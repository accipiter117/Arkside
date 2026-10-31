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
python3 tools/build.py      # src/* -> index.html
```

| File | What's in it |
|---|---|
| `src/index.template.html` | Page shell and DOM for every view |
| `src/style.css` | All styling (light and dark tokens, mobile-first) |
| `src/creator-core.js` | Shared character data and the 2D SVG operative renderer (same as the creator) |
| `src/model-kit.js` | Palette, seeded RNG, toon material and outline helpers |
| `src/engine.js` | Everything else: data, missions, save system, menus, tactics engine, AI, visuals, audio |

Never edit `index.html` directly. Edit `src/` and rebuild.

See `docs/DESIGN.md` for the game design and `docs/CLAUDE_CODE_PLAN.md` for the roadmap.

## Credits

See `assets/CREDITS.md`.
