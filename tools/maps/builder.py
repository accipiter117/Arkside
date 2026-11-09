#!/usr/bin/env python3
"""Write tools/maps/builder_maps.json, the maps under review in
lab/map-builder.html. Bump a map's version and list what changed each time
it is revised; the builder shows both."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from container2 import CONTAINER2

MAPS = [
  dict(id='x1v2', title='Container City Push', version=3, theme='container', time='day', data=dict(CONTAINER2, title='Container City Push', long=True, xp=160),
       changes=['Denser and taller, after your reference art: tall container stacks three and four storeys high line the west and east edges and the docks, so the skyline climbs and the camera has something to pan up to.',
                'Uneven stacking: upper containers overhang the street, with tarps, barrels, chimneys with smoke, lit shop signs and cables with bulbs strung between the rooftops.',
                'A second street level: plank stairs on posts climb from the market lane to the west homes, from the main street to the east homes, and up the gate wall.',
                'At the docks: a rusting ship hull off the north-west shore, boats moored by the piers, a shack and tall stacks by the port office.',
                'Still here from v2: the market hall and warehouses with fading roofs, the rope bridge, three drain tunnels and the stacked-container gate wall.'])]

if __name__ == '__main__':
    for mp in MAPS:
        d = mp['data']
        if 'm' in d: d['map'] = d.pop('m')
    out = os.path.join(HERE, 'builder_maps.json')
    json.dump(MAPS, open(out, 'w'), separators=(',', ':'))
    print('wrote', out, [f"{m['id']} v{m['version']}" for m in MAPS])
