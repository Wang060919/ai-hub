from __future__ import annotations

import json
from typing import Any
from urllib import error, request

API_URL = "http://127.0.0.1:8000/chat"

TEST_CASES = [
    ("整理文件计划", "帮我整理文件", "safe_action", "success", "medium"),
    ("删除重复文件计划", "帮我删除重复文件", "safe_action", "success", "high"),
    ("执行计划预览", "先给我一个执行计划：整理下载目录", "safe_action", "success", "medium"),
    ("分析文件计划", "帮我分析文件", "safe_action", "success", "low"),
    ("普通问候不命中", "hello ai hub", "not_safe_action", "success", ""),
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


def evaluate_result(result: dict[str, Any], expected_skill: str, expected_status: str, expected_risk: str) -> str:
    actual_skill = str(result.get("skill", ""))
    actual_status = str(result.get("status", ""))
    data = result.get("data") or {}
    action_plan = data.get("action_plan", {})
    actual_risk = str(action_plan.get("risk_level", ""))
    actual_executable = action_plan.get("executable", None)
    actual_confirmation = action_plan.get("requires_confirmation", None)

    if expected_skill == "not_safe_action":
        if actual_skill != "safe_action" and actual_status == expected_status:
            return "PASS"
        return "CHECK"

    if (
        actual_skill == expected_skill
        and actual_status == expected_status
        and actual_risk == expected_risk
        and actual_executable is False
        and actual_confirmation is True
    ):
        return "PASS"
    return "CHECK"


def main() -> None:
    summary: list[tuple[str, str]] = []

    for test_name, message, expected_skill, expected_status, expected_risk in TEST_CASES:
        try:
            result = post_message(message)
            data = result.get("data") or {}
            action_plan = data.get("action_plan", {})
            check = evaluate_result(result, expected_skill, expected_status, expected_risk)
            print(f"[{test_name}]")
            print(f"input: {message}")
            print(f"skill: {result.get('skill', '')}")
            print(f"status: {result.get('status', '')}")
            print(f"risk_level: {action_plan.get('risk_level', '')}")
            print(f"executable: {action_plan.get('executable', '')}")
            print(f"requires_confirmation: {action_plan.get('requires_confirmation', '')}")
            print(f"result: {check}")
            print()
            summary.append((test_name, check))
        except error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            print(f"[{test_name}]")
            print(f"input: {message}")
            print("skill: ")
            print("status: error")
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
