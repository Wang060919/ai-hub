from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from backend.adapters.deepseek import (
    DeepSeekConfigError,
    DeepSeekError,
    DeepSeekResponseError,
    create_deepseek_reply_from_messages,
)
from backend.core.config import get_settings
from backend.services.knowledge.models import (
    KnowledgeAnswer,
    KnowledgeCitation,
    KnowledgeSearchHit,
)

KnowledgeAnswerErrorCode = Literal[
    "KNOWLEDGE_MODEL_DISABLED",
    "KNOWLEDGE_PROVIDER_ERROR",
    "KNOWLEDGE_RESPONSE_INVALID",
]

DEFAULT_NO_EVIDENCE_ANSWER = "未在当前知识库中找到足够依据。"
MAX_CONTEXT_CHARS = 8000


@dataclass(frozen=True)
class KnowledgeAnswerError(RuntimeError):
    code: KnowledgeAnswerErrorCode
    message: str

    def __str__(self) -> str:
        return self.message


class KnowledgeAnswerService:
    def __init__(self, max_context_chars: int = MAX_CONTEXT_CHARS) -> None:
        self._max_context_chars = max(1, int(max_context_chars))

    def build_answer(
        self,
        question: str,
        hits: list[KnowledgeSearchHit],
    ) -> tuple[KnowledgeAnswer, list[KnowledgeCitation]]:
        citations = self.build_citations(hits)
        if not hits:
            return (
                KnowledgeAnswer(
                    text=DEFAULT_NO_EVIDENCE_ANSWER,
                    model=None,
                    grounded=False,
                ),
                citations,
            )

        settings = get_settings()
        messages = self._build_messages(question=question, hits=hits)

        try:
            answer_text = create_deepseek_reply_from_messages(messages)
        except DeepSeekConfigError as exc:
            raise KnowledgeAnswerError(
                "KNOWLEDGE_MODEL_DISABLED",
                f"Knowledge query model is disabled: {exc}",
            ) from exc
        except DeepSeekResponseError as exc:
            raise KnowledgeAnswerError(
                "KNOWLEDGE_RESPONSE_INVALID",
                f"Knowledge query response is invalid: {exc}",
            ) from exc
        except DeepSeekError as exc:
            raise KnowledgeAnswerError(
                "KNOWLEDGE_PROVIDER_ERROR",
                f"Knowledge query provider request failed: {exc}",
            ) from exc

        return (
            KnowledgeAnswer(
                text=answer_text,
                model=settings.deepseek_model,
                grounded=True,
            ),
            citations,
        )

    @staticmethod
    def build_citations(hits: list[KnowledgeSearchHit]) -> list[KnowledgeCitation]:
        return [
            KnowledgeCitation(
                index=index,
                chunk_id=hit.chunk_id,
                relative_path=hit.relative_path,
                chunk_index=hit.chunk_index,
            )
            for index, hit in enumerate(hits, start=1)
        ]

    def _build_messages(
        self,
        question: str,
        hits: list[KnowledgeSearchHit],
    ) -> list[dict[str, str]]:
        return [
            {
                "role": "user",
                "content": self._build_prompt(question=question, hits=hits),
            }
        ]

    def _build_prompt(
        self,
        question: str,
        hits: list[KnowledgeSearchHit],
    ) -> str:
        prompt_sections = [
            "你是 AI Hub 的知识库问答助手。",
            "你只能基于下面提供的知识片段回答问题，不允许补充片段之外的事实、常识、经验或猜测。",
            "如果依据不足，必须明确说明依据不足，或直接回答“未在当前知识库中找到足够依据”。",
            "请使用简体中文回答。",
            "回答时尽量在对应句子后标注 [1]、[2] 这样的引用编号。",
            "不要输出 JSON。",
            "",
            "问题：",
            question.strip(),
            "",
            "知识片段：",
            self._build_context_block(hits),
        ]
        return "\n".join(prompt_sections).strip()

    def _build_context_block(self, hits: list[KnowledgeSearchHit]) -> str:
        sections: list[str] = []
        remaining_chars = self._max_context_chars

        for index, hit in enumerate(hits, start=1):
            header = f"[{index}] 路径: {hit.relative_path} | chunk: {hit.chunk_index}"
            budget_for_content = max(0, remaining_chars - len(header) - 2)
            if budget_for_content <= 0:
                break

            content = hit.content.strip()
            truncated_content = content[:budget_for_content].rstrip()
            block = f"{header}\n{truncated_content}"
            sections.append(block)
            remaining_chars -= len(block) + 2
            if remaining_chars <= 0:
                break

        return "\n\n".join(sections).strip()
