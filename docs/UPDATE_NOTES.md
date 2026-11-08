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

# Update 6: painted portraits

- 15 painted portraits in `assets/portraits/` (768×768 WebP, about 1.5 MB), embedded by `tools/build.py` as `PORTRAITS`, keyed by file name.
- **Briefings:** the speaker's portrait at the top, full width with their title: Resistance leader or Security commander. A mission can set `portrait` (for example `'prisoner'`) to override the speaker.
- **Debriefs:** the same speaker, smaller, beside the debrief text.
- **Faction art:** each faction button on the title screen and the campaign banner show one of that faction's six soldier paintings, picked at random each visit.
- Roster, squad picker, recruit and debrief operative cards keep the 3D renders of each operative's own model.
- `index.html` is now about 9.2 MB (5.6 MB gzipped).


# Update 7: battle rifle, light snipers

- New **Battle rifle** (DMR): single shot, 36 damage, range 9, accuracy 80, best within 6 tiles. It sits between the assault rifle (30, range 7) and the sniper rifle (46, range 10). Available to every body type.
- **Light** operatives can now take the **sniper rifle** (and the battle rifle).
- Weapons by body (`BODY_WPN`): light: machine pistol, SMG, battle rifle, sniper rifle. Medium: SMG, assault rifle, shotgun, battle rifle, sniper rifle. Heavy: assault rifle, shotgun, battle rifle, LMG, minigun.
- The battle rifle is a new procedural model on the soldiers, about 0.8 long in the hand.

# Update 8: visual and world overhaul

- **Menus:** gunmetal plates, condensed type, Resistance and Security skins; campaign with hexagon numbers, Attack/Defend tags, stage pips and padlocks; briefings with an "Incoming transmission" speaker, numbered stages and four squad cards.
- **Mission HUD:** map first, about 8 to 12% of the screen (was about 42%): objective pill, menu, minimap button, one rotate button, two-finger twist, squad rail, round action buttons, aim then Fire, a details sheet and toasts.
- **Environment:** every map sits inside the Ark with an apron on stilts, neighbouring shacks, bridges, spray, fog, prop kits per district and ground variety.
- **Mechanics:** ladders, climb steps, vault rails, gap jumps, ziplines by body type; interactive points; eight traps; civilians.
- **Maps:** Container City retrofit, and Security Tower: Breakout (Resistance attack) and Breakout: Lockdown (Security defence).
- **Campaign:** operations are the campaign now, unlocking in order; the old missions are skirmishes.
- **Fix:** the escort bot passes through its own side's turrets and MG nests (and friendly units pass through theirs, but can't stop on them). Nothing can be built on the bot's remaining route, for either side; those tiles grey out with "Can’t build on the bot’s route." Engineers get Dismantle for an adjacent friendly turret, MG nest or barricade. An enemy standing on the route still stops the bot.

# Update 9: rival squads and AI allies

- **Rivals:** each campaign now has a named enemy squad of six (for example the Blue Wolves) that persists across operations. Four deploy each time; the rest wait on the bench. They earn XP, level up with the same table as your operatives, get injured when downed and sit out the next operation while a bench member steps in. Rivals who fall behind are pulled up to within two levels of the squad.
- **Traits:** every rival has one hidden trait (Fireproof, Fortifier, Ghost, Field surgeon, Eagle eye, Steady aim, Thick skin, Quick feet, Hates heights, Vengeful). Down them, Spot near them, or pick up one of the two intel caches in each operation to reveal it.
- **Allies:** two militia from your faction fight alongside your four in operations. They act on their own after your squad each turn, lean on cover and head for the objective. Lower health and accuracy than your operatives; if they go down they are out.
- **Balance:** grunts are slightly weaker now that rivals and allies are on the field, and attack operations bring one more trooper.
- **Screens:** Rivals board on the campaign screen (portrait, class, level, trait or "Trait ?", injured greyed out), two rival lines in the briefing, name tags with a red marker in missions (press and hold for level and trait), and a Rivals section in the debrief.
- **Test:** `node tools/rivals-test.mjs` plays three operations in a row per faction and checks the roster, traits, injuries, allies, levels and old-save loading.

