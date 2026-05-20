from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User input message.")


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
    risk_level: str
    recommended_next_step: str
    steps: list[str]
    requires_confirmation: bool = True
    executable: bool = False
    notes: str


class ChatResponse(BaseModel):
    reply: str
    skill: str
    status: str
    data: dict | None = None
