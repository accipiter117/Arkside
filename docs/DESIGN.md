# Arkside: design reference

What the game is today, so nothing gets lost in a rebuild. Code references are to `src/engine.js` unless noted.

## Setting and tone
The Ark: a floating eco-city off the coast, now overcrowded and drowning. Two factions:
- **Resistance** (orange accent `#c9581c`): refugees in Container City fighting for water and a way off the Ark.
- **Security** (blue accent `#2a7fbd`): the Founders' force keeping the Ark running, whatever it costs.

Visual direction, taken from Brink's art direction: contrast between rusty container shanties and bright blue sky, gleaming white curved Founders' architecture, scavenged turbines, graffiti, algae reactors and hydroponics. Bold forms over noisy detail.

## Structure
Title (pick faction, settings, creator import, save code) → Campaign (4 missions per faction, stars) → Briefing and squad pick (up to 4) → Mission → Debrief (XP, level ups, recruit, stars).

## Missions (`MISSIONS`)
| ID | Mission | District, time | Objectives |
|---|---|---|---|
| r1 | Dry Docks | Container City, morning | Capture both command posts, then clear the area |
| r2 | The Reservoir | Industrial, midday | Hack the terminal (2 progress) |
| r3 | Container City | Container City, overcast | Grab the cartridge and extract |
| r4 | Founders’ Rise | Founders’ district, golden hour | Destroy two relays, then hold the square for 3 turns |
| s1 | Ration Line | Container City, overcast | Hold the depot for 5 turns (starts alerted) |
| s2 | Pumping Station | Industrial, midday | Repair the pump (4 progress) |
| s3 | Smuggler’s Run | Container City, night | Down the cell leader before he reaches the boats |
| s4 | Lockdown | Founders’ district, dusk | Hack two floodgates, then clear the area |

Maps are 12×12 and come in two layers per mission:
- `h`: heights in half-levels. `0` ground, `2` level 1, `4` level 2; odd digits are stairs (heavies need these).
- `map`: contents. `.` floor, `~` water, `C` crate, `w` barricade, `X` pillar, `T` objective object, `H`/`S` health or supply command post, `P` spawn, `Q` spawn inside hold zone, `Z` hold zone, `E` exit, `I` item, `n` crawl vent (light only), `g` narrow gap (light and medium only).
Map sources and a reachability validator live in `tools/maps/` (`python3 tools/maps/validate.py`). Reinforcements arrive on set turns. Each mission has a par turn count (`PAR`) for stars.

## Rules
- Each operative gets one move and one action per turn. Undo is allowed for the last move unless it triggered overwatch, alerted the enemy, revealed new contacts or picked up the item.
- **Body types** (`EB`), inspired by Brink's SMART movement:
  - Light: 80 HP, move 7, vision 7. Climbs one level for 1 move, wall-hops two levels for 2, drops two levels, fits through vents and gaps.
  - Medium: 110 HP, move 5, vision 6. Climbs one level for 2 moves, drops two levels, fits through gaps.
  - Heavy: 150 HP, move 4, vision 5. Stairs only, drops one level, no vents or gaps.
- **Difficulty** (`DIFF`): Easy, Normal, Hard scale enemy accuracy, damage and health, the size of reinforcement waves, and (on Easy) squad health.
- **Hit chance:** weapon accuracy, minus range falloff past optimal range, minus 20 (half cover) or 40 (full cover), plus 15 for height (minus 10 if lower), plus 20 against unaware enemies, plus 10 against spotted enemies. Flanked targets take 20% more damage.
- **Fog of war:** you see what your squad sees. Missions mostly start undetected. Last known enemy positions show as markers.
- **Overwatch:** costs the turn, reaction shot at minus 10 against the first enemy that moves in range and sight. AI uses it too.
- **Command posts:** health posts heal 10 a turn, supply posts speed cooldowns. Standing on an owned post lets an operative swap class.
- **Classes and abilities** (`CLASS_AB`, unlocked at levels 1, 2 and 4):
  - Soldier: Grenade, Resupply, Suppress
  - Medic: Patch up (heal or revive), Adrenaline, Field surgery
  - Engineer: Barricade, Turret, Armour up
  - Operative: Spot, Disguise, EMP (and hacks objectives twice as fast)
  - Objective speed: operatives hack, soldiers plant, engineers repair at double rate.
- **Enemies** (`ETYPES`): trooper, heavy, marksman, medic (heals allies), engineer (drops a turret), infiltrator (flanks), turret, cell leader (runs for the exit).

## Progression
XP from missions, kills and objective actions. Levels at 100, 250, 450 and 700 XP (max 5): +8 HP and +3 accuracy per level, +1 move at level 3. Operatives downed on a won mission sit out the next one. Each level after the first earns a **perk**, picked in the Roster from three offered (`PERKS`: general, body, class and a sniper-only Marksman perk). Each first-time campaign win recruits a new operative. Stars: complete, nobody downed, within par.

## Creator link
`creator.html` exports a JSON array of operative looks (see `DEFAULT` in `src/creator-core.js`). The game's title screen imports it into the matching faction roster. The 2D portraits in menus use the same renderer (`render()` in `src/creator-core.js`).

## Presentation
- Isometric three.js view with pan, pinch zoom and 90° rotation. Toon-shaded units with inverted-hull outlines.
- Three district themes (container, founders, industrial) with procedural canvas textures, props, skyline, boats, turbines, birds and banners. Six times of day with lamps at dusk and night.
- Effects: tracers, muzzle lights, sparks, debris, smoke, camera shake, hit flashes, overwatch range rings.
- Audio is synthesised with WebAudio. Settings: graphics high or low, sound, game speed.

## Current units
All operatives and enemies are the animated Quaternius Toon Shooter soldiers (`src/units.js`): Security `soldier_ct`, Resistance `soldier_t`, recoloured from the creator look, with the creator head, armour, class gear and weapon attached to bones, and body types done by bone scaling. Clips: Idle, Duck on overwatch and in crawl vents, Walk or Run (lights) while moving, Jump on climbs and drops, Idle_Shoot per shot, HitReact, Death when downed. If the models can't load, units fall back to a plain capsule soldier (`capsuleSoldier`). The old procedural "Classic" bodies are gone; `settings.units` stays in saves for compatibility but isn't used.

Clothing shapes come from the base models, so tops (tee, tank, hoodie, jacket) don't change the silhouette yet; gloves recolour the hands.

## Operations
Long multi-stage missions (`OPERATIONS`), see `docs/OPERATIONS_PLAN.md`. Attack versions move your drop point forward as stages fall; defence versions (`defend:true`, e.g. `x1d`) flip the roles, with the attacker AI assigning pushers, escorts and flankers each turn. Downed operatives can redeploy at the drop point (by choice, or automatically after 3 turns) or wait for a medic.
