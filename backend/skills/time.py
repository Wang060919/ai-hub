from datetime import datetime

from backend.schemas import ChatResponse
from backend.skills.base import BaseSkill


class TimeSkill(BaseSkill):
    name = "time"

    def execute(self, message: str) -> ChatResponse:
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return ChatResponse(
            reply=f"Current time is {current_time}",
            skill=self.name,
            status="success",
        )
