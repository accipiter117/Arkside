#!/usr/bin/env python3
"""Build the single-file game: src/* -> index.html.

Usage:  python3 tools/build.py
The output index.html is fully self-contained apart from the pinned three.js
script and Google Fonts, so it runs straight from GitHub Pages.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

PARTS = [
    ("//__CREATOR_CORE__", "creator-core.js"),
    ("//__MODEL_KIT__", "model-kit.js"),
    ("//__ENGINE__", "engine.js"),
]

def main():
    html = (SRC / "index.template.html").read_text(encoding="utf-8")
    html = html.replace("/*__CSS__*/", (SRC / "style.css").read_text(encoding="utf-8"))
    for marker, name in PARTS:
        if marker not in html:
            raise SystemExit(f"marker {marker} missing from template")
        html = html.replace(marker, (SRC / name).read_text(encoding="utf-8"))
    out = ROOT / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    main()
