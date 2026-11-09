#!/usr/bin/env python3
"""Container City Push, revised (x1 v2). 24 wide x 32 deep, three stages,
built from real buildings (see BUILDINGS in src/world.js).
Attackers start in the scrapyard at the south (z 29-31) and push north.

Stage 1, the gate (z 22-31): the wall is stacked containers you can stand
on (ladders both sides), with the main gate in the middle, a crawl vent in
the west, a hackable side door in the east. Scrapyard: shacks, a pump house
and a water tower; a drain tunnel runs under the wall into the market.
Stage 2, the street (z 11-21): the bot drives up the main street (column
M). West: two-storey container homes, a cantina and the roofed market hall.
East: the workshop warehouse (roofed, two doors), container homes joined
by a rope bridge, and a drain tunnel down to the docks.
Stage 3, the docks (z 0-10): the crane platform, the lab warehouse with the
cache, the two-storey port office, a watchtower, the east piers.
Heights in half-levels: 0 ground, odd = ramp, 2 level 1 (half a storey),
4 one container storey, 8 two storeys.
"""
W, H = 24, 32
h = [[0] * W for _ in range(H)]
m = [['.'] * W for _ in range(H)]
f = [['.'] * W for _ in range(H)]
BLD = []

def rect(x, z, w, d, hv=None, ch=None):
    for zz in range(z, z + d):
        for xx in range(x, x + w):
            if hv is not None: h[zz][xx] = hv
            if ch is not None: m[zz][xx] = ch
def bld(t, x, z, w, d, lv=0, face='s', doors=(), col=None, st=None, hs=None, use=None, rot=None):
    """Stamp a building's tiles and record it for the renderer."""
    b = dict(t=t, x=x, z=z, w=w, d=d, lv=lv, face=face)
    if doors: b['doors'] = [list(p) for p in doors]
    if col: b['col'] = col
    if st: b['st'] = st
    if use: b['use'] = use
    if rot is not None: b['rot'] = rot
    BLD.append(b)
    if t in ('home', 'cantina', 'office', 'tower', 'bridge'):
        rect(x, z, w, d, lv, '.')
    elif t in ('shack', 'pump', 'tank', 'stack', 'distillery', 'radio', 'shrine', 'magnet'):
        rect(x, z, w, d, 0, 'B')
    elif t == 'deck':
        for i, (xx, zz) in enumerate([(xx, zz) for zz in range(z, z + d) for xx in range(x, x + w)]):
            h[zz][xx] = hs[i] if hs else lv; m[zz][xx] = '.'
    elif t == 'warehouse':
        rect(x, z, w, d, 0, '.')
        for zz in range(z, z + d):
            for xx in range(x, x + w):
                if (xx in (x, x + w - 1) or zz in (z, z + d - 1)) and (xx, zz) not in doors: m[zz][xx] = 'B'
    elif t == 'hall':
        rect(x, z, w, d, 0, '.')
        for (xx, zz) in ((x, z), (x + w - 1, z), (x, z + d - 1), (x + w - 1, z + d - 1)): m[zz][xx] = 'X'
def ladder(x, z): f[z][x] = 'L'

# ================= stage 3: the docks (z 0-10) =================
rect(0, 0, 24, 2, 0, '~'); rect(0, 2, 1, 9, 0, '~')
rect(17, 0, 7, 2, 0, '.'); m[0][18] = '~'; m[0][19] = '~'; m[0][22] = '~'
for x in (17, 20, 21): m[0][x] = 'E'
m[1][18] = 'C'; m[1][23] = 'w'
bld('warehouse', 1, 3, 7, 6, face='s', doors=((4, 8), (7, 5)))          # the lab warehouse
m[5][3] = 'I'; m[4][5] = 'C'; m[6][2] = 'C'; m[6][5] = 'w'
rect(10, 3, 5, 4, 2); m[4][12] = 'T'; h[7][12] = 1; h[7][11] = 1        # crane platform, steps south
ladder(10, 5); ladder(14, 5); m[3][10] = 'C'; m[3][14] = 'C'; m[6][10] = 'w'; m[6][14] = 'w'
bld('office', 17, 3, 3, 3, lv=8, face='w')                              # port office, two storeys
ladder(17, 4)
bld('stack', 20, 3, 4, 2, face='s', st=3)                               # tall stacks along the dock edge
bld('tower', 22, 7, 1, 1, lv=6, face='s'); ladder(22, 7)              # watchtower
bld('hall', 15, 7, 5, 3, face='w', use='fishery')                         # the fishery shed
m[8][16] = 'C'; m[8][18] = 'C'; m[8][17] = 'w'
m[2][3] = 'C'; m[2][9] = 'w'; m[2][14] = 'w'; m[2][15] = 'C'
for x, z in ((9, 9), (14, 9), (21, 9), (5, 10), (2, 10)): m[z][x] = 'C'
m[10][11] = 'w'; m[10][13] = 'w'
bld('radio', 7, 9, 2, 2, face='e')                                       # the radio shack and its mast

