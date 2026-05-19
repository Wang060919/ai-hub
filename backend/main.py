from fastapi import FastAPI

from backend.router import create_chat_router
from backend.storage import initialize_database


app = FastAPI(title="AI Hub", version="0.1.0")
app.include_router(create_chat_router())


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
