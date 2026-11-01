# Arkside: operations plan (agreed direction)

Decisions so far (Matthew):
- **Replace** the eight small missions with long, multi-stage **operations**.
- **Both sides of every map**, like Brink: each map has an attack version and a defence version. Each faction's campaign plays all its maps, attacking some and defending others.
- Container City Push (`x1`) is the template: 12 wide by 30 to 40 long, 2 to 4 stages, a moving drop point, a turn budget, optional objectives that open routes, and vantage points or crawl routes that reward body types.

## The map slate (draft, for discussion)
| Map | Inspired by | Attack stages | Signature mechanic |
|---|---|---|---|
| Container City | Container City | Blow gate, escort bot, repair crane, extract | Escort bot, gate perch for lights |
| Security Tower | Security Tower (jailbreak) | Breach wall, hack cell block, escort prisoner to boats | VIP escort who climbs |
| Terminal | Terminal (three parts) | Hack mainframe, crack safe, carry data key to monorail | Carried objective through crowds of cover |
| Shipyard | Shipyard (two parts) | Repair dock crane, board ship, disable missile | Two areas joined by a single gangway, ship decks multi-level |
| Reactor | Reactor (hack box) | Carry hack box to three consoles in turn | Hack box can be dropped and stolen back |
| Refuel | Refuel | Escort fuel truck, open hangar, hold until take-off | Final hold stage |
| Aquarium | Aquarium | Reach the server room, hack, extract the data | Tall flooded interior, vent-heavy routes, stealth |
| Founders' Tower | Founders' Tower (DLC) | Floor-by-floor push up the tower | Vertical stages on stacked floors |

## Defence versions
- Same map and stages, roles swapped. You win by running the attackers' turn budget down; you lose if they complete the final stage.
- New **attacker AI**: each enemy squad gets roles each turn. **Pushers** go to the objective and work it (plant, hack, repair, push or carry). **Escorts** stay within 2 tiles of pushers in cover. **Flankers** (lights) use vents, gaps and perches. Attackers advance their drop point when a stage falls, exactly like the player does.
- Defender tools: barricades and turrets matter more; repairing a planted charge or retaking a carried item becomes a player action ("Defuse", "Recover").

## Build order (proposed)
1. Attacker AI plus Container City defence version (mirror of `x1`).
2. Security Tower, attack and defence.
3. Terminal.
4. Shipyard.
5. Reactor.
6. Refuel.
7. Aquarium.
8. Founders' Tower.
9. Rewire both campaigns to the operations, retire the old missions, rebalance XP and recruits.

Each map ships with a validator entry in `tools/maps/` proving every stage is reachable by light, medium and heavy bodies.

## Status
- [x] Attacker AI and Container City defence version (`x1d`).
- [ ] Security Tower, attack and defence.
- [ ] Terminal.
- [ ] Shipyard.
- [ ] Reactor.
- [ ] Refuel.
- [ ] Aquarium.
- [ ] Founders' Tower.
- [ ] Rewire both campaigns and retire the old missions.
