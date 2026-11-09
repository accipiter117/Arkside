#!/usr/bin/env python3
"""Write tools/maps/builder_maps.json, the maps under review in
lab/map-builder.html. Bump a map's version and list what changed each time
it is revised; the builder shows both."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from container2 import CONTAINER2

MAPS = [
  dict(id='x1v2', title='Container City Push', version=5, theme='container', time='day', data=dict(CONTAINER2, title='Container City Push', long=True, xp=160),
       changes=['Six more jobs round the town:',
                'Water distillery (scrapyard, west): a tin shed with two copper stills and coils on the roof, blue water tanks, steam and a WATER sign. Solid building.',
                'Radio shack (docks, by the lab warehouse): a hut with a tall lattice mast and a blinking red light, a stack of dishes and a RADIO sign.',
                'A rooftop school on the west two-storey homes: desks and benches (half cover) and a chalkboard on an easel (full cover).',
                'A shrine at the market corner: a stone base, candles, a red tin canopy and prayer flags.',
                'Chicken coops on the east rooftops (and on some homes), and a rooftop vegetable garden with planter beds (half cover) next to them.',
                'A noodle stand by the cantina: a counter with a steaming pot, red lanterns, stools and a NOODLES sign.',
                'The scrapyard is now a scrap-sorting yard: scrap piles and car shells (full cover), tyre stacks (half cover) and a magnet crane holding a car over the yard.'])]

if __name__ == '__main__':
    for mp in MAPS:
        d = mp['data']
        if 'm' in d: d['map'] = d.pop('m')
    out = os.path.join(HERE, 'builder_maps.json')
    json.dump(MAPS, open(out, 'w'), separators=(',', ':'))
    print('wrote', out, [f"{m['id']} v{m['version']}" for m in MAPS])
