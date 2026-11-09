#!/usr/bin/env python3
"""Write tools/maps/builder_maps.json, the maps under review in
lab/map-builder.html. Bump a map's version and list what changed each time
it is revised; the builder shows both."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from container2 import CONTAINER2

MAPS = [
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
