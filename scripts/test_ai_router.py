from __future__ import annotations

import json
from typing import Any
from urllib import error, request

API_URL = "http://127.0.0.1:8000/chat"

TEST_CASES = [
    ("模糊英语输入", "这个词怎么背：refute", "dify_english", "success"),
    ("模糊想法输入", "帮我记一下以后做错词复习功能", "idea_capture", "success"),
    ("普通闲聊输入", "随便说句话", "echo", "success"),
]


def truncate_reply(reply: str, limit: int = 120) -> str:
    text = reply.replace("\r", " ").replace("\n", " ").strip()
    if len(text) <= limit:
        return text
    return text[:limit] + "..."


def post_message(message: str) -> dict[str, Any]:
    payload = json.dumps({"message": message}, ensure_ascii=False).encode("utf-8")
    http_request = request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with request.urlopen(http_request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def print_result(
    test_name: str,
    message: str,
    expected_skill: str,
    expected_status: str,
    result: dict[str, Any],
) -> None:
    actual_skill = str(result.get("skill", ""))
    actual_status = str(result.get("status", ""))
    check_result = "PASS" if actual_skill == expected_skill and actual_status == expected_status else "CHECK"
    print(f"[{test_name}]")
    print(f"input: {message}")
    print(f"expected skill: {expected_skill}")
    print(f"expected status: {expected_status}")
    print(f"actual skill: {actual_skill}")
    print(f"actual status: {actual_status}")
    print(f"result: {check_result}")
    print(f"reply: {truncate_reply(str(result.get('reply', '')))}")
    print()


def print_error(test_name: str, message: str, exc: Exception) -> None:
    print(f"[{test_name}]")
    print(f"input: {message}")
    print("skill: ")
    print("status: error")
    print(f"reply: {truncate_reply(str(exc))}")
    print()


def main() -> None:
    summary: list[tuple[str, str]] = []
    fallback_note_printed = False

    for test_name, message, expected_skill, expected_status in TEST_CASES:
        try:
            result = post_message(message)
            print_result(test_name, message, expected_skill, expected_status, result)
            summary.append((test_name, f"{result.get('skill', '')}/{result.get('status', '')}"))
        except error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            print_error(test_name, message, Exception(f"HTTP {exc.code}: {error_body or exc.reason}"))
            summary.append((test_name, "error"))
        except Exception as exc:
            print_error(test_name, message, exc)
            summary.append((test_name, "error"))

    if not fallback_note_printed:
        print("Note: 如果本地 Ollama 不可用，AI Router 应回退到 echo，而不是让接口崩溃。")
        print()

    print("Summary:")
    for test_name, skill in summary:
        print(f"- {test_name}: {skill}")


if __name__ == "__main__":
    main()
