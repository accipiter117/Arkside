# Arkside: design reference

What the game is today, so nothing gets lost in a rebuild. Code references are to `src/engine.js` unless noted.

## Setting and tone
The Ark: a floating eco-city off the coast, now overcrowded and drowning. Two factions:
- **Resistance** (orange accent `#c9581c`): refugees in Container City fighting for water and a way off the Ark.
- **Security** (blue accent `#2a7fbd`): the Founders' force keeping the Ark running, whatever it costs.

Visual direction, taken from Brink's art direction: contrast between rusty container shanties and bright blue sky, gleaming white curved Founders' architecture, scavenged turbines, graffiti, algae reactors and hydroponics. Bold forms over noisy detail.

## Structure
Title (pick faction, settings, share operatives, save code) → Campaign (operations in order, `CAMPAIGN`; old missions listed as skirmishes) → Briefing and squad pick (up to 4) → Mission → Debrief (XP, level ups, recruit, stars).

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
- Each operative gets one move and one action per turn. Every move can be undone, several moves back within a turn, along with anything it set off (overwatch shots, being spotted, new contacts, picking up the item): each move saves a full snapshot of the board. Shooting, abilities, objective work and ending the turn clear the undo history, and a move that completes an objective (starting the next stage) or ends the mission can't be undone.
- **Body types** (`EB`), inspired by Brink's SMART movement:
  - Light: 80 HP, move 7, vision 7. Wall-hops, vaults free, jumps gaps, drops three levels, fits through vents and gaps.
  - Medium: 110 HP, move 5, vision 6. Wall-climbs two levels, grabs ledges across gaps, drop-rolls three levels, fits through gaps.
  - Heavy: 150 HP, move 4, vision 5. Mantles one level, shoulder-charges through barricades and sheet walls, drops two levels, no vents or gaps.
  - Full table under Climbing, parkour, traps and civilians below.
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

## Creator
The Operative Creator lives in the game (`src/creator-ui.js`): Roster, then Recruit operative (up to 12 per faction) or Edit look. It shows a live 3D preview of the operative's own animated soldier (swipe to turn, Idle, a short aim when the weapon changes). Body type is fixed after recruiting. The title screen's Share operatives exports every operative as a JSON code and imports codes (including old ones from the standalone creator, which `creator.html` now retires). Menu portraits are head-and-shoulders snapshots of each operative's 3D model (`portraitHTML()` in `src/units.js`), rendered offscreen and cached in memory by look; they aren't stored in the save.

## Presentation
- Isometric three.js view with pan, pinch zoom and 90° rotation. Toon-shaded units with inverted-hull outlines.
- Three district themes (container, founders, industrial) with procedural canvas textures, props, skyline, boats, turbines, birds and banners. Six times of day with lamps at dusk and night.
- Each map sits inside the Ark (`src/world.js`): a deck apron on stilts with railings, neighbouring shacks and stacks on stilts with lit windows, rope bridges, spray at the stilts, light fog and the Ark's needle tower. Per-theme prop kits on the apron (shanty laundry, tarps, barrels, tanks, plants, dishes and scrap; Security planters, bollards, turning cameras, light pylons and holo signs; industrial pipes, valves, steam, hazard stripes and catwalks), merged into a few meshes. Ground variety per tile: deck plate, planks, concrete and grating over water (`mat` rows on a map, or a seeded pattern). Low graphics thins props and drops distant detail and dusk point lights.
- Menus use gunmetal plates with chamfered corners and condensed type, with a Resistance skin (orange, hazard stripes, tape, grain) and a Security skin (steel blue, cyan rules, corner brackets, grid).
- Mission HUD is map-first (about 8 to 12% of the screen): objective pill, menu sheet, map button (minimap), one rotate button, squad rail, round action buttons, aim with Fire and Cancel, a details sheet, and toasts.
- Effects: tracers, muzzle lights, sparks, debris, smoke, camera shake, hit flashes, overwatch range rings.
- Audio is synthesised with WebAudio. Settings: graphics high or low, sound, game speed.

