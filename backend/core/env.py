from __future__ import annotations

import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = PROJECT_ROOT / ".env"


def load_dotenv_file() -> None:
    """Read .env from the project root and inject values into os.environ.

    Only sets a key if it is not already present in the environment,
    so real environment variables always take priority.
    """
    if not ENV_FILE_PATH.exists():
        return

    for raw_line in ENV_FILE_PATH.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        clean_key = key.strip().lstrip("﻿")
        if not clean_key:
            continue

        if clean_key not in os.environ:
            os.environ[clean_key] = value.strip().strip('"').strip("'")
