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
from backend.services.file.text_file_service import SafeFileInfo, TextFileService

FileSummaryErrorCode = Literal[
    "SUMMARY_MODEL_DISABLED",
    "SUMMARY_PROVIDER_ERROR",
    "SUMMARY_RESPONSE_INVALID",
]


@dataclass(frozen=True)
class FileSummary:
    text: str
    model: str
    input_chars: int
    source_chars: int
    truncated: bool


@dataclass(frozen=True)
class FileSummaryResult:
    file: SafeFileInfo
    summary: FileSummary


class FileSummaryError(Exception):
    def __init__(self, code: FileSummaryErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class FileSummaryService:
    def __init__(self, text_file_service: TextFileService | None = None) -> None:
        self.text_file_service = text_file_service or TextFileService()

    def summarize_file(self, requested_path: str, max_input_chars: int | None = None) -> FileSummaryResult:
        settings = get_settings()
        self._ensure_summary_enabled(settings.enable_file_summary, settings.enable_deepseek_chat, settings.deepseek_api_key)

        text_file = self.text_file_service.read_text_file(requested_path)
        safe_max_input_chars = self._normalize_max_input_chars(
            max_input_chars=max_input_chars,
            default_max_input_chars=settings.file_summary_max_input_chars,
        )
        truncated_text = text_file.text[:safe_max_input_chars]
        is_truncated = text_file.chars > safe_max_input_chars

        messages = self._build_messages(
            file=text_file.file,
            truncated_text=truncated_text,
            input_chars=len(truncated_text),
            truncated=is_truncated,
        )

        try:
            summary_text = create_deepseek_reply_from_messages(messages)
        except DeepSeekConfigError as exc:
            raise FileSummaryError(
                "SUMMARY_MODEL_DISABLED",
                f"File summary is disabled: {exc}",
            ) from exc
        except DeepSeekResponseError as exc:
            raise FileSummaryError(
                "SUMMARY_RESPONSE_INVALID",
                f"File summary response is invalid: {exc}",
            ) from exc
        except DeepSeekError as exc:
            raise FileSummaryError(
                "SUMMARY_PROVIDER_ERROR",
                f"File summary provider request failed: {exc}",
            ) from exc

        return FileSummaryResult(
            file=text_file.file,
            summary=FileSummary(
                text=summary_text,
                model=settings.deepseek_model,
                input_chars=len(truncated_text),
                source_chars=text_file.chars,
                truncated=is_truncated,
            ),
        )

    @staticmethod
    def _ensure_summary_enabled(
        enable_file_summary: bool,
        enable_deepseek_chat: bool,
        deepseek_api_key: str,
    ) -> None:
        if not enable_file_summary or not enable_deepseek_chat or not deepseek_api_key:
            raise FileSummaryError(
                "SUMMARY_MODEL_DISABLED",
                "File summary is disabled or DeepSeek API key is missing.",
            )

    @staticmethod
    def _normalize_max_input_chars(max_input_chars: int | None, default_max_input_chars: int) -> int:
        safe_default = max(1, int(default_max_input_chars))
        if max_input_chars is None:
            return safe_default
        return max(1, min(int(max_input_chars), safe_default))

    @staticmethod
    def _build_messages(
        file: SafeFileInfo,
        truncated_text: str,
        input_chars: int,
        truncated: bool,
    ) -> list[dict[str, str]]:
        truncation_hint = "是" if truncated else "否"
        return [
            {
                "role": "user",
                "content": (
                    "你是一个只读文件总结助手。\n"
                    "请只根据用户提供的文件内容进行总结，不要补充文件中没有的信息。\n"
                    "请使用简体中文，控制在 2 到 4 句。\n"
                    "如果内容被截断，请明确说明“基于当前片段”。"
                ),
            },
            {
                "role": "user",
                "content": (
                    "请总结下面这段文件内容。\n\n"
                    f"文件名: {file.name}\n"
                    f"相对路径: {file.relative_path}\n"
                    f"文件类型: {file.suffix}\n"
                    f"输入字符数: {input_chars}\n"
                    f"是否截断: {truncation_hint}\n\n"
                    "文件内容：\n"
                    f"{truncated_text}"
                ),
            },
        ]