## Current units
All operatives and enemies are the animated Quaternius Toon Shooter soldiers (`src/units.js`): Security `soldier_ct`, Resistance `soldier_t`, recoloured from the creator look, with the creator head, armour, class gear and weapon attached to bones, and body types done by bone scaling. Clips: Idle, Duck on overwatch and in crawl vents, Walk or Run (lights) while moving, Jump on climbs and drops, Idle_Shoot per shot, HitReact, Death when downed. If the models can't load, units fall back to a plain capsule soldier (`capsuleSoldier`). The old procedural "Classic" bodies are gone; `settings.units` stays in saves for compatibility but isn't used.

Clothing shapes come from the base models, so tops (tee, tank, hoodie, jacket) don't change the silhouette yet; gloves recolour the hands.

## Operations
Long multi-stage missions (`OPERATIONS`), see `docs/OPERATIONS_PLAN.md`. Map sources live in `tools/maps/` (x1 in `long.py`, `tower.py`, `terminal.py`, `tidewater.py`, `foundry.py`); `validate_long.py` checks reachability and `sync.py` copies the layers into `engine.js`. Attack versions move your drop point forward as stages fall; defence versions (`defend:true`, e.g. `x1d`) flip the roles. Campaign order: Resistance x1, x1d, x2, x3d, x4, x4d, x5, x5d; Security x1, x1d, x2d, x3, x4, x4d, x5, x5d (Container City, Security Tower, Terminal, Tidewater, Service Lift), with the attacker AI assigning pushers, escorts and flankers each turn. Downed operatives can redeploy at the drop point (by choice, or automatically after 3 turns) or wait for a medic.

## Climbing, parkour, traps and civilians (`src/mechanics.js`)
- Movement by body type (update 18, every build gets its own way round):
  - Light: ladders 1 a level, climbs one level for 1 move, wall-hops two levels for 2, vaults rails free, jumps any one-tile gap (and lands a level up or down), drops three levels, crawl vents and narrow gaps.
  - Medium: ladders 1 a level, climbs one level for 2 (1 on a climb step or with Climber), wall-climbs two levels for 3 (2 with Climber), vaults rails for 1 extra move, jumps any gap for 3 (marked gaps 2, +1 to grab a ledge a level up), drop-rolls three levels, narrow gaps.
  - Heavy: ladders 2 a level, mantles up one level for 2, shoulder-charges through barricades `w` and sheet walls `F` for 2 moves (1 with the Breacher perk), smashing them flat for everyone, drops two levels.
  - Ziplines for lights and mediums. Vent crawlspaces (`vents`, linked pairs): lights only, 1 move from one grate to the other. Winch lifts (`winches`, foot then roof): lights and mediums are hauled up for 1 move. Drain tunnels (`tunnels`, linked manholes): every build, 2 moves plus 1 per 8 tiles, out of sight. On maps with `channels: true`, lights and mediums can also jump one-tile water channels.
  - Map data: `feat` rows (`L` ladder, `s` step, `r` rail, `_` gap, `=` marked gap) and `zips`; map letter `F` is a sheet wall (full cover, blocks sight, grenades flatten it). The move preview draws a dotted arc for jumps, vaults and ziplines, a climb marker on climbs and an orange burst over cover a heavy can charge through. Enemy AI plans with the same rules, so enemy heavies smash through too.
