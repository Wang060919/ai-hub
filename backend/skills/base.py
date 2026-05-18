from abc import ABC, abstractmethod

from backend.schemas import ChatResponse


class BaseSkill(ABC):
    name: str = "base"

    @abstractmethod
    def execute(self, message: str) -> ChatResponse:
        """Handle a message and return a normalized chat response."""
