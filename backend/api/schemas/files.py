from typing import Optional

from pydantic import BaseModel, Field


class FilePreviewRequest(BaseModel):
    path: str = Field(..., min_length=1)
    preview_chars: Optional[int] = None


class FilePreviewFileInfo(BaseModel):
    name: str
    suffix: str
    size_bytes: int
    size_human: str
    modified_at: str
    relative_path: str


class FilePreviewBody(BaseModel):
    text: str
    chars: int
    truncated: bool


class FilePreviewResponse(BaseModel):
    status: str
    file: FilePreviewFileInfo
    preview: FilePreviewBody


class FileSummarizeRequest(BaseModel):
    path: str = Field(..., min_length=1)
    max_input_chars: Optional[int] = Field(default=None, ge=1)


class FileSummaryBody(BaseModel):
    text: str
    model: str
    input_chars: int
    source_chars: int
    truncated: bool


class FileSummarizeResponse(BaseModel):
    status: str
    file: FilePreviewFileInfo
    summary: FileSummaryBody
