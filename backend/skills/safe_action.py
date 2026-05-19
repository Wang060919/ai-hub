from __future__ import annotations

from backend.schemas import ActionPlan, ChatResponse
from backend.skills.base import BaseSkill

SAFE_ACTION_KEYWORDS = (
    "帮我整理文件",
    "帮我清理文件",
    "帮我处理表格",
    "帮我整理目录",
    "帮我批量重命名",
    "帮我删除重复文件",
    "帮我生成一个操作计划",
    "先给我一个执行计划",
    "整理文件",
    "清理文件",
    "处理表格",
    "整理目录",
    "批量重命名",
    "删除重复文件",
    "操作计划",
    "执行计划",
    "下载目录",
)

SAFE_ACTION_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in SAFE_ACTION_KEYWORDS)
HIGH_RISK_KEYWORDS = ("删除", "清理", "批量移动", "批量重命名", "重复文件")


class SafeActionSkill(BaseSkill):
    name = "safe_action"

    def execute(self, message: str) -> ChatResponse:
        action_plan = self._build_action_plan(message.strip())
        return ChatResponse(
            reply="已生成安全操作计划，但当前不会执行任何真实操作。",
            skill=self.name,
            status="success",
            data={"action_plan": action_plan.model_dump()},
        )

    def _build_action_plan(self, message: str) -> ActionPlan:
        risk_level = self._get_risk_level(message)
        intent = self._get_intent(message)
        target_scope = self._get_target_scope(message)
        steps = self._build_steps(message, risk_level)
        notes = self._build_notes(risk_level)

        return ActionPlan(
            intent=intent,
            risk_level=risk_level,
            target_scope=target_scope,
            steps=steps,
            requires_confirmation=True,
            executable=False,
            notes=notes,
        )

    @staticmethod
    def _get_risk_level(message: str) -> str:
        if any(keyword in message for keyword in HIGH_RISK_KEYWORDS):
            return "high"
        if any(keyword in message for keyword in ("整理", "处理", "批量", "目录", "表格")):
            return "medium"
        return "low"

    @staticmethod
    def _get_intent(message: str) -> str:
        if "整理下载目录" in message:
            return "预览下载目录整理计划"
        if "整理桌面" in message:
            return "预览桌面文件整理计划"
        if "删除重复文件" in message:
            return "预览删除重复文件的安全操作计划"
        if "清理文件" in message:
            return "预览文件清理计划"
        if "批量重命名" in message:
            return "预览批量重命名的安全操作计划"
        if "处理表格" in message:
            return "预览表格处理的安全操作计划"
        if "整理目录" in message:
            return "预览目录整理计划"
        if "整理文件" in message:
            return "预览文件整理计划"
        if "执行计划" in message or "操作计划" in message:
            return "预览用户请求的执行计划"
        return "预览安全操作计划"

    @staticmethod
    def _get_target_scope(message: str) -> str:
        if "下载目录" in message:
            return "下载目录及其中待整理文件（仅预览范围，不执行）"
        if "表格" in message:
            return "用户指定的表格文件或表格目录（仅预览范围，不执行）"
        if "目录" in message:
            return "用户提到的目标目录（仅预览范围，不执行）"
        if "文件" in message:
            return "用户提到的文件集合（仅预览范围，不执行）"
        return "需由用户进一步确认的目标范围（当前仅生成计划）"

    @staticmethod
    def _build_steps(message: str, risk_level: str) -> list[str]:
        steps = [
            "识别用户想处理的文件范围和目标结果。",
            "列出将要检查的文件类型、命名模式或目录范围。",
            "预览可能执行的整理、分析或重命名动作，但当前不执行。",
            "等待用户确认后，后续版本再进入安全执行或沙盒验证阶段。",
        ]
        if risk_level == "high":
            steps.insert(2, "先进行重复项、删除项或批量改动项的清单预览。")
        if "下载目录" in message:
            steps[1] = "列出下载目录中待分类的文件类型、来源和命名模式。"
        return steps

    @staticmethod
    def _build_notes(risk_level: str) -> str:
        if risk_level == "high":
            return "高风险操作需人工确认、先备份、再做沙盒验证；当前版本只生成计划，不会执行。"
        return "当前版本只生成 ActionPlan 预览；需要人工确认，且不会执行任何真实操作。"
