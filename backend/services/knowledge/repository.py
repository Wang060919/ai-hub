from __future__ import annotations

import re
import sqlite3
from collections.abc import Callable
from datetime import datetime

from backend.services.knowledge.models import (
    KnowledgeChunkDraft,
    KnowledgeFileDraft,
    KnowledgeIndexResult,
    KnowledgeSearchHit,
    KnowledgeSearchResult,
    KnowledgeStorageStatus,
)


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

    def search_chunks(
        self,
        query: str,
        kb_id: str = "default",
        top_k: int = 4,
    ) -> KnowledgeSearchResult:
        with self._connection_factory() as connection:
            initialize_knowledge_schema(connection)

            search_terms = _extract_search_terms(query)
            if not search_terms:
                return KnowledgeSearchResult(
                    query=query,
                    kb_id=kb_id,
                    top_k=top_k,
                    index_method=_get_index_method(connection),
                    hits=[],
                )

            if _table_exists(connection, "knowledge_chunks_fts"):
                hits = _search_chunks_with_fts(
                    connection=connection,
                    query=query,
                    kb_id=kb_id,
                    top_k=top_k,
                    search_terms=search_terms,
                )
                index_method = "sqlite_fts"
            else:
                hits = _search_chunks_with_like(
                    connection=connection,
                    kb_id=kb_id,
                    top_k=top_k,
                    search_terms=search_terms,
                )
                index_method = "sqlite_like_fallback"

            return KnowledgeSearchResult(
                query=query,
                kb_id=kb_id,
                top_k=top_k,
                index_method=index_method,
                hits=hits,
            )

    def index_file_content(
        self,
        file_draft: KnowledgeFileDraft,
        chunks: list[KnowledgeChunkDraft],
        force_reindex: bool = False,
    ) -> KnowledgeIndexResult:
        with self._connection_factory() as connection:
            initialize_knowledge_schema(connection)

            existing_same_version = _get_existing_file_by_hash(
                connection,
                kb_id=file_draft.kb_id,
                relative_path=file_draft.relative_path,
                file_hash=file_draft.file_hash,
            )
            if existing_same_version is not None and not force_reindex:
                return KnowledgeIndexResult(
                    file_id=int(existing_same_version["id"]),
                    kb_id=str(existing_same_version["kb_id"]),
                    relative_path=str(existing_same_version["relative_path"]),
                    file_hash=str(existing_same_version["file_hash"]),
                    chunk_count=int(existing_same_version["chunk_count"]),
                    reused_existing=True,
                    replaced_existing=False,
                    index_method=_get_index_method(connection),
                )

            replaced_existing = False
            existing_same_path = _get_existing_file_by_path(
                connection,
                kb_id=file_draft.kb_id,
                relative_path=file_draft.relative_path,
            )
            if existing_same_path is not None:
                _delete_file_record(connection, file_id=int(existing_same_path["id"]))
                replaced_existing = True

            file_id = _insert_file_record(connection, file_draft, chunk_count=len(chunks))
            _insert_chunk_records(
                connection,
                file_id=file_id,
                kb_id=file_draft.kb_id,
                relative_path=file_draft.relative_path,
                chunks=chunks,
            )
            connection.commit()

            return KnowledgeIndexResult(
                file_id=file_id,
                kb_id=file_draft.kb_id,
                relative_path=file_draft.relative_path,
                file_hash=file_draft.file_hash,
                chunk_count=len(chunks),
                reused_existing=False,
                replaced_existing=replaced_existing,
                index_method=_get_index_method(connection),
            )


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
        markdown_files_count=_count_markdown_files(connection) if files_table_exists else 0,
    )


def _get_existing_file_by_hash(
    connection: sqlite3.Connection,
    kb_id: str,
    relative_path: str,
    file_hash: str,
) -> sqlite3.Row | None:
    return connection.execute(
        """
        SELECT id, kb_id, relative_path, file_hash, chunk_count
        FROM knowledge_files
        WHERE kb_id = ?
          AND relative_path = ?
          AND file_hash = ?
        LIMIT 1
        """,
        (kb_id, relative_path, file_hash),
    ).fetchone()


