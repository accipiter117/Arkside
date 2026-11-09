#!/usr/bin/env python3
"""Write tools/maps/builder_maps.json, the maps under review in
lab/map-builder.html. Bump a map's version and list what changed each time
it is revised; the builder shows both."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from container2 import CONTAINER2

MAPS = [
  dict(id='x1v2', title='Container City Push', version=1, theme='container', time='day', data=dict(CONTAINER2, title='Container City Push', long=True, xp=160),
       changes=['New size: 24 wide by 32 deep (was 12 by 34), so the push has room for flanking routes and side areas.',
                'Stage 1, the gate: the container wall now spans the whole map. Main gate in the middle, a crawl vent in the west for lights, a hackable side door in the east, a wall-top walkway in the west for climbers and one in the east with a ladder for everyone.',
                'Stage 2, the street: the bot drives straight up the main street (column M). West side: a market square with stalls and two levels of rooftops. East side: a workshop yard behind sheet walls and a long level-1 roof. Ziplines from both roofs.',
                'Stage 3, the docks: the crane platform in the middle (repair it), the lab container in the west with the cache behind sheet walls, boats at the east piers, a container stack with a crane-cargo trap over the approach.'])]

if __name__ == '__main__':
    for mp in MAPS:
        d = mp['data']
        if 'm' in d: d['map'] = d.pop('m')
    out = os.path.join(HERE, 'builder_maps.json')
    json.dump(MAPS, open(out, 'w'), separators=(',', ':'))
    print('wrote', out, [f"{m['id']} v{m['version']}" for m in MAPS])