# ================= stage 2: the street (z 11-21) =================
bld('stack', 0, 11, 2, 4, face='e', st=4)                               # the west skyline
bld('home', 2, 11, 3, 3, lv=8, face='e')                                 # two-storey homes, a school on the roof
bld('yard', 2, 11, 3, 3, use='school'); m[12][2] = 'w'; m[12][3] = 'w'; m[11][3] = 'C'
bld('deck', 5, 12, 1, 3, face='e', hs=[8, 6, 4])                         # plank stairs up to them from the lane
bld('deck', 6, 14, 1, 1, face='e', hs=[2])
bld('home', 6, 11, 3, 2, lv=4, face='s', col='#c98a2a')
bld('cantina', 8, 14, 2, 2, lv=4, face='e')
bld('yard', 10, 14, 1, 3, use='bar')                                     # the bar terrace
m[15][10] = 'w'; m[16][10] = 'w'
bld('hall', 1, 16, 7, 5, face='e', use='market')                         # the market hall (roofed)
for x, z in ((3, 17), (5, 17), (3, 19), (5, 19), (4, 18)): m[z][x] = 'w'
m[18][2] = 'C'; m[18][6] = 'C'
bld('shack', 9, 18, 2, 2, face='e')
bld('shrine', 9, 21, 1, 1, face='e')                                     # a shrine at the market corner
bld('warehouse', 15, 11, 7, 5, face='w', doors=((15, 13), (18, 15)), use='works')  # the foundry works (roofed)
m[12][17] = 'C'; m[13][19] = 'w'; m[12][20] = 'C'; m[14][17] = 'C'
bld('stack', 22, 11, 2, 5, face='w', st=3)                              # the east skyline
bld('deck', 13, 17, 1, 4, face='w', hs=[8, 6, 4, 2])                    # plank stairs up from the street
bld('home', 14, 17, 3, 3, lv=8, face='w')                                # east homes joined by a rope bridge
bld('bridge', 17, 18, 2, 1, lv=8, face='s')
bld('home', 19, 17, 4, 3, lv=8, face='w', col='#2f6e8a')
bld('yard', 19, 17, 4, 3, use='coop'); m[17][21] = 'C'
bld('yard', 14, 17, 3, 3, use='garden'); m[18][15] = 'w'; m[17][15] = 'w'
bld('stack', 23, 17, 1, 4, face='w', st=4)
ladder(22, 20)
bld('yard', 10, 12, 1, 2, use='noodles')                                 # the noodle stand
m[16][13] = 'C'; m[13][10] = 'w'; m[20][10] = 'C'; m[21][15] = 'C'; m[21][20] = 'w'; m[16][21] = 'C'

# ================= stage 1: the gate (z 22-31) =================
for (x0, x1) in ((0, 1), (3, 9), (14, 19), (21, 23)):
    bld('home', x0, 22, x1 - x0 + 1, 2, lv=6, face='s', col='#8a2f2a' if x0 < 12 else '#3d5f7a')   # the container wall, standable
for x in (10, 11, 12, 13): m[22][x] = 'D'; m[23][x] = 'D'
m[22][2] = 'n'; m[23][2] = 'n'                                           # crawl vent (lights)
m[23][20] = 'K'                                                          # side door (hack)
ladder(17, 23); ladder(7, 22); ladder(16, 22)                           # ladders: east face up from the yard, both down the far side
bld('deck', 8, 24, 1, 3, face='s', hs=[6, 4, 2])                         # plank stairs up the west of the wall
bld('stack', 0, 25, 2, 4, face='e', st=3)
bld('shack', 3, 26, 3, 2, face='e')
bld('hall', 18, 25, 4, 3, face='w', use='clinic')                       # the clinic tent
m[26][19] = 'C'; m[26][20] = 'C'; m[25][20] = 'w'
bld('distillery', 5, 28, 3, 2, face='n')                                # the water distillery
bld('yard', 9, 24, 7, 5, use='scrap')                                    # the scrap-sorting yard
bld('magnet', 15, 27, 1, 1, rot=-2.2)                                    # its magnet crane
bld('tank', 20, 28, 2, 2, face='n')
bld('home', 16, 29, 3, 2, lv=4, face='n', col='#4f6b3a'); ladder(15, 30)
for x, z in ((10, 25), (14, 25), (10, 27), (13, 27), (22, 26), (5, 25)): m[z][x] = 'C'
for x, z in ((11, 25), (12, 25), (6, 27), (17, 27)): m[z][x] = 'w'
for x in (9, 10, 13, 14): m[30][x] = 'P'

