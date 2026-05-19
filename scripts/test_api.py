from __future__ import annotations

import json
from typing import Any
from urllib import error, request

API_URL = "http://127.0.0.1:8000/chat"

TEST_CASES = [
    ("EchoSkill", "hello ai hub"),
    ("TimeSkill", "现在几点了"),
    ("IdeaCaptureSkill 保存想法", "记录想法：测试脚本写入"),
    ("IdeaCaptureSkill 查询最近想法", "最近想法"),
    ("DifyEnglishSkill", "帮我查一个四级单词：refute"),
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
        response_body = response.read().decode("utf-8")
    return json.loads(response_body)


def print_result(test_name: str, result: dict[str, Any]) -> None:
    skill = result.get("skill", "")
    status = result.get("status", "")
    reply = truncate_reply(str(result.get("reply", "")))
    print(f"[{test_name}]")
    print(f"skill: {skill}")
    print(f"status: {status}")
    print(f"reply: {reply}")
    print()


def print_error(test_name: str, exc: Exception) -> None:
    print(f"[{test_name}]")
    print("skill: ")
    print("status: error")
    print(f"reply: {truncate_reply(str(exc))}")
    print()


def main() -> None:
    summary: list[tuple[str, str]] = []

    for test_name, message in TEST_CASES:
        try:
            result = post_message(message)
            print_result(test_name, result)
            summary.append((test_name, str(result.get("status", ""))))
        except error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            print_error(test_name, Exception(f"HTTP {exc.code}: {error_body or exc.reason}"))
            summary.append((test_name, "error"))
        except Exception as exc:
            print_error(test_name, exc)
            summary.append((test_name, "error"))

    print("Summary:")
    for test_name, status in summary:
        print(f"- {test_name}: {status}")


if __name__ == "__main__":
    main()
