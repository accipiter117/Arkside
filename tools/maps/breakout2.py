#!/usr/bin/env python3
"""Breakout (x2) and Breakout: Lockdown (x2d), rebuilt at 24 wide x 32 deep
for the Founders' district: the island prison under the Security Tower.
Attackers land on the jetty in the south (z 29-31) and push north.

Stage 1, the sea wall (z 22-31): the beach below a white sea wall you can
stand on, with guard towers, the gate in the middle, a service hatch in the
west (hack it), a crawl vent in the east, ladders and a winch up the wall.
Stage 2, the prison yard (z 11-21): Block C in the middle (hack the cell
door panel), the barracks and the mess hall in the west, the armoury and
tower blocks in the east, searchlights sweeping the yard.
Stage 3, the getaway (z 0-10): past the Security Tower spire and the plaza
to the boats in the north-west; a drawbridge in the north-east brings in
Security's reinforcement boat unless someone raises it.
Heights in half-levels: 0 ground, 2 level 1, 4 one storey, 6 the wall top,
8 two storeys.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapkit import Grid

g = Grid(24, 32)

# ================= stage 3: the getaway (z 0-10) =================
g.rect(0, 0, 24, 1, 0, '~')
g.put('E', (2, 0), (3, 0), (4, 0))                                  # the boats
g.put('.', (13, 0), (14, 0))                                        # drawbridge to the reinforcement boat
g.b('block', 0, 2, 2, 6, face='e', st=3)                            # harbour stores
g.b('apt', 6, 3, 5, 3, lv=4, face='s')                              # staff quarters, one storey
g.b('apt', 11, 3, 3, 3, lv=8, face='s')                             # and a two-storey block
g.ladder((11, 6))
g.b('deck', 14, 4, 1, 2, face='w', hs=[6, 4])                       # white stairs down off the tall block
g.b('spire', 18, 2, 4, 4, face='s', st=9)                           # the Security Tower
g.b('kiosk', 16, 1, 1, 1, face='w')                                 # drawbridge guard post
g.b('yard', 14, 7, 5, 3, use='plaza')                               # the tower plaza
g.put('C', (15, 8), (17, 8)); g.put('w', (16, 9))
g.put('C', (3, 2), (8, 1), (22, 7)); g.put('w', (5, 7), (9, 8), (20, 8), (1, 9))

# ================= stage 2: the prison yard (z 11-21) =================
g.b('cellblock', 8, 11, 8, 4, face='s', doors=((11, 14), (13, 11)), use='cells')   # Block C
g.put('C', (9, 12), (10, 12), (14, 12)); g.put('w', (10, 13), (13, 13))
g.put('T', (11, 15))                                                # the cell door panel
g.b('apt', 0, 11, 5, 4, lv=8, face='e')                             # barracks, two storeys
g.b('deck', 5, 12, 1, 3, face='e', hs=[8, 6, 4])                    # white stairs up to them
g.b('atrium', 0, 16, 6, 5, face='e', use='mess')                    # the mess hall, glass roof
g.put('w', (2, 17), (2, 19), (4, 18)); g.put('C', (3, 19))
g.b('cellblock', 18, 11, 5, 4, face='w', doors=((18, 13),), use='armoury')   # the armoury
g.put('C', (20, 12), (21, 13))
g.b('block', 22, 16, 2, 6, face='w', st=5)                          # tower blocks along the east
g.b('kiosk', 17, 19, 1, 1, face='w')
g.b('yard', 6, 16, 14, 5, use='plaza')                              # the exercise yard
for p in ((8, 17), (15, 17), (11, 19), (12, 19), (19, 16)): g.put('w', p)
g.put('C', (7, 20), (16, 20))

# ================= stage 1: the sea wall (z 22-31) =================
for (x0, x1) in ((0, 1), (3, 9), (14, 20), (22, 23)):
    g.b('wallw', x0, 22, x1 - x0 + 1, 2, lv=6, face='s')           # the white sea wall, standable
for x in (10, 11, 12, 13): g.put('D', (x, 22), (x, 23))             # the wall gate
g.put('K', (2, 23)); g.put('.', (2, 22))                            # the service hatch (hack)
g.put('n', (21, 22), (21, 23))                                      # crawl vent (lights)
g.b('apt', 5, 22, 1, 2, lv=8, face='s'); g.b('apt', 17, 22, 1, 2, lv=8, face='s')   # guard towers on the wall
g.ladder((7, 23), (8, 22), (15, 22))                                # up the beach face; down the yard face
g.b('kiosk', 4, 26, 2, 1, face='s'); g.b('kiosk', 18, 26, 2, 1, face='s')   # beach guard posts
for p in ((8, 25), (15, 25), (2, 27), (21, 27), (11, 26), (12, 26)): g.put('w', p)
for p in ((6, 28), (17, 28), (6, 25), (17, 25), (1, 25), (22, 25)): g.put('C', p)
g.rect(0, 30, 24, 2, 0, '~'); g.rect(8, 29, 8, 3, 0, '.')            # the sea and the landing jetty
g.put('P', (9, 30), (10, 30), (13, 30), (14, 30))

H_ROWS, M_ROWS, F_ROWS = g.rows()
ZIPS = [[2, 12, 6, 9], [12, 4, 14, 1], [16, 23, 19, 18]]
TUNNELS = [[2, 28, 4, 21], [16, 16, 16, 9]]
VENTS = [[20, 25, 17, 20], [6, 9, 1, 1]]
WINCHES = [[15, 24, 15, 23], [9, 7, 9, 6], [5, 15, 5, 14]]
EXTRAS = [dict(t='boat', x=3, z=-2, rot=1.4), dict(t='boat', x=13, z=-3, rot=2.2), dict(t='boat', x=6, z=33, rot=.3), dict(t='boat', x=18, z=34, rot=2.8)]
STAGES = [
  dict(name='The sea wall', objectives=[dict(type='plant', label='Blow the wall gate', targets=[[11, 23]], need=2, clears=[[10, 22], [12, 22], [13, 22], [10, 23], [12, 23], [13, 23], [11, 22]])], spawns=None, addTurns=0,
       enemies=[['marksman', 5, 22], ['marksman', 17, 22], ['trooper', 8, 23], ['trooper', 15, 23], ['heavy', 12, 21], ['trooper', 19, 25], ['engineer', 4, 25]], reinf=[[3, [['trooper', 9, 20], ['trooper', 14, 20]]]]),
  dict(front=21, name='The prison yard', objectives=[dict(type='hack', label='Hack the cell door panel', targets=[[11, 15]], need=3)], spawns=[[10, 24], [11, 24], [12, 24], [13, 24]], addTurns=9,
       enemies=[['marksman', 2, 12], ['marksman', 19, 12], ['trooper', 8, 18], ['trooper', 15, 18], ['heavy', 11, 16], ['medic', 14, 16], ['engineer', 6, 15], ['infiltrator', 19, 18]], reinf=[[3, [['trooper', 1, 10], ['trooper', 21, 10]]]]),
  dict(front=10, name='The getaway', objectives=[dict(type='rescue', label='Get her to the boats')], spawns=[[10, 10], [11, 10], [12, 10], [13, 10]], addTurns=9,
       enemies=[['trooper', 4, 6], ['trooper', 8, 8], ['marksman', 12, 4], ['heavy', 5, 2], ['infiltrator', 15, 6], ['medic', 3, 4], ['marksman', 7, 4]], reinf=[[2, [['trooper', 13, 0], ['trooper', 14, 0]]], [4, [['heavy', 14, 0]]]]),
]
SECONDARIES = [dict(id='hatch', type='hack', stage=0, targets=[[2, 23]], need=2, label='Hack the service hatch')]
POINTS = [dict(type='supply', x=23, z=31), dict(type='supply', x=0, z=21), dict(type='supply', x=23, z=9),
          dict(type='searchlight', x=0, z=26, dir=[1, 0], len=7), dict(type='searchlight', x=23, z=24, dir=[-1, 0], len=7),
          dict(type='searchlight', x=7, z=21, dir=[1, 0], len=9), dict(type='searchlight', x=21, z=15, dir=[-1, 0], len=8)]
TRAPS = [dict(type='steam', x=16, z=24, line=[[15, 25], [14, 25], [13, 25]]), dict(type='barrels', x=3, z=29),
         dict(type='drawbridge', x=15, z=1, tiles=[[13, 0], [14, 0]]), dict(type='fuel', x=19, z=21, area=[[18, 20], [19, 20], [18, 21], [20, 21]])]
BREAKOUT2 = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, tunnels=TUNNELS, vents=VENTS, winches=WINCHES, bld=g.bld, extras=EXTRAS,
                 stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, turns=11)
# The defence version: the 'prisoner' is a cache in her cell that the attackers carry to the boats.
DEF_ITEM = (12, 12)

if __name__ == '__main__':
    g.show()
