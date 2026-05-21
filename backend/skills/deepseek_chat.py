from backend.adapters.deepseek import (
    DeepSeekError,
    create_deepseek_reply,
    create_deepseek_reply_from_messages,
)
from backend.schemas import ChatMessage, ChatResponse
from backend.skills.base import BaseSkill


class DeepSeekChatSkill(BaseSkill):
    name = "deepseek_chat"

    def execute(self, message: str) -> ChatResponse:
        try:
            reply = create_deepseek_reply(message)
        except DeepSeekError as exc:
            return ChatResponse(
                reply=f"DeepSeek chat failed: {exc}",
                skill=self.name,
                status="error",
                data={"error_type": exc.__class__.__name__},
            )

        return ChatResponse(
            reply=reply,
            skill=self.name,
            status="success",
        )

    def execute_messages(self, messages: list[ChatMessage]) -> ChatResponse:
        try:
            reply = create_deepseek_reply_from_messages(messages)
        except DeepSeekError as exc:
            return ChatResponse(
                reply=f"DeepSeek chat failed: {exc}",
                skill=self.name,
                status="error",
                data={"error_type": exc.__class__.__name__},
            )

        return ChatResponse(
            reply=reply,
            skill=self.name,
            status="success",
        )
