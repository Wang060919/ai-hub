from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os


@dataclass(frozen=True)
class Settings:
    """Lightweight application settings with safe defaults."""

    app_name: str = "AI Hub"
    app_version: str = "v0.9-api-stabilization"
    environment: str = "development"
    debug: bool = False
    backend_host: str = "127.0.0.1"
    backend_port: int = 8000

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            app_name=os.getenv("AI_HUB_APP_NAME", cls.app_name),
            app_version=os.getenv("AI_HUB_APP_VERSION", cls.app_version),
            environment=os.getenv("AI_HUB_ENVIRONMENT", cls.environment),
            debug=_parse_bool(os.getenv("AI_HUB_DEBUG"), cls.debug),
            backend_host=os.getenv("AI_HUB_BACKEND_HOST", cls.backend_host),
            backend_port=_parse_int(os.getenv("AI_HUB_BACKEND_PORT"), cls.backend_port),
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
