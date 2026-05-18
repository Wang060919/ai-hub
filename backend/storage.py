from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "ai_hub.db"


def get_connection() -> sqlite3.Connection:
    initialize_database()
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS ideas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'unreviewed',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def save_idea(content: str) -> dict:
    timestamp = datetime.now().isoformat(timespec="seconds")
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO ideas (content, status, created_at, updated_at)
            VALUES (?, 'unreviewed', ?, ?)
            """,
            (content, timestamp, timestamp),
        )
        connection.commit()
        return {
            "idea_id": cursor.lastrowid,
            "content": content,
        }


def list_recent_ideas(limit: int = 5) -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, content, status, created_at, updated_at
            FROM ideas
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]
