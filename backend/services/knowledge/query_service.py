from __future__ import annotations

from backend.services.knowledge.answer_service import KnowledgeAnswerService
from backend.services.knowledge.models import KnowledgeQueryResult, KnowledgeSearchHit, KnowledgeSearchResult
from backend.services.knowledge.repository import KnowledgeRepository, get_linked_files

DEFAULT_KB_ID = "default"
DEFAULT_TOP_K = 4
MAX_TOP_K = 8
MAX_LINK_HITS = 2


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

        enriched_hits = self._enrich_with_link_hits(
            hits=search_result.hits,
            kb_id=search_result.kb_id,
            query=normalized_question,
        )

        answer, citations = self._answer_service.build_answer(
            question=normalized_question,
            hits=enriched_hits,
        )

        return KnowledgeQueryResult(
            question=normalized_question,
            kb_id=search_result.kb_id,
            top_k=search_result.top_k,
            index_method=search_result.index_method,
            answer=answer,
            hits=enriched_hits,
            citations=citations,
        )

    def _enrich_with_link_hits(
        self,
        hits: list[KnowledgeSearchHit],
        kb_id: str,
        query: str,
    ) -> list[KnowledgeSearchHit]:
        if not hits:
            return hits

        seen_file_ids = {hit.file_id for hit in hits}
        link_hit_count = 0

        for hit in hits[:2]:
            if link_hit_count >= MAX_LINK_HITS:
                break

            try:
                with self._repository._connection_factory() as connection:
                    linked = get_linked_files(connection, hit.file_id)
            except Exception:
                continue

            for link in linked:
                if link_hit_count >= MAX_LINK_HITS:
                    break
                if not link.target_file_id:
                    continue
                if link.target_file_id in seen_file_ids:
                    continue

                try:
                    linked_result = self._repository.search_chunks(
                        query=query,
                        kb_id=kb_id,
                        top_k=1,
                    )
                    for linked_hit in linked_result.hits:
                        if linked_hit.file_id == link.target_file_id:
                            hits = list(hits) + [linked_hit]
                            seen_file_ids.add(link.target_file_id)
                            link_hit_count += 1
                            break
                except Exception:
                    continue

        return hits
