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


class KnowledgeStatusBody(BaseModel):
    enabled: bool
    fts_enabled: bool
    fts_available: bool
    index_method: str
    files_count: int
    chunks_count: int
    files_table_exists: bool
    chunks_table_exists: bool
    fts_table_exists: bool


class KnowledgeStatusResponse(BaseModel):
    status: str
    knowledge: KnowledgeStatusBody
