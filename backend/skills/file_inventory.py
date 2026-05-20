from __future__ import annotations

import re

from backend.schemas import ChatResponse, FileInventoryItem, FileInventoryPlan
from backend.skills.base import BaseSkill

FILE_INVENTORY_KEYWORDS = (
    "这是我的文件清单",
    "文件清单",
    "我有这些文件",
    "资料列表",
    "待分析文件",
    "请根据这些文件生成分析计划",
    "根据文件列表生成计划",
)

FILE_INVENTORY_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in FILE_INVENTORY_KEYWORDS)
HIGH_RISK_KEYWORDS = ("删除", "清理", "移动", "重命名", "覆盖", "复制")
MEDIUM_RISK_KEYWORDS = ("ocr", "图片文字", "识别图片文字", "文件夹", "目录", "批量")
FILE_NAME_PATTERN = re.compile(r"([A-Za-z0-9_\-\u4e00-\u9fff]+(?:\.[A-Za-z0-9]+)+)")


class FileInventorySkill(BaseSkill):
    name = "file_inventory"

    def execute(self, message: str) -> ChatResponse:
        plan = self._build_plan(message.strip())
        return ChatResponse(
            reply="已根据你提供的文件清单生成分析计划，但当前不会访问或处理任何真实文件。",
            skill=self.name,
            status="success",
            data={"file_inventory_plan": plan.model_dump()},
        )

    def _build_plan(self, message: str) -> FileInventoryPlan:
        files = self._parse_files(message)
        inferred_file_types = self._collect_file_types(files)
        analysis_goal = self._get_analysis_goal(message, files)
        risk_level = self._get_risk_level(message, files, inferred_file_types)
        intent = self._get_intent(message, files)

        return FileInventoryPlan(
            intent=intent,
            files=files,
            inferred_file_types=inferred_file_types,
            analysis_goal=analysis_goal,
            risk_level=risk_level,
            recommended_next_step=self._get_recommended_next_step(risk_level),
            steps=self._build_steps(files, analysis_goal, risk_level),
            requires_confirmation=True,
            executable=False,
            notes=self._build_notes(risk_level),
        )

    def _parse_files(self, message: str) -> list[FileInventoryItem]:
        candidate_lines = self._extract_candidate_lines(message)
        files: list[FileInventoryItem] = []

        for line in candidate_lines:
            cleaned_line = self._clean_line(line)
            if not cleaned_line:
                continue
            file_name = self._extract_file_name(cleaned_line)
            file_type = self._detect_file_type(cleaned_line, file_name)
            size_hint = self._extract_size_hint(cleaned_line)
            location_hint = self._extract_location_hint(cleaned_line)
            user_goal = self._extract_user_goal(cleaned_line)
            files.append(
                FileInventoryItem(
                    name=file_name or cleaned_line,
                    file_type=file_type,
                    size_hint=size_hint,
                    location_hint=location_hint,
                    user_goal=user_goal,
                )
            )

        if files:
            return files

        fallback_name = self._clean_line(message.replace("\r", "\n").split("\n")[-1])
        return [
            FileInventoryItem(
                name=fallback_name or "用户提供的文件清单描述",
                file_type=self._detect_file_type(message, fallback_name),
                size_hint=self._extract_size_hint(message),
                location_hint=self._extract_location_hint(message),
                user_goal=self._extract_user_goal(message),
            )
        ]

    @staticmethod
    def _extract_candidate_lines(message: str) -> list[str]:
        normalized = message.replace("\r", "\n")
        lines = [line.strip() for line in normalized.split("\n") if line.strip()]
        if len(lines) > 1:
            first_line = lines[0]
            remaining_lines = lines[1:]
            if "：" in first_line:
                label_content = first_line.split("：", 1)[1].strip()
                if label_content:
                    return [label_content, *remaining_lines]
            if ":" in first_line:
                label_content = first_line.split(":", 1)[1].strip()
                if label_content:
                    return [label_content, *remaining_lines]
            return remaining_lines

        single_line = lines[0] if lines else message
        if "：" in single_line:
            return [single_line.split("：", 1)[1]]
        if ":" in single_line:
            return [single_line.split(":", 1)[1]]
        return [single_line]

    @staticmethod
    def _clean_line(line: str) -> str:
        return re.sub(r"^\s*(?:[-*]|\d+[.)、]?)\s*", "", line).strip(" ，,;；")

    @staticmethod
    def _extract_file_name(line: str) -> str:
        match = FILE_NAME_PATTERN.search(line)
        if match:
            return match.group(1)
        return ""

    def _detect_file_type(self, text: str, file_name: str) -> str:
        normalized_text = text.lower()
        normalized_name = file_name.lower()
        if normalized_name.endswith(".pdf"):
            return "pdf"
        if normalized_name.endswith((".doc", ".docx")):
            return "word"
        if normalized_name.endswith((".xls", ".xlsx", ".csv")):
            return "excel"
        if normalized_name.endswith((".png", ".jpg", ".jpeg", ".webp")):
            return "image"
        if "pdf" in normalized_text:
            return "pdf"
        if "word" in normalized_text:
            return "word"
        if "excel" in normalized_text:
            return "excel"
        if "图片" in text or "image" in normalized_text:
            return "image"
        return "unknown"

    @staticmethod
    def _extract_size_hint(text: str) -> str:
        match = re.search(r"(\d+(?:\.\d+)?)\s*(KB|MB|GB|kb|mb|gb)", text)
        if match:
            return f"{match.group(1)}{match.group(2).upper()}"
        return "未提供"

    @staticmethod
    def _extract_location_hint(text: str) -> str:
        path_match = re.search(r"([A-Za-z]:\\[^，,\n;；]*)", text)
        if path_match:
            return path_match.group(1).strip()
        for part in re.split(r"[，,;；]", text):
            segment = part.strip()
            if "\\" in segment or "/" in segment:
                return segment
        return "未提供"

    @staticmethod
    def _extract_user_goal(text: str) -> str:
        goal_match = re.search(r"(?:目标|用途|需求)\s*[:：]\s*(.+)$", text)
        if goal_match:
            return goal_match.group(1).strip(" ，,;；")
        return "待用户进一步说明"

    @staticmethod
    def _collect_file_types(files: list[FileInventoryItem]) -> list[str]:
        inferred_types: list[str] = []
        for item in files:
            if item.file_type not in inferred_types:
                inferred_types.append(item.file_type)
        return inferred_types or ["unknown"]

    @staticmethod
    def _get_analysis_goal(message: str, files: list[FileInventoryItem]) -> str:
        for item in files:
            if item.user_goal != "待用户进一步说明":
                return item.user_goal
        if "总结" in message:
            return "总结重点并提炼关键信息"
        if "整理" in message:
            return "整理文件相关信息并准备后续分析计划"
        return "根据文件清单生成后续处理或分析计划"

    @staticmethod
    def _get_risk_level(message: str, files: list[FileInventoryItem], inferred_file_types: list[str]) -> str:
        normalized_message = message.lower()
        if any(keyword in message for keyword in HIGH_RISK_KEYWORDS):
            return "high"
        if any(keyword in normalized_message for keyword in MEDIUM_RISK_KEYWORDS):
            return "medium"
        if len(files) > 3:
            return "medium"
        if "image" in inferred_file_types and any(keyword in normalized_message for keyword in ("ocr", "文字", "识别")):
            return "medium"
        return "low"

    @staticmethod
    def _get_intent(message: str, files: list[FileInventoryItem]) -> str:
        if len(files) == 1:
            return "根据单个文件清单生成分析计划"
        if len(files) > 1:
            return "根据多个文件清单生成批量分析计划"
        if "资料列表" in message:
            return "根据资料列表生成分析计划"
        return "根据用户提供的文件清单生成分析计划"

    @staticmethod
    def _get_recommended_next_step(risk_level: str) -> str:
        if risk_level == "high":
            return "该需求已接近真实文件操作，请改用 SafeActionSkill 先生成安全操作计划。"
        if risk_level == "medium":
            return "请先补充文件范围、目标和优先级，再确认是否进入后续分析流程。"
        return "请确认清单信息无误，后续可基于该计划继续细化分析步骤。"

    @staticmethod
    def _build_steps(files: list[FileInventoryItem], analysis_goal: str, risk_level: str) -> list[str]:
        steps = [
            "整理用户手动提供的文件名称、类型、大小和位置描述。",
            f"明确当前分析目标：{analysis_goal}",
            "根据文件类型生成后续可执行前的处理或分析思路。",
            "等待用户确认范围与目标，当前版本不会访问任何真实文件。",
        ]
        if len(files) > 1:
            steps.insert(2, "按文件条目拆分处理优先级，避免在后续阶段混淆不同文件目标。")
        if risk_level == "medium":
            steps.insert(3, "标记该请求包含图片识别、目录级描述或批量处理，需要额外确认边界。")
        if risk_level == "high":
            steps.insert(3, "标记该请求包含潜在高风险文件操作，应先切换到 SafeActionSkill 生成操作计划。")
        return steps

    @staticmethod
    def _build_notes(risk_level: str) -> str:
        note = "当前只基于用户提供的信息生成计划，不会访问、读取、扫描、打开或处理任何真实文件。"
        if risk_level == "medium":
            note += " 当前不会执行 OCR、图片解析或目录扫描。"
        if risk_level == "high":
            note += " 如涉及删除、移动、重命名或覆盖，应改用 SafeActionSkill 先生成安全操作计划。"
        return note
