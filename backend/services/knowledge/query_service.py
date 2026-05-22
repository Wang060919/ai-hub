from __future__ import annotations

from backend.services.knowledge.answer_service import KnowledgeAnswerService
from backend.services.knowledge.models import KnowledgeQueryResult, KnowledgeSearchResult
from backend.services.knowledge.repository import KnowledgeRepository

DEFAULT_KB_ID = "default"
DEFAULT_TOP_K = 4
MAX_TOP_K = 8


class KnowledgeQueryService:
    """Validate search inputs and delegate chunk retrieval to the repository."""

    def __init__(
        self,
        repository: KnowledgeRepository,
        answer_service: KnowledgeAnswerService | None = None,
    ) -> None:
        self._repository = repository
        self._answer_service = answer_service or KnowledgeAnswerService()

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
        normalized_top_k = min(MAX_TOP_K, max(1, int(top_k)))

        return self._repository.search_chunks(
            query=normalized_query,
            kb_id=normalized_kb_id,
            top_k=normalized_top_k,
        )

    def query(
        self,
        question: str,
        kb_id: str = DEFAULT_KB_ID,
        top_k: int = DEFAULT_TOP_K,
    ) -> KnowledgeQueryResult:
        normalized_question = str(question or "").strip()
        if not normalized_question:
            raise ValueError("question must not be empty.")

        search_result = self.search(
            query=normalized_question,
            kb_id=kb_id,
            top_k=top_k,
        )
        answer, citations = self._answer_service.build_answer(
            question=normalized_question,
            hits=search_result.hits,
        )

        return KnowledgeQueryResult(
            question=normalized_question,
            kb_id=search_result.kb_id,
            top_k=search_result.top_k,
            index_method=search_result.index_method,
            answer=answer,
            hits=search_result.hits,
            citations=citations,
        )
