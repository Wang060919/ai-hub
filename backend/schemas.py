from __future__ import annotations

from typing import Literal, Optional

from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User input message.")
    messages: Optional[list[ChatMessage]] = Field(
        default=None,
        description="Optional short chat context. Stateless and limited to recent user/assistant messages.",
    )


class ActionPlan(BaseModel):
    intent: str
    risk_level: str
    target_scope: str
    steps: list[str]
    requires_confirmation: bool = True
    executable: bool = False
    notes: str


class FileAnalysisPlan(BaseModel):
    intent: str
    file_type_guess: str
    analysis_goal: str
    risk_level: str
    steps: list[str]
    requires_confirmation: bool = True
    executable: bool = False
    notes: str


class FileInventoryItem(BaseModel):
    name: str
    file_type: str
    size_hint: str
    location_hint: str
    user_goal: str


class FileInventoryPlan(BaseModel):
    intent: str
    files: list[FileInventoryItem]
    inferred_file_types: list[str]
    analysis_goal: str
    risk_level: str
    recommended_next_step: str
    steps: list[str]
    requires_confirmation: bool = True
    executable: bool = False
    notes: str


class ReadOnlyScannedFile(BaseModel):
    name: str
    suffix: str
    size_bytes: int
    modified_at: str
    item_type: str = "file"


class ReadOnlyScannedDirectory(BaseModel):
    name: str
    item_type: str = "directory"


class ReadOnlyFileScanPlan(BaseModel):
    intent: str
    scan_root: str
    requested_path: str
    scanned_path: str
    files: list[ReadOnlyScannedFile]
    directories: list[ReadOnlyScannedDirectory]
    total_files: int
    total_directories: int
    total_size_bytes: int
    total_size_human: str
    file_type_summary: dict[str, int]
    risk_level: str
    recommended_next_step: str
    steps: list[str]
    requires_confirmation: bool = True
    executable: bool = False
    notes: str


class ReadOnlyTextPreviewPlan(BaseModel):
    intent: str
    scan_root: str
    requested_path: str
    resolved_path: str
    file_name: str
    suffix: str
    size_bytes: int
    size_human: str
    preview_chars: int
    preview_text: str
    truncated: bool
    risk_level: str
    recommended_next_step: str
    requires_confirmation: bool = True
    executable: bool = False
    notes: str


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str


class VersionApiInfo(BaseModel):
    chat: str
    health: str
    version: str
    skills: str


class VersionResponse(BaseModel):
    app: str
    version: str
    stable_base: str
    api: VersionApiInfo


class SkillInfo(BaseModel):
    name: str
    description: str
    stage: str
    safety_level: str
    executable: bool


class SkillsResponse(BaseModel):
    app: str
    version: str
    skills: list[SkillInfo]


class ChatResponse(BaseModel):
    reply: str
    skill: str
    status: str
    data: Optional[dict] = None


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    error: ErrorBody


def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "error",
            "error": {
                "code": code,
                "message": message,
            },
        },
    )
