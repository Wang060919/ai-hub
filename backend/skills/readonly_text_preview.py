from __future__ import annotations

import os
import re
from pathlib import Path

from backend.schemas import ChatResponse, ReadOnlyTextPreviewPlan
from backend.skills.base import BaseSkill

READONLY_TEXT_PREVIEW_KEYWORDS = (
    "预览文本文件",
    "只读预览文本",
    "查看 txt",
    "查看 md",
    "预览 markdown",
    "读取文本预览",
    "看一下这个 txt 文件",
    "看一下这个 md 文件",
    "预览文件",
    "预览 txt",
    "预览 md",
    "预览文本",
    "查看 markdown",
)

READONLY_TEXT_PREVIEW_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in READONLY_TEXT_PREVIEW_KEYWORDS)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_SCAN_ROOT = PROJECT_ROOT / "data" / "scan_sandbox"
WINDOWS_ABSOLUTE_PATH_PATTERN = re.compile(r"^[A-Za-z]:[\\/]")
WINDOWS_PATH_PATTERN = re.compile(r"([A-Za-z]:\\[^，,\n;；]*)")
RELATIVE_PATH_PATTERN = re.compile(
    r"((?:data[\\/]|\.?[\\/]?data[\\/]|\.?[\\/])?[A-Za-z0-9_\- .\\/\u4e00-\u9fff]+\.(?:txt|md))",
    re.IGNORECASE,
)
ALLOWED_SUFFIXES = {".txt", ".md"}
MAX_FILE_SIZE_BYTES = 64 * 1024
MAX_PREVIEW_CHARS = 2000


