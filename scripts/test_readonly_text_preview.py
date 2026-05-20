from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib import error, request

API_URL = "http://127.0.0.1:8000/chat"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCAN_SANDBOX = PROJECT_ROOT / "data" / "scan_sandbox"
A_NOTE_FILE = SCAN_SANDBOX / "a_note.txt"
MARKDOWN_FILE = SCAN_SANDBOX / "README.md"
LARGE_TEXT_FILE = SCAN_SANDBOX / "large.txt"
PDF_PLACEHOLDER_FILE = SCAN_SANDBOX / "b_words.pdf"

TEST_CASES = [
    ("预览 txt 文件", "预览文件：data\\scan_sandbox\\a_note.txt", "readonly_text_preview", "success"),
    ("预览点路径 txt 文件", "预览文件：./data/scan_sandbox/a_note.txt", "readonly_text_preview", "success"),
    ("预览 markdown 文件", "预览 markdown：data\\scan_sandbox\\README.md", "readonly_text_preview", "success"),
    ("拒绝白名单外文件", "预览文件：C:\\Windows\\win.ini", "readonly_text_preview", "error"),
    ("拒绝非 txt/md 文件", "预览文件：data\\scan_sandbox\\b_words.pdf", "readonly_text_preview", "error"),
    ("拒绝超大文本文件", "预览文件：data\\scan_sandbox\\large.txt", "readonly_text_preview", "error"),
    ("扫描目录仍走 scanner", "扫描目录", "not_readonly_text_preview", "success"),
    ("整理文件仍走 safe_action", "帮我整理文件", "not_readonly_text_preview", "success"),
    ("普通问候不命中", "hello ai hub", "not_readonly_text_preview", "success"),
]


def ensure_test_sandbox() -> None:
    SCAN_SANDBOX.mkdir(parents=True, exist_ok=True)
    A_NOTE_FILE.write_text("Alpha line 1\nAlpha line 2\n这是一个只读文本预览测试文件。", encoding="utf-8")
    MARKDOWN_FILE.write_text("# Preview Title\n\n- item 1\n- item 2\n\n这是一份 markdown 预览测试。", encoding="utf-8")
    LARGE_TEXT_FILE.write_text("L" * ((64 * 1024) + 32), encoding="utf-8")
    PDF_PLACEHOLDER_FILE.write_text("pdf placeholder", encoding="utf-8")


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


def assert_success_plan(plan: dict[str, Any], expected_name: str, expected_suffix: str) -> None:
    if plan.get("file_name") != expected_name:
        raise AssertionError(f"file_name 不符合预期: {plan.get('file_name')}")
    if plan.get("suffix") != expected_suffix:
        raise AssertionError(f"suffix 不符合预期: {plan.get('suffix')}")
    if int(plan.get("size_bytes", 0)) <= 0:
        raise AssertionError("size_bytes 应大于 0。")
    if not str(plan.get("preview_text", "")).strip():
        raise AssertionError("preview_text 为空。")
    if int(plan.get("preview_chars", 0)) <= 0:
        raise AssertionError("preview_chars 应大于 0。")
    if plan.get("executable") is not False:
        raise AssertionError("executable 应为 false。")
    if plan.get("requires_confirmation") is not True:
        raise AssertionError("requires_confirmation 应为 true。")


def evaluate_result(test_name: str, result: dict[str, Any], expected_skill: str, expected_status: str) -> str:
    actual_skill = str(result.get("skill", ""))
    actual_status = str(result.get("status", ""))
    data = result.get("data") or {}
    plan = data.get("readonly_text_preview_plan", {})

    if expected_skill == "not_readonly_text_preview":
        if actual_skill != "readonly_text_preview" and actual_status == expected_status:
            return "PASS"
        return "CHECK"

    if actual_skill != expected_skill or actual_status != expected_status:
        return "CHECK"

    if plan.get("executable") is not False or plan.get("requires_confirmation") is not True:
        return "CHECK"

    if test_name in {"预览 txt 文件", "预览点路径 txt 文件"}:
        assert_success_plan(plan, "a_note.txt", ".txt")
    elif test_name == "预览 markdown 文件":
        assert_success_plan(plan, "README.md", ".md")
    elif expected_status == "error":
        if int(plan.get("size_bytes", 0)) != 0:
            return "CHECK"

    return "PASS"


def main() -> None:
    ensure_test_sandbox()
    summary: list[tuple[str, str]] = []

    for test_name, message, expected_skill, expected_status in TEST_CASES:
        try:
            result = post_message(message)
            data = result.get("data") or {}
            plan = data.get("readonly_text_preview_plan", {})
            check = evaluate_result(test_name, result, expected_skill, expected_status)
            print(f"[{test_name}]")
            print(f"input: {message}")
            print(f"skill: {result.get('skill', '')}")
            print(f"status: {result.get('status', '')}")
            print(f"file_name: {plan.get('file_name', '')}")
            print(f"suffix: {plan.get('suffix', '')}")
            print(f"size_bytes: {plan.get('size_bytes', '')}")
            print(f"truncated: {plan.get('truncated', '')}")
            print(f"executable: {plan.get('executable', '')}")
            print(f"requires_confirmation: {plan.get('requires_confirmation', '')}")
            print(f"result: {check}")
            print()
            summary.append((test_name, check))
        except error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            print(f"[{test_name}]")
            print(f"input: {message}")
            print("skill: ")
            print("status: error")
            print("file_name: ")
            print("suffix: ")
            print("size_bytes: ")
            print("truncated: ")
            print("executable: ")
            print("requires_confirmation: ")
            print(f"result: HTTP {exc.code}: {error_body or exc.reason}")
            print()
            summary.append((test_name, "error"))
        except Exception as exc:
            print(f"[{test_name}]")
            print(f"input: {message}")
            print("skill: ")
            print("status: error")
            print("file_name: ")
            print("suffix: ")
            print("size_bytes: ")
            print("truncated: ")
            print("executable: ")
            print("requires_confirmation: ")
            print(f"result: {exc}")
            print()
            summary.append((test_name, "error"))

    print("Summary:")
    for test_name, result in summary:
        print(f"- {test_name}: {result}")

    failed_cases = [test_name for test_name, result in summary if result != "PASS"]
    if failed_cases:
        raise SystemExit(f"测试失败: {', '.join(failed_cases)}")


if __name__ == "__main__":
    main()
