from __future__ import annotations

import hashlib

from backend.services.file.text_file_service import TextFileService
from backend.services.knowledge.chunker import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    chunk_text,
)
from backend.services.knowledge.models import KnowledgeFileDraft, KnowledgeIndexResult
from backend.services.knowledge.repository import KnowledgeRepository

DEFAULT_KB_ID = "default"


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
        file_hash = _calculate_sha256(text_file.text)
        chunks = chunk_text(
            text_file.text,
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
        )
        return self._repository.index_file_content(
            file_draft=file_draft,
            chunks=chunks,
            force_reindex=force_reindex,
        )


def _calculate_sha256(text: str) -> str:
    digest = hashlib.sha256(str(text).encode("utf-8")).hexdigest()
    return f"sha256:{digest}"
