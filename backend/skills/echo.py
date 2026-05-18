from backend.schemas import ChatResponse
from backend.skills.base import BaseSkill


class EchoSkill(BaseSkill):
    name = "echo"

    def execute(self, message: str) -> ChatResponse:
        return ChatResponse(
            reply=f"Echo: {message}",
            skill=self.name,
            status="success",
        )
