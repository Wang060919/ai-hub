from __future__ import annotations

from backend.schemas import HealthResponse, SkillInfo, SkillsResponse, VersionApiInfo, VersionResponse

APP_NAME = "AI Hub"
APP_VERSION = "v0.9-api-stabilization"
STABLE_BASE_VERSION = "v0.8-readonly-text-preview"

API_ENDPOINTS = {
    "chat": "/chat",
    "health": "/health",
    "version": "/version",
    "skills": "/skills",
}

SKILLS_CATALOG = (
    SkillInfo(
        name="echo",
        description="Returns the input text as a basic fallback reply.",
        stage="v0.1-micro-core",
        safety_level="safe-readonly",
        executable=True,
    ),
    SkillInfo(
        name="time",
        description="Returns the current server time without external calls.",
        stage="v0.1-micro-core",
        safety_level="safe-readonly",
        executable=True,
    ),
    SkillInfo(
        name="idea_capture",
        description="Captures or lists lightweight idea notes through the existing backend flow.",
        stage="v0.1-micro-core",
        safety_level="internal-storage",
        executable=True,
    ),
    SkillInfo(
        name="dify_english",
        description="Routes English-learning requests to the external Dify API without exposing any key material.",
        stage="v0.2-dify-english-skill",
        safety_level="external-api",
        executable=True,
    ),
    SkillInfo(
        name="safe_action",
        description="Generates a safe action plan only and never executes real file operations.",
        stage="v0.4-safe-action-skill",
        safety_level="plan-only",
        executable=False,
    ),
    SkillInfo(
        name="file_analysis",
        description="Builds a file analysis plan from user text only and does not read real files.",
        stage="v0.5-file-analysis-skill",
        safety_level="plan-only",
        executable=False,
    ),
    SkillInfo(
        name="file_inventory",
        description="Parses user-provided file inventory text only and does not inspect the real file system.",
        stage="v0.6-file-inventory-skill",
        safety_level="plan-only",
        executable=False,
    ),
    SkillInfo(
        name="readonly_file_scanner",
        description="Reads file metadata only from the whitelist scope and does not read file contents.",
        stage="v0.7-readonly-file-scanner",
        safety_level="whitelist-readonly",
        executable=False,
    ),
    SkillInfo(
        name="readonly_text_preview",
        description="Reads preview text only for whitelisted txt or md small files within the allowed scope.",
        stage="v0.8-readonly-text-preview",
        safety_level="whitelist-readonly",
        executable=False,
    ),
)


def build_health_response() -> HealthResponse:
    return HealthResponse(status="ok", app=APP_NAME, version=APP_VERSION)


def build_version_response() -> VersionResponse:
    return VersionResponse(
        app=APP_NAME,
        version=APP_VERSION,
        stable_base=STABLE_BASE_VERSION,
        api=VersionApiInfo(**API_ENDPOINTS),
    )


def build_skills_response() -> SkillsResponse:
    return SkillsResponse(app=APP_NAME, version=APP_VERSION, skills=list(SKILLS_CATALOG))
