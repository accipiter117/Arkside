#!/usr/bin/env python3
"""Container City Push, revised (x1 v2). 24 wide x 32 deep, three stages.
Attackers start in the scrapyard at the south (z 29-31) and push north.

Stage 1, the gate (z 22-31): the container wall across the whole map at
z 22-23 with the main gate in the middle, a crawl vent in the west, a
hackable side door in the east and ladders up the wall for climbers.
Stage 2, the street (z 11-21): the bot's route runs up the main street
(x 11-12); container blocks either side make alleys, rooftops at level 1
and 2, a market square in the west and a workshop yard in the east.
Stage 3, the docks (z 0-10): the crane platform in the middle (repair
it), the lab container with the cache in the west, boats at the east piers.
Heights in half-levels: 0 ground, odd = ramp, 2 level 1, 4 level 2.
"""
W, H = 24, 32
h = [[0] * W for _ in range(H)]
m = [['.'] * W for _ in range(H)]
f = [['.'] * W for _ in range(H)]

def rect(x, z, w, d, hv=None, ch=None):
    for zz in range(z, z + d):
        for xx in range(x, x + w):
            if hv is not None: h[zz][xx] = hv
            if ch is not None: m[zz][xx] = ch
def stairs(cells):
    for (x, z, hv) in cells: h[z][x] = hv

# ================= stage 3: the docks (z 0-10) =================
rect(0, 0, 24, 2, 0, '~')                     # the sea
rect(0, 2, 2, 9, 0, '~')                      # west harbour edge
rect(17, 0, 7, 2, 0, '.'); rect(18, 0, 2, 1, 0, '~'); rect(22, 0, 2, 1, 0, '~')   # east piers
for x in (17, 20, 21): m[0][x] = 'E'          # boats at the pier ends
m[1][18] = 'C'; m[1][22] = 'w'
# the crane platform, level 1, stairs on the south side
rect(9, 3, 6, 4, 2); m[4][12] = 'T'           # crane controls
stairs([(11, 7, 1), (12, 7, 1)]); f[5][9] = 'L'; f[5][14] = 'L'
m[3][9] = 'C'; m[3][14] = 'C'; m[6][10] = 'w'; m[6][13] = 'w'
# the lab container (west), level 0 inside sheet walls, cache inside
for x in range(2, 8): m[3][x] = 'F'; m[8][x] = 'F'
for z in range(4, 8): m[z][2] = 'F'; m[z][7] = 'F'
m[8][5] = '.'; m[5][7] = '.'                  # doorways south and east
m[5][4] = 'I'; m[6][3] = 'C'
# container stacks along the dock front, level 2, with a ladder and a zipline perch
rect(16, 3, 3, 3, 4); f[5][16] = 'L'; m[3][18] = 'C'
rect(20, 4, 3, 2, 2); stairs([(21, 6, 1)]); m[4][22] = 'w'
m[2][3] = 'C'; m[2][9] = 'w'; m[2][14] = 'w'; m[2][16] = 'C'
for x, z in ((4, 9), (9, 9), (14, 9), (19, 8), (22, 9), (17, 7)): m[z][x] = 'C'
m[10][11] = 'w'; m[10][12] = 'w'

# ================= stage 2: the street (z 11-21) =================
# west block: market roofs, level 1 and 2
rect(0, 11, 4, 4, 2); rect(0, 15, 3, 3, 4); stairs([(3, 16, 3), (4, 16, 2), (5, 16, 1)]); f[13][3] = 's'
rect(5, 12, 4, 3, 4); f[14][7] = 'L'; m[12][5] = 'C'
# the market square, open ground with stalls
for x, z in ((6, 17), (8, 17), (6, 19), (8, 19)): m[z][x] = 'F'
m[18][7] = 'w'; m[20][5] = 'C'; m[16][9] = 'C'
# street-side containers (cover lines either side of the main street)
for z in (12, 15, 18): m[z][10] = 'C'; m[z][13] = 'C'
m[20][10] = 'w'; m[20][13] = 'w'
# east block: workshop yard and rooftops
rect(15, 11, 4, 3, 4); f[13][17] = 'L'; m[11][18] = 'C'
rect(20, 12, 4, 6, 2); stairs([(19, 15, 1)]); f[17][22] = 's'; m[13][22] = 'C'; m[16][21] = 'w'
for x in range(15, 19): m[16][x] = 'F'
m[16][16] = '.'                                # a gap in the workshop wall
m[18][16] = 'C'; m[19][19] = 'w'; m[20][17] = 'C'; m[19][22] = 'C'
m[11][7] = 'n'; m[11][8] = 'n'                 # a crawl vent under the west roof

