from __future__ import annotations

import json
import threading
from dataclasses import asdict, dataclass
from pathlib import Path

from backend.core.config import get_settings
from backend.core.env import PROJECT_ROOT

CONFIG_FILE = PROJECT_ROOT / "model_config.json"


@dataclass
class ModelConfig:
    api_url: str
    api_key: str
    model: str
    timeout: int


_lock = threading.Lock()
_runtime_config: ModelConfig | None = None


def _config_from_settings() -> ModelConfig:
    settings = get_settings()
    return ModelConfig(
        api_url=settings.model_api_url,
        api_key=settings.model_api_key,
        model=settings.model_name,
        timeout=settings.model_timeout,
    )


def _load_from_file() -> ModelConfig | None:
    if not CONFIG_FILE.exists():
        return None
    try:
        data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        return ModelConfig(
            api_url=data.get("api_url", ""),
            api_key=data.get("api_key", ""),
            model=data.get("model", ""),
            timeout=int(data.get("timeout", 30)),
        )
    except Exception:
        return None


def _save_to_file(config: ModelConfig) -> None:
    try:
        CONFIG_FILE.write_text(
            json.dumps(asdict(config), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception:
        pass


def get_model_config() -> ModelConfig:
    global _runtime_config
    with _lock:
        if _runtime_config is not None:
            return _runtime_config
        saved = _load_from_file()
        if saved is not None:
            _runtime_config = saved
            return _runtime_config
    return _config_from_settings()


def update_model_config(
    *,
    api_url: str | None = None,
    api_key: str | None = None,
    model: str | None = None,
    timeout: int | None = None,
) -> ModelConfig:
    global _runtime_config
    with _lock:
        current = _runtime_config or _load_from_file() or _config_from_settings()
        _runtime_config = ModelConfig(
            api_url=api_url if api_url is not None else current.api_url,
            api_key=api_key if api_key is not None else current.api_key,
            model=model if model is not None else current.model,
            timeout=timeout if timeout is not None else current.timeout,
        )
        _save_to_file(_runtime_config)
        return _runtime_config
