from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
import os


@dataclass(frozen=True)
class Settings:
    """Lightweight application settings with safe defaults."""

    app_name: str = "AI Hub"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    backend_host: str = "127.0.0.1"
    backend_port: int = 8000
    enable_deepseek_chat: bool = False
    enable_file_summary: bool = False
    file_summary_max_input_chars: int = 8000
    deepseek_api_key: str = field(default="", repr=False)
    deepseek_api_url: str = "https://api.deepseek.com/chat/completions"
    deepseek_model: str = "deepseek-v4-flash"
    deepseek_timeout_seconds: int = 20

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            app_name=os.getenv("AI_HUB_APP_NAME", cls.app_name),
            app_version=os.getenv("AI_HUB_APP_VERSION", cls.app_version),
            environment=os.getenv("AI_HUB_ENVIRONMENT", cls.environment),
            debug=_parse_bool(os.getenv("AI_HUB_DEBUG"), cls.debug),
            backend_host=os.getenv("AI_HUB_BACKEND_HOST", cls.backend_host),
            backend_port=_parse_int(os.getenv("AI_HUB_BACKEND_PORT"), cls.backend_port),
            enable_deepseek_chat=_parse_bool(
                os.getenv("ENABLE_DEEPSEEK_CHAT"),
                cls.enable_deepseek_chat,
            ),
            enable_file_summary=_parse_bool(
                os.getenv("ENABLE_FILE_SUMMARY"),
                cls.enable_file_summary,
            ),
            file_summary_max_input_chars=_parse_positive_int(
                os.getenv("FILE_SUMMARY_MAX_INPUT_CHARS"),
                cls.file_summary_max_input_chars,
            ),
            deepseek_api_key=_parse_str(
                os.getenv("DEEPSEEK_API_KEY"),
                cls.deepseek_api_key,
            ),
            deepseek_api_url=_parse_str(
                os.getenv("DEEPSEEK_API_URL"),
                cls.deepseek_api_url,
            ),
            deepseek_model=_parse_str(
                os.getenv("DEEPSEEK_MODEL"),
                cls.deepseek_model,
            ),
            deepseek_timeout_seconds=_parse_int(
                os.getenv("DEEPSEEK_TIMEOUT_SECONDS"),
                cls.deepseek_timeout_seconds,
            ),
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings.from_env()


def _parse_bool(raw_value: str | None, default: bool) -> bool:
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_int(raw_value: str | None, default: int) -> int:
    if raw_value is None:
        return default
    try:
        return int(raw_value)
    except ValueError:
        return default


def _parse_str(raw_value: str | None, default: str) -> str:
    if raw_value is None:
        return default
    clean_value = raw_value.strip()
    return clean_value or default


def _parse_positive_int(raw_value: str | None, default: int) -> int:
    parsed_value = _parse_int(raw_value, default)
    return parsed_value if parsed_value > 0 else default