H_ROWS = [''.join(str(v) for v in r) for r in h]
M_ROWS = [''.join(r) for r in m]
F_ROWS = [''.join(r) for r in f]
ZIPS = [[2, 12, 4, 21], [21, 18, 17, 10], [18, 4, 13, 8]]
TUNNELS = [[4, 29, 6, 21], [16, 21, 13, 9], [22, 31, 21, 21]]
EXTRAS = [dict(t='hull', x=4, z=-4, rot=.35, len=10), dict(t='boat', x=17, z=-2, rot=1.2), dict(t='boat', x=21, z=-3, rot=.4), dict(t='boat', x=9, z=-3, rot=2.6)]
PATH = [[12, z] for z in range(24, 10, -1)]
STAGES = [
  dict(name='Breach the gate', objectives=[dict(type='plant', label='Blow the gate', targets=[[11, 23]], need=2, clears=[[10, 22], [12, 22], [13, 22], [10, 23], [12, 23], [13, 23], [11, 22]])], spawns=None, addTurns=0,
       enemies=[['marksman', 5, 22], ['marksman', 18, 22], ['trooper', 11, 21], ['heavy', 12, 20], ['infiltrator', 19, 21], ['turret', 14, 21], ['engineer', 8, 21], ['trooper', 3, 21]], reinf=[[3, [['trooper', 6, 20], ['trooper', 17, 21]]]]),
  dict(front=21, name='Escort the bot', objectives=[dict(type='escort', path=PATH, hp=360)], spawns=[[10, 24], [11, 24], [12, 24], [13, 24]], addTurns=9,
       enemies=[['marksman', 4, 11], ['marksman', 20, 18], ['trooper', 9, 12], ['trooper', 17, 13], ['heavy', 12, 11], ['medic', 4, 17], ['infiltrator', 16, 19], ['engineer', 13, 14]], reinf=[[3, [['trooper', 3, 10], ['trooper', 20, 10]]], [5, [['heavy', 12, 9]]]]),
  dict(front=10, name='Take the docks', objectives=[dict(type='repair', label='Repair the crane', targets=[[12, 4]], need=5), dict(type='extract')], spawns=[[11, 13], [12, 13], [11, 12], [12, 12]], addTurns=10,
       enemies=[['trooper', 9, 7], ['trooper', 16, 9], ['heavy', 12, 5], ['marksman', 18, 4], ['marksman', 22, 7], ['medic', 13, 3], ['infiltrator', 4, 6], ['engineer', 10, 4]], reinf=[[2, [['trooper', 17, 1], ['trooper', 21, 1]]], [4, [['heavy', 20, 1]]]]),
]
SECONDARIES = [dict(id='door', type='hack', stage=0, targets=[[20, 23]], need=2, label='Hack the side door'),
               dict(id='mg', type='mg', stage=1, targets=[[12, 18]], need=2, label='Build an MG nest')]
POINTS = [dict(type='supply', x=23, z=31), dict(type='supply', x=0, z=21), dict(type='supply', x=16, z=10)]
TRAPS = [dict(type='crane', x=15, z=6, area=[[11, 8], [12, 8], [11, 9], [12, 9]], crate=[11, 8]),
         dict(type='barrels', x=8, z=25), dict(type='barrels', x=15, z=24), dict(type='steam', x=14, z=16, line=[[13, 17], [13, 18], [12, 19]]),
         dict(type='fuel', x=9, z=10, area=[[8, 10], [7, 10], [8, 9], [7, 9]])]
CONTAINER2 = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, tunnels=TUNNELS, bld=BLD, extras=EXTRAS, stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, turns=10)

if __name__ == '__main__':
    for z in range(H): print(f'{z:2} {H_ROWS[z]}  {M_ROWS[z]}  {F_ROWS[z]}')
