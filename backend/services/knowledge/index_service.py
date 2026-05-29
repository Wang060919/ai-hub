from __future__ import annotations

import hashlib
import stat
from pathlib import Path

from backend.services.file.text_file_service import TextFileService
from backend.services.file.text_file_service import FileServiceError
from backend.services.knowledge.chunker import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    chunk_text,
)
from backend.services.knowledge.frontmatter import parse_frontmatter
from backend.services.knowledge.linker import extract_wikilinks
from backend.services.knowledge.models import (
    KnowledgeDirectoryIndexError,
    KnowledgeDirectoryIndexItem,
    KnowledgeDirectoryIndexResult,
    KnowledgeDirectoryIndexSummary,
    KnowledgeFileDraft,
    KnowledgeIndexResult,
)
from backend.services.knowledge.repository import KnowledgeRepository

DEFAULT_KB_ID = "default"
DEFAULT_DIRECTORY_MAX_FILES = 50
MAX_DIRECTORY_MAX_FILES = 200
IGNORED_DIRECTORY_NAMES = frozenset(
    {
        ".obsidian",
        "attachments",
        "assets",
        "images",
    }
)


class KnowledgeIndexService:
    """Read a safe text file, chunk it, and persist it through the repository."""

    def __init__(
        self,
        text_file_service: TextFileService,
        repository: KnowledgeRepository,
    ) -> None:
        self._text_file_service = text_file_service
        self._repository = repository

    def index_file(
        self,
        path: str,
        kb_id: str = DEFAULT_KB_ID,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
        force_reindex: bool = False,
    ) -> KnowledgeIndexResult:
        text_file = self._text_file_service.read_text_file(path)

        frontmatter, body = parse_frontmatter(text_file.text)
        tags = list(frontmatter.tags)
        aliases = list(frontmatter.aliases)
        linked_files = extract_wikilinks(body)

        searchable_text = body
        metadata_parts: list[str] = []
        if tags:
            metadata_parts.append(" ".join(f"#{tag}" for tag in tags))
        if aliases:
            metadata_parts.append(" ".join(aliases))
        if metadata_parts:
            searchable_text = "\n".join(metadata_parts) + "\n" + body

        file_hash = _calculate_sha256(text_file.text)
        chunks = chunk_text(
            searchable_text,
            chunk_size=chunk_size,
            overlap=chunk_overlap,
        )

        file_draft = KnowledgeFileDraft(
            kb_id=str(kb_id or DEFAULT_KB_ID),
            source_path=str(path),
            relative_path=text_file.file.relative_path,
            file_name=text_file.file.name,
            suffix=text_file.file.suffix,
            size_bytes=text_file.file.size_bytes,
            modified_at=text_file.file.modified_at,
            file_hash=file_hash,
            content_chars=text_file.chars,
            text_content=text_file.text,
            tags=tags,
            aliases=aliases,
            linked_files=linked_files,
        )
        return self._repository.index_file_content(
            file_draft=file_draft,
            chunks=chunks,
            force_reindex=force_reindex,
        )

    def index_markdown_directory(
        self,
        directory: str,
        kb_id: str = DEFAULT_KB_ID,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
        recursive: bool = True,
        force_reindex: bool = False,
        max_files: int = DEFAULT_DIRECTORY_MAX_FILES,
    ) -> KnowledgeDirectoryIndexResult:
        safe_directory = self._normalize_directory_input(directory)
        safe_max_files = max(1, min(int(max_files), MAX_DIRECTORY_MAX_FILES))
        resolved_directory = self._resolve_safe_directory(safe_directory)
        matched_files = self._collect_markdown_files(resolved_directory, recursive=recursive)
        process_files = matched_files[:safe_max_files]
        skipped_files = max(0, len(matched_files) - len(process_files))

        results: list[KnowledgeDirectoryIndexItem] = []
        errors: list[KnowledgeDirectoryIndexError] = []
        indexed_files = 0
        reused_files = 0
        failed_files = 0

        for file_path in process_files:
            relative_path = self._text_file_service._safe_relative_path(file_path)
            try:
                file_result = self.index_file(
                    path=relative_path,
                    kb_id=kb_id,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    force_reindex=force_reindex,
                )
                item_status = "reused" if file_result.reused_existing else "indexed"
                indexed_files += 0 if file_result.reused_existing else 1
                reused_files += 1 if file_result.reused_existing else 0
                results.append(
                    KnowledgeDirectoryIndexItem(
                        path=file_result.relative_path,
                        status=item_status,
                        chunk_count=file_result.chunk_count,
                        reused_existing=file_result.reused_existing,
                        replaced_existing=file_result.replaced_existing,
                    )
                )
            except FileServiceError as exc:
                failed_files += 1
                results.append(
                    KnowledgeDirectoryIndexItem(
                        path=relative_path,
                        status="failed",
                        chunk_count=0,
                        reused_existing=False,
                        replaced_existing=False,
                        error_code=exc.code,
                        error_message=exc.message,
                    )
                )
                errors.append(
                    KnowledgeDirectoryIndexError(
                        path=relative_path,
                        code=exc.code,
                        message=exc.message,
                    )
                )

        if skipped_files > 0:
            results.append(
                KnowledgeDirectoryIndexItem(
                    path=safe_directory,
                    status="skipped",
                    chunk_count=0,
                    reused_existing=False,
                    replaced_existing=False,
                    error_code="MAX_FILES_LIMIT",
                    error_message=f"Only the first {safe_max_files} Markdown files were processed.",
                )
            )

        return KnowledgeDirectoryIndexResult(
            directory=safe_directory,
            kb_id=str(kb_id or DEFAULT_KB_ID),
            recursive=bool(recursive),
            force_reindex=bool(force_reindex),
            max_files=safe_max_files,
            summary=KnowledgeDirectoryIndexSummary(
                matched_files=len(matched_files),
                indexed_files=indexed_files,
                reused_files=reused_files,
                failed_files=failed_files,
                skipped_files=skipped_files,
            ),
            results=results,
            errors=errors,
        )

    @staticmethod
    def _normalize_directory_input(directory: str) -> str:
        normalized = str(directory or "").strip().strip('"').strip("'").replace("\\", "/")
        normalized = normalized.strip("/")
        if not normalized:
            raise FileServiceError("PATH_NOT_ALLOWED", "请提供白名单根目录内的相对目录。")
        if normalized.startswith(".") or normalized.startswith("..") or "/../" in f"/{normalized}/":
            raise FileServiceError("PATH_NOT_ALLOWED", "目录路径不能越出白名单根目录。")
        return normalized

    def _resolve_safe_directory(self, directory: str) -> Path:
        candidate = (self._text_file_service.scan_root / directory).resolve()
        try:
            candidate.relative_to(self._text_file_service.scan_root)
        except ValueError as exc:
            raise FileServiceError("PATH_NOT_ALLOWED", "目录路径不能越出白名单根目录。") from exc

        if not candidate.exists():
            raise FileServiceError("FILE_NOT_FOUND", "请求的目录不存在。")
        if not candidate.is_dir():
            raise FileServiceError("PATH_NOT_ALLOWED", "请求的路径不是目录。")
        return candidate

    def _collect_markdown_files(self, directory_path: Path, recursive: bool) -> list[Path]:
        if recursive:
            return sorted(self._walk_markdown_files(directory_path))

        collected: list[Path] = []
        for item in directory_path.iterdir():
            if item.is_dir():
                continue
            if self._should_ignore_file(item):
                continue
            if item.suffix.lower() != ".md":
                continue
            collected.append(item)
        return sorted(collected)

    def _walk_markdown_files(self, directory_path: Path) -> list[Path]:
        collected: list[Path] = []
        for item in directory_path.iterdir():
            if item.is_dir():
                if self._should_ignore_directory(item):
                    continue
                collected.extend(self._walk_markdown_files(item))
                continue
            if self._should_ignore_file(item):
                continue
            if item.suffix.lower() == ".md":
                collected.append(item)
        return collected

    def _should_ignore_directory(self, directory_path: Path) -> bool:
        lower_name = directory_path.name.lower()
        return (
            lower_name in IGNORED_DIRECTORY_NAMES
            or directory_path.name.startswith(".")
            or self._is_hidden_path(directory_path)
        )

    def _should_ignore_file(self, file_path: Path) -> bool:
        return file_path.name.startswith(".") or self._is_hidden_path(file_path)

    @staticmethod
    def _is_hidden_path(path: Path) -> bool:
        try:
            file_attributes = getattr(path.stat(), "st_file_attributes", 0)
        except OSError:
            return False
        return bool(file_attributes & getattr(stat, "FILE_ATTRIBUTE_HIDDEN", 0))


def _calculate_sha256(text: str) -> str:
    digest = hashlib.sha256(str(text).encode("utf-8")).hexdigest()
    return f"sha256:{digest}"
