from __future__ import annotations

import json
from collections.abc import Generator
from urllib import error, request

from backend.core.model_config import get_model_config
from backend.schemas import ChatMessage


class LLMError(RuntimeError):
    """Base error for LLM adapter failures."""


class LLMConfigError(LLMError):
    """Raised when chat is disabled or missing required config."""


class LLMResponseError(LLMError):
    """Raised when the LLM returns an unexpected response shape."""


def is_chat_enabled() -> bool:
    config = get_model_config()
    return bool(config.api_key)


def _chat_url(api_url: str) -> str:
    trimmed = api_url.rstrip("/")
    if trimmed.lower().endswith("/chat/completions"):
        return trimmed
    return trimmed + "/chat/completions"


def create_reply(message: str) -> str:
    return create_reply_from_messages([{"role": "user", "content": message}])


def create_reply_from_messages(messages: list[ChatMessage | dict[str, str]]) -> str:
    config = get_model_config()
    clean_messages = _normalize_messages(messages)

    if not config.api_key:
        raise LLMConfigError("API key is not configured.")
    if not clean_messages:
        raise LLMConfigError("Messages cannot be empty.")

    payload = json.dumps(
        {
            "model": config.model,
            "messages": clean_messages,
            "stream": False,
        }
    ).encode("utf-8")

    http_request = request.Request(
        _chat_url(config.api_url),
        data=payload,
        headers={
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=config.timeout) as response:
            response_body = response.read().decode("utf-8")
    except TimeoutError as exc:
        raise LLMError("Request timed out.") from exc
    except error.HTTPError as exc:
        raise LLMError(f"HTTP request failed with status {exc.code}.") from exc
    except error.URLError as exc:
        raise LLMError(f"Network request failed: {exc.reason}.") from exc

    try:
        response_data = json.loads(response_body)
    except json.JSONDecodeError as exc:
        raise LLMResponseError("Non-JSON response.") from exc

    return _extract_reply(response_data)


def stream_reply_from_messages(
    messages: list[ChatMessage | dict[str, str]],
) -> Generator[str, None, None]:
    config = get_model_config()
    clean_messages = _normalize_messages(messages)

    if not config.api_key:
        raise LLMConfigError("API key is not configured.")
    if not clean_messages:
        raise LLMConfigError("Messages cannot be empty.")

    payload = json.dumps(
        {
            "model": config.model,
            "messages": clean_messages,
            "stream": True,
        }
    ).encode("utf-8")

    http_request = request.Request(
        _chat_url(config.api_url),
        data=payload,
        headers={
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=config.timeout) as response:
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
        raise LLMError("Request timed out.") from exc
    except error.HTTPError as exc:
        raise LLMError(f"HTTP request failed with status {exc.code}.") from exc
    except error.URLError as exc:
        raise LLMError(f"Network request failed: {exc.reason}.") from exc


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
            clean_messages.append({"role": role, "content": clean_content})

    return clean_messages


def _extract_reply(response_data: object) -> str:
    if not isinstance(response_data, dict):
        raise LLMResponseError("Response must be a JSON object.")

    choices = response_data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise LLMResponseError("Response is missing choices.")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise LLMResponseError("Response choice is invalid.")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise LLMResponseError("Response is missing message.")

    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise LLMResponseError("Response is missing reply content.")

    return content.strip()
