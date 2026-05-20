from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any
from urllib import error, request


PROJECT_ROOT = Path(__file__).resolve().parent.parent
HOST = "127.0.0.1"
PORT = 8765
BASE_URL = f"http://{HOST}:{PORT}"
STARTUP_TIMEOUT_SECONDS = 20
NON_EXECUTABLE_SKILLS = {
    "safe_action",
    "file_analysis",
    "file_inventory",
    "readonly_file_scanner",
    "readonly_text_preview",
}


def fetch_json(path: str) -> dict[str, Any]:
    with request.urlopen(f"{BASE_URL}{path}", timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def wait_for_server() -> None:
    deadline = time.time() + STARTUP_TIMEOUT_SECONDS
    last_error: Exception | None = None

    while time.time() < deadline:
        try:
            payload = fetch_json("/health")
            if payload.get("status") == "ok":
                return
        except (error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            time.sleep(0.5)

    raise RuntimeError(f"Server did not become ready within {STARTUP_TIMEOUT_SECONDS} seconds: {last_error}")


def run_checks() -> None:
    health_payload = fetch_json("/health")
    assert health_payload["status"] == "ok", health_payload
    assert health_payload["app"] == "AI Hub", health_payload
    assert health_payload["version"] == "v0.9-api-stabilization", health_payload

    version_payload = fetch_json("/version")
    assert version_payload["app"] == "AI Hub", version_payload
    assert version_payload["version"] == "v0.9-api-stabilization", version_payload
    assert version_payload["stable_base"] == "v0.8-readonly-text-preview", version_payload

    api_payload = version_payload["api"]
    assert api_payload["chat"] == "/chat", api_payload
    assert api_payload["health"] == "/health", api_payload
    assert api_payload["version"] == "/version", api_payload
    assert api_payload["skills"] == "/skills", api_payload

    skills_payload = fetch_json("/skills")
    skills = skills_payload["skills"]
    assert any(skill["name"] == "readonly_text_preview" for skill in skills), skills_payload

    skills_by_name = {skill["name"]: skill for skill in skills}
    for skill_name in NON_EXECUTABLE_SKILLS:
        assert skill_name in skills_by_name, skills_payload
        assert skills_by_name[skill_name]["executable"] is False, skills_by_name[skill_name]

    print("Metadata API checks passed.")
    print("Verified endpoints: /health, /version, /skills")
    print("No /chat request was made, so this script does not trigger Dify usage.")


def main() -> int:
    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "backend.main:app",
            "--host",
            HOST,
            "--port",
            str(PORT),
        ],
        cwd=str(PROJECT_ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        wait_for_server()
        run_checks()
        return 0
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)


if __name__ == "__main__":
    raise SystemExit(main())