# Update 10: civilians in the crossfire, revivable militia

- **Civilians stream across the map.** They come in at the enemy's end and hurry towards their own faction's edge (refugees to the Resistance side, citizens to the Security side), keeping clear of fighters once the shooting starts, and leave when they reach the far end. New ones arrive while the count is under the cap (about 6 to 10 in shanty areas, 2 to 4 in Security districts, halved on Low).
- **Walk through them.** Units pass through civilians but can't stop on them. Stray shots, blasts and traps still hit them.
- **Your own people count.** Downing a civilian of your own faction (by your fire, including strays) costs 5 XP per operative and gets a line in the debrief. Enemy-faction civilians cost nothing.
- **Militia can be revived.** Downed militia allies lie where they fall; a medic's Patch up gets them back up. They still don't redeploy.

# Update 11: Terminal, and every operation open

- **Terminal: Data Run** (Security attack, operation 4 of the Security campaign) and **Terminal: Blackout** (Resistance defence, operation 4 of the Resistance campaign). A 12 x 36 transit terminal on the industrial decks in three stages: hack the mainframe in the concourse to lift the security shutters, crack the safe in the baggage hall, then carry the data key up to the monorail platform. Mezzanines and escalators, ticket barriers to vault, a crawl vent and a hackable side door past the shutters, one-tile offices with ladders and a zipline, steam, fuel and barrel traps, and three supply stations. Seven civilians stream through.
- **Every operation is open from the start** while testing (`OPEN_OPS` in engine.js). Security Tower was already there, locked behind the Container City wins; now it shows straight away.
- Map source and validator entry: `tools/maps/terminal.py`, `python3 tools/maps/validate_long.py`.

# Update 12: mobility pass

- **Container City:** two long ziplines from the sniper towers over the gate into the street, a three-tile crawl vent beside the gate, climb steps onto the crate stacks, two level-2 perches with ladders above the crane yard, and a zipline anchor an engineer can rig from the street walkway down into the yard.
- **Security Tower:** a second drain under the sea wall for lights, the prison-yard catwalk broken by two gap jumps (lights on the left, mediums at the marked right one), and a zipline anchor on the catwalk corner that drops into the getaway yard.
- **Terminal:** lookout perches above both mezzanines with the ziplines moved up to them, broken office walkways (marked gap left, lights-only gap right), a two-tile vent run past the shutters and a duct run through the platform hall.
- **Easier to spot:** ladders are thicker with a chevron at the foot, vault rails are painted hazard yellow, ziplines have a bright cable, yellow posts, a pulley and a cyan chevron at the start, plain gaps get white edge chevrons (yellow for marked ones), and crawl vents get cyan chevrons at each mouth.
- **Briefing:** a Routes line counts the ziplines, vents, perches, ladders, climb steps, rails and gap jumps on the map.
- **Fix:** gap tiles crashed the fog pass (they have no floor mesh), which froze the enemy turn on any map with a gap.
- **Tooling:** `tools/maps/sync.py` copies the map layers from the Python sources into `src/engine.js`, so edit the map in `tools/maps/`, validate, sync, build.

# Update 13: Control mode, Harbour Row

