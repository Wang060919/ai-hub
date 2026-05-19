from __future__ import annotations

from backend.schemas import ChatResponse, FileAnalysisPlan
from backend.skills.base import BaseSkill

FILE_ANALYSIS_KEYWORDS = (
    "帮我分析文件",
    "帮我看一下这个文件",
    "帮我总结这个文档",
    "帮我分析pdf",
    "帮我分析 pdf",
    "帮我分析word",
    "帮我分析 word",
    "帮我分析excel",
    "帮我分析 excel",
    "帮我分析表格",
    "帮我分析图片",
    "帮我识别图片文字",
    "帮我ocr",
    "帮我 ocr",
    "帮我分析文件夹",
    "先给我一个文件分析计划",
    "分析文件",
    "总结这个文档",
    "分析pdf",
    "分析 pdf",
    "分析word",
    "分析 word",
    "分析excel",
    "分析 excel",
    "分析表格",
    "分析图片",
    "识别图片文字",
    "分析文件夹",
    "ocr",
    "文件分析计划",
)

FILE_ANALYSIS_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in FILE_ANALYSIS_KEYWORDS)
FOLDER_ANALYSIS_KEYWORDS = ("文件夹", "目录", "批量")
OCR_KEYWORDS = ("ocr", "识别图片文字", "图片文字", "文字识别", "提取图片文字")


class FileAnalysisSkill(BaseSkill):
    name = "file_analysis"

    def execute(self, message: str) -> ChatResponse:
        plan = self._build_plan(message.strip())
        return ChatResponse(
            reply="已生成文件分析计划，但当前不会读取或处理任何真实文件。",
            skill=self.name,
            status="success",
            data={"file_analysis_plan": plan.model_dump()},
        )

    def _build_plan(self, message: str) -> FileAnalysisPlan:
        file_type_guess = self._get_file_type_guess(message)
        risk_level = self._get_risk_level(message, file_type_guess)
        analysis_goal = self._get_analysis_goal(message)

        return FileAnalysisPlan(
            intent=self._get_intent(file_type_guess),
            file_type_guess=file_type_guess,
            analysis_goal=analysis_goal,
            risk_level=risk_level,
            steps=self._build_steps(file_type_guess, analysis_goal, risk_level),
            requires_confirmation=True,
            executable=False,
            notes=self._build_notes(file_type_guess, risk_level),
        )

    @staticmethod
    def _get_file_type_guess(message: str) -> str:
        normalized_message = message.lower()
        if "pdf" in normalized_message:
            return "pdf"
        if "word" in normalized_message or "文档" in message:
            return "word"
        if "excel" in normalized_message or "表格" in message:
            return "excel"
        if "图片" in message or "image" in normalized_message or "ocr" in normalized_message:
            return "image"
        if "folder" in normalized_message or any(keyword in message for keyword in FOLDER_ANALYSIS_KEYWORDS):
            return "folder"
        return "unknown"

    @staticmethod
    def _get_risk_level(message: str, file_type_guess: str) -> str:
        normalized_message = message.lower()
        if any(keyword in normalized_message for keyword in OCR_KEYWORDS):
            return "medium"
        if file_type_guess == "folder":
            return "medium"
        if any(keyword in message for keyword in FOLDER_ANALYSIS_KEYWORDS):
            return "medium"
        return "low"

    @staticmethod
    def _get_analysis_goal(message: str) -> str:
        normalized_message = message.lower()
        if any(keyword in normalized_message for keyword in OCR_KEYWORDS):
            return "预览图片文字识别与提取思路"
        if "总结" in message:
            return "预览文档总结与关键信息提炼思路"
        if "表格" in message or "excel" in normalized_message:
            return "预览表格结构、数据字段与分析思路"
        if "图片" in message:
            return "预览图片内容理解与信息提取思路"
        if any(keyword in message for keyword in FOLDER_ANALYSIS_KEYWORDS) or "folder" in normalized_message:
            return "预览文件夹内文件分析与分类思路"
        return "预览文件内容理解与后续分析思路"

    @staticmethod
    def _get_intent(file_type_guess: str) -> str:
        if file_type_guess == "pdf":
            return "预览 PDF 文件分析计划"
        if file_type_guess == "word":
            return "预览 Word 文档分析计划"
        if file_type_guess == "excel":
            return "预览 Excel 或表格分析计划"
        if file_type_guess == "image":
            return "预览图片或 OCR 分析计划"
        if file_type_guess == "folder":
            return "预览文件夹分析计划"
        return "预览通用文件分析计划"

    @staticmethod
    def _build_steps(file_type_guess: str, analysis_goal: str, risk_level: str) -> list[str]:
        steps = [
            "识别用户希望分析的文件类型与分析目标。",
            "列出后续真实处理前需要确认的文件范围、来源和格式。",
            "预览可能采用的分析流程，但当前版本不会读取任何真实文件。",
            "等待用户确认后，后续版本再决定是否接入 OCR、文档解析或自动化能力。",
        ]
        if file_type_guess == "folder":
            steps[1] = "列出文件夹分析前需要确认的目录范围、文件类型和批量处理边界。"
        if file_type_guess == "image":
            steps[2] = "预览图片理解或 OCR 的流程说明，但当前版本不会打开图片或执行识别。"
        if risk_level == "medium":
            steps.insert(2, "标记该请求涉及较高的不确定性，需要用户进一步确认分析边界。")
        if analysis_goal:
            steps.insert(1, f"分析目标：{analysis_goal}")
        return steps

    @staticmethod
    def _build_notes(file_type_guess: str, risk_level: str) -> str:
        note = "当前只生成 FileAnalysisPlan 预览，不会读取、打开或处理任何真实文件。"
        if file_type_guess == "image":
            note += " 当前不会执行 OCR 或图片文字识别。"
        if file_type_guess in {"pdf", "word", "excel"}:
            note += " 当前不会打开或解析文档内容。"
        if risk_level == "medium":
            note += " 该请求需要用户确认范围后，未来版本才适合继续。"
        return note
