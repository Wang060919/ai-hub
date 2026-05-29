"""Minimal YAML frontmatter parser for Obsidian-compatible Markdown files.

No external dependencies. Handles the subset of YAML used by Obsidian:
- `key: value` scalars
- `- item` lists (tags, aliases)
- `---` delimiters
- One level of nesting (enough for standard Obsidian frontmatter)
"""

from __future__ import annotations

from dataclasses import dataclass, field

FRONTMATTER_START = "---"
FRONTMATTER_END = "---"


@dataclass(frozen=True)
class Frontmatter:
    tags: list[str] = field(default_factory=list)
    aliases: list[str] = field(default_factory=list)
    raw: dict[str, object] = field(default_factory=dict)


def parse_frontmatter(text: str) -> tuple[Frontmatter, str]:
    """Parse YAML frontmatter from Markdown text.

    Returns (frontmatter, body_without_frontmatter).
    """
    clean_text = str(text or "")
    stripped = clean_text.lstrip("﻿").lstrip()

    if not stripped.startswith(FRONTMATTER_START + "\n"):
        return Frontmatter(), clean_text

    lines = stripped.split("\n")
    end_index = -1
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == FRONTMATTER_END:
            end_index = i
            break

    if end_index == -1:
        return Frontmatter(), clean_text

    frontmatter_lines = lines[1:end_index]
    body_lines = lines[end_index + 1 :]
    body = "\n".join(body_lines)

    raw = _parse_yaml_lines(frontmatter_lines)

    tags = _extract_list(raw, "tags")
    aliases = _extract_list(raw, "aliases")

    return Frontmatter(tags=tags, aliases=aliases, raw=raw), body


def _parse_yaml_lines(lines: list[str]) -> dict[str, object]:
    result: dict[str, object] = {}
    current_key: str | None = None
    current_list: list[str] | None = None

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        if stripped.startswith("- ") and current_key and current_list is not None:
            item = stripped[2:].strip().strip("\"'")
            if item:
                current_list.append(item)
            continue

        colon_index = stripped.find(":")
        if colon_index == -1:
            continue

        key = stripped[:colon_index].strip()
        value = stripped[colon_index + 1 :].strip()

        if current_key and current_list is not None:
            result[current_key] = current_list

        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            if inner:
                result[key] = [
                    item.strip().strip("\"'")
                    for item in inner.split(",")
                    if item.strip().strip("\"'")
                ]
            else:
                result[key] = []
            current_key = None
            current_list = None
        elif not value:
            current_key = key
            current_list = []
        else:
            result[key] = value.strip("\"'")
            current_key = None
            current_list = None

    if current_key and current_list is not None:
        result[current_key] = current_list

    return result


def _extract_list(raw: dict[str, object], key: str) -> list[str]:
    value = raw.get(key)
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return []
