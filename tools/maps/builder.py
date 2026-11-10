#!/usr/bin/env python3
"""Write tools/maps/builder_maps.json, the maps under review in
lab/map-builder.html. Bump a map's version and list what changed each time
it is revised; the builder shows both."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from container2 import CONTAINER2
from breakout2 import BREAKOUT2

MAPS = [
  dict(id='x2v2', title='Breakout', version=1, theme='founders', time='dusk', data=dict(BREAKOUT2, title='Breakout', long=True, xp=180),
       changes=['New size: 24 wide by 32 deep (was 12 by 36), in the Founders\' district with its own building set: white apartments with glass bands, balconies and solar roofs, white tower blocks, the Security Tower spire, guard posts, the white sea wall you can stand on, Block C with barred windows, and a glass-roofed mess hall.',
                'Stage 1, the sea wall: land on the jetty, cross the beach past two guard posts and searchlights, then blow the wall gate. A service hatch in the west (hack it), a crawl vent in the east, two guard towers on the wall, ladders and a winch up the beach face, a vent under the wall to the yard.',
                'Stage 2, the prison yard: hack the cell door panel in front of Block C (cells with bunks and bars inside). West: the barracks with white stairs up, and the mess hall with canteen tables. East: the armoury with weapon racks, tower blocks and a guard post. Searchlights sweep the yard; a drain tunnel runs north from the yard.',
                'Stage 3, the getaway: past the Security Tower and its plaza to the boats in the north-west. Staff quarters with a winch and stairs, harbour stores, and the drawbridge in the north-east that brings in the reinforcement boat unless you raise it. Lights can take a vent straight to the harbour.']),
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
