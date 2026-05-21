from fastapi import APIRouter

from backend.ai_router import OllamaRouter, is_ai_router_enabled
from backend.adapters.deepseek import is_deepseek_chat_enabled
from backend.schemas import ChatRequest, ChatResponse
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

TIME_KEYWORDS = ("时间", "几点", "time")
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


def create_chat_router() -> APIRouter:
    router = APIRouter()
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

    @router.post("/chat", response_model=ChatResponse)
    def chat(payload: ChatRequest) -> ChatResponse:
        rule_skill = select_skill(
            payload.message,
            dify_english_skill=dify_english_skill,
            echo_skill=echo_skill,
            file_analysis_skill=file_analysis_skill,
            file_inventory_skill=file_inventory_skill,
            idea_capture_skill=idea_capture_skill,
            readonly_file_scanner_skill=readonly_file_scanner_skill,
            readonly_text_preview_skill=readonly_text_preview_skill,
            safe_action_skill=safe_action_skill,
            time_skill=time_skill,
        )
        if rule_skill.name != echo_skill.name:
            return rule_skill.execute(payload.message)

        if is_deepseek_chat_enabled():
            deepseek_response = execute_deepseek_with_echo_fallback(
                payload.message,
                deepseek_chat_skill=deepseek_chat_skill,
                echo_skill=echo_skill,
            )
            return deepseek_response

        if not is_ai_router_enabled():
            return echo_skill.execute(payload.message)

        ai_route = ai_router.classify(payload.message)
        routed_skill_name = str(ai_route.get("skill", echo_skill.name))
        routed_skill = skills_by_name.get(routed_skill_name, echo_skill)
        return routed_skill.execute(payload.message)

    return router


def execute_deepseek_with_echo_fallback(
    message: str,
    deepseek_chat_skill: DeepSeekChatSkill,
    echo_skill: EchoSkill,
) -> ChatResponse:
    try:
        deepseek_response = deepseek_chat_skill.execute(message)
    except Exception:
        return echo_skill.execute(message)

    if deepseek_response.status != "success":
        return echo_skill.execute(message)
    return deepseek_response


def select_skill(
    message: str,
    dify_english_skill: DifyEnglishSkill,
    echo_skill: EchoSkill,
    file_analysis_skill: FileAnalysisSkill,
    file_inventory_skill: FileInventorySkill,
    idea_capture_skill: IdeaCaptureSkill,
    readonly_file_scanner_skill: ReadOnlyFileScannerSkill,
    readonly_text_preview_skill: ReadOnlyTextPreviewSkill,
    safe_action_skill: SafeActionSkill,
    time_skill: TimeSkill,
):
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
        and not has_safe_action_intent(normalized_message)
        and not should_use_readonly_text_preview(normalized_message)
        and not should_use_readonly_file_scanner(normalized_message)
        and not should_use_file_inventory(normalized_message)
    ):
        return dify_english_skill
    if (
        any(keyword in normalized_message for keyword in DIFY_LEARNING_KEYWORDS_LOWER)
        and not has_safe_action_intent(normalized_message)
        and not should_use_readonly_text_preview(normalized_message)
        and not should_use_readonly_file_scanner(normalized_message)
        and not should_use_file_inventory(normalized_message)
    ):
        return dify_english_skill
    if has_safe_action_intent(normalized_message):
        return safe_action_skill
    if should_use_readonly_text_preview(normalized_message):
        return readonly_text_preview_skill
    if should_use_readonly_file_scanner(normalized_message):
        return readonly_file_scanner_skill
    if should_use_file_inventory(normalized_message):
        return file_inventory_skill
    if should_use_file_analysis(normalized_message):
        return file_analysis_skill
    return echo_skill


def has_safe_action_intent(normalized_message: str) -> bool:
    if any(keyword in normalized_message for keyword in SAFE_ACTION_KEYWORDS_LOWER):
        return True
    return any(keyword in normalized_message for keyword in SAFE_ACTION_OPERATION_HINTS)


def should_use_file_inventory(normalized_message: str) -> bool:
    if has_safe_action_intent(normalized_message):
        return False
    if should_use_readonly_text_preview(normalized_message):
        return False
    if should_use_readonly_file_scanner(normalized_message):
        return False
    return any(keyword in normalized_message for keyword in FILE_INVENTORY_KEYWORDS_LOWER)


def should_use_readonly_text_preview(normalized_message: str) -> bool:
    if has_safe_action_intent(normalized_message):
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


def should_use_readonly_file_scanner(normalized_message: str) -> bool:
    if has_safe_action_intent(normalized_message):
        return False
    if should_use_readonly_text_preview(normalized_message):
        return False
    if any(keyword in normalized_message for keyword in FILE_INVENTORY_KEYWORDS_LOWER):
        return False
    return any(keyword in normalized_message for keyword in READONLY_FILE_SCANNER_KEYWORDS_LOWER)


def should_use_file_analysis(normalized_message: str) -> bool:
    if has_safe_action_intent(normalized_message):
        return False
    if should_use_readonly_text_preview(normalized_message):
        return False
    if should_use_readonly_file_scanner(normalized_message):
        return False
    if should_use_file_inventory(normalized_message):
        return False
    return any(keyword in normalized_message for keyword in FILE_ANALYSIS_KEYWORDS_LOWER)
