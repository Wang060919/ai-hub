from fastapi import APIRouter

from backend.app_info import build_health_response
from backend.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return build_health_response()
