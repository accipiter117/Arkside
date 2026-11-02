#!/usr/bin/env python3
"""Security Tower: Breakout. 12 x 36, three stages, from Matthew's map draft
(references/4-map-drafts.html, Security Tower tab). Builds the height, map
and feature layers and prints them; long.py imports TOWER from here so the
validator checks exactly what the game ships.

Rows run top (harbour, z=0) to bottom (dock, z=35); attackers start at the
bottom. Heights in half-levels: 0 ground, 2 level 1, 4 level 2, 6 level 3.
"""
W, H = 12, 36
h = [[0] * W for _ in range(H)]
m = [['.'] * W for _ in range(H)]
f = [['.'] * W for _ in range(H)]

def rect(x, z, w, d, hv=None, ch=None):
    for zz in range(z, z + d):
        for xx in range(x, x + w):
            if hv is not None: h[zz][xx] = hv
            if ch is not None: m[zz][xx] = ch

# ---------- stage 3: the getaway (z 0-11) ----------
rect(0, 0, 12, 1, 0, '~')                 # sea
for x in (1, 2, 3): m[0][x] = 'E'         # boats
for x in (6, 7): m[0][x] = '.'            # drawbridge to Security's reinforcement boat
rect(9, 1, 3, 7, 6)                       # the tower, level 3
f[7][9] = 'L'                             # ladder up the tower, from the yard
rect(5, 4, 4, 3, 4)                       # rooftops, level 2
f[6][5] = 'L'                             # ladder onto the roofs
f[6][8] = 's'                             # climb step off the tower side
for x, z in ((1, 5), (3, 5), (1, 7), (3, 7)): m[z][x] = 'C'   # barracks bunks and lockers
m[6][2] = 'w'; m[4][4] = 'w'
m[2][5] = 'C'; m[2][8] = 'C'; m[3][2] = 'C'
# getaway yard z 9-11, open ground
m[9][2] = 'C'; m[9][9] = 'C'; m[8][6] = 'w'

# ---------- stage 2: the prison yard (z 12-23) ----------
rect(0, 12, 12, 1, 4)                     # catwalk ring, level 2
rect(0, 12, 1, 12, 4); rect(11, 12, 1, 12, 4)
rect(0, 23, 12, 1, 4)
for x in (0, 2, 4, 5, 6, 7): h[23][x] = 0 # openings under the wall gate, culvert and hatch
rect(3, 13, 6, 2, 2)                      # cell block, level 1
m[14][5] = 'T'                            # the cell block door
for x, z in ((0, 14), (11, 14), (0, 22), (11, 22)): f[z][x] = 'L'   # corner ladders
f[20][2] = 'r'; f[20][9] = 'r'            # vault rails along the exercise pens
for z in (16, 17, 18, 19): m[z][2] = 'w' if z in (16, 19) else '.'; 
for z in (16, 19): m[z][9] = 'w'
m[17][5] = 'C'; m[18][6] = 'C'; m[21][4] = 'C'; m[21][8] = 'C'

# ---------- stage 1: the sea wall (z 24-35) ----------
rect(0, 24, 12, 2, 4)                     # the sea wall, level 2
for x in range(4, 8): h[24][x] = 0; h[25][x] = 0   # the gate
m[25][4] = 'D'; m[25][5] = 'T'; m[25][6] = 'D'; m[25][7] = 'D'
h[24][2] = 0; h[25][2] = 0; m[24][2] = 'n'; m[25][2] = 'n'          # drainage culvert, lights only
h[24][0] = 0; h[25][0] = 0; m[25][0] = 'K'                           # service hatch
h[24][1] = 6; h[24][10] = 6; f[24][1] = 'L'; f[24][10] = 'L'         # sniper towers on the wall corners
f[25][1] = 'L'; f[25][10] = 'L'                                      # ladders from the dock onto the wall
rect(1, 26, 3, 2, 2, 'C'); rect(1, 26, 3, 2, 2, '.')                 # crate stack, level 1
f[25][3] = 's'                                                       # climb step from the crates onto the wall walk
rect(8, 28, 3, 2, 2)                                                 # more stacked crates
m[30][5] = 'C'; m[31][8] = 'C'; m[29][2] = 'w'; m[32][6] = 'w'
rect(5, 33, 3, 3, 0, '~')                                            # water inlet
for x in (2, 3, 8, 9): m[34][x] = 'P'

H_ROWS = [''.join(str(v) for v in r) for r in h]
M_ROWS = [''.join(r) for r in m]
F_ROWS = [''.join(r) for r in f]
ZIPS = [[1, 24, 3, 19], [10, 24, 8, 20], [10, 2, 3, 2]]

STAGES = [
  dict(name='The sea wall', objectives=[dict(type='plant', label='Blow the wall gate', targets=[[5, 25]], need=2, clears=[[4, 25], [6, 25], [7, 25]])], spawns=None, addTurns=0,
       enemies=[['marksman', 1, 24], ['marksman', 10, 24], ['trooper', 3, 24], ['trooper', 9, 24], ['heavy', 5, 24], ['trooper', 9, 27]], reinf=[[3, [['trooper', 6, 22]]]]),
  dict(front=24, name='The prison yard', objectives=[dict(type='hack', label='Hack the cell block door', targets=[[5, 14]], need=3)], spawns=[[4, 24], [5, 24], [6, 24], [7, 24]], addTurns=8,
       enemies=[['marksman', 0, 16], ['marksman', 11, 20], ['trooper', 4, 17], ['trooper', 7, 19], ['heavy', 5, 16], ['medic', 8, 15], ['engineer', 2, 13]], reinf=[[3, [['trooper', 1, 12], ['trooper', 10, 12]]]]),
  dict(front=11, name='The getaway', objectives=[dict(type='rescue', label='Get her to the boats')], spawns=[[4, 10], [5, 10], [6, 10], [7, 10]], addTurns=8,
       enemies=[['trooper', 2, 8], ['trooper', 3, 6], ['marksman', 10, 3], ['heavy', 6, 5], ['infiltrator', 8, 3], ['medic', 1, 4]], reinf=[[2, [['trooper', 6, 0], ['trooper', 7, 0]]], [4, [['heavy', 6, 0]]]]),
]
SECONDARIES = [dict(id='hatch', type='hack', stage=0, targets=[[0, 25]], need=2, label='Hack the service hatch')]
POINTS = [dict(type='supply', x=11, z=32), dict(type='searchlight', x=0, z=18, dir=[1, 0], len=5), dict(type='searchlight', x=11, z=17, dir=[-1, 0], len=5),
          dict(type='hatch', x=9, z=13, ladder=[9, 12]), dict(type='supply', x=1, z=10)]
TRAPS = [dict(type='crane', x=11, z=29, area=[[5, 26], [6, 26], [5, 27], [6, 27]], crate=[5, 26]), dict(type='steam', x=3, z=22, line=[[4, 23], [5, 23], [6, 23]]),
         dict(type='drawbridge', x=8, z=1, tiles=[[6, 0], [7, 0]])]
TOWER = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, stages=STAGES, secondaries=SECONDARIES, turns=10)

if __name__ == '__main__':
    import json
    for z in range(H): print(f'{z:2} {H_ROWS[z]}  {M_ROWS[z]}  {F_ROWS[z]}')
