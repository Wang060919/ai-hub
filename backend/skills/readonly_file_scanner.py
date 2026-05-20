from __future__ import annotations

import os
import re
from datetime import datetime
from pathlib import Path

from backend.schemas import ChatResponse, ReadOnlyFileScanPlan, ReadOnlyScannedDirectory, ReadOnlyScannedFile
from backend.skills.base import BaseSkill

READONLY_FILE_SCANNER_KEYWORDS = (
    "扫描目录",
    "只读扫描目录",
    "列出目录文件",
    "生成文件清单",
    "扫描文件夹",
    "查看目录下有哪些文件",
    "根据这个目录生成文件清单",
    "根据目录生成文件清单",
)

READONLY_FILE_SCANNER_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in READONLY_FILE_SCANNER_KEYWORDS)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_SCAN_ROOT = PROJECT_ROOT / "data" / "scan_sandbox"
WINDOWS_ABSOLUTE_PATH_PATTERN = re.compile(r"^[A-Za-z]:[\\/]")


class ReadOnlyFileScannerSkill(BaseSkill):
    name = "readonly_file_scanner"

    def execute(self, message: str) -> ChatResponse:
        requested_path = self._extract_requested_path(message.strip())
        scan_root = self._get_scan_root()

        try:
            scanned_path = self._resolve_scanned_path(requested_path, scan_root)
            plan = self._build_success_plan(requested_path, scan_root, scanned_path)
            return ChatResponse(
                reply="已完成只读文件扫描，只读取了文件元信息，没有读取文件内容或执行任何文件操作。",
                skill=self.name,
                status="success",
                data={"readonly_file_scan_plan": plan.model_dump()},
            )
        except ValueError as exc:
            plan = self._build_error_plan(requested_path, scan_root, str(exc))
            return ChatResponse(
                reply=f"无法执行只读扫描：{exc}",
                skill=self.name,
                status="error",
                data={"readonly_file_scan_plan": plan.model_dump()},
            )

    @staticmethod
    def _get_scan_root() -> Path:
        configured_root = os.getenv("AI_HUB_SCAN_ROOT", "").strip()
        if configured_root:
            return Path(configured_root).resolve()
        return DEFAULT_SCAN_ROOT.resolve()

    def _extract_requested_path(self, message: str) -> str:
        path_match = re.search(r"([A-Za-z]:\\[^，,\n;；]*)", message)
        if path_match:
            return path_match.group(1).strip()

        if "：" in message:
            trailing = message.split("：", 1)[1].strip()
            if trailing:
                return trailing
        if ":" in message:
            trailing = message.split(":", 1)[1].strip()
            if trailing:
                return trailing
        return "."

    def _resolve_scanned_path(self, requested_path: str, scan_root: Path) -> Path:
        candidate = self._build_candidate_path(requested_path, scan_root)
        resolved_candidate = candidate.resolve()

        self._ensure_within_scan_root(resolved_candidate, scan_root)
        self._ensure_allowed_depth(resolved_candidate, scan_root)
        try:
            resolved_candidate.stat()
        except FileNotFoundError as exc:
            raise ValueError("请求的扫描目录不存在。")
        except OSError as exc:
            raise ValueError("请求的扫描目录无法访问。") from exc
        if not resolved_candidate.is_dir():
            raise ValueError("请求的扫描路径不是目录。")
        return resolved_candidate

    def _build_candidate_path(self, requested_path: str, scan_root: Path) -> Path:
        normalized = requested_path.strip().strip('"').strip("'")
        if not normalized or normalized == ".":
            return scan_root

        if WINDOWS_ABSOLUTE_PATH_PATTERN.match(normalized):
            return Path(normalized)

        if normalized.startswith(("data\\", "data/", ".\\data\\", "./data/")):
            return (PROJECT_ROOT / normalized).resolve()

        if normalized.startswith((".\\", "./")):
            if normalized in {".\\", "./"}:
                return scan_root
            return (PROJECT_ROOT / normalized).resolve()

        return (scan_root / normalized).resolve()

    @staticmethod
    def _ensure_within_scan_root(candidate: Path, scan_root: Path) -> None:
        try:
            candidate.relative_to(scan_root)
        except ValueError as exc:
            raise ValueError("请求的扫描路径不在白名单目录内。") from exc

    @staticmethod
    def _ensure_allowed_depth(candidate: Path, scan_root: Path) -> None:
        if candidate == scan_root:
            return
        if candidate.parent != scan_root:
            raise ValueError("当前只允许扫描白名单根目录或其直接子目录。")

    def _build_success_plan(self, requested_path: str, scan_root: Path, scanned_path: Path) -> ReadOnlyFileScanPlan:
        files: list[ReadOnlyScannedFile] = []
        directories: list[ReadOnlyScannedDirectory] = []
        total_size_bytes = 0

        for item in scanned_path.iterdir():
            if item.is_file():
                item_stat = item.stat()
                total_size_bytes += int(item_stat.st_size)
                files.append(
                    ReadOnlyScannedFile(
                        name=item.name,
                        suffix=item.suffix.lower(),
                        size_bytes=int(item_stat.st_size),
                        modified_at=datetime.fromtimestamp(item_stat.st_mtime).isoformat(timespec="seconds"),
                    )
                )
            elif item.is_dir():
                directories.append(ReadOnlyScannedDirectory(name=item.name))

        risk_level = self._get_risk_level(scanned_path, scan_root, len(files), len(directories))
        return ReadOnlyFileScanPlan(
            intent="生成白名单目录内的只读文件清单计划",
            scan_root=str(scan_root),
            requested_path=requested_path,
            scanned_path=str(scanned_path),
            files=files,
            directories=directories,
            total_files=len(files),
            total_directories=len(directories),
            total_size_bytes=total_size_bytes,
            risk_level=risk_level,
            recommended_next_step=self._get_recommended_next_step(risk_level),
            steps=self._build_steps(scanned_path, risk_level),
            requires_confirmation=True,
            executable=False,
            notes=self._build_success_notes(),
        )

    def _build_error_plan(self, requested_path: str, scan_root: Path, reason: str) -> ReadOnlyFileScanPlan:
        return ReadOnlyFileScanPlan(
            intent="生成白名单目录内的只读文件清单计划",
            scan_root=str(scan_root),
            requested_path=requested_path,
            scanned_path="",
            files=[],
            directories=[],
            total_files=0,
            total_directories=0,
            total_size_bytes=0,
            risk_level="medium",
            recommended_next_step="请改为白名单目录内的根目录或直接子目录，再重新发起只读扫描。",
            steps=[
                "确认请求路径是否位于 AI_HUB_SCAN_ROOT 白名单内。",
                "确认请求路径存在且是目录。",
                "重新发起只读扫描，当前版本不会读取文件内容。",
            ],
            requires_confirmation=True,
            executable=False,
            notes=f"扫描被拒绝或失败：{reason} 当前版本只允许白名单目录内的一层只读扫描。",
        )

    @staticmethod
    def _get_risk_level(scanned_path: Path, scan_root: Path, total_files: int, total_directories: int) -> str:
        if scanned_path != scan_root:
            return "medium"
        if total_files + total_directories > 10:
            return "medium"
        return "low"

    @staticmethod
    def _get_recommended_next_step(risk_level: str) -> str:
        if risk_level == "medium":
            return "请先确认扫描范围和目录边界，再基于该清单选择后续分析或手动整理步骤。"
        return "请确认清单信息无误，后续可将扫描结果交给 FileInventorySkill 或 FileAnalysisSkill 继续规划。"

    @staticmethod
    def _build_steps(scanned_path: Path, risk_level: str) -> list[str]:
        steps = [
            f"只读取目录 `{scanned_path}` 下一层的文件名、后缀、大小和修改时间。",
            "整理目录中的文件条目与子目录条目，不递归进入更深层目录。",
            "基于元信息生成文件清单计划，当前版本不会读取文件内容。",
            "等待用户确认后，再决定是否进入后续人工分析或规划阶段。",
        ]
        if risk_level == "medium":
            steps.insert(2, "标记该扫描请求涉及更具体的子目录或较多条目，需要用户确认边界。")
        return steps

    @staticmethod
    def _build_success_notes() -> str:
        return (
            "当前只进行了白名单目录内的一层只读扫描；"
            "只读取了文件名、后缀、大小和修改时间，"
            "没有读取文件内容，也没有执行任何文件操作。"
        )
