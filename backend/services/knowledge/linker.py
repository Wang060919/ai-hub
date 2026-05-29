"""Parse Obsidian-style [[wikilinks]] from Markdown text.

Supports:
- [[target]]
- [[target|display text]]
- [[target#heading]]

Returns a list of target names (without heading or display parts).
"""

from __future__ import annotations

import re

WIKILINK_PATTERN = re.compile(r"\[\[([^\]|#]+?)(?:[|#][^\]]*)?\]\]")


def extract_wikilinks(text: str) -> list[str]:
    """Extract unique wikilink target names from text."""
    clean_text = str(text or "")
    matches = WIKILINK_PATTERN.findall(clean_text)
    seen: set[str] = set()
    result: list[str] = []
    for target in matches:
        name = target.strip()
        if name and name not in seen:
            seen.add(name)
            result.append(name)
    return result
