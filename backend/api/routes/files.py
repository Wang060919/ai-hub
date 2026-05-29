from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.api.schemas.files import (
    FilePreviewFileInfo,
    FilePreviewRequest,
    FilePreviewResponse,
    FileSummarizeRequest,
    FileSummarizeResponse,
)
from backend.schemas import error_response
from backend.services.file import (
    FileServiceError,
    FileSummaryError,
    FileSummaryService,
    SafeFileInfo,
    TextFileService,
)

router = APIRouter()
text_file_service = TextFileService()
file_summary_service = FileSummaryService(text_file_service=text_file_service)


@router.post("/files/preview", response_model=FilePreviewResponse)
def preview_file(request: FilePreviewRequest) -> FilePreviewResponse | JSONResponse:
    try:
        result = text_file_service.preview_text_file(
            requested_path=request.path,
            preview_chars=request.preview_chars,
        )
    except FileServiceError as exc:
        return error_response(400, exc.code, exc.message)

    return FilePreviewResponse(
        status="ok",
        file=_serialize_file_info(result.file),
        preview={
            "text": result.text,
            "chars": result.chars,
            "truncated": result.truncated,
        },
    )


@router.post("/files/summarize", response_model=FileSummarizeResponse)
def summarize_file(request: FileSummarizeRequest) -> FileSummarizeResponse | JSONResponse:
    try:
        result = file_summary_service.summarize_file(
            requested_path=request.path,
            max_input_chars=request.max_input_chars,
        )
    except FileServiceError as exc:
        return error_response(400, exc.code, exc.message)
    except FileSummaryError as exc:
        return error_response(_summary_error_status_code(exc.code), exc.code, exc.message)

    return FileSummarizeResponse(
        status="ok",
        file=_serialize_file_info(result.file),
        summary={
            "text": result.summary.text,
            "model": result.summary.model,
            "input_chars": result.summary.input_chars,
            "source_chars": result.summary.source_chars,
            "truncated": result.summary.truncated,
        },
    )


def _serialize_file_info(file_info: SafeFileInfo) -> FilePreviewFileInfo:
    return FilePreviewFileInfo(
        name=file_info.name,
        suffix=file_info.suffix,
        size_bytes=file_info.size_bytes,
        size_human=file_info.size_human,
        modified_at=file_info.modified_at,
        relative_path=file_info.relative_path,
    )


def _summary_error_status_code(error_code: str) -> int:
    if error_code == "SUMMARY_MODEL_DISABLED":
        return 503
    if error_code == "SUMMARY_RESPONSE_INVALID":
        return 502
    return 502