- **Harbour Row** is a 20 x 20 shanty district with a market square, a walled clinic, a pump house deck, a water tower and a canal with two bridges, plus rooftop runs, ladders, three ziplines, a crawl duct and a broken walkway. It sits in a new Control section on the campaign screen, open to both factions from the start and replayable.
- **Control rules:** one zone is live at a time (market, pump house, clinic, water tower, canal bridge, in that order). At the end of each full round the team that is alone inside the zone scores 10; both inside and nobody scores. The zone moves every 6 turns and the next one is announced two turns ahead, with its outline shown faintly. First to 100 wins; at the 24-turn cap the higher score takes it, level is a draw.
- **The enemy:** the rival squad deploys first, then waves of two every other turn from the north edge while under seven on the field. Pushers head for the zone and dig into cover inside it. Your militia stand with you and your downed operatives redeploy at the south drop point as usual.
- Code lives in `src/control.js` with hooks in `engine.js` marked "control"; the map in `tools/maps/control.py` (validated from both sides' spawns).
- **Respawns (after the first play-test):** enemy waves now arrive every turn (three when they are down to two or fewer), the field cap is eight, downed rivals rejoin with a wave three turns later, your downed operatives redeploy after two turns instead of three, and downed militia redeploy at the drop point too.

# Update 14: rival levelling, pass-through movement

- **Rivals level at your pace.** Each deployed rival now earns the squad's average XP gain for the mission plus 15 a kill (three quarters if they were downed), instead of a small fixed amount. The bench still gets half, and the catch-up rule still lifts stragglers.
- **Units pass through each other.** Any unit can move through any other unit, friend or enemy, but nobody can end a move on an occupied tile. Enemy turrets and MG nests still block. The escort bot is unchanged: an enemy standing on its route still stops it.

# Update 15: map visuals pass

- **Ladders** are steel stiles with yellow rungs, sit flush against the face they climb, and carry a hoop over the top edge so they read from any angle. The railing on a raised tile now opens where a ladder or climb step comes up instead of being drawn through it.
- **Ziplines** have a proper start post behind the rider and a landing post beyond the landing tile, a thicker steel cable running post top to post top, a pulley with a handle on the line, and a cyan chevron at the start.
- **Shadows** are twice the resolution on High, so edges stop smearing across tiles on the long maps.

# Update 16: new unit bodies (Quaternius Universal Base Characters)

- **Every unit now uses the Universal Base Characters bodies** (CC0, male and female) in place of the Toon Shooter soldiers: operatives, rivals, grunts, militia and civilians. The Toon Shooter clips are carried onto the new skeleton when the game loads (`src/retarget.js`), so Idle, Walk, Run, Shoot, Hit, Death, Jump and Take cover all play as before.
- **Toon shaded with outlines**, as agreed. Skin tones tint the body texture; tops, sleeves, gloves, trousers and boots are painted by body region in the shader so every creator clothing option still shows, and the chest rigs, plate carriers, riot and scrap armour, pauldrons, kneepads, class packs, helmets, caps, beanies, goggles, masks and visors are the existing 3D pieces fitted to the new body.
- **Builds and sexes:** the creator gains Male / Female (random for recruits, enemies, rivals, militia and civilians; older saves default to male), and Light, Medium and Heavy scale the limbs and torso.
- **Hair** comes from the pack: buzz, parted, long and buns meshes plus a beard, mapped from the creator's hair and facial hair options and tinted with the hair colour.
- **The left hand is pinned to the weapon's foregrip** every frame by a small two-bone solve, so aimed poses hold the gun on the long-armed bodies.
- **Known gaps for the next pass:** face shapes, expressions and markings (scar, tattoo, paint) do not yet show on the new faces; mohawk, spiky, slick, top knot and dreads fall back to the nearest pack hair; the female body has no chest piece under the rigs yet. Draw calls fell (about 1,390 on High in Container City, was 1,540) but triangles rose (about 410k, was 164k), so Low graphics matter more on older phones.
- `tools/pack_ubc.py` packs the GLBs from the downloaded pack; `lab/retarget-trial.html` shows the old and new bodies side by side.
- **Faces, second pass:** face shapes (long, square, angular, broad) now shape the new heads; scars, tattoos, war paint and eye patches show on them; moustaches, mohawks and spiky hair are built on top of the pack hair. Expressions still do not move the new brows, and the pack beard reads coarse at game size.
- **Gear rebuilt for the new bodies:** chest plates and carriers are now curved shells that wrap the ribcage (front and back) instead of boxes, pauldrons are rounded caps on the shoulders, kneepads are domes on the shins, scrap armour is angled curved plates with straps, and class packs are smaller rounded cases. Sized per build from the body's own chest, so heavies fill out through the body rather than the gear.
- **Arms:** the left elbow is now steered out and down (an elbow guide) when the hand is pinned to the gun, so it no longer folds into the chest. Each arm has raise, forward, twist and elbow bend offsets, and the strength of the hand pin is adjustable; all of these are in the body tuner's Arms panel.
- **Gun direction:** the gun is now aimed from the body's facing rather than the right hand's animated rotation (which pointed the barrel skyward on the new bodies): level when firing or in cover, angled down at a low ready when idle or moving. The support hand stays on the gun in both. Aim, carry and across-body angles are sliders in the tuner's Arms panel.

# Update 17: rings, disguise, civilians, hit label, crane tiles

- **No faction rings.** Units no longer have red or blue rings under them. The selected operative keeps its highlight, and only enemies your selected operative can shoot get a red ring. Civilians never have one.
- **Disguise looks the part.** An Operative using Disguise turns into an unarmed civilian of the map's own civilians (refugees in the shanty districts, citizens in Security areas), keeping their face and hair, until the disguise ends. Your name tag still shows "Disguised".
- **Civilians move together**, all at once at the end of the enemy turn, and the camera no longer follows them.
- **Hit chance** sits above the target's name and health bar instead of over it.
- **Crane cargo drop zone:** tiles in the drop zone are ordinary floor for moving. Tap the crane's hook or cargo to aim at it; a drop-zone tile only aims at the crane when you can't move there.

# Update 18: parkour for every build, better ground and cover, two new operations

- **Every build moves its own way.** Lights keep everything and now drop three levels. Mediums wall-climb two levels (3 moves), jump any one-tile gap (marked gaps are cheaper) and grab a ledge a level up on the far side, and drop-roll three levels. Heavies mantle up one level (2 moves) anywhere, shoulder-charge straight through barricades and the new sheet walls (2 moves, and the wall is gone for everyone), and drop two levels. Enemy heavies charge through too. New heavy perk: **Breacher** (charging costs 1 move). Climber now also makes the medium wall climb cheaper.
- **Sheet walls** (map letter `F`): corrugated panels in the shanty, steel hoarding in the industrial decks, frosted glass in the Founders' halls. Full cover and they block sight, but grenades flatten them and heavies walk through them. The move preview marks cover a heavy can charge through with an orange burst.
- **Ground and cover look better.** Tiles get worn variants (stains, cracks, painted lines, bolts and litter), rust and dirt drips down platform sides, soft contact shadows where floors meet walls and crates, and scattered puddles, oil and bay markings (High graphics). Cover is rebuilt per district: shipping-container crates with doors and corner castings, strapped crate stacks on pallets, planters; sandbag walls, concrete jersey barriers and lit security barriers.
- **Tidewater Run / Tidewater Hold** (both campaigns): after a storm surge, cross the shanty rooftops and cut the spotter relay, drop into the drowned market and restart the drainage pump, then carry the floodgate key from the dock warehouse to the boats. Lights and mediums can jump the one-tile flood channels; heavies use the plank bridges.
- **Service Lift / Service Lift: Lockdown** (both campaigns): escort the bot across the foundry floor, repair the cargo lift over the casting pit, then ride up into the Founders' atrium and hack the broadcast core. The map changes district partway up (`themeRows`).
- Map sources `tools/maps/tidewater.py` and `foundry.py`; the reachability checker follows the new movement rules.
- **Clearer move range.** The tiles a selected unit can reach are a little stronger, with a bright line round the edge of the area.
- **No permanent climb markings.** The chevrons on climb steps, ladders, rails, gaps, vents and ziplines are switched off (`MECH_MARKS` in `src/mechanics.js`). The ladders, rails and gaps themselves still show, and the move preview still draws jump arcs and climb markers for the selected unit.
- **Hunker down:** a new action for every operative, next to Overwatch. It ends their turn, and until your next turn enemies get an extra −20 to hit them while they're in half or full cover (no help in the open). Shown as "Hunkered" on their tag.
- **Credits** for Quaternius, Tiny Strike and the sound sources are now in Settings on the title screen.
