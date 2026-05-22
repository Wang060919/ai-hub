from __future__ import annotations

from backend.services.knowledge.models import KnowledgeSearchResult
from backend.services.knowledge.repository import KnowledgeRepository

DEFAULT_KB_ID = "default"
DEFAULT_TOP_K = 4


class KnowledgeQueryService:
    """Validate search inputs and delegate chunk retrieval to the repository."""

    def __init__(self, repository: KnowledgeRepository) -> None:
        self._repository = repository

    def search(
        self,
        query: str,
        kb_id: str = DEFAULT_KB_ID,
        top_k: int = DEFAULT_TOP_K,
    ) -> KnowledgeSearchResult:
        normalized_query = str(query or "").strip()
        if not normalized_query:
            raise ValueError("query must not be empty.")

        normalized_kb_id = str(kb_id or DEFAULT_KB_ID).strip() or DEFAULT_KB_ID
        normalized_top_k = max(1, int(top_k))

        return self._repository.search_chunks(
            query=normalized_query,
            kb_id=normalized_kb_id,
            top_k=normalized_top_k,
        )
