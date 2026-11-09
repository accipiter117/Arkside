#!/usr/bin/env python3
"""Write tools/maps/builder_maps.json, the maps under review in
lab/map-builder.html. Bump a map's version and list what changed each time
it is revised; the builder shows both."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from container2 import CONTAINER2

MAPS = [
  dict(id='x1v2', title='Container City Push', version=4, theme='container', time='day', data=dict(CONTAINER2, title='Container City Push', long=True, xp=160),
       changes=['People live here now. Buildings have jobs, and the cover inside them is that job\'s props (same cover rules as before):',
                'Market hall (west): stall counters with striped canopies and fruit (half cover), produce crates (full cover), hanging lanterns and a MARKET sign.',
                'Fishery (docks, by the crane): an open shed with nets, crates of fish on ice and a drying rack hung with fish.',
                'Foundry works (the east warehouse): a tall brick smokestack, a glowing furnace door, gas bottles and workbenches inside.',
                'Clinic tent (behind the gate, east): white canvas with a red cross on the roof, cots with drip stands and medical crates.',
                'Bar terrace beside the cantina: tables with stools and bottles.',
                'Washing lines strung between the homes and stacks, and vegetable planters on some rooftops.'])]

if __name__ == '__main__':
    for mp in MAPS:
        d = mp['data']
        if 'm' in d: d['map'] = d.pop('m')
    out = os.path.join(HERE, 'builder_maps.json')
    json.dump(MAPS, open(out, 'w'), separators=(',', ':'))
    print('wrote', out, [f"{m['id']} v{m['version']}" for m in MAPS])
