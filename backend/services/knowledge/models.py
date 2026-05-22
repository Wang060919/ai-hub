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

