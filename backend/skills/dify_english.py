from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from urllib import error, request

from backend.schemas import ChatResponse
from backend.skills.base import BaseSkill

DIFY_KEYWORDS = ("四级", "单词", "出题", "判题", "错词", "英文", "英语", "cet")
DEFAULT_DIFY_USER = "wang-ai-hub"
DEFAULT_TIMEOUT = 30
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = PROJECT_ROOT / ".env"


def load_dotenv() -> dict[str, str]:
    env_values: dict[str, str] = {}
    if not ENV_FILE_PATH.exists():
        return env_values

    for raw_line in ENV_FILE_PATH.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        clean_key = key.strip().lstrip("\ufeff")
        clean_value = value.strip().strip('"').strip("'")
        if clean_key:
            env_values[clean_key] = clean_value

    return env_values


@lru_cache(maxsize=1)
def get_dify_config() -> tuple[str | None, str | None]:
    api_url = os.getenv("DIFY_API_URL", "").strip()
    api_key = os.getenv("DIFY_API_KEY", "").strip()
    if api_url and api_key:
        return api_url, api_key

    env_values = load_dotenv()
    if not api_url:
        api_url = env_values.get("DIFY_API_URL", "").strip()
    if not api_key:
        api_key = env_values.get("DIFY_API_KEY", "").strip()

    return api_url or None, api_key or None


class DifyEnglishSkill(BaseSkill):
    name = "dify_english"

    def execute(self, message: str) -> ChatResponse:
        api_url, api_key = get_dify_config()
        if not api_url or not api_key:
            return ChatResponse(
                reply="Dify 调用失败：缺少 DIFY_API_URL 或 DIFY_API_KEY",
                skill=self.name,
                status="error",
                data={"error_type": "config_error"},
            )

        payload = json.dumps(
            {
                "inputs": {},
                "query": message,
                "response_mode": "blocking",
                "conversation_id": "",
                "user": DEFAULT_DIFY_USER,
            }
        ).encode("utf-8")

        http_request = request.Request(
            api_url,
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0 Safari/537.36"
                ),
            },
            method="POST",
        )

        try:
            with request.urlopen(http_request, timeout=DEFAULT_TIMEOUT) as response:
                response_body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            return ChatResponse(
                reply=f"Dify 调用失败：{error_body or exc.reason}",
                skill=self.name,
                status="error",
                data={
                    "error_type": "http_error",
                    "status_code": exc.code,
                },
            )
        except error.URLError as exc:
            return ChatResponse(
                reply=f"Dify 调用失败：{exc.reason}",
                skill=self.name,
                status="error",
                data={"error_type": "network_error"},
            )
        except Exception as exc:
            return ChatResponse(
                reply=f"Dify 调用失败：{exc}",
                skill=self.name,
                status="error",
                data={"error_type": "unexpected_error"},
            )

        try:
            response_data = json.loads(response_body)
        except json.JSONDecodeError as exc:
            return ChatResponse(
                reply=f"Dify 调用失败：响应不是合法 JSON，{exc}",
                skill=self.name,
                status="error",
                data={"error_type": "invalid_json"},
            )

        return ChatResponse(
            reply=response_data.get("answer", ""),
            skill=self.name,
            status="success",
            data={
                "conversation_id": response_data.get("conversation_id", ""),
                "message_id": response_data.get("message_id") or response_data.get("id", ""),
            },
        )
