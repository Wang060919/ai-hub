from backend.schemas import ChatResponse
from backend.skills.base import BaseSkill
from backend.storage import list_recent_ideas, save_idea

CAPTURE_PREFIXES = (
    "记录想法：",
    "帮我记录一个想法：",
    "idea:",
    "save idea:",
)

LIST_KEYWORDS = ("最近想法", "查看想法", "list ideas")


class IdeaCaptureSkill(BaseSkill):
    name = "idea_capture"

    def execute(self, message: str) -> ChatResponse:
        stripped_message = message.strip()
        lowered_message = stripped_message.lower()

        for prefix in CAPTURE_PREFIXES:
            if lowered_message.startswith(prefix.lower()):
                content = stripped_message[len(prefix) :].strip()
                saved_idea = save_idea(content=content)
                return ChatResponse(
                    reply="已记录想法",
                    skill=self.name,
                    status="success",
                    data=saved_idea,
                )

        if any(keyword in lowered_message for keyword in LIST_KEYWORDS):
            ideas = list_recent_ideas(limit=5)
            return ChatResponse(
                reply="最近想法列表",
                skill=self.name,
                status="success",
                data={"ideas": ideas},
            )

        return ChatResponse(
            reply="暂不支持该想法操作",
            skill=self.name,
            status="error",
        )
