# Working on Arkside

Read `README.md`, `docs/DESIGN.md` and `docs/CLAUDE_CODE_PLAN.md` before changing anything.

## Ground rules
- The shipped game is one self-contained `index.html`. Edit files in `src/`, then run `python3 tools/build.py`. Never hand-edit `index.html`.
- No frameworks, no bundler, no npm dependencies at runtime. three.js stays pinned at r128 (cdnjs). Any extra three.js example scripts must be r128 builds from jsDelivr (`three@0.128.0/examples/js/...`), loaded as plain `<script>` tags.
- Matthew plays and tests on a phone. Every change must work with touch, small screens and safe areas. Keep the Low graphics setting working.
- Keep saves backwards compatible. Save key is `arkside.campaign.v1`; add fields with defaults in `fillSave()` rather than changing the shape.
- UI text: British spelling, plain natural language, no em dashes, typographic apostrophes (’).
- After changes, test in a headless browser (Playwright with SwiftShader works) and check the console for errors before committing.
- Small, focused commits with clear messages.
