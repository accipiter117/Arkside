#!/usr/bin/env python3
"""Service Lift (x5) and Service Lift: Lockdown (x5d), rebuilt at 24 wide x
32 deep. The bottom of the map is the industrial decks and the top (z 0-9)
the Founders' atrium (THEME_ROWS). Attackers start at the south (z 30-31).

Stage 1, the foundry floor (z 22-31): escort the bot up the conveyor road
(column M); a refinery and the furnace works to the west, silos and a
control room to the east, pipe racks and steel catwalks.
Stage 2, the gantries (z 11-21): the casting pit (gaps), crossed by a
gantry walkway at level 1 with side walkways; build the bridge or jump the
gaps; repair the cargo lift controls at the north edge.
Stage 3, the atrium (z 0-9): through the lift doors into the Founders'
atrium: a glass-roofed hall with planters and benches, balconies either
side, the broadcast gallery at the north with the core (hack it).
Heights in half-levels: 0 ground, 1 a stair, 2 level 1, 4 one storey,
6 the control room, 8 two storeys.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapkit import Grid

g = Grid(24, 32)

# ================= stage 3: the atrium (z 0-9), Founders' look =================
g.rect(7, 0, 10, 2, 2)                                               # the broadcast gallery, level 1
g.put('T', (12, 0))                                                  # the broadcast core
g.h[2][8] = 1; g.h[2][15] = 1                                       # grand stairs up to the gallery
g.put('w', (9, 1), (14, 1)); g.put('C', (7, 0), (16, 0))
g.b('block', 0, 0, 3, 2, face='s', st=5); g.b('block', 21, 0, 3, 2, face='s', st=5)
g.b('apt', 0, 3, 4, 5, lv=4, face='e'); g.ladder((3, 7))             # balconies either side
g.b('apt', 20, 3, 4, 5, lv=4, face='w'); g.ladder((20, 7))
g.b('deck', 4, 3, 1, 2, face='e', hs=[4, 2]); g.b('deck', 19, 3, 1, 2, face='w', hs=[4, 2])
g.b('atrium', 6, 3, 12, 6, face='s', use='plaza')                    # the atrium hall
for p in ((8, 5), (15, 5), (11, 7), (12, 7)): g.put('w', p)
g.put('C', (10, 4), (13, 4))
g.put('M', (12, 3))

# the bulkhead between the decks and the Ark, with the cargo lift doors
for (x0, x1) in ((0, 1), (3, 10), (13, 20), (22, 23)):
    g.b('piperack', x0, 9, x1 - x0 + 1, 1, face='s')
g.put('D', (11, 9), (12, 9))                                         # the cargo lift doors
g.put('n', (2, 9))                                                   # a duct for lights
g.put('g', (21, 9))                                                  # a service gap for lights and mediums

# ================= stage 2: the gantries (z 10-21) =================
g.put('T', (13, 11))                                                 # the cargo lift controls
g.b('ctrl', 15, 10, 3, 2, lv=4, face='s'); g.ladder((15, 11))
g.b('ctrl', 6, 10, 3, 2, lv=4, face='s')
g.put('C', (9, 11), (19, 11)); g.put('w', (4, 12), (20, 12))
for z in range(14, 19):                                             # the casting pit
    for x in range(24): g.f[z][x] = '_'
for z in range(14, 19):
    for x in (0, 23): g.f[z][x] = '.'; g.h[z][x] = 2                # side walkways, level 1
for x in range(24): g.f[16][x] = '.'; g.h[16][x] = 2                # the cross gantry, level 1
for z in (14, 15): g.f[z][6] = '.'; g.h[z][6] = 2                   # spurs
for z in (17, 18): g.f[z][17] = '.'; g.h[z][17] = 2
g.f[15][3] = '='; g.f[17][20] = '='; g.f[15][9] = '='               # marked gaps (mediums)
for z in (17, 18): g.h[z][12] = 2                                   # where the deployable bridge goes
g.put('C', (2, 13), (21, 13), (8, 20), (15, 20)); g.put('w', (11, 20), (5, 19), (18, 19))
g.b('silo', 20, 19, 4, 2, face='w', st=3)
g.b('piperack', 0, 20, 4, 1, face='s')

# ================= stage 1: the foundry floor (z 22-31) =================
g.b('refinery', 1, 22, 5, 4, face='e')                               # the refinery
g.b('warehouse', 1, 27, 6, 5, face='e', doors=((6, 29), (3, 27)), use='works')   # the furnace works
g.put('C', (3, 29), (4, 30)); g.put('w', (2, 30))
g.b('silo', 19, 22, 4, 4, face='w', st=3.6)                          # silos
g.b('ctrl', 18, 27, 4, 3, lv=6, face='w'); g.ladder((18, 29))       # the foundry control room
g.b('deck', 17, 27, 1, 2, face='w', hs=[4, 2])
g.b('piperack', 22, 27, 2, 5, face='w')
g.b('deck', 7, 23, 1, 3, face='e', hs=[2, 4, 4]); g.b('deck', 8, 25, 2, 1, face='e', hs=[4, 4])   # a steel catwalk over the west road
for z in (24, 27): g.f[z][10] = 'r'; g.f[z][14] = 'r'                # conveyor rails to vault
for p in ((10, 26), (14, 26), (16, 23), (9, 29), (15, 29)): g.put('C', p)
for p in ((11, 23), (13, 28), (16, 30)): g.put('w', p)
g.put('P', (10, 31), (11, 31), (13, 31), (14, 31))

H_ROWS, M_ROWS, F_ROWS = g.rows()
ZIPS = [[19, 28, 15, 23], [2, 3, 7, 6], [16, 10, 13, 13]]
TUNNELS = [[16, 31, 22, 21], [7, 21, 4, 11]]
VENTS = [[8, 21, 3, 10], [20, 21, 19, 12]]
WINCHES = [[16, 12, 16, 11], [8, 12, 8, 11], [17, 30, 18, 29]]
PATH = [[12, z] for z in range(30, 21, -1)]
STAGES = [
  dict(name='The foundry floor', objectives=[dict(type='escort', path=PATH, hp=340)], spawns=None, addTurns=0,
       enemies=[['marksman', 19, 27], ['marksman', 8, 24], ['trooper', 11, 24], ['trooper', 15, 25], ['heavy', 12, 22], ['engineer', 17, 22], ['medic', 9, 22]], reinf=[[3, [['trooper', 10, 21], ['trooper', 14, 21]]], [5, [['infiltrator', 22, 21]]]]),
  dict(front=21, name='The gantries', objectives=[dict(type='repair', label='Repair the cargo lift', targets=[[13, 11]], need=4, clears=[[11, 9], [12, 9]])], spawns=[[11, 22], [12, 22], [13, 22], [14, 22]], addTurns=9,
       enemies=[['marksman', 0, 15], ['marksman', 23, 17], ['trooper', 6, 15], ['trooper', 17, 18], ['heavy', 12, 12], ['medic', 10, 11], ['infiltrator', 20, 16], ['engineer', 7, 12]], reinf=[[3, [['trooper', 3, 11], ['trooper', 20, 11]]]]),
  dict(front=9, name='The atrium', objectives=[dict(type='hack', label='Hack the broadcast core', targets=[[12, 0]], need=4)], spawns=[[11, 11], [12, 11], [10, 12], [14, 12]], addTurns=9,
       enemies=[['trooper', 9, 2], ['trooper', 14, 2], ['heavy', 12, 1], ['marksman', 2, 4], ['marksman', 21, 4], ['medic', 11, 2], ['infiltrator', 16, 7]], reinf=[[2, [['trooper', 8, 0], ['trooper', 15, 0]]], [4, [['heavy', 13, 1]]]]),
]
SECONDARIES = [dict(id='mg', type='mg', stage=2, targets=[[12, 3]], need=2, label='Build an MG nest')]
POINTS = [dict(type='supply', x=23, z=31), dict(type='supply', x=0, z=21), dict(type='bridge', x=11, z=19, tiles=[[12, 18], [12, 17]]),
          dict(type='searchlight', x=23, z=2, dir=[-1, 0], len=8)]
TRAPS = [dict(type='steam', x=0, z=26, line=[[6, 26], [7, 26], [8, 26]]), dict(type='barrels', x=16, z=28),
         dict(type='gantry', x=0, z=19, tiles=[[1, 16], [2, 16], [3, 16], [4, 16], [5, 16]]), dict(type='barrels', x=22, z=13),
         dict(type='fuel', x=23, z=26, area=[[17, 24], [18, 24], [17, 25], [18, 25]])]
THEME_ROWS = [[0, 9, 'founders']]
FOUNDRY2 = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, tunnels=TUNNELS, vents=VENTS, winches=WINCHES, bld=g.bld, themeRows=THEME_ROWS,
                stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, turns=11)

if __name__ == '__main__':
    g.show()
