# Arkside: Claude Code plan

## Paste this into Claude Code to start

> You're picking up **Arkside**, a fan-made isometric tactics game set in Brink's Ark. The repo is `accipiter117/Arkside`. Read `CLAUDE.md`, `README.md`, `docs/DESIGN.md` and this plan first. I work entirely from my phone, so keep me updated with short summaries and screenshots where you can, and ask me before any big design change. Start with Phase 0, then Phase 1. Commit after each step with a clear message, and tell me when something is ready to test on GitHub Pages.

---

## Status
Phase 0 and Phase 1 (1a to 1e) are done: the test tools are in `tools/`, and the animated units are live behind Settings, Units: Animated (preview), waiting for Matthew’s sign-off before they become the default. When they do, remove the procedural walk, recoil and breathing code (kept for Classic units). Next: Phase 2 (optional) or Phase 3.

## Phase 0: Orientation and safety net
1. Run `python3 tools/build.py` and confirm `index.html` builds identically to what's committed.
2. Set up a Playwright smoke test (`tools/smoke.py` or `.mjs`) that loads `index.html`, starts every mission in both campaigns, runs a few enemy turns and fails on any console error. Chromium with `--use-gl=swiftshader` works headless. Serve over a local HTTP server (some browsers block `file://` for module-style loading).
3. Add `tools/screens.py` to save screenshots of the title, a briefing and an in-mission view at phone size (390×800) so changes can be reviewed visually.

## Phase 1: Animated units (the main goal)
Replace the procedural unit bodies with the Quaternius Toon Shooter soldiers (`assets/models/`, CC0), keeping the creator customisation by attaching our own parts to the skeleton. `lab/unit-review.html` is a working prototype of loading, recolouring, outlines, class gear on the spine bone, weapon visibility and animations. Port from it.

### 1a. Loading
- Load the two GLBs with GLTFLoader r128 (jsDelivr, pinned) and clone per unit with `SkeletonUtils.clone` (r128, `examples/js/utils/SkeletonUtils.js`).
- Single-file requirement: `tools/build.py` should embed the GLBs as base64 into `index.html` at build time. Keep the source GLBs in `assets/models/`.
- Base model choice: Security uses `soldier_ct` (helmeted, shoulder pads), Resistance uses `soldier_t` (hooded). Allow overriding per operative later.
- Keep the procedural `buildOperative` as a fallback if loading fails.

### 1b. Creator-driven look (hybrid)
- **Colours:** map creator `primary`, `secondary` and `skin` to the model's materials (`Character_Main`/`Enemy_Red`, `Pants`/`Grey`, `Skin`). Split shared materials so the head can differ from the body (see the review page).
- **Head replacement:** hide the model's head mesh and attach a creator-built head to the `Head` bone: face shape, expression, hair, facial hair, markings, headgear and face gear. Port the head section of `buildOperative` in `src/engine.js`, scaled to the new rig.
- **Armour and gear** as rigid attachments: carrier, rig, riot and scrap armour on `Torso`; pauldrons on `UpperArm.L/R`; kneepads on `LowerLeg.L/R`; class packs on `Torso` (already prototyped).
- **Weapons:** the rig has `AK`, `SMG`, `Pistol` and `Sniper` on the right hand. Map creator weapons: rifle→AK, smg→SMG, mpistol→Pistol, sniper→Sniper. Build shotgun, LMG and minigun with the existing procedural `weaponModel()` and parent them to the same hand bone.
- **Body types:** scale bones rather than the whole model. Heavy: wider shoulders and chest, thicker limbs, slightly smaller head. Light: slimmer and a touch taller. Aim for Brink's exaggerated proportions.

### 1c. Animation hookup
Clips available: Idle, Walk, Run, Run_Gun, Walk_Shoot, Idle_Shoot, HitReact, Duck, Death, Jump, Jump_Idle, Jump_Land, Wave, Yes, No, Punch.
- Idle by default. Walk while moving tile to tile (Run for light bodies). Jump clips for ledge hops.
- Idle_Shoot for each shot, synced to tracers and muzzle flash. HitReact on damage. Death when downed, and reverse or Idle when revived.
- Duck while on overwatch or hunkered behind full cover.
- Use an `AnimationMixer` per unit, crossfades around 0.2s, and update mixers in the main frame loop.
- Remove the old procedural walk, recoil and breathing code once the clips replace it.

### 1d. Performance on phones
- Share geometry and materials across clones where colours match. Skip outlines on Low graphics.
- Pause mixers for units hidden by fog.
- Target 12 or more units on screen at a steady frame rate on a mid-range phone. Measure before and after.

### 1e. Review checkpoint
Update `lab/unit-review.html` to use the final pipeline with a creator-look picker, so Matthew can sign off before the game switches over.

## Phase 2: Optional Blender pipeline
If rigid attachments aren't enough (for example hoodies or coats that need to bend), install Blender headless in the cloud environment, script clothing with automatic skin weights, and export new GLBs to `assets/models/`. Document the scripts in `tools/blender/`.

## Phase 3: Polish and QA
- Full playthrough of both campaigns via automated play where possible. Report balance issues (Founders’ Rise and Ration Line are suspected to be hard).
- Credits line in the title screen Settings: Quaternius (CC0) and Tiny Strike.
- Keep the smoke test green on every commit.

## Backlog (ask before starting)
- More missions per campaign, and replayable skirmish maps.
- Path preview before moving.
- Hunker down action, flanking indicators on move tiles.
- Proper class-swap visuals and a codex built from the unit cards.
