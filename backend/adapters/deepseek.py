from __future__ import annotations

import json
from collections.abc import Generator
from urllib import error, request

from backend.core.config import get_settings
from backend.schemas import ChatMessage


class DeepSeekError(RuntimeError):
    """Base error for DeepSeek adapter failures."""


class DeepSeekConfigError(DeepSeekError):
    """Raised when DeepSeek chat is disabled or missing required config."""


class DeepSeekResponseError(DeepSeekError):
    """Raised when DeepSeek returns an unexpected response shape."""


def is_deepseek_chat_enabled() -> bool:
    settings = get_settings()
    return settings.enable_deepseek_chat and bool(settings.deepseek_api_key)


def create_deepseek_reply(message: str) -> str:
    return create_deepseek_reply_from_messages(
        [
            {
                "role": "user",
                "content": message,
            }
        ]
    )


def create_deepseek_reply_from_messages(messages: list[ChatMessage | dict[str, str]]) -> str:
    settings = get_settings()
    clean_messages = _normalize_messages(messages)

    if not settings.enable_deepseek_chat:
        raise DeepSeekConfigError("DeepSeek chat is disabled.")
    if not settings.deepseek_api_key:
        raise DeepSeekConfigError("DeepSeek API key is not configured.")
    if not clean_messages:
        raise DeepSeekConfigError("DeepSeek messages cannot be empty.")

    payload = json.dumps(
        {
            "model": settings.deepseek_model,
            "messages": clean_messages,
            "stream": False,
        }
    ).encode("utf-8")

    http_request = request.Request(
        settings.deepseek_api_url,
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.deepseek_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(
            http_request,
            timeout=settings.deepseek_timeout_seconds,
        ) as response:
            response_body = response.read().decode("utf-8")
    except TimeoutError as exc:
        raise DeepSeekError("DeepSeek request timed out.") from exc
    except error.HTTPError as exc:
        message = f"DeepSeek HTTP request failed with status {exc.code}."
        raise DeepSeekError(message) from exc
    except error.URLError as exc:
        raise DeepSeekError(f"DeepSeek network request failed: {exc.reason}.") from exc

    try:
        response_data = json.loads(response_body)
    except json.JSONDecodeError as exc:
        raise DeepSeekResponseError("DeepSeek returned a non-JSON response.") from exc

    return _extract_reply(response_data)


def stream_deepseek_reply_from_messages(
    messages: list[ChatMessage | dict[str, str]],
) -> Generator[str, None, None]:
    """Yield content tokens from a streaming DeepSeek chat completion."""
    settings = get_settings()
    clean_messages = _normalize_messages(messages)

    if not settings.enable_deepseek_chat:
        raise DeepSeekConfigError("DeepSeek chat is disabled.")
    if not settings.deepseek_api_key:
        raise DeepSeekConfigError("DeepSeek API key is not configured.")
    if not clean_messages:
        raise DeepSeekConfigError("DeepSeek messages cannot be empty.")

    payload = json.dumps(
        {
            "model": settings.deepseek_model,
            "messages": clean_messages,
            "stream": True,
        }
    ).encode("utf-8")

    http_request = request.Request(
        settings.deepseek_api_url,
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.deepseek_api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        method="POST",
    )

    try:
        with request.urlopen(
            http_request,
            timeout=settings.deepseek_timeout_seconds,
        ) as response:
            for raw_line in response:
                line = raw_line.decode("utf-8").strip()
                if not line or not line.startswith("data:"):
                    continue
                data_str = line[len("data:"):].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                except json.JSONDecodeError:
                    continue
                delta = (
                    chunk.get("choices", [{}])[0]
                    .get("delta", {})
                    .get("content")
                )
                if delta:
                    yield delta
    except TimeoutError as exc:
        raise DeepSeekError("DeepSeek request timed out.") from exc
    except error.HTTPError as exc:
        message = f"DeepSeek HTTP request failed with status {exc.code}."
        raise DeepSeekError(message) from exc
    except error.URLError as exc:
        raise DeepSeekError(f"DeepSeek network request failed: {exc.reason}.") from exc


def _normalize_messages(messages: list[ChatMessage | dict[str, str]]) -> list[dict[str, str]]:
    clean_messages = []
    for message in messages:
        if isinstance(message, ChatMessage):
            role = message.role
            content = message.content
        elif isinstance(message, dict):
            role = str(message.get("role", ""))
            content = str(message.get("content", ""))
        else:
            continue

        clean_content = content.strip()
        if role in {"user", "assistant"} and clean_content:
            clean_messages.append(
                {
                    "role": role,
                    "content": clean_content,
                }
            )

    return clean_messages


def _extract_reply(response_data: object) -> str:
    if not isinstance(response_data, dict):
        raise DeepSeekResponseError("DeepSeek response must be a JSON object.")

    choices = response_data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise DeepSeekResponseError("DeepSeek response is missing choices.")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise DeepSeekResponseError("DeepSeek response choice is invalid.")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise DeepSeekResponseError("DeepSeek response is missing message.")

    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise DeepSeekResponseError("DeepSeek response is missing reply content.")

    return content.strip()
