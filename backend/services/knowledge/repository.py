from __future__ import annotations

import sqlite3
from collections.abc import Callable
from typing import Any

from backend.services.knowledge.models import KnowledgeStorageStatus


ConnectionFactory = Callable[[], sqlite3.Connection]


class KnowledgeRepository:
    """SQLite storage helper for knowledge-base schema and status checks."""

    def __init__(self, connection_factory: ConnectionFactory) -> None:
        self._connection_factory = connection_factory

    def initialize_storage(self) -> KnowledgeStorageStatus:
        with self._connection_factory() as connection:
            initialize_knowledge_schema(connection)
            return build_knowledge_storage_status(connection)

    def get_storage_status(self) -> KnowledgeStorageStatus:
        with self._connection_factory() as connection:
            return build_knowledge_storage_status(connection)

    def reserve_file_record(self, **_: Any) -> None:
        raise NotImplementedError("Knowledge file indexing is not implemented yet.")

    def reserve_chunk_records(self, **_: Any) -> None:
        raise NotImplementedError("Knowledge chunk indexing is not implemented yet.")


def initialize_knowledge_schema(connection: sqlite3.Connection) -> bool:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS knowledge_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kb_id TEXT NOT NULL DEFAULT 'default',
            source_path TEXT NOT NULL,
            relative_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            suffix TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            modified_at TEXT NOT NULL,
            file_hash TEXT NOT NULL,
            content_chars INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'indexed',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (kb_id, relative_path, file_hash)
        )
        """
    )
    connection.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_knowledge_files_lookup
        ON knowledge_files (kb_id, relative_path)
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS knowledge_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL,
            kb_id TEXT NOT NULL DEFAULT 'default',
            chunk_index INTEGER NOT NULL,
            char_start INTEGER NOT NULL,
            char_end INTEGER NOT NULL,
            content TEXT NOT NULL,
            content_chars INTEGER NOT NULL,
            token_estimate INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(file_id) REFERENCES knowledge_files(id) ON DELETE CASCADE,
            UNIQUE (file_id, chunk_index)
        )
        """
    )
    connection.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_lookup
        ON knowledge_chunks (kb_id, file_id, chunk_index)
        """
    )
    return ensure_knowledge_fts_table(connection)


def ensure_knowledge_fts_table(connection: sqlite3.Connection) -> bool:
    if not is_fts5_available(connection):
        return False

    connection.execute(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_chunks_fts
        USING fts5(
            content,
            chunk_id UNINDEXED,
            file_id UNINDEXED,
            kb_id UNINDEXED,
            relative_path UNINDEXED
        )
        """
    )
    return True


def is_fts5_available(connection: sqlite3.Connection) -> bool:
    try:
        connection.execute(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS temp.knowledge_fts5_probe
            USING fts5(content)
            """
        )
        connection.execute("DROP TABLE IF EXISTS temp.knowledge_fts5_probe")
    except sqlite3.OperationalError:
        return False
    return True


def build_knowledge_storage_status(connection: sqlite3.Connection) -> KnowledgeStorageStatus:
    files_table_exists = _table_exists(connection, "knowledge_files")
    chunks_table_exists = _table_exists(connection, "knowledge_chunks")
    fts_available = is_fts5_available(connection)
    fts_table_exists = _table_exists(connection, "knowledge_chunks_fts")

    files_count = _count_rows(connection, "knowledge_files") if files_table_exists else 0
    chunks_count = _count_rows(connection, "knowledge_chunks") if chunks_table_exists else 0

    return KnowledgeStorageStatus(
        enabled=files_table_exists and chunks_table_exists,
        fts_enabled=fts_available and fts_table_exists,
        fts_available=fts_available,
        index_method="sqlite_fts" if fts_available and fts_table_exists else "sqlite_like_fallback",
        files_table_exists=files_table_exists,
        chunks_table_exists=chunks_table_exists,
        fts_table_exists=fts_table_exists,
        files_count=files_count,
        chunks_count=chunks_count,
    )


def _table_exists(connection: sqlite3.Connection, table_name: str) -> bool:
    row = connection.execute(
        """
        SELECT 1
        FROM sqlite_master
        WHERE type IN ('table', 'view')
          AND name = ?
        LIMIT 1
        """,
        (table_name,),
    ).fetchone()
    return row is not None


def _count_rows(connection: sqlite3.Connection, table_name: str) -> int:
    row = connection.execute(f"SELECT COUNT(*) AS row_count FROM {table_name}").fetchone()
    return int(row[0]) if row is not None else 0

