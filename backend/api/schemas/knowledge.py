from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class KnowledgeIndexFileRequest(BaseModel):
    path: str = Field(..., min_length=1)
    kb_id: str = Field(default="default", min_length=1)
    chunk_size: int = Field(default=800, ge=1)
    chunk_overlap: int = Field(default=120, ge=0)
    force_reindex: bool = False


class KnowledgeIndexFileInfo(BaseModel):
    kb_id: str
    relative_path: str
    file_hash: str


class KnowledgeIndexFileBody(BaseModel):
    file_id: int
    chunk_count: int
    reused_existing: bool
    replaced_existing: bool
    index_method: str


class KnowledgeIndexFileResponse(BaseModel):
    status: str
    file: KnowledgeIndexFileInfo
    index: KnowledgeIndexFileBody


class KnowledgeIndexMarkdownDirectoryRequest(BaseModel):
    directory: str = Field(..., min_length=1)
    kb_id: str = Field(default="default", min_length=1)
    recursive: bool = True
    force_reindex: bool = False
    max_files: int = Field(default=50, ge=1, le=200)


class KnowledgeIndexMarkdownDirectorySummary(BaseModel):
    matched_files: int
    indexed_files: int
    reused_files: int
    failed_files: int
    skipped_files: int


class KnowledgeIndexMarkdownDirectoryItem(BaseModel):
    path: str
    status: str
    chunk_count: int
    reused_existing: bool
    replaced_existing: bool
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class KnowledgeIndexMarkdownDirectoryError(BaseModel):
    path: str
    code: str
    message: str


class KnowledgeIndexMarkdownDirectoryResponse(BaseModel):
    status: str
    directory: str
    kb_id: str
    recursive: bool
    force_reindex: bool
    max_files: int
    summary: KnowledgeIndexMarkdownDirectorySummary
    results: list[KnowledgeIndexMarkdownDirectoryItem]
    errors: list[KnowledgeIndexMarkdownDirectoryError]


class KnowledgeStatusBody(BaseModel):
    enabled: bool
    fts_enabled: bool
    fts_available: bool
    index_method: str
    files_count: int
    chunks_count: int
    markdown_files_count: int
    files_table_exists: bool
    chunks_table_exists: bool
    fts_table_exists: bool
    tags_count: int = 0
    links_count: int = 0


class KnowledgeStatusResponse(BaseModel):
    status: str
    knowledge: KnowledgeStatusBody


class KnowledgeSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    kb_id: str = Field(default="default", min_length=1)
    top_k: int = Field(default=4, ge=1)


class KnowledgeSearchBody(BaseModel):
    query: str
    kb_id: str
    top_k: int
    index_method: str
    hits_count: int


class KnowledgeSearchHitItem(BaseModel):
    chunk_id: int
    file_id: int
    relative_path: str
    chunk_index: int
    score: float
    content: str


class KnowledgeSearchResponse(BaseModel):
    status: str
    search: KnowledgeSearchBody
    hits: list[KnowledgeSearchHitItem]


class KnowledgeQueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    kb_id: str = Field(default="default", min_length=1)
    top_k: int = Field(default=4, ge=1)


class KnowledgeAnswerItem(BaseModel):
    text: str
    model: Optional[str]
    grounded: bool


class KnowledgeCitationItem(BaseModel):
    index: int
    chunk_id: int
    relative_path: str
    chunk_index: int


class KnowledgeQueryResponse(BaseModel):
    status: str
    answer: KnowledgeAnswerItem
    hits: list[KnowledgeSearchHitItem]
    citations: list[KnowledgeCitationItem]
