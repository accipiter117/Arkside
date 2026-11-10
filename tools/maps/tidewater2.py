#!/usr/bin/env python3
"""Tidewater Run (x4) and Tidewater Hold (x4d), rebuilt at 24 wide x 32 deep
in the flooded shanty district. Attackers start on the south rooftops
(z 28-31) and push north to the boats.

Stage 1, the rooftops (z 22-31): container homes one and two storeys high,
split by flooded alleys one tile wide (lights and mediums jump them),
joined by rope bridges and plank boardwalks; the spotter relay on the tall
mast roof (hack it).
Stage 2, the drowned market (z 11-21): a grid of flood channels with plank
bridges, the market hall on the dry square, the pump house (restart the
drainage pump), stall roofs and a noodle stand.
Stage 3, the docks (z 0-10): the fishery shed, the warehouse with the
floodgate key, piers with the boats, a crane over the dock road.
Heights in half-levels: 0 ground (or water), 2 level 1, 4 one storey,
6 a tall roof, 8 two storeys.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapkit import Grid

g = Grid(24, 32)
W = '~'

# ================= stage 3: the docks (z 0-10) =================
g.rect(0, 0, 24, 2, 0, W)
for x0 in (2, 9, 16):                                                # three piers
    g.rect(x0, 0, 3, 2, 0, '.')
g.put('E', (3, 0), (10, 0), (17, 0))                                 # boats at the pier ends
g.put(W, (2, 0), (4, 0), (9, 0), (11, 0), (16, 0), (18, 0))
g.b('warehouse', 1, 3, 6, 5, face='s', doors=((3, 7), (6, 5)))       # the floodgate store
g.put('I', (3, 4)); g.put('C', (5, 4)); g.put('w', (2, 6))
g.b('hall', 8, 3, 6, 4, face='s', use='fishery')                     # the fishery shed
g.put('C', (10, 4), (12, 5)); g.put('w', (11, 4))
g.b('home', 15, 3, 3, 3, lv=8, face='w'); g.ladder((15, 5))          # dock homes, two storeys
g.b('stack', 18, 3, 3, 3, face='w', st=3)
g.b('tower', 22, 4, 1, 1, lv=6, face='w'); g.ladder((22, 5))
g.b('radio', 21, 7, 2, 2, face='w')
for p in ((7, 9), (14, 9), (19, 9), (2, 9)): g.put('C', p)
g.put('w', (10, 9), (13, 9), (22, 2))

# ================= stage 2: the drowned market (z 11-21) =================
g.rect(0, 16, 24, 1, 0, W); g.rect(0, 11, 24, 1, 0, W)               # two flooded canals across
for x in (4, 12, 19): g.b('deck', x, 16, 1, 1, face='s', hs=[0])     # plank bridges over the canals
for x in (6, 16): g.b('deck', x, 11, 1, 1, face='s', hs=[0])
for z in range(12, 16): g.put(W, (8, z))                             # a channel up the west
g.b('deck', 8, 14, 1, 1, face='e', hs=[0])
g.b('hall', 9, 12, 7, 4, face='s', use='market')                     # the market hall on the dry square
for p in ((11, 13), (13, 13), (12, 14)): g.put('w', p)
g.put('C', (14, 14))
g.b('pump', 1, 12, 3, 2, face='s')                                   # the pump house
g.put('T', (2, 14))                                                  # the drainage pump controls
g.b('yard', 17, 12, 1, 2, use='noodles'); g.put('w', (17, 13))
g.b('home', 19, 12, 4, 3, lv=4, face='w', col='#c98a2a'); g.ladder((19, 14))
g.b('shack', 3, 18, 3, 2, face='e'); g.b('shack', 19, 18, 3, 2, face='w')
g.b('home', 8, 18, 3, 3, lv=4, face='s')                             # stall roofs you can climb on
g.b('cantina', 14, 18, 3, 2, lv=4, face='s')
g.b('yard', 12, 18, 2, 3, use='bar'); g.put('w', (12, 19), (13, 20))
g.put('C', (1, 20), (22, 20), (6, 21), (17, 21)); g.put('w', (0, 18), (23, 17))

# ================= stage 1: the rooftops (z 22-31) =================
g.rect(0, 22, 24, 10, 0, W)                                          # flooded alleys under the rooftops
g.b('home', 10, 22, 4, 3, lv=8, face='s')                            # the mast roof
g.put('T', (12, 22))                                                 # the spotter relay
g.b('home', 1, 22, 4, 3, lv=4, face='e'); g.b('home', 5, 23, 4, 2, lv=6, face='e', col='#2f6e8a')
g.b('home', 15, 22, 4, 3, lv=6, face='w'); g.b('home', 20, 22, 3, 3, lv=4, face='w')
g.b('home', 1, 26, 3, 3, lv=4, face='e'); g.b('home', 5, 26, 4, 2, lv=4, face='s', col='#4f6b3a')
g.b('home', 10, 26, 4, 2, lv=6, face='s'); g.b('home', 15, 26, 4, 3, lv=4, face='w', col='#8a2f2a')
g.b('home', 20, 26, 3, 3, lv=6, face='w')
g.b('stack', 0, 30, 2, 2, face='e', st=3); g.b('stack', 22, 30, 2, 2, face='w', st=3)
g.b('home', 3, 29, 6, 3, lv=4, face='n'); g.b('home', 10, 29, 4, 3, lv=4, face='n'); g.b('home', 15, 29, 6, 3, lv=4, face='n')
g.b('deck', 9, 27, 1, 1, face='s', hs=[4]); g.b('deck', 14, 27, 1, 1, face='s', hs=[4])     # boardwalks over the alleys
g.b('bridge', 4, 25, 1, 1, lv=4, face='s'); g.b('bridge', 19, 25, 1, 1, lv=4, face='s')
g.b('deck', 12, 25, 1, 1, face='s', hs=[6])
g.b('deck', 11, 19, 1, 3, face='e', hs=[2, 4, 6])                    # plank stairs down from the mast roof into the market
g.b('deck', 0, 25, 1, 1, face='s', hs=[2]); g.b('deck', 23, 25, 1, 1, face='s', hs=[2])
g.ladder((11, 24)); g.ladder((14, 23))
g.put('C', (2, 27), (16, 27), (7, 30), (18, 30)); g.put('w', (6, 26), (12, 30), (21, 27), (2, 23))
g.put('P', (5, 30), (12, 31), (11, 31), (17, 30))

H_ROWS, M_ROWS, F_ROWS = g.rows()
ZIPS = [[12, 23, 9, 19], [21, 23, 20, 13], [16, 4, 13, 9]]
TUNNELS = [[3, 21, 4, 9], [20, 21, 20, 9]]
VENTS = [[7, 9, 4, 6], [15, 21, 14, 15]]
WINCHES = [[18, 6, 17, 5], [18, 15, 19, 14], [9, 21, 9, 20]]
EXTRAS = [dict(t='hull', x=12, z=-5, rot=1.2, len=11), dict(t='boat', x=6, z=-2, rot=.6), dict(t='boat', x=20, z=-2, rot=2.4)]
STAGES = [
  dict(name='The rooftops', objectives=[dict(type='hack', label='Cut the spotter relay', targets=[[12, 22]], need=3)], spawns=None, addTurns=0,
       enemies=[['marksman', 11, 23], ['marksman', 16, 22], ['trooper', 6, 23], ['trooper', 20, 23], ['heavy', 13, 24], ['infiltrator', 2, 22], ['medic', 17, 23]], reinf=[[3, [['trooper', 12, 20], ['trooper', 5, 20]]]]),
  dict(front=21, name='The drowned market', objectives=[dict(type='repair', label='Restart the drainage pump', targets=[[2, 14]], need=4)], spawns=[[10, 23], [11, 23], [13, 23], [12, 24]], addTurns=9,
       enemies=[['marksman', 20, 13], ['marksman', 9, 19], ['trooper', 4, 14], ['trooper', 10, 13], ['heavy', 3, 15], ['engineer', 6, 13], ['infiltrator', 15, 14], ['medic', 1, 15]], reinf=[[3, [['trooper', 2, 10], ['trooper', 20, 10]]]]),
  dict(front=10, name='The docks', objectives=[dict(type='extract')], spawns=[[2, 15], [3, 15], [5, 15], [6, 14]], addTurns=9,
       enemies=[['trooper', 4, 9], ['trooper', 12, 8], ['heavy', 9, 5], ['marksman', 16, 4], ['marksman', 22, 4], ['medic', 10, 1], ['infiltrator', 18, 8]], reinf=[[2, [['trooper', 3, 1], ['trooper', 17, 1]]], [4, [['heavy', 10, 1]]]]),
]
SECONDARIES = [dict(id='mg', type='mg', stage=1, targets=[[12, 17]], need=2, label='Build an MG nest')]
POINTS = [dict(type='supply', x=12, z=21), dict(type='supply', x=0, z=10), dict(type='supply', x=23, z=10)]
TRAPS = [dict(type='flood', x=23, z=15, tiles=[[19, 16], [12, 16], [4, 16]]), dict(type='crane', x=23, z=9, area=[[11, 8], [12, 8], [11, 9], [12, 9]], crate=[11, 8]),
         dict(type='barrels', x=7, z=15), dict(type='fuel', x=16, z=20, area=[[17, 20], [18, 20], [17, 21], [18, 21]])]
MAT = []
for z in range(32):
    MAT.append(''.join('p' if (z >= 22 or z <= 1) else ('d' if (x + z) % 3 else 'c') for x in range(24)))
TIDEWATER2 = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, tunnels=TUNNELS, vents=VENTS, winches=WINCHES, bld=g.bld, extras=EXTRAS, mat=MAT, channels=True,
                  stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, turns=11)

if __name__ == '__main__':
    g.show()
