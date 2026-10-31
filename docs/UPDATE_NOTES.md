# Update: music, sound effects, camera, difficulty, multi-level maps

Built in the Claude chat and already playable there. This brings the repo up to date.

- Faction themes (`assets/audio/`) embedded at build time; Music toggle in Settings.
- Recorded sound effects (`assets/sfx/`, CC0 and CC-BY, see `assets/CREDITS.md`) with stereo panning; synth fallback kept.
- Camera follows moving and fighting units, fully centred when zoomed in.
- Difficulty setting (Easy, Normal, Hard). Normal is now the default and softer than the old balance.
- All eight maps rebuilt with up to three levels, stairs, crawl vents (light only) and narrow gaps (no heavies). Movement rules by body type are in `docs/DESIGN.md`.
- Map sources and a reachability checker in `tools/maps/`. The engine has its own copy of the maps inside `src/engine.js` (`MISSIONS`); keep the two in sync if you edit maps.

# Update 2: UI fixes and press-and-hold info

- Fixed: the Back button on the Roster and Briefing screens did nothing (duplicate element IDs). Back buttons are now scoped per view.
- Press and hold (or hover with a mouse) any ability, class, weapon, stat, action button, unit or tile for a description. Long-press on the map shows unit and tile details.
- Revived operatives can move on the turn they're revived, but not act.
- Downed operatives who aren't revived redeploy at the drop point after 3 turns, at half health, move only that turn.
- Roster: pick each operative's weapon (sniper rifle added for medium bodies) as well as class.
