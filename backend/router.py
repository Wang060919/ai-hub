from fastapi import APIRouter

from backend.ai_router import OllamaRouter, is_ai_router_enabled
from backend.schemas import ChatRequest, ChatResponse
from backend.skills.echo import EchoSkill
from backend.skills.dify_english import DIFY_KEYWORDS, DifyEnglishSkill
from backend.skills.idea_capture import CAPTURE_PREFIXES, LIST_KEYWORDS, IdeaCaptureSkill
from backend.skills.time import TimeSkill

TIME_KEYWORDS = ("时间", "几点", "time")
CAPTURE_PREFIXES_LOWER = tuple(prefix.lower() for prefix in CAPTURE_PREFIXES)
LIST_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in LIST_KEYWORDS)
CAPTURE_INTENT_KEYWORDS_LOWER = (
    "帮我记一下",
    "记一下",
    "帮我保存一下",
    "先记下来",
    "以后做",
)
DIFY_KEYWORDS_LOWER = tuple(keyword.lower() for keyword in DIFY_KEYWORDS)
DIFY_LEARNING_KEYWORDS_LOWER = (
    "怎么背",
    "怎么记",
    "这个词",
    "词怎么",
    "背单词",
)


def create_chat_router() -> APIRouter:
    router = APIRouter()
    ai_router = OllamaRouter()
    dify_english_skill = DifyEnglishSkill()
    echo_skill = EchoSkill()
    idea_capture_skill = IdeaCaptureSkill()
    time_skill = TimeSkill()
    skills_by_name = {
        echo_skill.name: echo_skill,
        time_skill.name: time_skill,
        idea_capture_skill.name: idea_capture_skill,
        dify_english_skill.name: dify_english_skill,
    }

    @router.post("/chat", response_model=ChatResponse)
    def chat(payload: ChatRequest) -> ChatResponse:
        rule_skill = select_skill(
            payload.message,
            dify_english_skill=dify_english_skill,
            echo_skill=echo_skill,
            idea_capture_skill=idea_capture_skill,
            time_skill=time_skill,
        )
        if rule_skill.name != echo_skill.name:
            return rule_skill.execute(payload.message)

        if not is_ai_router_enabled():
            return echo_skill.execute(payload.message)

        ai_route = ai_router.classify(payload.message)
        routed_skill_name = str(ai_route.get("skill", echo_skill.name))
        routed_skill = skills_by_name.get(routed_skill_name, echo_skill)
        return routed_skill.execute(payload.message)

    return router


def select_skill(
    message: str,
    dify_english_skill: DifyEnglishSkill,
    echo_skill: EchoSkill,
    idea_capture_skill: IdeaCaptureSkill,
    time_skill: TimeSkill,
):
    normalized_message = message.strip().lower()
    if normalized_message.startswith(CAPTURE_PREFIXES_LOWER):
        return idea_capture_skill
    if any(keyword in normalized_message for keyword in LIST_KEYWORDS_LOWER):
        return idea_capture_skill
    if any(keyword in normalized_message for keyword in CAPTURE_INTENT_KEYWORDS_LOWER):
        return idea_capture_skill
    if any(keyword in normalized_message for keyword in TIME_KEYWORDS):
        return time_skill
    if any(keyword in normalized_message for keyword in DIFY_KEYWORDS_LOWER):
        return dify_english_skill
    if any(keyword in normalized_message for keyword in DIFY_LEARNING_KEYWORDS_LOWER):
        return dify_english_skill
    return echo_skill
