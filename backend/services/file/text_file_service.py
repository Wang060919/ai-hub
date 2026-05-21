from __future__ import annotations

import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Literal

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SCAN_ROOT = PROJECT_ROOT / "data" / "scan_sandbox"
WINDOWS_ABSOLUTE_PATH_PATTERN = re.compile(r"^[A-Za-z]:[\\/]")

DEFAULT_MAX_FILE_SIZE_BYTES = 256 * 1024
DEFAULT_PREVIEW_CHARS = 2000
MAX_PREVIEW_CHARS = 5000
ALLOWED_SUFFIXES = frozenset({".txt", ".md", ".log", ".csv"})

FileServiceErrorCode = Literal[
    "FILE_NOT_FOUND",
    "PATH_NOT_ALLOWED",
    "PATH_IS_NOT_FILE",
    "FILE_TOO_LARGE",
    "UNSUPPORTED_FILE_TYPE",
    "FILE_NOT_READABLE",
    "BINARY_FILE_REJECTED",
]


@dataclass(frozen=True)
class SafeFileInfo:
    name: str
    suffix: str
    size_bytes: int
    size_human: str
    modified_at: str
    relative_path: str


@dataclass(frozen=True)
class FilePreview:
    file: SafeFileInfo
    text: str
    chars: int
    truncated: bool


@dataclass(frozen=True)
class SafeTextFileContent:
    file: SafeFileInfo
    text: str
    chars: int


