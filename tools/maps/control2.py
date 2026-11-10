#!/usr/bin/env python3
"""Harbour Row (c1), rebuilt at 28 x 28 for the Control mode in the shanty
district. One live zone at a time; the team alone inside it at the end of a
round scores. Enemy edge is the north (z 0), the player deploys on the
south edge (z 27).

Zones: the market (the roofed market hall in the middle, 5 x 5), the pump
house (the distillery yard, north-east), the clinic (the clinic tent,
south-west), the water tower (a two-storey rooftop under the tower,
north-west) and the canal bridge (south-east, over the canal).
Heights in half-levels: 0 ground (or water), 2 level 1, 4 one storey,
8 two storeys.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapkit import Grid

g = Grid(28, 28)
W = '~'

# ---------- the canal across the south-east, with bridges ----------
for x in range(12, 28): g.put(W, (x, 19))
for x in (14, 19, 25): g.b('deck', x, 19, 1, 1, face='s', hs=[0])

# ---------- zone: the water tower (north-west) ----------
g.b('home', 4, 4, 5, 5, lv=8, face='e')                              # the rooftop under the tower
g.b('tank', 1, 1, 3, 3, face='e')                                    # the water tower
g.b('deck', 9, 6, 1, 3, face='e', hs=[8, 6, 4]); g.b('deck', 9, 9, 1, 1, face='e', hs=[2])
g.ladder((4, 8)); g.put('C', (5, 5), (7, 7))
g.b('stack', 0, 6, 3, 4, face='e', st=3)

# ---------- zone: the pump house (north-east) ----------
g.b('distillery', 20, 1, 4, 2, face='s')
g.b('pump', 25, 1, 2, 2, face='s')
g.b('yard', 19, 4, 7, 5, use='scrap')                                # the pump yard
g.put('C', (20, 5), (24, 7)); g.put('w', (22, 6), (25, 4))
g.b('home', 23, 9, 4, 3, lv=4, face='w'); g.ladder((23, 10))
g.b('stack', 26, 4, 2, 4, face='w', st=3)

# ---------- zone: the market (middle) ----------
g.b('hall', 10, 10, 7, 7, face='s', use='market')                    # the market hall
for p in ((12, 12), (14, 12), (12, 14), (14, 14), (13, 15)): g.put('w', p)
g.put('C', (11, 13), (15, 13))
g.b('cantina', 18, 12, 3, 2, lv=4, face='w'); g.b('yard', 17, 12, 1, 3, use='bar'); g.put('w', (17, 13))
g.b('yard', 9, 17, 1, 2, use='noodles'); g.put('w', (9, 17))
g.b('home', 4, 11, 4, 3, lv=4, face='e', col='#c98a2a'); g.b('home', 4, 14, 3, 2, lv=8, face='e'); g.ladder((7, 15))
g.b('shack', 12, 2, 3, 2, face='s'); g.b('shack', 15, 6, 2, 2, face='w'); g.b('radio', 10, 1, 2, 2, face='s')
g.b('shrine', 17, 9, 1, 1, face='s')

# ---------- zone: the clinic (south-west) ----------
g.b('hall', 2, 19, 6, 5, face='e', use='clinic')                     # the clinic tent
g.put('C', (3, 20), (4, 20)); g.put('w', (5, 22))
g.b('home', 0, 25, 4, 3, lv=4, face='n', col='#4f6b3a'); g.ladder((4, 26))
g.b('stack', 9, 21, 2, 3, face='w', st=3)

# ---------- zone: the canal bridge (south-east) ----------
g.b('hall', 16, 21, 5, 3, face='n', use='fishery')                   # a fish market on the bank
g.put('C', (17, 22)); g.put('w', (19, 22))
g.b('home', 22, 21, 5, 3, lv=8, face='w'); g.ladder((22, 23))
g.b('bridge', 21, 21, 1, 1, lv=8, face='s')
g.b('home', 12, 22, 3, 3, lv=4, face='n')
g.put('C', (13, 18), (22, 18), (16, 20)); g.put('w', (18, 18), (24, 20))

# ---------- cover in the lanes ----------
for p in ((2, 12), (9, 3), (17, 4), (2, 17), (11, 20), (24, 15), (20, 16), (6, 17), (13, 8), (8, 25)): g.put('C', p)
for p in ((5, 10), (21, 9), (8, 20), (18, 26), (13, 24), (26, 13)): g.put('w', p)
for x in (11, 12, 15, 16): g.put('P', (x, 27))

H_ROWS, M_ROWS, F_ROWS = g.rows()
ZIPS = [[5, 5, 10, 9], [24, 10, 18, 12], [24, 22, 19, 18]]
TUNNELS = [[1, 18, 9, 2], [26, 26, 26, 12]]
VENTS = [[3, 17, 7, 10], [21, 17, 16, 9]]
WINCHES = [[8, 9, 8, 8], [21, 24, 22, 23], [24, 12, 24, 11]]
ZONES = [dict(name='The market', x=13, z=13, r=2), dict(name='The pump house', x=22, z=6), dict(name='The clinic', x=5, z=21),
         dict(name='The water tower', x=6, z=6), dict(name='The canal bridge', x=19, z=19)]
ESPAWNS = [[12, 0], [13, 0], [14, 0], [15, 0], [8, 0], [18, 0]]
POOL = ['trooper', 'engineer', 'heavy', 'medic', 'infiltrator', 'trooper', 'marksman']
ENEMIES = [['trooper', 12, 1], ['engineer', 15, 1], ['heavy', 8, 1], ['medic', 18, 1]]
STAGES = [dict(name='Control', objectives=[dict(type='control', targets=[[z['x'], z['z']] for z in ZONES])], spawns=None, enemies=ENEMIES, reinf=[]),
          dict(name='Control (enemy side)', objectives=[dict(type='control', targets=[[z['x'], z['z']] for z in ZONES])], spawns=ESPAWNS, enemies=[], reinf=[])]
POINTS = [dict(type='supply', x=1, z=24), dict(type='supply', x=27, z=2)]
TRAPS = [dict(type='barrels', x=11, z=17), dict(type='barrels', x=7, z=3), dict(type='fuel', x=19, z=8, area=[[19, 7], [20, 7], [19, 6], [20, 8]]),
         dict(type='steam', x=27, z=10, line=[[26, 9], [25, 9], [24, 8]]), dict(type='flood', x=27, z=20, tiles=[[25, 19], [19, 19]])]
CONTROL2 = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, tunnels=TUNNELS, vents=VENTS, winches=WINCHES, bld=g.bld, channels=True,
                stages=STAGES, secondaries=[], points=POINTS, traps=TRAPS, turns=26, zones=ZONES, espawns=ESPAWNS, pool=POOL)

if __name__ == '__main__':
    g.show()
