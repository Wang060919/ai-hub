from __future__ import annotations

import json
from typing import Any
from urllib import error, request

API_URL = "http://127.0.0.1:8000/chat"

TEST_CASES = [
    ("分析 PDF", "帮我分析 PDF", "file_analysis", "success", "pdf", "low"),
    ("总结文档", "帮我总结这个文档", "file_analysis", "success", "word", "low"),
    ("分析 Excel", "帮我分析 Excel", "file_analysis", "success", "excel", "low"),
    ("识别图片文字", "帮我识别图片文字", "file_analysis", "success", "image", "medium"),
    ("分析文件夹", "帮我分析文件夹", "file_analysis", "success", "folder", "medium"),
    ("整理文件应走安全计划", "帮我整理文件", "not_file_analysis", "success", "", ""),
    ("普通问候不命中", "hello ai hub", "not_file_analysis", "success", "", ""),
]


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


def evaluate_result(
    result: dict[str, Any],
    expected_skill: str,
    expected_status: str,
    expected_file_type: str,
    expected_risk: str,
) -> str:
    actual_skill = str(result.get("skill", ""))
    actual_status = str(result.get("status", ""))
    data = result.get("data") or {}
    plan = data.get("file_analysis_plan", {})
    actual_file_type = str(plan.get("file_type_guess", ""))
    actual_risk = str(plan.get("risk_level", ""))
    actual_executable = plan.get("executable", None)
    actual_confirmation = plan.get("requires_confirmation", None)

    if expected_skill == "not_file_analysis":
        if actual_skill != "file_analysis" and actual_status == expected_status:
            return "PASS"
        return "CHECK"

    if (
        actual_skill == expected_skill
        and actual_status == expected_status
        and actual_file_type == expected_file_type
        and actual_risk == expected_risk
        and actual_executable is False
        and actual_confirmation is True
    ):
        return "PASS"
    return "CHECK"


def main() -> None:
    summary: list[tuple[str, str]] = []

    for test_name, message, expected_skill, expected_status, expected_file_type, expected_risk in TEST_CASES:
        try:
            result = post_message(message)
            data = result.get("data") or {}
            plan = data.get("file_analysis_plan", {})
            check = evaluate_result(result, expected_skill, expected_status, expected_file_type, expected_risk)
            print(f"[{test_name}]")
            print(f"input: {message}")
            print(f"skill: {result.get('skill', '')}")
            print(f"status: {result.get('status', '')}")
            print(f"file_type_guess: {plan.get('file_type_guess', '')}")
            print(f"risk_level: {plan.get('risk_level', '')}")
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
            print("file_type_guess: ")
            print("risk_level: ")
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
            print("file_type_guess: ")
            print("risk_level: ")
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
