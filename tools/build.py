#!/usr/bin/env python3
"""Build the single-file pages from src/.

Usage:  python3 tools/build.py

  src/index.template.html            -> index.html
  src/lab/unit-review.template.html  -> lab/unit-review.html

Each output is self-contained apart from the pinned three.js scripts and
Google Fonts, so it runs straight from GitHub Pages. The unit models in
assets/models/*.glb are embedded as base64 (ARK_GLB) so no extra requests
or file:// loading issues.
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

JS_PARTS = {
    "//__CREATOR_CORE__": "creator-core.js",
    "//__MODEL_KIT__": "model-kit.js",
    "//__UNITS__": "units.js",
    "//__ENGINE__": "engine.js",
}
GLBS = {"sec": "soldier_ct.glb", "res": "soldier_t.glb"}

PAGES = [
    (SRC / "index.template.html", ROOT / "index.html"),
    (SRC / "lab" / "unit-review.template.html", ROOT / "lab" / "unit-review.html"),
]


def glb_script():
    parts = []
    for key, name in GLBS.items():
        data = base64.b64encode((ROOT / "assets" / "models" / name).read_bytes()).decode("ascii")
        parts.append(f'{key}:"{data}"')
    return "const ARK_GLB={" + ",".join(parts) + "};"


def build(template, out, glb):
    html = template.read_text(encoding="utf-8")
    if "/*__CSS__*/" in html:
        html = html.replace("/*__CSS__*/", (SRC / "style.css").read_text(encoding="utf-8"))
    if "/*__GLB__*/" in html:
        html = html.replace("/*__GLB__*/", glb)
    for marker, name in JS_PARTS.items():
        if marker in html:
            html = html.replace(marker, (SRC / name).read_text(encoding="utf-8"))
    for marker in [*JS_PARTS, "/*__CSS__*/", "/*__GLB__*/"]:
        if marker in html:
            raise SystemExit(f"marker {marker} not replaced in {template}")
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


def main():
    glb = glb_script()
    for template, out in PAGES:
        if template.exists():
            build(template, out, glb)


if __name__ == "__main__":
    main()
