from backend.schemas import ChatResponse
from backend.skills.base import BaseSkill
from backend.storage import list_recent_ideas, save_idea

CAPTURE_PREFIXES = (
    "记录想法：",
    "帮我记录一个想法：",
    "idea:",
    "save idea:",
)

NATURAL_CAPTURE_PREFIXES = (
    "帮我记一下",
    "记一下",
    "帮我保存一下",
    "先记下来",
    "以后做",
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
                return self._save_content(content)

        for prefix in NATURAL_CAPTURE_PREFIXES:
            content = self._extract_natural_capture_content(stripped_message, lowered_message, prefix)
            if content is not None:
                return self._save_content(content)

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

    def _extract_natural_capture_content(
        self,
        original_message: str,
        lowered_message: str,
        trigger: str,
    ) -> str | None:
        trigger_index = lowered_message.find(trigger.lower())
        if trigger_index < 0:
            return None

        before_text = original_message[:trigger_index].strip(" ：:，,。.!；;")
        after_text = original_message[trigger_index + len(trigger) :].strip(" ：:，,。.!；;")

        if after_text:
            return after_text
        if before_text:
            return before_text
        return None

    def _save_content(self, content: str) -> ChatResponse:
        if not content:
            return ChatResponse(
                reply="暂不支持该想法操作",
                skill=self.name,
                status="error",
            )

        saved_idea = save_idea(content=content)
        return ChatResponse(
            reply="已记录想法",
            skill=self.name,
            status="success",
            data=saved_idea,
        )
