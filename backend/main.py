from fastapi import FastAPI

from backend.app_info import APP_NAME, APP_VERSION, build_health_response, build_skills_response, build_version_response
from backend.router import create_chat_router
from backend.schemas import HealthResponse, SkillsResponse, VersionResponse
from backend.storage import initialize_database


app = FastAPI(title=APP_NAME, version=APP_VERSION)
app.include_router(create_chat_router())


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return build_health_response()


@app.get("/version", response_model=VersionResponse)
def version_info() -> VersionResponse:
    return build_version_response()


@app.get("/skills", response_model=SkillsResponse)
def skills_info() -> SkillsResponse:
    return build_skills_response()
