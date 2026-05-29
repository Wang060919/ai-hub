@echo off
echo Starting AI Hub...
start "AI Hub Backend" python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend
start "AI Hub Frontend" node frontend/server.mjs
echo.
echo AI Hub started.
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://127.0.0.1:4173
echo.
echo Close this window or press Ctrl+C to stop.
