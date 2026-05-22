from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.api.schemas.knowledge import (
    KnowledgeIndexFileInfo,
    KnowledgeIndexFileRequest,
    KnowledgeIndexFileResponse,
)
from backend.services.file.text_file_service import FileServiceError, TextFileService
from backend.services.knowledge.index_service import KnowledgeIndexService
from backend.services.knowledge.repository import KnowledgeRepository
from backend.storage import get_connection

router = APIRouter()
knowledge_index_service = KnowledgeIndexService(
    text_file_service=TextFileService(),
    repository=KnowledgeRepository(get_connection),
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
