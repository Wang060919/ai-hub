from __future__ import annotations

from enum import Enum


class ErrorCode(str, Enum):
    UNKNOWN = "unknown_error"
    CONFIGURATION = "configuration_error"
    VALIDATION = "validation_error"
    ROUTING = "routing_error"
    SERVICE_UNAVAILABLE = "service_unavailable"


class AIHubError(Exception):
    """Base error type for future backend layers."""

    def __init__(self, message: str, code: ErrorCode = ErrorCode.UNKNOWN) -> None:
        super().__init__(message)
        self.message = message
        self.code = code


class ConfigurationError(AIHubError):
    def __init__(self, message: str = "Invalid application configuration.") -> None:
        super().__init__(message=message, code=ErrorCode.CONFIGURATION)


class ValidationError(AIHubError):
    def __init__(self, message: str = "Validation failed.") -> None:
        super().__init__(message=message, code=ErrorCode.VALIDATION)


class RoutingError(AIHubError):
    def __init__(self, message: str = "Route resolution failed.") -> None:
        super().__init__(message=message, code=ErrorCode.ROUTING)