class ReadOnlyTextPreviewSkill(BaseSkill):
    name = "readonly_text_preview"

    def execute(self, message: str) -> ChatResponse:
        requested_path = self._extract_requested_path(message.strip())
        scan_root = self._get_scan_root()

        try:
            resolved_path, item_stat = self._resolve_requested_file(requested_path, scan_root)
            plan = self._build_success_plan(requested_path, scan_root, resolved_path, item_stat)
            return ChatResponse(
                reply="已生成只读文本预览，只读取了白名单目录内的小型文本文件，没有执行任何文件操作。",
                skill=self.name,
                status="success",
                data={"readonly_text_preview_plan": plan.model_dump()},
            )
        except ValueError as exc:
            plan = self._build_error_plan(requested_path, scan_root, str(exc))
            return ChatResponse(
                reply=f"无法生成只读文本预览：{exc}",
                skill=self.name,
                status="error",
                data={"readonly_text_preview_plan": plan.model_dump()},
            )

    @staticmethod
    def _get_scan_root() -> Path:
        configured_root = os.getenv("AI_HUB_SCAN_ROOT", "").strip()
        if configured_root:
            return Path(configured_root).resolve()
        return DEFAULT_SCAN_ROOT.resolve()

    def _extract_requested_path(self, message: str) -> str:
        path_match = WINDOWS_PATH_PATTERN.search(message)
        if path_match:
            return path_match.group(1).strip()

        relative_match = RELATIVE_PATH_PATTERN.search(message)
        if relative_match:
            return relative_match.group(1).strip(" \"'")

        if "：" in message:
            trailing = message.split("：", 1)[1].strip()
            if trailing:
                return trailing
        if ":" in message:
            trailing = message.split(":", 1)[1].strip()
            if trailing:
                return trailing
        raise ValueError("请提供白名单目录内的 txt 或 md 文件路径。")

    def _resolve_requested_file(self, requested_path: str, scan_root: Path) -> tuple[Path, os.stat_result]:
        candidate = self._build_candidate_path(requested_path, scan_root)
        self._ensure_within_scan_root(candidate, scan_root)

        try:
            candidate_stat = candidate.stat()
        except FileNotFoundError as exc:
            raise ValueError("请求的预览文件不存在。") from exc
        except OSError as exc:
            raise ValueError("请求的预览文件无法访问。") from exc

        if not candidate.is_file():
            raise ValueError("请求的预览路径不是文件。")

        suffix = candidate.suffix.lower()
        if suffix not in ALLOWED_SUFFIXES:
            raise ValueError("当前只允许预览 txt 或 md 小文本文件。")

        if int(candidate_stat.st_size) > MAX_FILE_SIZE_BYTES:
            raise ValueError("请求的文本文件超过只读预览大小限制。")

        return candidate, candidate_stat

    def _build_candidate_path(self, requested_path: str, scan_root: Path) -> Path:
        normalized = requested_path.strip().strip('"').strip("'")
        if not normalized:
            raise ValueError("请提供白名单目录内的 txt 或 md 文件路径。")

        if WINDOWS_ABSOLUTE_PATH_PATTERN.match(normalized):
            return Path(normalized).resolve()

        if normalized.startswith(("data\\", "data/", ".\\data\\", "./data/")):
            if scan_root != DEFAULT_SCAN_ROOT.resolve():
                raise ValueError(
                    f"当前生效的白名单根目录是 `{scan_root}`，请提供该目录内的文件路径，而不是项目默认 data 目录路径。"
                )
            return (PROJECT_ROOT / normalized).resolve()

        if normalized.startswith((".\\", "./")):
            return (PROJECT_ROOT / normalized).resolve()

        return (scan_root / normalized).resolve()

    @staticmethod
    def _ensure_within_scan_root(candidate: Path, scan_root: Path) -> None:
        try:
            candidate.relative_to(scan_root)
        except ValueError as exc:
            raise ValueError("请求的预览文件不在白名单目录内。") from exc

    def _build_success_plan(
        self, requested_path: str, scan_root: Path, resolved_path: Path, item_stat: os.stat_result
    ) -> ReadOnlyTextPreviewPlan:
        content = resolved_path.read_text(encoding="utf-8", errors="replace")
        preview_text = content[:MAX_PREVIEW_CHARS]
        truncated = len(content) > MAX_PREVIEW_CHARS

        return ReadOnlyTextPreviewPlan(
            intent="生成白名单目录内小型文本文件的只读预览",
            scan_root=str(scan_root),
            requested_path=requested_path,
            resolved_path=str(resolved_path),
            file_name=resolved_path.name,
            suffix=resolved_path.suffix.lower(),
            size_bytes=int(item_stat.st_size),
            size_human=self._format_size(int(item_stat.st_size)),
            preview_chars=len(preview_text),
            preview_text=preview_text,
            truncated=truncated,
            risk_level="low",
            recommended_next_step=self._get_recommended_next_step(resolved_path.suffix.lower(), truncated),
            requires_confirmation=True,
            executable=False,
            notes=self._build_success_notes(),
        )

    def _build_error_plan(self, requested_path: str, scan_root: Path, reason: str) -> ReadOnlyTextPreviewPlan:
        return ReadOnlyTextPreviewPlan(
            intent="生成白名单目录内小型文本文件的只读预览",
            scan_root=str(scan_root),
            requested_path=requested_path,
            resolved_path="",
            file_name="",
            suffix="",
            size_bytes=0,
            size_human="0 B",
            preview_chars=0,
            preview_text="",
            truncated=False,
            risk_level="low",
            recommended_next_step="请改为白名单目录内 64KB 以内的 txt 或 md 文件，再重新发起只读预览。",
            requires_confirmation=True,
            executable=False,
            notes=f"预览被拒绝或失败：{reason} 当前版本只允许白名单目录内的小型 txt/md 文本预览。",
        )

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"

        size = float(size_bytes)
        units = ["KB", "MB", "GB", "TB"]
        for unit in units:
            size /= 1024
            if size < 1024 or unit == units[-1]:
                return f"{size:.1f} {unit}"
        return f"{size_bytes} B"

    @staticmethod
    def _get_recommended_next_step(suffix: str, truncated: bool) -> str:
        if truncated:
            return (
                "当前预览已截断，建议先确认是否需要聚焦具体段落或目标，再基于该文本预览补充说明，"
                "后续可交给 FileAnalysisSkill 生成分析计划。"
            )
        if suffix == ".md":
            return "如需进一步理解该 Markdown 文本，建议基于当前预览补充分析目标，再交给 FileAnalysisSkill 生成计划。"
        return "如需进一步理解该文本，建议基于当前预览补充分析目标，再交给 FileAnalysisSkill 生成计划。"

    @staticmethod
    def _build_success_notes() -> str:
        return (
            "当前只读取了白名单目录内的 txt/md 小文件预览；"
            "读取前已完成白名单、文件类型和大小校验，"
            "没有解析复杂文档，也没有执行任何文件操作。"
        )
