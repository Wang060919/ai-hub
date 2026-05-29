from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.api.schemas.knowledge import (
    KnowledgeAnswerItem,
    KnowledgeCitationItem,
    KnowledgeIndexMarkdownDirectoryError,
    KnowledgeIndexMarkdownDirectoryItem,
    KnowledgeIndexMarkdownDirectoryRequest,
    KnowledgeIndexMarkdownDirectoryResponse,
    KnowledgeIndexMarkdownDirectorySummary,
    KnowledgeIndexFileInfo,
    KnowledgeIndexFileRequest,
    KnowledgeIndexFileResponse,
    KnowledgeQueryRequest,
    KnowledgeQueryResponse,
    KnowledgeSearchBody,
    KnowledgeSearchHitItem,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    KnowledgeStatusBody,
    KnowledgeStatusResponse,
)
from backend.schemas import error_response
from backend.services.file.text_file_service import FileServiceError, TextFileService
from backend.services.knowledge.index_service import KnowledgeIndexService
from backend.services.knowledge.answer_service import KnowledgeAnswerError
from backend.services.knowledge.query_service import KnowledgeQueryService
from backend.services.knowledge.repository import KnowledgeRepository
from backend.storage import get_connection

router = APIRouter()
knowledge_index_service = KnowledgeIndexService(
    text_file_service=TextFileService(),
    repository=KnowledgeRepository(get_connection),
)
knowledge_repository = KnowledgeRepository(get_connection)
knowledge_query_service = KnowledgeQueryService(knowledge_repository)


@router.get("/knowledge/status", response_model=KnowledgeStatusResponse)
def knowledge_status() -> KnowledgeStatusResponse:
    storage_status = knowledge_repository.get_storage_status()

    return KnowledgeStatusResponse(
        status="ok",
        knowledge=KnowledgeStatusBody(
            enabled=storage_status.enabled,
            fts_enabled=storage_status.fts_enabled,
            fts_available=storage_status.fts_available,
            index_method=storage_status.index_method,
            files_count=storage_status.files_count,
            chunks_count=storage_status.chunks_count,
            markdown_files_count=storage_status.markdown_files_count,
            files_table_exists=storage_status.files_table_exists,
            chunks_table_exists=storage_status.chunks_table_exists,
            fts_table_exists=storage_status.fts_table_exists,
            tags_count=storage_status.tags_count,
            links_count=storage_status.links_count,
        ),
    )


@router.post("/knowledge/search", response_model=KnowledgeSearchResponse)
def knowledge_search(request: KnowledgeSearchRequest) -> KnowledgeSearchResponse | JSONResponse:
    try:
        result = knowledge_query_service.search(
            query=request.query,
            kb_id=request.kb_id,
            top_k=request.top_k,
        )
    except ValueError as exc:
        return error_response(400, "INVALID_QUERY", str(exc))

    return KnowledgeSearchResponse(
        status="ok",
        search=KnowledgeSearchBody(
            query=result.query,
            kb_id=result.kb_id,
            top_k=result.top_k,
            index_method=result.index_method,
            hits_count=len(result.hits),
        ),
        hits=[
            KnowledgeSearchHitItem(
                chunk_id=hit.chunk_id,
                file_id=hit.file_id,
                relative_path=hit.relative_path,
                chunk_index=hit.chunk_index,
                score=hit.score,
                content=hit.content,
            )
            for hit in result.hits
        ],
    )


@router.post("/knowledge/query", response_model=KnowledgeQueryResponse)
def knowledge_query(request: KnowledgeQueryRequest) -> KnowledgeQueryResponse | JSONResponse:
    try:
        result = knowledge_query_service.query(
            question=request.question,
            kb_id=request.kb_id,
            top_k=request.top_k,
        )
    except ValueError as exc:
        return error_response(400, "INVALID_QUESTION", str(exc))
    except KnowledgeAnswerError as exc:
        return error_response(503, exc.code, exc.message)

    return KnowledgeQueryResponse(
        status="ok",
        answer=KnowledgeAnswerItem(
            text=result.answer.text,
            model=result.answer.model,
            grounded=result.answer.grounded,
        ),
        hits=[
            KnowledgeSearchHitItem(
                chunk_id=hit.chunk_id,
                file_id=hit.file_id,
                relative_path=hit.relative_path,
                chunk_index=hit.chunk_index,
                score=hit.score,
                content=hit.content,
            )
            for hit in result.hits
        ],
        citations=[
            KnowledgeCitationItem(
                index=citation.index,
                chunk_id=citation.chunk_id,
                relative_path=citation.relative_path,
                chunk_index=citation.chunk_index,
            )
            for citation in result.citations
        ],
    )


@router.post("/knowledge/index-file", response_model=KnowledgeIndexFileResponse)
def index_file(request: KnowledgeIndexFileRequest) -> KnowledgeIndexFileResponse | JSONResponse:
    if request.chunk_overlap >= request.chunk_size:
        return error_response(400, "INVALID_CHUNK_PARAMS", "chunk_overlap must be smaller than chunk_size.")

    try:
        result = knowledge_index_service.index_file(
            path=request.path,
            kb_id=request.kb_id,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap,
            force_reindex=request.force_reindex,
        )
    except FileServiceError as exc:
        return error_response(400, exc.code, exc.message)

    return KnowledgeIndexFileResponse(
        status="ok",
        file=KnowledgeIndexFileInfo(
            kb_id=result.kb_id,
            relative_path=result.relative_path,
            file_hash=result.file_hash,
        ),
        index={
            "file_id": result.file_id,
            "chunk_count": result.chunk_count,
            "reused_existing": result.reused_existing,
            "replaced_existing": result.replaced_existing,
            "index_method": result.index_method,
        },
    )


@router.post(
    "/knowledge/index-markdown-directory",
    response_model=KnowledgeIndexMarkdownDirectoryResponse,
)
def index_markdown_directory(
    request: KnowledgeIndexMarkdownDirectoryRequest,
) -> KnowledgeIndexMarkdownDirectoryResponse | JSONResponse:
    try:
        result = knowledge_index_service.index_markdown_directory(
            directory=request.directory,
            kb_id=request.kb_id,
            recursive=request.recursive,
            force_reindex=request.force_reindex,
            max_files=request.max_files,
        )
    except FileServiceError as exc:
        return error_response(400, exc.code, exc.message)

    return KnowledgeIndexMarkdownDirectoryResponse(
        status="ok",
        directory=result.directory,
        kb_id=result.kb_id,
        recursive=result.recursive,
        force_reindex=result.force_reindex,
        max_files=result.max_files,
        summary=KnowledgeIndexMarkdownDirectorySummary(
            matched_files=result.summary.matched_files,
            indexed_files=result.summary.indexed_files,
            reused_files=result.summary.reused_files,
            failed_files=result.summary.failed_files,
            skipped_files=result.summary.skipped_files,
        ),
        results=[
            KnowledgeIndexMarkdownDirectoryItem(
                path=item.path,
                status=item.status,
                chunk_count=item.chunk_count,
                reused_existing=item.reused_existing,
                replaced_existing=item.replaced_existing,
                error_code=item.error_code,
                error_message=item.error_message,
            )
            for item in result.results
        ],
        errors=[
            KnowledgeIndexMarkdownDirectoryError(
                path=error.path,
                code=error.code,
                message=error.message,
            )
            for error in result.errors
        ],
    )
