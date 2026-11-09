#!/usr/bin/env python3
"""Write tools/maps/builder_maps.json, the maps under review in
lab/map-builder.html. Bump a map's version and list what changed each time
it is revised; the builder shows both."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from container2 import CONTAINER2

MAPS = [
  dict(id='x1v2', title='Container City Push', version=2, theme='container', time='day', data=dict(CONTAINER2, title='Container City Push', long=True, xp=160),
       changes=['Real buildings instead of plain raised blocks: two-storey container homes, a cantina, a roofed market hall, a workshop warehouse and a lab warehouse (roofs fade when your squad is inside), shacks with tin roofs, pump houses, a water tower, a two-storey port office and a watchtower.',
                'The gate wall is now stacked containers you can stand on, with ladders up both faces, as well as the gate, the west crawl vent and the east side door.',
                'Underground: three drain tunnels (purple in Plan). Any build can climb into a manhole and come out at the other end, out of sight: scrapyard to the market, the workshop alley down to the docks, and up the east edge.',
                'A rope bridge joins the two east container-home rooftops two storeys up, and ziplines run from the rooftops to the street and the docks.',
                'Streets: the main street (column M) for the bot, the market lane in the west, the workshop alley in the east, and a dock road along row 10.'])]

if __name__ == '__main__':
    for mp in MAPS:
        d = mp['data']
        if 'm' in d: d['map'] = d.pop('m')
    out = os.path.join(HERE, 'builder_maps.json')
    json.dump(MAPS, open(out, 'w'), separators=(',', ':'))
    print('wrote', out, [f"{m['id']} v{m['version']}" for m in MAPS])
