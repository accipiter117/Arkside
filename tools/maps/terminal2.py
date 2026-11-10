#!/usr/bin/env python3
"""Terminal: Data Run (x3) and Terminal: Blackout (x3d), rebuilt at 24 wide
x 32 deep on the industrial decks. Attackers come in off the street in the
south (z 29-31) and push north to the monorail.

Stage 1, the concourse (z 21-31): a glass-roofed concourse with the
mainframe in the middle (hack it to lift the shutters), ticket desks,
vending machines and benches; tall control rooms either side; the bulkhead
of pipe racks with the shutters, a crawl vent and a side door.
Stage 2, the vault (z 11-20): the baggage hall with carousels and luggage,
the vault with the safe (crack it), silos and a refinery to the east.
Stage 3, the platform (z 0-10): the monorail platform with the car waiting,
the staff canteen, the control tower, pipe racks along the edges.
Heights in half-levels: 0 ground, 1 a stair, 2 the platform, 4 one storey,
6 the control rooms, 8 the control tower.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapkit import Grid

g = Grid(24, 32)

# ================= stage 3: the platform (z 0-10) =================
g.rect(2, 0, 20, 4, 2)                                               # the platform, level 1
for x in (9, 10, 11, 12): g.put('E', (x, 0))                         # monorail car doors
g.h[4][6] = 1; g.h[4][17] = 1                                       # stairs up to the platform
g.ladder((11, 3)); g.h[4][11] = 0
for x in (7, 8, 15, 16): g.f[3][x] = 'r'                            # ticket barriers to vault over
g.put('C', (4, 1), (19, 1)); g.put('w', (8, 1), (15, 1))
g.b('piperack', 0, 0, 1, 11, face='e'); g.b('piperack', 23, 0, 1, 11, face='w')
g.b('hall', 2, 6, 6, 4, face='e', use='mess')                       # the staff canteen
g.put('w', (4, 7), (5, 8)); g.put('C', (3, 8))
g.b('ctrl', 15, 6, 4, 3, lv=8, face='w')                            # the control tower
g.ladder((15, 7))
g.b('deck', 19, 6, 1, 3, face='w', hs=[6, 4, 2])                    # steel stairs down its east side
g.put('C', (10, 6), (13, 8), (21, 9)); g.put('w', (9, 9), (12, 9), (20, 5))

# ================= stage 2: the vault (z 11-20) =================
g.b('warehouse', 2, 12, 9, 7, face='e', doors=((6, 18), (10, 15), (6, 12)), use='baggage')   # the baggage hall
for p in ((4, 14), (5, 14), (7, 14), (8, 14), (4, 16), (5, 16), (7, 16), (8, 16)): g.put('w', p)
g.put('C', (3, 13), (9, 17))
g.b('warehouse', 13, 11, 6, 6, face='s', doors=((15, 16), (16, 11)), use='vault')                       # the vault
g.put('T', (15, 12))                                                 # the safe
g.put('I', (17, 13)); g.put('C', (14, 14)); g.put('w', (17, 15))
g.b('silo', 20, 11, 4, 4, face='w')                                 # silos
g.b('refinery', 19, 16, 5, 4, face='w')                             # the refinery
g.b('ctrl', 11, 11, 2, 2, lv=4, face='s')                           # a small booth by the vault
g.put('C', (12, 18), (17, 19), (1, 19)); g.put('w', (13, 17), (0, 11))

# ================= stage 1: the concourse (z 21-31) =================
for (x0, x1) in ((0, 3), (5, 9), (14, 18), (20, 23)):
    g.b('piperack', x0, 21, x1 - x0 + 1, 1, face='s')               # the bulkhead
for x in (10, 11, 12, 13): g.put('D', (x, 21))                       # the security shutters
g.put('n', (4, 21))                                                 # crawl vent (lights)
g.put('K', (19, 21))                                                # side door (hack)
g.b('ctrl', 0, 23, 2, 4, lv=6, face='e'); g.ladder((1, 26))         # control rooms either side, ladders on their yard faces
g.b('ctrl', 22, 23, 2, 4, lv=6, face='w'); g.ladder((22, 26))
g.b('atrium', 4, 22, 16, 6, face='s', use='ticket')                 # the concourse
g.put('T', (11, 24))                                                # the mainframe
for p in ((7, 24), (8, 24), (15, 24), (16, 24), (10, 26), (13, 26)): g.put('w', p)
g.put('C', (5, 23), (18, 23), (11, 25))
for p in ((6, 29), (17, 29), (2, 30), (21, 30)): g.put('w', p)       # barriers in the street
g.put('C', (9, 28), (14, 28), (1, 28), (22, 28))
g.put('P', (9, 30), (10, 30), (13, 30), (14, 30))

H_ROWS, M_ROWS, F_ROWS = g.rows()
ZIPS = [[1, 23, 4, 19], [22, 23, 19, 21], [16, 6, 12, 4]]
TUNNELS = [[2, 29, 1, 13], [21, 29, 12, 10]]
VENTS = [[4, 22, 3, 17], [18, 18, 17, 14]]
WINCHES = [[12, 13, 12, 12], [14, 7, 15, 7]]
EXTRAS = [dict(t='monorail', x0=-2, x1=25, z=-1, y=1.9, car=10.5)]
STAGES = [
  dict(name='The concourse', objectives=[dict(type='hack', label='Hack the mainframe', targets=[[11, 24]], need=3, clears=[[10, 21], [11, 21], [12, 21], [13, 21]])], spawns=None, addTurns=0,
       enemies=[['marksman', 0, 24], ['marksman', 23, 24], ['trooper', 9, 23], ['trooper', 14, 23], ['heavy', 12, 22], ['engineer', 17, 25], ['medic', 6, 22]], reinf=[[3, [['trooper', 11, 20], ['trooper', 12, 20]]]]),
  dict(front=20, name='The vault', objectives=[dict(type='plant', label='Crack the safe', targets=[[15, 12]], need=3)], spawns=[[10, 22], [11, 22], [12, 22], [13, 22]], addTurns=9,
       enemies=[['marksman', 11, 11], ['trooper', 5, 15], ['trooper', 16, 14], ['heavy', 14, 15], ['medic', 7, 13], ['engineer', 17, 18], ['infiltrator', 1, 15], ['marksman', 19, 15]], reinf=[[3, [['trooper', 9, 10], ['trooper', 14, 10]]]]),
  dict(front=10, name='The platform', objectives=[dict(type='extract')], spawns=[[14, 17], [15, 17], [16, 17], [13, 18]], addTurns=9,
       enemies=[['trooper', 8, 2], ['trooper', 15, 2], ['heavy', 11, 2], ['marksman', 16, 7], ['marksman', 5, 2], ['medic', 12, 1], ['infiltrator', 21, 7]], reinf=[[2, [['trooper', 3, 0], ['trooper', 20, 0]]], [4, [['heavy', 12, 0]]]]),
]
SECONDARIES = [dict(id='door', type='hack', stage=0, targets=[[19, 21]], need=2, label='Hack the side door'),
               dict(id='mg', type='mg', stage=2, targets=[[11, 5]], need=2, label='Build an MG nest')]
POINTS = [dict(type='supply', x=23, z=31), dict(type='supply', x=0, z=20), dict(type='supply', x=22, z=10)]
TRAPS = [dict(type='steam', x=18, z=20, line=[[17, 20], [16, 20], [15, 20]]), dict(type='barrels', x=3, z=29), dict(type='barrels', x=20, z=29),
         dict(type='fuel', x=19, z=15, area=[[18, 17], [17, 17], [18, 18], [16, 17]]), dict(type='steam', x=1, z=4, line=[[2, 5], [3, 5], [4, 5]])]
TERMINAL2 = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, tunnels=TUNNELS, vents=VENTS, winches=WINCHES, bld=g.bld, extras=EXTRAS,
                 stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, turns=11)

if __name__ == '__main__':
    g.show()
