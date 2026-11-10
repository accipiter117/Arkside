#!/usr/bin/env python3
"""Write tools/maps/builder_maps.json, the maps under review in
lab/map-builder.html. Bump a map's version and list what changed each time
it is revised; the builder shows both."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from container2 import CONTAINER2
from breakout2 import BREAKOUT2
from terminal2 import TERMINAL2
from tidewater2 import TIDEWATER2
from foundry2 import FOUNDRY2

MAPS = [
  dict(id='x2v2', title='Breakout', version=1, theme='founders', time='dusk', data=dict(BREAKOUT2, title='Breakout', long=True, xp=180),
       changes=['New size: 24 wide by 32 deep (was 12 by 36), in the Founders\' district with its own building set: white apartments with glass bands, balconies and solar roofs, white tower blocks, the Security Tower spire, guard posts, the white sea wall you can stand on, Block C with barred windows, and a glass-roofed mess hall.',
                'Stage 1, the sea wall: land on the jetty, cross the beach past two guard posts and searchlights, then blow the wall gate. A service hatch in the west (hack it), a crawl vent in the east, two guard towers on the wall, ladders and a winch up the beach face, a vent under the wall to the yard.',
                'Stage 2, the prison yard: hack the cell door panel in front of Block C (cells with bunks and bars inside). West: the barracks with white stairs up, and the mess hall with canteen tables. East: the armoury with weapon racks, tower blocks and a guard post. Searchlights sweep the yard; a drain tunnel runs north from the yard.',
                'Stage 3, the getaway: past the Security Tower and its plaza to the boats in the north-west. Staff quarters with a winch and stairs, harbour stores, and the drawbridge in the north-east that brings in the reinforcement boat unless you raise it. Lights can take a vent straight to the harbour.']),
  dict(id='x3v2', title='Terminal', version=1, theme='industrial', time='overcast', data=dict(TERMINAL2, title='Terminal', long=True, xp=180, civ=7),
       changes=['New size: 24 wide by 32 deep (was 12 by 36), on the industrial decks with the new industrial kit: silos, a refinery with columns and a flare stack, pipe racks, steel catwalks and stairs, control rooms with window bands, and the monorail on its pylons.',
                'Stage 1, the concourse: a glass-roofed concourse with the mainframe in the middle (hack it to lift the shutters), ticket desks, vending machines and benches; tall control rooms either side with ladders; a bulkhead of pipe racks with the shutters, a crawl vent (west) and a side door (east).',
                'Stage 2, the vault: the baggage hall with carousels and luggage piles (three doors), the vault with the safe and the data key (doors south and north), a booth with a winch, silos and the refinery to the east. A vent from the concourse into the baggage hall.',
                'Stage 3, the platform: the monorail car waiting at a raised platform with ticket barriers to vault, the staff canteen, the control tower with steel stairs and a winch. Drain tunnels from the street to the baggage hall and to the platform.']),
  dict(id='x4v2', title='Tidewater Run', version=1, theme='container', time='overcast', data=dict(TIDEWATER2, title='Tidewater Run', long=True, xp=190, civ=6),
       changes=['New size: 24 wide by 32 deep (was 12 by 36), in the flooded shanty district with the Container City kit.',
                'Stage 1, the rooftops: container-home roofs one and two storeys high over flooded alleys one tile wide (lights and mediums jump them, everyone can cross the rope bridges and plank boardwalks). The spotter relay is on the tall mast roof in the middle; plank stairs lead down into the market.',
                'Stage 2, the drowned market: two flooded canals across the map with plank bridges, a channel up the west side, the market hall on the dry square, the pump house in the west (restart the drainage pump), a noodle stand, a cantina with a bar terrace and stall roofs. The floodgate panel can flood the bridges.',
                'Stage 3, the docks: the fishery shed, the floodgate store with the key, two-storey dock homes and a stack, a watchtower and the radio shack, three piers with boats, a crane over the dock road, and a hull off the shore.']),
  dict(id='x5v2', title='Service Lift', version=1, theme='industrial', time='day', data=dict(FOUNDRY2, title='Service Lift', long=True, xp=200, civ=4),
       changes=['New size: 24 wide by 32 deep (was 12 by 36). The industrial decks in the south and middle, the Founders\' atrium in the north (rows 1 to 10), on one map.',
                'Stage 1, the foundry floor: escort the bot up the conveyor road (column M). West: the refinery and the furnace works with its smokestack. East: silos and the foundry control room with steel stairs and a winch. A steel catwalk over the west road; conveyor rails to vault.',
                'Stage 2, the gantries: the casting pit across the map, crossed by a gantry walkway at level 1 with side walkways and spurs, marked gaps for mediums, a deployable bridge (G20) and a gantry charge that drops the west walkway. Repair the cargo lift controls at the north edge, between two booths with winches.',
                'Stage 3, the atrium: through the cargo lift doors in a bulkhead of pipe racks (a duct in the west for lights, a service gap in the east), into the glass-roofed Founders\' atrium with planters and benches, white balconies either side with stairs, tower blocks in the corners and the broadcast gallery with the core at the north.']),
  dict(id='x1v2', title='Container City Push', version=6, theme='container', time='day', data=dict(CONTAINER2, title='Container City Push', long=True, xp=160),
       changes=['Two new ways to move (both used by the enemy AI too):',
                'Vent crawlspaces, lights only: linked pairs of vent grates (teal in Plan). A light shrinks into one and pops out of the other for 1 move. Four pairs: outside the lab warehouse into it (G10 to E5), past the foundry wall into the works (O13 to T15), from the market lane up inside the stack onto the rooftop school (I21 to E14), and under the gate wall from the scrap yard (Q25 to Q22).',
                'Winch lifts, lights and mediums: a yellow davit with a pulley on the roof edge and a red foot loop at the bottom. Step on the loop and you are hauled straight up onto the roof for 1 move. Four lifts: the port office (T7 up to T6), the east homes (Q17 up to Q18), the gate wall (P25 up to P24) and the west homes (D15 up to D14). Heavies are too heavy for them.',
                'The move preview draws a vent link as a teal line and a winch as a yellow line straight up.'])]

if __name__ == '__main__':
    for mp in MAPS:
        d = mp['data']
        if 'm' in d: d['map'] = d.pop('m')
    out = os.path.join(HERE, 'builder_maps.json')
    json.dump(MAPS, open(out, 'w'), separators=(',', ':'))
    print('wrote', out, [f"{m['id']} v{m['version']}" for m in MAPS])
