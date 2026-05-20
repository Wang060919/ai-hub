from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib import error, request

API_URL = "http://127.0.0.1:8000/chat"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCAN_SANDBOX = PROJECT_ROOT / "data" / "scan_sandbox"
CHILD_DIRECTORY = SCAN_SANDBOX / "lesson_pack"
NESTED_DIRECTORY = CHILD_DIRECTORY / "nested"
ROOT_TEST_FILE = SCAN_SANDBOX / "single_file.txt"

TEST_CASES = [
    ("默认扫描目录", "扫描目录", "readonly_file_scanner", "success"),
    ("相对路径扫描", "列出目录文件：data\\scan_sandbox", "readonly_file_scanner", "success"),
    ("拒绝扫描 C 盘", "扫描目录：C:\\", "readonly_file_scanner_error", "error"),
    ("拒绝路径穿越", "扫描目录：data\\scan_sandbox\\..\\..\\", "readonly_file_scanner_error", "error"),
    ("拒绝扫描文件路径", "扫描目录：data\\scan_sandbox\\single_file.txt", "readonly_file_scanner_error", "error"),
    ("拒绝不存在路径", "扫描目录：data\\scan_sandbox\\not_exists", "readonly_file_scanner_error", "error"),
    ("拒绝超过一层子目录", "扫描目录：data\\scan_sandbox\\lesson_pack\\nested", "readonly_file_scanner_error", "error"),
    ("整理文件应走安全计划", "帮我整理文件", "not_readonly_file_scanner", "success"),
    ("手动文件清单应走 inventory", "文件清单：cet4.pdf，目标：总结重点", "not_readonly_file_scanner", "success"),
    ("通用文件分析应走 analysis", "帮我分析 PDF", "not_readonly_file_scanner", "success"),
    ("普通问候不命中", "hello ai hub", "not_readonly_file_scanner", "success"),
]


def ensure_test_sandbox() -> None:
    SCAN_SANDBOX.mkdir(parents=True, exist_ok=True)
    CHILD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    NESTED_DIRECTORY.mkdir(parents=True, exist_ok=True)
    (SCAN_SANDBOX / "cet4_words.pdf").write_text("metadata test file", encoding="utf-8")
    (SCAN_SANDBOX / "wrong_words.xlsx").write_text("spreadsheet placeholder", encoding="utf-8")
    ROOT_TEST_FILE.write_text("single file placeholder", encoding="utf-8")
    (CHILD_DIRECTORY / "notes.txt").write_text("child directory placeholder", encoding="utf-8")


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


def evaluate_result(result: dict[str, Any], expected_skill: str, expected_status: str) -> str:
    actual_skill = str(result.get("skill", ""))
    actual_status = str(result.get("status", ""))
    data = result.get("data") or {}
    plan = data.get("readonly_file_scan_plan", {})

    if expected_skill == "not_readonly_file_scanner":
        if actual_skill != "readonly_file_scanner" and actual_status == expected_status:
            return "PASS"
        return "CHECK"

    if expected_skill == "readonly_file_scanner_error":
        if (
            actual_skill == "readonly_file_scanner"
            and actual_status == expected_status
            and plan.get("executable") is False
            and plan.get("requires_confirmation") is True
        ):
            return "PASS"
        return "CHECK"

    if (
        actual_skill == expected_skill
        and actual_status == expected_status
        and int(plan.get("total_files", 0)) >= 1
        and plan.get("executable") is False
        and plan.get("requires_confirmation") is True
    ):
        return "PASS"
    return "CHECK"


def main() -> None:
    ensure_test_sandbox()
    summary: list[tuple[str, str]] = []

    for test_name, message, expected_skill, expected_status in TEST_CASES:
        try:
            result = post_message(message)
            data = result.get("data") or {}
            plan = data.get("readonly_file_scan_plan", {})
            check = evaluate_result(result, expected_skill, expected_status)
            print(f"[{test_name}]")
            print(f"input: {message}")
            print(f"skill: {result.get('skill', '')}")
            print(f"status: {result.get('status', '')}")
            print(f"total_files: {plan.get('total_files', '')}")
            print(f"total_directories: {plan.get('total_directories', '')}")
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
            print("total_files: ")
            print("total_directories: ")
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
            print("total_files: ")
            print("total_directories: ")
            print("executable: ")
            print("requires_confirmation: ")
            print(f"result: {exc}")
            print()
            summary.append((test_name, "error"))

    print("Summary:")
    for test_name, result in summary:
        print(f"- {test_name}: {result}")


if __name__ == "__main__":
    main()
