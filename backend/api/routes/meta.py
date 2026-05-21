from fastapi import APIRouter

from backend.app_info import build_skills_response, build_version_response
from backend.schemas import SkillsResponse, VersionResponse

router = APIRouter()


@router.get("/version", response_model=VersionResponse)
def version_info() -> VersionResponse:
    return build_version_response()


@router.get("/skills", response_model=SkillsResponse)
def skills_info() -> SkillsResponse:
    return build_skills_response()
