from fastapi import APIRouter

from backend.schemas import ChatRequest, ChatResponse
from backend.skills.echo import EchoSkill
from backend.skills.dify_english import DIFY_KEYWORDS, DifyEnglishSkill
from backend.skills.idea_capture import CAPTURE_PREFIXES, LIST_KEYWORDS, IdeaCaptureSkill
from backend.skills.time import TimeSkill

TIME_KEYWORDS = ("时间", "几点", "time")


def create_chat_router() -> APIRouter:
    router = APIRouter()
    dify_english_skill = DifyEnglishSkill()
    echo_skill = EchoSkill()
    idea_capture_skill = IdeaCaptureSkill()
    time_skill = TimeSkill()

    @router.post("/chat", response_model=ChatResponse)
    def chat(payload: ChatRequest) -> ChatResponse:
        skill = select_skill(
            payload.message,
            dify_english_skill=dify_english_skill,
            echo_skill=echo_skill,
            idea_capture_skill=idea_capture_skill,
            time_skill=time_skill,
        )
        return skill.execute(payload.message)

    return router


def select_skill(
    message: str,
    dify_english_skill: DifyEnglishSkill,
    echo_skill: EchoSkill,
    idea_capture_skill: IdeaCaptureSkill,
    time_skill: TimeSkill,
):
    normalized_message = message.strip().lower()
    if normalized_message.startswith(tuple(prefix.lower() for prefix in CAPTURE_PREFIXES)):
        return idea_capture_skill
    if any(keyword in normalized_message for keyword in LIST_KEYWORDS):
        return idea_capture_skill
    if any(keyword in normalized_message for keyword in TIME_KEYWORDS):
        return time_skill
    if any(keyword in normalized_message for keyword in DIFY_KEYWORDS):
        return dify_english_skill
    return echo_skill
