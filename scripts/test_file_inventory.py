from __future__ import annotations

import json
from typing import Any
from urllib import error, request

API_URL = "http://127.0.0.1:8000/chat"

TEST_CASES = [
    (
        "单个 PDF 清单",
        "文件清单：cet4_words.pdf，PDF，3MB，D:\\Downloads，目标：总结重点并出题",
        "file_inventory",
        "success",
        ["pdf"],
        "low",
    ),
    (
        "单个 Excel 清单",
        "我有这些文件：wrong_words.xlsx，目标：整理错词",
        "file_inventory",
        "success",
        ["excel"],
        "low",
    ),
    (
        "图片清单 OCR 目标",
        "资料列表：photo.png，目标：识别图片文字",
        "file_inventory",
        "success",
        ["image"],
        "medium",
    ),
    ("通用 PDF 分析", "帮我分析 PDF", "not_file_inventory", "success", [], ""),
    ("文件整理计划", "帮我整理文件", "not_file_inventory", "success", [], ""),
    ("普通问候", "hello ai hub", "not_file_inventory", "success", [], ""),
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
    expected_types: list[str],
    expected_risk: str,
) -> str:
    actual_skill = str(result.get("skill", ""))
    actual_status = str(result.get("status", ""))
    data = result.get("data") or {}
    plan = data.get("file_inventory_plan", {})
    actual_types = list(plan.get("inferred_file_types", []))
    actual_risk = str(plan.get("risk_level", ""))
    actual_executable = plan.get("executable", None)
    actual_confirmation = plan.get("requires_confirmation", None)

    if expected_skill == "not_file_inventory":
        if actual_skill != "file_inventory" and actual_status == expected_status:
            return "PASS"
        return "CHECK"

    if (
        actual_skill == expected_skill
        and actual_status == expected_status
        and all(file_type in actual_types for file_type in expected_types)
        and actual_risk == expected_risk
        and actual_executable is False
        and actual_confirmation is True
    ):
        return "PASS"
    return "CHECK"


def main() -> None:
    summary: list[tuple[str, str]] = []

    for test_name, message, expected_skill, expected_status, expected_types, expected_risk in TEST_CASES:
        try:
            result = post_message(message)
            data = result.get("data") or {}
            plan = data.get("file_inventory_plan", {})
            files = plan.get("files", [])
            check = evaluate_result(result, expected_skill, expected_status, expected_types, expected_risk)
            print(f"[{test_name}]")
            print(f"input: {message}")
            print(f"skill: {result.get('skill', '')}")
            print(f"status: {result.get('status', '')}")
            print(f"file_count: {len(files)}")
            print(f"inferred_file_types: {plan.get('inferred_file_types', [])}")
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
            print("file_count: ")
            print("inferred_file_types: ")
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
            print("file_count: ")
            print("inferred_file_types: ")
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
