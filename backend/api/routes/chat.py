from __future__ import annotations

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.ai_router import OllamaRouter, is_ai_router_enabled
from backend.adapters.deepseek import (
    DeepSeekError,
    is_deepseek_chat_enabled,
    stream_deepseek_reply_from_messages,
)
from backend.schemas import ChatMessage, ChatRequest, ChatResponse
from backend.services.knowledge.answer_service import KnowledgeAnswerError
from backend.services.knowledge.query_service import KnowledgeQueryService
from backend.services.knowledge.repository import KnowledgeRepository
from backend.skills.deepseek_chat import DeepSeekChatSkill
from backend.skills.dify_english import DIFY_KEYWORDS, DifyEnglishSkill
from backend.skills.echo import EchoSkill
from backend.skills.file_analysis import FILE_ANALYSIS_KEYWORDS_LOWER, FileAnalysisSkill
from backend.skills.file_inventory import FILE_INVENTORY_KEYWORDS_LOWER, FileInventorySkill
from backend.skills.idea_capture import CAPTURE_PREFIXES, LIST_KEYWORDS, IdeaCaptureSkill
from backend.skills.readonly_file_scanner import READONLY_FILE_SCANNER_KEYWORDS_LOWER, ReadOnlyFileScannerSkill
from backend.skills.readonly_text_preview import READONLY_TEXT_PREVIEW_KEYWORDS_LOWER, ReadOnlyTextPreviewSkill
from backend.skills.safe_action import SAFE_ACTION_KEYWORDS_LOWER, SafeActionSkill
from backend.skills.time import TimeSkill
from backend.storage import get_connection

TIME_KEYWORDS = ("时间", "几点", "time")
MAX_CONTEXT_TURNS = 4
MAX_CONTEXT_MESSAGES = MAX_CONTEXT_TURNS * 2 + 1
MAX_MESSAGE_CONTENT_CHARS = 1500
MAX_CONTEXT_TOTAL_CHARS = 8000
CAPTURE_PREFIXES_LOWER = tuple(prefix.lower() for prefix in CAPTURE_PREFIXES)
LIST_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in LIST_KEYWORDS)
CAPTURE_INTENT_KEYWORDS_LOWER = (
    "帮我记一下",
    "记一下",
    "帮我保存一下",
    "帮我保存一个",
    "先记下来",
    "以后做",
)
DIFY_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in DIFY_KEYWORDS)
DIFY_LEARNING_KEYWORDS_LOWER = (
    "怎么背",
    "怎么记",
    "这个词",
    "词怎么",
    "背单词",
)
SAFE_ACTION_OPERATION_HINTS = (
    "删除",
    "清理",
    "重命名",
    "批量移动",
    "批量重命名",
    "复制",
    "移动",
    "覆盖",
    "删除重复文件",
    "删除重复的",
    "整理文件",
    "整理目录",
    "执行计划",
    "操作计划",
)
KNOWLEDGE_INTENT_KEYWORDS_LOWER = (
    "根据知识库",
    "知识库",
    "我的笔记",
    "笔记里",
    "笔记中",
    "已入库",
    "保存的内容",
    "之前记录",
    "我记录的",
    "我的文档",
    "根据我保存",
    "搜索知识",
    "查知识库",
    "找到的笔记",
    "文件里提到",
    "文件中提到",
)

ai_router = OllamaRouter()
deepseek_chat_skill = DeepSeekChatSkill()
dify_english_skill = DifyEnglishSkill()
echo_skill = EchoSkill()
file_analysis_skill = FileAnalysisSkill()
file_inventory_skill = FileInventorySkill()
idea_capture_skill = IdeaCaptureSkill()
readonly_file_scanner_skill = ReadOnlyFileScannerSkill()
readonly_text_preview_skill = ReadOnlyTextPreviewSkill()
safe_action_skill = SafeActionSkill()
time_skill = TimeSkill()
skills_by_name = {
    echo_skill.name: echo_skill,
    time_skill.name: time_skill,
    idea_capture_skill.name: idea_capture_skill,
    dify_english_skill.name: dify_english_skill,
    safe_action_skill.name: safe_action_skill,
    readonly_text_preview_skill.name: readonly_text_preview_skill,
    readonly_file_scanner_skill.name: readonly_file_scanner_skill,
    file_inventory_skill.name: file_inventory_skill,
    file_analysis_skill.name: file_analysis_skill,
}

