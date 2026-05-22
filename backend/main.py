from fastapi import FastAPI

from backend.api.routes.chat import router as chat_router
from backend.api.routes.files import router as files_router
from backend.api.routes.health import router as health_router
from backend.api.routes.knowledge import router as knowledge_router
from backend.api.routes.meta import router as meta_router
from backend.app_info import APP_NAME, APP_VERSION
from backend.storage import initialize_database


app = FastAPI(title=APP_NAME, version=APP_VERSION)
app.include_router(chat_router)
app.include_router(files_router)
app.include_router(health_router)
app.include_router(knowledge_router)
app.include_router(meta_router)


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()
