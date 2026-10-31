# Arkside

A fan-made, turn-based isometric tactics game set on the Ark, the drowning floating city from Splash Damage's *Brink* (2011). Two campaigns (Resistance and Security), fog of war, overwatch, command posts, class swaps, levelling operatives and squads imported from the Operative Creator.

Unofficial and non-commercial. Brink and its setting belong to their owners.

## Play

- **Game:** `index.html` (GitHub Pages: https://accipiter117.github.io/Arkside/)
- **Operative Creator:** `creator.html`. Its squad export code imports straight into the game.
- **Lab:** experiments and art reviews in `lab/` (unit model review, art style tests).

## How it's built

Vanilla JS and three.js r128, no framework and no bundler. The game ships as **one self-contained `index.html`**, assembled from `src/` by a tiny script:

```
python3 tools/build.py      # src/* -> index.html and lab/unit-review.html
```

| File | What's in it |
|---|---|
| `src/index.template.html` | Page shell and DOM for every view |
| `src/style.css` | All styling (light and dark tokens, mobile-first) |
| `src/creator-core.js` | Shared character data and the 2D SVG operative renderer (same as the creator) |
| `src/model-kit.js` | Palette, seeded RNG, toon material and outline helpers |
| `src/units.js` | Unit models: procedural operatives, the shared creator head, weapons, and the rigged Toon Shooter pipeline (loading, recolouring, attachments, body types, animation) |
| `src/lab/unit-review.template.html` | The unit review lab page (built into `lab/unit-review.html`) |
| `src/engine.js` | Everything else: data, missions, save system, menus, tactics engine, AI, visuals, audio |

Never edit `index.html` or `lab/unit-review.html` directly. Edit `src/` and rebuild. The build embeds the unit models (`assets/models/`), faction themes (`assets/audio/`) and sound effects (`assets/sfx/`).

## Testing

Node and Playwright (preinstalled in the Claude Code cloud environment):

```
python3 tools/maps/validate.py              # map reachability, prints OK
node tools/smoke.mjs [--animated] [--low]   # every mission, 3 turns, fails on console errors
node tools/screens.mjs [--animated]         # phone-size screenshots into shots/
node tools/perf.mjs                         # frame rate and draw calls, classic vs animated
```

Where the three.js CDNs and Google Fonts are blocked (as in the cloud sandbox), the tools serve the same files from npm packages cached in `tools/.cache`. See `tools/browser.mjs`.

See `docs/DESIGN.md` for the game design and `docs/CLAUDE_CODE_PLAN.md` for the roadmap.

## Credits

See `assets/CREDITS.md`.