knowledge_repository = KnowledgeRepository(get_connection)
knowledge_query_service = KnowledgeQueryService(knowledge_repository)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    rule_skill = _select_skill(payload.message)
    if rule_skill.name != echo_skill.name:
        return rule_skill.execute(payload.message)

    if _should_use_knowledge(payload.message) and _has_knowledge_content():
        return _execute_knowledge_chat(payload.message)

    if is_deepseek_chat_enabled():
        deepseek_response = _execute_deepseek_with_echo_fallback(
            payload.message,
            messages=payload.messages,
        )
        return deepseek_response

    if not is_ai_router_enabled():
        return echo_skill.execute(payload.message)

    ai_route = ai_router.classify(payload.message)
    routed_skill_name = str(ai_route.get("skill", echo_skill.name))
    routed_skill = skills_by_name.get(routed_skill_name, echo_skill)
    return routed_skill.execute(payload.message)


def _sse_event(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/chat/stream")
def chat_stream(payload: ChatRequest) -> StreamingResponse:
    rule_skill = _select_skill(payload.message)

    def generate():
        if rule_skill.name != echo_skill.name:
            result = rule_skill.execute(payload.message)
            yield _sse_event({"type": "metadata", "skill": result.skill, "status": result.status})
            yield _sse_event({"type": "token", "content": result.reply})
            yield _sse_event({"type": "done"})
            return

        if _should_use_knowledge(payload.message) and _has_knowledge_content():
            yield from _stream_knowledge_chat(payload.message)
            return

        if is_deepseek_chat_enabled():
            yield from _stream_deepseek_chat(payload.message, payload.messages)
            return

        if is_ai_router_enabled():
            ai_route = ai_router.classify(payload.message)
            routed_skill_name = str(ai_route.get("skill", echo_skill.name))
            routed_skill = skills_by_name.get(routed_skill_name, echo_skill)
            result = routed_skill.execute(payload.message)
            yield _sse_event({"type": "metadata", "skill": result.skill, "status": result.status})
            yield _sse_event({"type": "token", "content": result.reply})
            yield _sse_event({"type": "done"})
            return

        result = echo_skill.execute(payload.message)
        yield _sse_event({"type": "metadata", "skill": result.skill, "status": result.status})
        yield _sse_event({"type": "token", "content": result.reply})
        yield _sse_event({"type": "done"})

    return StreamingResponse(generate(), media_type="text/event-stream")


def _stream_deepseek_chat(message: str, messages: list[ChatMessage] | None):
    deepseek_messages = _build_deepseek_messages(message, messages)
    yield _sse_event({"type": "metadata", "skill": "deepseek_chat", "status": "success"})
    try:
        for token in stream_deepseek_reply_from_messages(deepseek_messages):
            yield _sse_event({"type": "token", "content": token})
    except DeepSeekError as exc:
        yield _sse_event({"type": "error", "message": str(exc)})
        return
    except Exception:
        result = echo_skill.execute(message)
        yield _sse_event({"type": "token", "content": result.reply})
    yield _sse_event({"type": "done"})


def _stream_knowledge_chat(message: str):
    try:
        result = knowledge_query_service.query(question=message)
    except KnowledgeAnswerError as exc:
        if exc.code == "KNOWLEDGE_MODEL_DISABLED":
            yield _sse_event({"type": "metadata", "skill": "knowledge", "status": "error"})
            yield _sse_event({"type": "error", "message": "知识库问答功能未启用：后端 AI 模型尚未配置，请联系管理员开启 DeepSeek。", "code": "KNOWLEDGE_MODEL_DISABLED"})
        else:
            yield _sse_event({"type": "metadata", "skill": "knowledge", "status": "error"})
            yield _sse_event({"type": "error", "message": str(exc)})
        yield _sse_event({"type": "done"})
        return
    except ValueError:
        yield _sse_event({"type": "metadata", "skill": "knowledge", "status": "success"})
        yield _sse_event({"type": "token", "content": "未在知识库中找到相关内容。"})
        yield _sse_event({"type": "done"})
        return
    except Exception:
        result = echo_skill.execute(message)
        yield _sse_event({"type": "metadata", "skill": "knowledge", "status": "success"})
        yield _sse_event({"type": "token", "content": result.reply})
        yield _sse_event({"type": "done"})
        return

    citations_data = [
        {"index": c.index, "relative_path": c.relative_path, "chunk_index": c.chunk_index}
        for c in result.citations
    ]

    if is_deepseek_chat_enabled() and result.answer.grounded:
        yield _sse_event({
            "type": "metadata",
            "skill": "knowledge",
            "status": "success",
            "grounded": result.answer.grounded,
            "citations": citations_data,
            "hits_count": len(result.hits),
            "kb_id": result.kb_id,
        })
        deepseek_messages = _build_deepseek_messages(
            f"基于以下知识片段回答用户问题。\n\n知识片段：\n{result.answer.text}\n\n用户问题：{message}",
            None,
        )
        try:
            for token in stream_deepseek_reply_from_messages(deepseek_messages):
                yield _sse_event({"type": "token", "content": token})
        except DeepSeekError as exc:
            yield _sse_event({"type": "token", "content": result.answer.text})
        except Exception:
            yield _sse_event({"type": "token", "content": result.answer.text})
    else:
        yield _sse_event({
            "type": "metadata",
            "skill": "knowledge",
            "status": "success",
            "grounded": result.answer.grounded,
            "citations": citations_data,
            "hits_count": len(result.hits),
            "kb_id": result.kb_id,
        })
        yield _sse_event({"type": "token", "content": result.answer.text})

    yield _sse_event({"type": "done"})


def _execute_deepseek_with_echo_fallback(
    message: str,
    messages: list[ChatMessage] | None,
) -> ChatResponse:
    try:
        deepseek_messages = _build_deepseek_messages(message, messages)
        deepseek_response = deepseek_chat_skill.execute_messages(deepseek_messages)
    except Exception:
        return echo_skill.execute(message)

    if deepseek_response.status != "success":
        return echo_skill.execute(message)
    return deepseek_response


def _build_deepseek_messages(
    message: str,
    messages: list[ChatMessage] | None,
) -> list[ChatMessage]:
    current_message = message.strip()
    context_messages = list(messages or [])
    normalized_messages = [
        ChatMessage(
            role=context_message.role,
            content=context_message.content.strip()[:MAX_MESSAGE_CONTENT_CHARS],
        )
        for context_message in context_messages
        if context_message.content.strip()
    ]

    has_current_message = (
        bool(normalized_messages)
        and normalized_messages[-1].role == "user"
        and normalized_messages[-1].content == current_message
    )
    if not has_current_message:
        normalized_messages.append(
            ChatMessage(
                role="user",
                content=current_message[:MAX_MESSAGE_CONTENT_CHARS],
            )
        )

    return _trim_deepseek_messages(normalized_messages[-MAX_CONTEXT_MESSAGES:])


def _trim_deepseek_messages(messages: list[ChatMessage]) -> list[ChatMessage]:
    trimmed_messages: list[ChatMessage] = []
    total_chars = 0

    for message in reversed(messages):
        content = message.content[:MAX_MESSAGE_CONTENT_CHARS]
        next_total = total_chars + len(content)
        if next_total > MAX_CONTEXT_TOTAL_CHARS and trimmed_messages:
            break
        if next_total > MAX_CONTEXT_TOTAL_CHARS:
            content = content[:MAX_CONTEXT_TOTAL_CHARS]
            next_total = len(content)

        trimmed_messages.append(ChatMessage(role=message.role, content=content))
        total_chars = next_total

    return list(reversed(trimmed_messages))


def _select_skill(message: str):
    normalized_message = message.strip().lower()
    if normalized_message.startswith(CAPTURE_PREFIXES_LOWER):
        return idea_capture_skill
    if any(keyword in normalized_message for keyword in LIST_KEYWORDS_LOWER):
        return idea_capture_skill
    if any(keyword in normalized_message for keyword in CAPTURE_INTENT_KEYWORDS_LOWER):
        return idea_capture_skill
    if any(keyword in normalized_message for keyword in TIME_KEYWORDS):
        return time_skill
    if (
        any(keyword in normalized_message for keyword in DIFY_KEYWORDS_LOWER)
        and not _has_safe_action_intent(normalized_message)
        and not _should_use_readonly_text_preview(normalized_message)
        and not _should_use_readonly_file_scanner(normalized_message)
        and not _should_use_file_inventory(normalized_message)
    ):
        return dify_english_skill
    if (
        any(keyword in normalized_message for keyword in DIFY_LEARNING_KEYWORDS_LOWER)
        and not _has_safe_action_intent(normalized_message)
        and not _should_use_readonly_text_preview(normalized_message)
        and not _should_use_readonly_file_scanner(normalized_message)
        and not _should_use_file_inventory(normalized_message)
    ):
        return dify_english_skill
    if _has_safe_action_intent(normalized_message):
        return safe_action_skill
    if _should_use_readonly_text_preview(normalized_message):
        return readonly_text_preview_skill
    if _should_use_readonly_file_scanner(normalized_message):
        return readonly_file_scanner_skill
    if _should_use_file_inventory(normalized_message):
        return file_inventory_skill
    if _should_use_file_analysis(normalized_message):
        return file_analysis_skill
    return echo_skill


def _has_safe_action_intent(normalized_message: str) -> bool:
    if any(keyword in normalized_message for keyword in SAFE_ACTION_KEYWORDS_LOWER):
        return True
    return any(keyword in normalized_message for keyword in SAFE_ACTION_OPERATION_HINTS)


def _should_use_file_inventory(normalized_message: str) -> bool:
    if _has_safe_action_intent(normalized_message):
        return False
    if _should_use_readonly_text_preview(normalized_message):
        return False
    if _should_use_readonly_file_scanner(normalized_message):
        return False
    return any(keyword in normalized_message for keyword in FILE_INVENTORY_KEYWORDS_LOWER)


def _should_use_readonly_text_preview(normalized_message: str) -> bool:
    if _has_safe_action_intent(normalized_message):
        return False
    if any(keyword in normalized_message for keyword in READONLY_FILE_SCANNER_KEYWORDS_LOWER):
        return False
    if any(keyword in normalized_message for keyword in FILE_INVENTORY_KEYWORDS_LOWER):
        return False
    if any(keyword in normalized_message for keyword in FILE_ANALYSIS_KEYWORDS_LOWER):
        return False

    has_preview_keyword = any(keyword in normalized_message for keyword in READONLY_TEXT_PREVIEW_KEYWORDS_LOWER)
    has_allowed_suffix = ".txt" in normalized_message or ".md" in normalized_message
    has_preview_hint = any(keyword in normalized_message for keyword in ("预览", "查看", "读取"))
    has_markdown_hint = "markdown" in normalized_message

    if has_preview_keyword:
        return True
    if has_allowed_suffix and (has_preview_hint or has_markdown_hint):
        return True
    return False


def _should_use_readonly_file_scanner(normalized_message: str) -> bool:
    if _has_safe_action_intent(normalized_message):
        return False
    if _should_use_readonly_text_preview(normalized_message):
        return False
    if any(keyword in normalized_message for keyword in FILE_INVENTORY_KEYWORDS_LOWER):
        return False
    return any(keyword in normalized_message for keyword in READONLY_FILE_SCANNER_KEYWORDS_LOWER)


def _should_use_file_analysis(normalized_message: str) -> bool:
    if _has_safe_action_intent(normalized_message):
        return False
    if _should_use_readonly_text_preview(normalized_message):
        return False
    if _should_use_readonly_file_scanner(normalized_message):
        return False
    if _should_use_file_inventory(normalized_message):
        return False
    return any(keyword in normalized_message for keyword in FILE_ANALYSIS_KEYWORDS_LOWER)


def _should_use_knowledge(normalized_message: str) -> bool:
    return any(keyword in normalized_message for keyword in KNOWLEDGE_INTENT_KEYWORDS_LOWER)


def _has_knowledge_content() -> bool:
    try:
        status = knowledge_repository.get_storage_status()
        return status.files_count > 0
    except Exception:
        return False


def _execute_knowledge_chat(message: str) -> ChatResponse:
    try:
        result = knowledge_query_service.query(question=message)
    except KnowledgeAnswerError as exc:
        if exc.code == "KNOWLEDGE_MODEL_DISABLED":
            return ChatResponse(
                reply="知识库问答功能未启用：后端 AI 模型尚未配置，请联系管理员开启 DeepSeek。",
                skill="knowledge",
                status="error",
                data={"error_type": "KNOWLEDGE_MODEL_DISABLED"},
            )
        return echo_skill.execute(message)
    except ValueError:
        return ChatResponse(
            reply="未在知识库中找到相关内容。",
            skill="knowledge",
            status="success",
            data={"grounded": False, "hits_count": 0},
        )
    except Exception:
        return echo_skill.execute(message)

    citations_data = [
        {
            "index": c.index,
            "relative_path": c.relative_path,
            "chunk_index": c.chunk_index,
        }
        for c in result.citations
    ]

    return ChatResponse(
        reply=result.answer.text,
        skill="knowledge",
        status="success",
        data={
            "grounded": result.answer.grounded,
            "citations": citations_data,
            "hits_count": len(result.hits),
            "kb_id": result.kb_id,
        },
    )
