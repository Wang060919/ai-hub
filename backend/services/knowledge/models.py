from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class KnowledgeStorageStatus:
    enabled: bool
    fts_enabled: bool
    fts_available: bool
    index_method: str
    files_table_exists: bool
    chunks_table_exists: bool
    fts_table_exists: bool
    files_count: int
    chunks_count: int
    markdown_files_count: int
    tags_count: int = 0
    links_count: int = 0


@dataclass(frozen=True)
class KnowledgeChunkDraft:
    chunk_index: int
    char_start: int
    char_end: int
    content: str
    content_chars: int
    token_estimate: int


@dataclass(frozen=True)
class KnowledgeFileDraft:
    kb_id: str
    source_path: str
    relative_path: str
    file_name: str
    suffix: str
    size_bytes: int
    modified_at: str
    file_hash: str
    content_chars: int
    text_content: str
    tags: list[str] = ()
    aliases: list[str] = ()
    linked_files: list[str] = ()


@dataclass(frozen=True)
class KnowledgeIndexResult:
    file_id: int
    kb_id: str
    relative_path: str
    file_hash: str
    chunk_count: int
    reused_existing: bool
    replaced_existing: bool
    index_method: str


@dataclass(frozen=True)
class KnowledgeDirectoryIndexItem:
    path: str
    status: str
    chunk_count: int
    reused_existing: bool
    replaced_existing: bool
    error_code: str | None = None
    error_message: str | None = None


@dataclass(frozen=True)
class KnowledgeDirectoryIndexSummary:
    matched_files: int
    indexed_files: int
    reused_files: int
    failed_files: int
    skipped_files: int


@dataclass(frozen=True)
class KnowledgeDirectoryIndexError:
    path: str
    code: str
    message: str


@dataclass(frozen=True)
class KnowledgeDirectoryIndexResult:
    directory: str
    kb_id: str
    recursive: bool
    force_reindex: bool
    max_files: int
    summary: KnowledgeDirectoryIndexSummary
    results: list[KnowledgeDirectoryIndexItem]
    errors: list[KnowledgeDirectoryIndexError]


@dataclass(frozen=True)
class KnowledgeSearchHit:
    chunk_id: int
    file_id: int
    relative_path: str
    chunk_index: int
    score: float
    content: str


@dataclass(frozen=True)
class KnowledgeSearchResult:
    query: str
    kb_id: str
    top_k: int
    index_method: str
    hits: list[KnowledgeSearchHit]


@dataclass(frozen=True)
class KnowledgeCitation:
    index: int
    chunk_id: int
    relative_path: str
    chunk_index: int


@dataclass(frozen=True)
class KnowledgeAnswer:
    text: str
    model: str | None
    grounded: bool


@dataclass(frozen=True)
class KnowledgeQueryResult:
    question: str
    kb_id: str
    top_k: int
    index_method: str
    answer: KnowledgeAnswer
    hits: list[KnowledgeSearchHit]
    citations: list[KnowledgeCitation]


@dataclass(frozen=True)
class KnowledgeFileTag:
    file_id: int
    tag: str


@dataclass(frozen=True)
class KnowledgeFileLink:
    source_file_id: int
    target_name: str
    target_file_id: int | None = None
