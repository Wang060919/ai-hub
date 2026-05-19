from __future__ import annotations

import json
import os
from typing import Final
from urllib import error, request

ALLOWED_SKILLS: Final[set[str]] = {"echo", "time", "idea_capture", "dify_english"}
DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434"
DEFAULT_OLLAMA_MODEL = "qwen2.5:7b"
DEFAULT_TIMEOUT_SECONDS = 8
MIN_CONFIDENCE = 0.7
OLLAMA_SYSTEM_PROMPT = """
你是一个中文意图分类器，只负责判断用户消息应该交给哪个 skill。

可选 skill 只有：
- echo
- time
- idea_capture
- dify_english

判断规则：
1. 只有在明显询问时间时才返回 time。
2. 只有在明显要记录想法、保存想法、查看最近想法时才返回 idea_capture。
3. 只有在明显和英语、英文、四级、单词、出题、判题、错词、背词相关时才返回 dify_english。
4. 不明确时返回 echo。

你必须只输出一个 JSON 对象，不要输出任何额外文字，格式固定为：
{"skill":"echo|time|idea_capture|dify_english","confidence":0.0,"reason":"简短理由"}
""".strip()


def is_ai_router_enabled() -> bool:
    raw_value = os.getenv("AI_ROUTER_ENABLED", "true").strip().lower()
    return raw_value not in {"false", "0", "no", "off"}


class OllamaRouter:
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout: int = DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL)).rstrip("/")
        self.model = model or os.getenv("OLLAMA_ROUTER_MODEL", DEFAULT_OLLAMA_MODEL)
        self.timeout = timeout

    def classify(self, message: str) -> dict[str, object]:
        if not is_ai_router_enabled():
            return self._fallback("disabled")

        payload = json.dumps(
            {
                "model": self.model,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0},
                "messages": [
                    {"role": "system", "content": OLLAMA_SYSTEM_PROMPT},
                    {"role": "user", "content": message},
                ],
            }
        ).encode("utf-8")

        http_request = request.Request(
            f"{self.base_url}/api/chat",
            data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )

        try:
            with request.urlopen(http_request, timeout=self.timeout) as response:
                response_body = response.read().decode("utf-8")
        except (error.HTTPError, error.URLError, TimeoutError, OSError):
            return self._fallback("request_failed")
        except Exception:
            return self._fallback("unexpected_error")

        try:
            outer_payload = json.loads(response_body)
            content = outer_payload["message"]["content"]
            classification = json.loads(content)
        except (json.JSONDecodeError, KeyError, TypeError):
            return self._fallback("invalid_json")

        skill = classification.get("skill")
        confidence = classification.get("confidence")
        reason = classification.get("reason", "")

        if skill not in ALLOWED_SKILLS:
            return self._fallback("invalid_skill")

        try:
            confidence_value = float(confidence)
        except (TypeError, ValueError):
            return self._fallback("invalid_confidence")

        if confidence_value < MIN_CONFIDENCE:
            return self._fallback("low_confidence")

        return {
            "skill": skill,
            "confidence": confidence_value,
            "reason": str(reason)[:80],
        }

    @staticmethod
    def _fallback(reason: str) -> dict[str, object]:
        return {"skill": "echo", "confidence": 0.0, "reason": reason}
