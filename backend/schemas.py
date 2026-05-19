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


class ChatResponse(BaseModel):
    reply: str
    skill: str
    status: str
    data: dict | None = None