def _get_existing_file_by_path(
    connection: sqlite3.Connection,
    kb_id: str,
    relative_path: str,
) -> sqlite3.Row | None:
    return connection.execute(
        """
        SELECT id, kb_id, relative_path, file_hash, chunk_count
        FROM knowledge_files
        WHERE kb_id = ?
          AND relative_path = ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (kb_id, relative_path),
    ).fetchone()


def _insert_file_record(
    connection: sqlite3.Connection,
    file_draft: KnowledgeFileDraft,
    chunk_count: int,
) -> int:
    timestamp = datetime.now().isoformat(timespec="seconds")
    cursor = connection.execute(
        """
        INSERT INTO knowledge_files (
            kb_id,
            source_path,
            relative_path,
            file_name,
            suffix,
            size_bytes,
            modified_at,
            file_hash,
            content_chars,
            chunk_count,
            status,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'indexed', ?, ?)
        """,
        (
            file_draft.kb_id,
            file_draft.source_path,
            file_draft.relative_path,
            file_draft.file_name,
            file_draft.suffix,
            file_draft.size_bytes,
            file_draft.modified_at,
            file_draft.file_hash,
            file_draft.content_chars,
            chunk_count,
            timestamp,
            timestamp,
        ),
    )
    return int(cursor.lastrowid)


def _insert_chunk_records(
    connection: sqlite3.Connection,
    file_id: int,
    kb_id: str,
    relative_path: str,
    chunks: list[KnowledgeChunkDraft],
) -> None:
    connection.executemany(
        """
        INSERT INTO knowledge_chunks (
            file_id,
            kb_id,
            chunk_index,
            char_start,
            char_end,
            content,
            content_chars,
            token_estimate,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                file_id,
                kb_id,
                chunk.chunk_index,
                chunk.char_start,
                chunk.char_end,
                chunk.content,
                chunk.content_chars,
                chunk.token_estimate,
                datetime.now().isoformat(timespec="seconds"),
            )
            for chunk in chunks
        ],
    )

    if _table_exists(connection, "knowledge_chunks_fts"):
        inserted_rows = connection.execute(
            """
            SELECT id, file_id, kb_id, content
            FROM knowledge_chunks
            WHERE file_id = ?
            ORDER BY chunk_index ASC
            """,
            (file_id,),
        ).fetchall()
        connection.executemany(
            """
            INSERT INTO knowledge_chunks_fts (
                content,
                chunk_id,
                file_id,
                kb_id,
                relative_path
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (
                    str(row["content"]),
                    int(row["id"]),
                    int(row["file_id"]),
                    str(row["kb_id"]),
                    relative_path,
                )
                for row in inserted_rows
            ],
        )


def _delete_file_record(connection: sqlite3.Connection, file_id: int) -> None:
    if _table_exists(connection, "knowledge_chunks_fts"):
        connection.execute(
            """
            DELETE FROM knowledge_chunks_fts
            WHERE file_id = ?
            """,
            (file_id,),
        )
    connection.execute("DELETE FROM knowledge_chunks WHERE file_id = ?", (file_id,))
    connection.execute("DELETE FROM knowledge_files WHERE id = ?", (file_id,))


def _get_index_method(connection: sqlite3.Connection) -> str:
    return "sqlite_fts" if _table_exists(connection, "knowledge_chunks_fts") else "sqlite_like_fallback"


def _search_chunks_with_fts(
    connection: sqlite3.Connection,
    query: str,
    kb_id: str,
    top_k: int,
    search_terms: list[str],
) -> list[KnowledgeSearchHit]:
    match_query = _build_fts_match_query(search_terms)
    if not match_query:
        return []

    rows = connection.execute(
        """
        SELECT
            chunks.id AS chunk_id,
            chunks.file_id AS file_id,
            files.relative_path AS relative_path,
            chunks.chunk_index AS chunk_index,
            ABS(bm25(knowledge_chunks_fts)) AS score,
            chunks.content AS content
        FROM knowledge_chunks_fts
        JOIN knowledge_chunks AS chunks
          ON chunks.id = knowledge_chunks_fts.chunk_id
        JOIN knowledge_files AS files
          ON files.id = chunks.file_id
        WHERE knowledge_chunks_fts.kb_id = ?
          AND knowledge_chunks_fts MATCH ?
        ORDER BY bm25(knowledge_chunks_fts) ASC, chunks.id ASC
        LIMIT ?
        """,
        (kb_id, match_query, top_k),
    ).fetchall()

    if rows:
        return [_build_search_hit(row) for row in rows]

    # Fall back when MATCH parsing produces no hits for a free-form user question.
    return _search_chunks_with_like(
        connection=connection,
        kb_id=kb_id,
        top_k=top_k,
        search_terms=search_terms,
    )


def _search_chunks_with_like(
    connection: sqlite3.Connection,
    kb_id: str,
    top_k: int,
    search_terms: list[str],
) -> list[KnowledgeSearchHit]:
    like_clauses = []
    score_clauses = []
    score_parameters: list[object] = []
    where_parameters: list[object] = [kb_id]

    for term in search_terms:
        like_pattern = f"%{term.lower()}%"
        like_clauses.append("LOWER(chunks.content) LIKE ?")
        score_clauses.append("CASE WHEN LOWER(chunks.content) LIKE ? THEN 1.0 ELSE 0.0 END")
        score_parameters.append(like_pattern)
        where_parameters.append(like_pattern)

    parameters: list[object] = [*score_parameters, *where_parameters, top_k]

    rows = connection.execute(
        f"""
        SELECT
            chunks.id AS chunk_id,
            chunks.file_id AS file_id,
            files.relative_path AS relative_path,
            chunks.chunk_index AS chunk_index,
            ({' + '.join(score_clauses)}) AS score,
            chunks.content AS content
        FROM knowledge_chunks AS chunks
        JOIN knowledge_files AS files
          ON files.id = chunks.file_id
        WHERE chunks.kb_id = ?
          AND ({' OR '.join(like_clauses)})
        ORDER BY score DESC, chunks.id ASC
        LIMIT ?
        """,
        parameters,
    ).fetchall()

    return [_build_search_hit(row) for row in rows]


def _build_search_hit(row: sqlite3.Row) -> KnowledgeSearchHit:
    return KnowledgeSearchHit(
        chunk_id=int(row["chunk_id"]),
        file_id=int(row["file_id"]),
        relative_path=str(row["relative_path"]),
        chunk_index=int(row["chunk_index"]),
        score=float(row["score"]),
        content=str(row["content"]),
    )


def _extract_search_terms(query: str) -> list[str]:
    normalized = str(query or "").strip().lower()
    if not normalized:
        return []

    terms = [term for term in re.split(r"\s+", normalized) if term]
    if terms:
        return terms
    return [normalized]


def _build_fts_match_query(search_terms: list[str]) -> str:
    safe_terms = []
    for term in search_terms:
        cleaned = re.sub(r'["*]', " ", term).strip()
        if cleaned:
            safe_terms.append(f'"{cleaned}"')
    return " OR ".join(safe_terms)


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


def _count_markdown_files(connection: sqlite3.Connection) -> int:
    row = connection.execute(
        """
        SELECT COUNT(*) AS row_count
        FROM knowledge_files
        WHERE LOWER(suffix) = '.md'
        """
    ).fetchone()
    return int(row[0]) if row is not None else 0