class FileServiceError(Exception):
    def __init__(self, code: FileServiceErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class TextFileService:
    """Read small text files from the configured whitelist root."""

    def __init__(
        self,
        scan_root: Path | str | None = None,
        max_file_size_bytes: int | None = None,
        allowed_suffixes: set[str] | frozenset[str] | None = None,
    ) -> None:
        self.scan_root = self._resolve_scan_root(scan_root)
        self.max_file_size_bytes = max_file_size_bytes or _parse_int(
            os.getenv("AI_HUB_MAX_TEXT_FILE_BYTES"),
            DEFAULT_MAX_FILE_SIZE_BYTES,
        )
        self.allowed_suffixes = frozenset(
            suffix.lower() for suffix in (allowed_suffixes or ALLOWED_SUFFIXES)
        )

    def preview_text_file(self, requested_path: str, preview_chars: int | None = None) -> FilePreview:
        text_file = self.read_text_file(requested_path)
        safe_preview_chars = self._normalize_preview_chars(preview_chars)
        preview_text = text_file.text[:safe_preview_chars]
        return FilePreview(
            file=text_file.file,
            text=preview_text,
            chars=len(preview_text),
            truncated=text_file.chars > safe_preview_chars,
        )

    def read_text_file(self, requested_path: str) -> SafeTextFileContent:
        resolved_path = self._resolve_requested_path(requested_path)
        item_stat = self._stat_file(resolved_path)
        self._ensure_file(resolved_path)
        self._ensure_supported_suffix(resolved_path)
        self._ensure_allowed_size(item_stat.st_size)

        raw_content = self._read_bytes(resolved_path)
        self._ensure_text_content(raw_content)
        text = raw_content.decode("utf-8", errors="replace")
        return SafeTextFileContent(
            file=self._build_file_info(resolved_path, item_stat),
            text=text,
            chars=len(text),
        )

    def _resolve_requested_path(self, requested_path: str) -> Path:
        normalized = str(requested_path or "").strip().strip('"').strip("'")
        if not normalized:
            raise FileServiceError("PATH_NOT_ALLOWED", "请提供白名单目录内的文本文件路径。")

        if WINDOWS_ABSOLUTE_PATH_PATTERN.match(normalized):
            candidate = Path(normalized).resolve()
        elif normalized.startswith(("data\\", "data/", ".\\data\\", "./data/")):
            candidate = (PROJECT_ROOT / normalized).resolve()
        elif normalized.startswith((".\\", "./")):
            candidate = (PROJECT_ROOT / normalized).resolve()
        else:
            candidate = (self.scan_root / normalized).resolve()

        self._ensure_within_scan_root(candidate)
        return candidate

    def _stat_file(self, resolved_path: Path) -> os.stat_result:
        try:
            return resolved_path.stat()
        except FileNotFoundError as exc:
            raise FileServiceError("FILE_NOT_FOUND", "请求的文件不存在。") from exc
        except OSError as exc:
            raise FileServiceError("FILE_NOT_READABLE", "请求的文件无法访问。") from exc

    @staticmethod
    def _ensure_file(resolved_path: Path) -> None:
        if not resolved_path.is_file():
            raise FileServiceError("PATH_IS_NOT_FILE", "请求的路径不是文件。")

    def _ensure_supported_suffix(self, resolved_path: Path) -> None:
        if resolved_path.suffix.lower() not in self.allowed_suffixes:
            raise FileServiceError(
                "UNSUPPORTED_FILE_TYPE",
                "当前只支持 txt、md、log、csv 文本文件。",
            )

    def _ensure_allowed_size(self, size_bytes: int) -> None:
        if size_bytes > self.max_file_size_bytes:
            raise FileServiceError("FILE_TOO_LARGE", "文件超过当前读取大小限制。")

    @staticmethod
    def _read_bytes(resolved_path: Path) -> bytes:
        try:
            return resolved_path.read_bytes()
        except OSError as exc:
            raise FileServiceError("FILE_NOT_READABLE", "请求的文件无法读取。") from exc

    @staticmethod
    def _ensure_text_content(raw_content: bytes) -> None:
        if b"\x00" in raw_content:
            raise FileServiceError("BINARY_FILE_REJECTED", "疑似二进制文件，已拒绝读取。")

        if not raw_content:
            return

        sample = raw_content[:4096]
        control_bytes = sum(
            1
            for item in sample
            if item < 32 and item not in {9, 10, 13}
        )
        if control_bytes / len(sample) > 0.05:
            raise FileServiceError("BINARY_FILE_REJECTED", "疑似二进制文件，已拒绝读取。")

    def _build_file_info(self, resolved_path: Path, item_stat: os.stat_result) -> SafeFileInfo:
        return SafeFileInfo(
            name=resolved_path.name,
            suffix=resolved_path.suffix.lower(),
            size_bytes=int(item_stat.st_size),
            size_human=self._format_size(int(item_stat.st_size)),
            modified_at=datetime.fromtimestamp(item_stat.st_mtime).isoformat(timespec="seconds"),
            relative_path=self._safe_relative_path(resolved_path),
        )

    def _ensure_within_scan_root(self, candidate: Path) -> None:
        try:
            candidate.relative_to(self.scan_root)
        except ValueError as exc:
            raise FileServiceError("PATH_NOT_ALLOWED", "请求的文件不在白名单目录内。") from exc

    def _safe_relative_path(self, resolved_path: Path) -> str:
        return resolved_path.relative_to(self.scan_root).as_posix()

    @staticmethod
    def _normalize_preview_chars(preview_chars: int | None) -> int:
        if preview_chars is None:
            return DEFAULT_PREVIEW_CHARS
        return max(1, min(int(preview_chars), MAX_PREVIEW_CHARS))

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"

        size = float(size_bytes)
        for unit in ("KB", "MB", "GB", "TB"):
            size /= 1024
            if size < 1024 or unit == "TB":
                return f"{size:.1f} {unit}"
        return f"{size_bytes} B"

    @staticmethod
    def _resolve_scan_root(scan_root: Path | str | None) -> Path:
        raw_scan_root = scan_root or os.getenv("AI_HUB_SCAN_ROOT", "").strip() or DEFAULT_SCAN_ROOT
        return Path(raw_scan_root).resolve()


def _parse_int(raw_value: str | None, default: int) -> int:
    if raw_value is None:
        return default
    try:
        parsed_value = int(raw_value)
    except ValueError:
        return default
    return parsed_value if parsed_value > 0 else default
