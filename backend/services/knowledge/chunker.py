from __future__ import annotations

from backend.services.knowledge.models import KnowledgeChunkDraft

DEFAULT_CHUNK_SIZE = 800
DEFAULT_CHUNK_OVERLAP = 120
MAX_BOUNDARY_SCAN = 120


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[KnowledgeChunkDraft]:
    clean_text = str(text or "")
    if not clean_text:
        return []

    safe_chunk_size = max(1, int(chunk_size))
    safe_overlap = max(0, min(int(overlap), safe_chunk_size - 1)) if safe_chunk_size > 1 else 0

    chunks: list[KnowledgeChunkDraft] = []
    start = 0
    text_length = len(clean_text)

    while start < text_length:
        hard_end = min(start + safe_chunk_size, text_length)
        end = _find_chunk_end(clean_text, start, hard_end)
        if end <= start:
            end = hard_end

        content = clean_text[start:end].strip()
        if content:
            char_start = _find_content_start(clean_text, start, end, content)
            char_end = char_start + len(content)
            chunks.append(
                KnowledgeChunkDraft(
                    chunk_index=len(chunks),
                    char_start=char_start,
                    char_end=char_end,
                    content=content,
                    content_chars=len(content),
                    token_estimate=_estimate_tokens(content),
                )
            )

        if end >= text_length:
            break
        start = max(end - safe_overlap, start + 1)

    return chunks


def _find_chunk_end(text: str, start: int, hard_end: int) -> int:
    if hard_end >= len(text):
        return len(text)

    window_end = min(len(text), hard_end + MAX_BOUNDARY_SCAN)
    boundary_window = text[hard_end:window_end]

    for marker in ("\n\n", "\n", " "):
        offset = boundary_window.find(marker)
        if offset != -1:
            return hard_end + offset + len(marker)

    backward_window_start = max(start, hard_end - MAX_BOUNDARY_SCAN)
    backward_window = text[backward_window_start:hard_end]

    for marker in ("\n\n", "\n", " "):
        offset = backward_window.rfind(marker)
        if offset != -1:
            return backward_window_start + offset + len(marker)

    return hard_end


def _find_content_start(text: str, start: int, end: int, content: str) -> int:
    raw_segment = text[start:end]
    stripped_index = raw_segment.find(content)
    if stripped_index == -1:
        return start
    return start + stripped_index


def _estimate_tokens(content: str) -> int:
    # Lightweight heuristic for future prompt-budget control.
    return max(1, len(content) // 4)