- Mixed districts: `themeRows: [[z0, z1, theme]]` gives a band of rows another district's look (Service Lift climbs from the industrial decks into the Founders' atrium).
- Interactive points (`points`): supply station (once: heal 30 or refresh), searchlight (spots and calls one reinforcement; hack to switch off; in defence it lights attackers for you), ladder hatch, deployable bridge, zipline anchor.
- Traps (`traps`, one use, enemies use them too): crane cargo, explosive barrels (chain), steam pipe (blocks sight, scalds), fuel spill, gantry collapse, floodgate, shutters, drawbridge (cuts off a reinforcement boat). Shoot the shootable ones (aim at them like a target); work the others from an adjacent tile. Press and hold shows the danger area in red.
- Civilians: unarmed people in muted clothes, more in shanty areas than Security ones (`civ` on a mission overrides), halved on Low. They wander, then flee or hide once shooting starts. Stray shots, blasts and traps can down them, with no penalty. They block movement.
- Breakout's prisoner, Mara Quill, joins at the getaway with an SMG and a light body, can't redeploy, and the mission fails if she stays down for 3 turns.

## Rival squads and AI allies (`src/rivals.js`)
Each faction campaign has a named enemy squad of six rivals from the opposing faction (`SAVE.rivals[faction]`, generated when the campaign screen first opens and kept for the whole campaign; older saves generate one on load). Rivals cover all four classes with a mix of bodies, carry a hidden trait (`RIVAL_TRAITS`: Fireproof, Fortifier, Ghost, Field surgeon, Eagle eye, Steady aim, Thick skin, Quick feet, Hates heights, Vengeful) and are revealed by downing them, a Spot within three tiles, or one of the two intel pickups placed in every operation.

Operations only (`rivalsStart`): the four highest-level uninjured rivals deploy in place of fresh grunts, with the bench filling gaps; the surviving rivals move up with the enemy at each stage. Grunts are a little weaker than before (90% health, −2 accuracy) and attack operations get one extra trooper. Two militia allies from the player's faction (`alliesSpawn`) deploy at the drop point: medium soldiers with lower health and accuracy, fully automatic, acting after the player's four each turn (`alliesAct`), favouring cover and the current objective. They are not on the roster, are not saved, and are out of the fight if downed.

After each operation (`rivalsEnd`): deployed rivals earn the squad's average XP gain for the mission plus 15 per kill (three quarters if downed), so they level at the same pace as your operatives; the bench earns half the deployed average; anyone more than two levels below the squad average is lifted to two below. Levels use the operative table (`LEVELS`) and raise health, accuracy and (at level 3) movement. Downed rivals are injured and sit out the next operation. The Rivals board sits on the campaign screen, the briefing carries two rival lines, and the debrief lists downings, reveals and level ups.

## Control (`src/control.js`)
King-of-the-hill on a square district map (`c1`, Harbour Row, `tools/maps/control.py`). A mission with `control:true` lists `zones` (centre tiles, 3 x 3 live area), `zoneTurns`, `win` and `espawns`. `ctlTick` runs at the end of every full round: the team alone inside the live zone scores `CTL_ROUND` (10), the zone counter drops, the zone moves on in order, the next one is announced two turns ahead, and the win or the turn-cap result ends the mission. The enemy AI reuses the defence roles: four pushers go to stand in the zone (`ctlPushAct`), the rest fight as usual, waves of two arrive every other turn from `espawns` while under the stage size. Rivals, militia, intel and civilians work as in operations.

## Unit bodies (`src/units-base.js`, `src/retarget.js`)
Units are the Quaternius Universal Base Characters (CC0): `assets/models/base_m.glb` and `base_f.glb` with the hair pieces as `hair_*.glb`, packed by `tools/pack_ubc.py`. They ship without clips, so `prepBase()` bakes the Toon Shooter clips onto them at load with `retargetClip()` (world-space rotation deltas after a per-bone rest-frame alignment; clavicles carry the delta only). `buildBase()` clones a template per unit, applies the toon cloth shader (skin tint plus clothing colours by body region), scales bones for the build, adds hair, the shared gear builders (`rigGear`, headgear from `opHead` in gear-only mode) and a procedural weapon, and returns a holder whose `BaseAnim` extends `RigAnim` with a left-hand IK solve. `buildRigged()` hands over to it while `UNIT_STYLE` is `base`; the old soldiers remain as a fallback.
