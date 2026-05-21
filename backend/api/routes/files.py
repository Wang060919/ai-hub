from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.api.schemas.files import FilePreviewRequest, FilePreviewResponse
from backend.services.file import FileServiceError, TextFileService

router = APIRouter()
text_file_service = TextFileService()


@router.post("/files/preview", response_model=FilePreviewResponse)
def preview_file(request: FilePreviewRequest) -> FilePreviewResponse | JSONResponse:
    try:
        result = text_file_service.preview_text_file(
            requested_path=request.path,
            preview_chars=request.preview_chars,
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

    return FilePreviewResponse(
        status="ok",
        file={
            "name": result.file.name,
            "suffix": result.file.suffix,
            "size_bytes": result.file.size_bytes,
            "size_human": result.file.size_human,
            "modified_at": result.file.modified_at,
            "relative_path": result.file.relative_path,
        },
        preview={
            "text": result.text,
            "chars": result.chars,
            "truncated": result.truncated,
        },
    )