# ================= stage 1: the gate (z 22-31) =================
rect(0, 22, 24, 2, 4, 'w')                     # the container wall (level 2, impassable)
for x in (10, 11, 12, 13): m[22][x] = 'D'; h[22][x] = 0; m[23][x] = 'D'; h[23][x] = 0   # the main gate
m[22][2] = 'n'; h[22][2] = 0; m[23][2] = 'n'; h[23][2] = 0   # crawl vent (lights)
m[23][20] = 'K'; h[23][20] = 0; m[22][20] = '.'; h[22][20] = 0   # side door (hack)
# wall-top walkways with ladders up from the yard for climbers
for x in (6, 7, 16, 17): m[22][x] = '.'; m[23][x] = '.'
f[23][17] = 'L'                                # west walkway: climbers only (wall-hop or wall climb); east: a ladder for everyone
# the scrapyard: cover, a raised scrap heap, a gantry on the east
rect(3, 26, 3, 2, 2); stairs([(4, 28, 1)]); m[26][3] = 'C'
rect(18, 25, 3, 3, 2); stairs([(19, 28, 1)]); m[25][20] = 'C'
for x, z in ((8, 25), (15, 25), (10, 27), (13, 27), (1, 25), (22, 28), (7, 29), (16, 29)): m[z][x] = 'C'
for x, z in ((11, 25), (12, 25), (6, 27), (17, 27)): m[z][x] = 'w'
m[26][9] = 'F'; m[26][14] = 'F'
for x in (9, 10, 13, 14): m[30][x] = 'P'

H_ROWS = [''.join(str(v) for v in r) for r in h]
M_ROWS = [''.join(r) for r in m]
F_ROWS = [''.join(r) for r in f]
ZIPS = [[2, 15, 6, 20], [21, 12, 17, 9], [17, 4, 13, 8]]
PATH = [[12, z] for z in range(24, 10, -1)]
STAGES = [
  dict(name='Breach the gate', objectives=[dict(type='plant', label='Blow the gate', targets=[[11, 23]], need=2, clears=[[10, 22], [12, 22], [13, 22], [10, 23], [12, 23], [13, 23], [11, 22]])], spawns=None, addTurns=0,
       enemies=[['trooper', 6, 22], ['trooper', 17, 22], ['heavy', 11, 21], ['marksman', 1, 16], ['marksman', 21, 14], ['infiltrator', 20, 20], ['turret', 14, 20], ['engineer', 8, 20]], reinf=[[3, [['trooper', 4, 19], ['trooper', 20, 18]]]]),
  dict(front=21, name='Escort the bot', objectives=[dict(type='escort', path=PATH, hp=360)], spawns=[[10, 24], [11, 24], [12, 24], [13, 24]], addTurns=9,
       enemies=[['trooper', 6, 13], ['trooper', 17, 12], ['marksman', 2, 11], ['marksman', 21, 12], ['heavy', 12, 11], ['medic', 9, 14], ['infiltrator', 22, 16], ['engineer', 14, 14]], reinf=[[3, [['trooper', 3, 10], ['trooper', 20, 9]]], [5, [['heavy', 12, 9]]]]),
  dict(front=10, name='Take the docks', objectives=[dict(type='repair', label='Repair the crane', targets=[[12, 4]], need=5), dict(type='extract')], spawns=[[11, 13], [12, 13], [11, 14], [12, 14]], addTurns=10,
       enemies=[['trooper', 9, 7], ['trooper', 15, 7], ['heavy', 12, 5], ['marksman', 17, 4], ['marksman', 4, 4], ['medic', 13, 3], ['infiltrator', 21, 5], ['engineer', 10, 3]], reinf=[[2, [['trooper', 19, 1], ['trooper', 21, 1]]], [4, [['heavy', 20, 1]]]]),
]
SECONDARIES = [dict(id='door', type='hack', stage=0, targets=[[20, 23]], need=2, label='Hack the side door'),
               dict(id='mg', type='mg', stage=1, targets=[[12, 19]], need=2, label='Build an MG nest')]
POINTS = [dict(type='supply', x=23, z=30), dict(type='supply', x=0, z=20), dict(type='zipanchor', x=22, z=11, zip=[21, 11, 16, 8])]
TRAPS = [dict(type='crane', x=15, z=6, area=[[11, 8], [12, 8], [11, 9], [12, 9]], crate=[11, 8]),
         dict(type='barrels', x=5, z=24), dict(type='barrels', x=18, z=24), dict(type='steam', x=15, z=17, line=[[15, 18], [15, 19], [15, 20]]),
         dict(type='fuel', x=4, z=10, area=[[3, 10], [5, 10], [3, 9], [5, 9]])]
CONTAINER2 = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, turns=10)

if __name__ == '__main__':
    for z in range(H): print(f'{z:2} {H_ROWS[z]}  {M_ROWS[z]}  {F_ROWS[z]}')
