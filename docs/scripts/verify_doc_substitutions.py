#!/usr/bin/env python3
"""Fail if built Sphinx HTML still contains unexpanded MyST substitution tokens.

Reads ``myst_substitutions`` and ``release`` from ``docs/conf.py`` so new tokens
are checked automatically — no hard-coded list to maintain in CI.
"""
from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DOCS = REPO / "docs"


def _html_build_dir() -> Path:
    if custom := os.environ.get("DOCS_HTML_DIR"):
        return Path(custom)
    if rtd := os.environ.get("READTHEDOCS_OUTPUT"):
        return Path(rtd) / "html"
    return DOCS / "_build" / "html"


def _load_conf() -> object:
    spec = importlib.util.spec_from_file_location(
        "lessonkit_docs_conf", DOCS / "conf.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load docs/conf.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    build = _html_build_dir()
    if not build.is_dir():
        print(f"Missing docs build output: {build}", file=sys.stderr)
        print("Run: sphinx-build -W -b html docs docs/_build/html", file=sys.stderr)
        return 1

    conf = _load_conf()
    substitutions: dict[str, str] = conf.myst_substitutions  # type: ignore[attr-defined]
    release: str = conf.release  # type: ignore[attr-defined]

    failed = False
    html_files = sorted(build.rglob("*.html"))

    for key in substitutions:
        token = f"{{{{ {key} }}}}"
        for path in html_files:
            text = path.read_text(encoding="utf-8", errors="replace")
            if token not in text:
                continue
            rel = path.relative_to(REPO)
            print(f"UNEXPANDED substitution token {token!r} in {rel}")
            failed = True

    index = build / "index.html"
    if index.is_file():
        hero_needle = f"v{release}"
        index_text = index.read_text(encoding="utf-8", errors="replace")
        if hero_needle not in index_text:
            print(
                f"MISSING docs home hero release badge: expected {hero_needle!r} "
                f"in {index.relative_to(REPO)}"
            )
            failed = True
        if "v{{ release }}" in index_text or "v{{release}}" in index_text:
            print("BROKEN docs home hero badge: literal v{{ release }} in index.html")
            failed = True

    if failed:
        print(
            "\nMyST substitutions do not run inside {raw} html or inline code. "
            "docs/conf.py source-read should expand myst_substitutions before parse.",
            file=sys.stderr,
        )
        return 1

    print(
        f"Doc substitution verification passed ({len(substitutions)} tokens, "
        f"release {release})."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
