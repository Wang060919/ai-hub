from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.api.schemas.knowledge import (
    KnowledgeIndexFileInfo,
    KnowledgeIndexFileRequest,
    KnowledgeIndexFileResponse,
    KnowledgeSearchBody,
    KnowledgeSearchHitItem,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    KnowledgeStatusBody,
    KnowledgeStatusResponse,
)
from backend.services.file.text_file_service import FileServiceError, TextFileService
from backend.services.knowledge.index_service import KnowledgeIndexService
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
            files_table_exists=storage_status.files_table_exists,
            chunks_table_exists=storage_status.chunks_table_exists,
            fts_table_exists=storage_status.fts_table_exists,
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
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "error": {
                    "code": "INVALID_QUERY",
                    "message": str(exc),
                },
            },
        )

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


@router.post("/knowledge/index-file", response_model=KnowledgeIndexFileResponse)
def index_file(request: KnowledgeIndexFileRequest) -> KnowledgeIndexFileResponse | JSONResponse:
    if request.chunk_overlap >= request.chunk_size:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "error": {
                    "code": "INVALID_CHUNK_PARAMS",
                    "message": "chunk_overlap must be smaller than chunk_size.",
                },
            },
        )

    try:
        result = knowledge_index_service.index_file(
            path=request.path,
            kb_id=request.kb_id,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap,
            force_reindex=request.force_reindex,
        )
    except FileServiceError as exc:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                },
            },
        )

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
