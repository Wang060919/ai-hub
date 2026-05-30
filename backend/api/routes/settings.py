from __future__ import annotations

import json
from typing import Optional
from urllib import error, request

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.core.model_config import get_model_config, update_model_config

router = APIRouter()


def _mask_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "****"
    return key[:4] + "****" + key[-4:]


class ModelSettingsResponse(BaseModel):
    api_url: str
    api_key_masked: str
    model: str
    timeout: int


class ModelSettingsUpdate(BaseModel):
    api_url: Optional[str] = Field(default=None, min_length=1)
    api_key: Optional[str] = Field(default=None, min_length=1)
    model: Optional[str] = Field(default=None, min_length=1)
    timeout: Optional[int] = Field(default=None, ge=1, le=120)


@router.get("/settings/model", response_model=ModelSettingsResponse)
def get_model_settings() -> ModelSettingsResponse:
    config = get_model_config()
    return ModelSettingsResponse(
        api_url=config.api_url,
        api_key_masked=_mask_key(config.api_key),
        model=config.model,
        timeout=config.timeout,
    )


@router.post("/settings/model", response_model=ModelSettingsResponse)
def post_model_settings(payload: ModelSettingsUpdate) -> ModelSettingsResponse:
    kwargs = {}
    if payload.api_url is not None:
        kwargs["api_url"] = payload.api_url
    if payload.api_key is not None:
        kwargs["api_key"] = payload.api_key
    if payload.model is not None:
        kwargs["model"] = payload.model
    if payload.timeout is not None:
        kwargs["timeout"] = payload.timeout

    config = update_model_config(**kwargs)
    return ModelSettingsResponse(
        api_url=config.api_url,
        api_key_masked=_mask_key(config.api_key),
        model=config.model,
        timeout=config.timeout,
    )


def _derive_models_url(api_url: str) -> str:
    trimmed = api_url.rstrip("/")
    base = trimmed
    for suffix in ("/chat/completions", "/completions"):
        if base.lower().endswith(suffix):
            base = base[: -len(suffix)]
            break
    base = base.rstrip("/")
    if base.lower().endswith("/v1"):
        return base + "/models"
    return base + "/v1/models"


class ModelListRequest(BaseModel):
    api_url: str = Field(..., min_length=1)
    api_key: Optional[str] = None


class ModelListResponse(BaseModel):
    models: list[str]
    error: Optional[str] = None


@router.post("/settings/models", response_model=ModelListResponse)
def post_model_list(payload: ModelListRequest) -> ModelListResponse:
    models_url = _derive_models_url(payload.api_url)
    headers = {"Accept": "application/json"}
    if payload.api_key:
        headers["Authorization"] = f"Bearer {payload.api_key}"

    http_request = request.Request(models_url, headers=headers, method="GET")

    try:
        with request.urlopen(http_request, timeout=15) as response:
            body = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        code = exc.code
        try:
            err_body = json.loads(exc.read().decode("utf-8"))
            msg = err_body.get("error", {}).get("message") or str(err_body)
        except Exception:
            msg = f"HTTP {code}"
        return ModelListResponse(models=[], error=f"HTTP {code}: {msg}")
    except Exception as exc:
        return ModelListResponse(models=[], error=str(exc))

    raw_models = body.get("data") or body.get("models") or []
    model_ids = []
    for item in raw_models:
        if isinstance(item, dict):
            mid = item.get("id") or item.get("name") or ""
        else:
            mid = str(item)
        mid = mid.strip()
        if mid:
            model_ids.append(mid)

    return ModelListResponse(models=sorted(model_ids))
