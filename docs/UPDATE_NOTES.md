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

# Update 3: Operations (mission overhaul, first pass)

- New **Operations** section on each campaign screen, starting with **Container City Push**: a 12×34 map in three stages (blow the gate, escort the maintenance bot, repair the crane and extract the cache), modelled on Brink's Container City.
- **Moving front line:** completing a stage moves your drop point forward, adds turns, spawns the next enemy line, and sends surviving enemies back to defend it.
- **Turn budget** instead of a timer, shown in the top bar. Running out fails the operation.
- **Escort objective:** the bot moves up to 2 tiles at the end of your turn if a squad member is beside it and no enemy is. It can be disabled and repaired (Engineers twice as fast).
- **Optional objectives** that open routes: hack the side door (Operatives fast), build the side stairs for heavies (Engineers fast), build an MG nest (Engineers fast).
- New map tiles: gate `D`, hackable door `K`, buildable scaffold/stairs `Y`, MG nest spot `M`.
- The engine now supports non-square maps (`NX` × `NZ`).
- Long maps live in `tools/maps/long.py`, checked by `tools/maps/validate_long.py`. Mission data is in `OPERATIONS` in `src/engine.js`.

# Update 4: perks, phone-friendly extras, redeploy choice

- **Perks:** each level after the first earns a perk, chosen in the Roster from three offered (14 in total: general, body-specific, class-specific, and a sniper-only Marksman perk). Effects apply in missions.
- **Objective marker:** a gold diamond over the current objective, or an arrow at the screen edge pointing to it when it's off-screen.
- **Minimap** in the top-left of every mission. Tap it to move the camera. Shows explored terrain, your squad, visible enemies, the objective and the camera view.
- **Swipe** left or right on the bottom panel to switch operative.
- **Install to home screen:** `manifest.webmanifest`, `sw.js` and `icons/` make the GitHub Pages site installable, full screen and playable offline. The service worker only registers on github.io.
- **Redeploy as a choice:** downed operatives can be told to redeploy at the drop point next turn, or wait for a medic. They still redeploy automatically after 3 turns.
- The Undo button moved to the top centre to make room for the minimap.
- New: `docs/OPERATIONS_PLAN.md`, the agreed plan for the operations rebuild.

# Update 5: defence operations and the attacker AI

- New operation **Container City Hold** (`x1d`): the defence version of Container City Push on the same map. Survive the turn budget; each line that falls adds more turns to hold and moves your drop point back.
- **Attacker AI** with roles assigned every enemy turn: **pushers** (the two best-placed attackers, preferring the class that works the objective fastest) plant, repair, push the bot, repair a disabled bot, pick up and carry the cache; **escorts** fight around the objective; **flankers** (light bodies) take vents and perches. Attackers stay off the bot's route.
- **Attacker reinforcements** top the attacking force back up at their drop point each turn (capped by difficulty), and their drop point advances when a line falls.
- **Defender actions:** Defuse (charges), Reset (hacks) and Sabotage (repairs) undo enemy progress from an adjacent tile; Engineers and Operatives undo twice as much where it fits. Shooting the bot disables it until an attacker repairs it. Kill the cache carrier and step on the dropped cache to send it back to the lab.
- Bot movement rule, both modes: it moves if its side has someone beside it and the other side doesn't outnumber them there.
- Defence stars: complete, nobody downed, and the first line never fell.
- Operations list shows A (attack) or D (defence).
