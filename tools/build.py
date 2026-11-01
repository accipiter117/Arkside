#!/usr/bin/env python3
"""Build the single-file pages from src/.

Usage:  python3 tools/build.py

  src/index.template.html            -> index.html
  src/lab/unit-review.template.html  -> lab/unit-review.html

Each output is self-contained apart from the pinned three.js scripts and
Google Fonts, so it runs straight from GitHub Pages. Embedded at build time:
- assets/models/*.glb, the unit models, as base64 (ARK_GLB)
- assets/audio/theme-*.m4a, the faction themes, as data URIs (MUSIC_RES, MUSIC_SEC)
- assets/sfx/*.mp3, sound effects grouped by name without the trailing
  number (rifle1, rifle2 -> "rifle"), as base64 (SFX_DATA)
- assets/portraits/*.webp and assets/title/*.webp, painted portraits and
  title art, as data URIs (PORTRAITS)
"""
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

JS_PARTS = {
    "//__CREATOR_CORE__": "creator-core.js",
    "//__MODEL_KIT__": "model-kit.js",
    "//__UNITS__": "units.js",
    "//__CREATOR_UI__": "creator-ui.js",
    "//__ENGINE__": "engine.js",
}
GLBS = {"sec": "soldier_ct.glb", "res": "soldier_t.glb"}
MUSIC = (("MUSIC_RES", "theme-resistance.m4a"), ("MUSIC_SEC", "theme-security.m4a"))

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


def audio_script():
    out = []
    for const, name in MUSIC:
        f = ROOT / "assets" / "audio" / name
        if f.exists():
            out.append(f'const {const}="data:audio/mp4;base64,{base64.b64encode(f.read_bytes()).decode()}";')
        else:
            out.append(f"const {const}=null;")
    sfx = {}
    sdir = ROOT / "assets" / "sfx"
    if sdir.exists():
        for f in sorted(sdir.glob("*.mp3")):
            name = re.sub(r"\d+$", "", f.stem)
            sfx.setdefault(name, []).append(base64.b64encode(f.read_bytes()).decode())
    out.append("const SFX_DATA=" + (json.dumps(sfx, separators=(",", ":")) if sfx else "null") + ";")
    # Painted portraits (assets/portraits/*.webp), keyed by file name without extension.
    # Title art (assets/title/*.webp) goes in the same object, keyed the same way.
    paint = {}
    for pdir in (ROOT / "assets" / "portraits", ROOT / "assets" / "title"):
        if pdir.exists():
            for f in sorted(pdir.glob("*.webp")):
                paint[f.stem] = "data:image/webp;base64," + base64.b64encode(f.read_bytes()).decode()
    out.append("const PORTRAITS=" + json.dumps(paint, separators=(",", ":")) + ";")
    return "\n".join(out)


def build(template, out, subs):
    html = template.read_text(encoding="utf-8")
    if "/*__CSS__*/" in html:
        html = html.replace("/*__CSS__*/", (SRC / "style.css").read_text(encoding="utf-8"))
    for marker, value in subs.items():
        if marker in html:
            html = html.replace(marker, value())
    for marker, name in JS_PARTS.items():
        if marker in html:
            html = html.replace(marker, (SRC / name).read_text(encoding="utf-8"))
    for marker in [*JS_PARTS, *subs, "/*__CSS__*/"]:
        if marker in html:
            raise SystemExit(f"marker {marker} not replaced in {template}")
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


def main():
    subs = {"/*__GLB__*/": glb_script, "//__MUSIC__": audio_script}
    for template, out in PAGES:
        if template.exists():
            build(template, out, subs)


if __name__ == "__main__":
    main()
