#!/usr/bin/env python3
"""Terminal: Data Run. 12 x 36, three stages. Security attack the Resistance-
held transit terminal (Resistance defend it in Terminal: Blackout, x3d).
Builds the height, map and feature layers; long.py imports TERMINAL so the
validator checks exactly what the game ships.

Rows run top (monorail platform, z=0) to bottom (street entrance, z=35);
attackers start at the bottom. Heights in half-levels: 0 ground, 1 ramp
(escalator), 2 level 1, 4 level 2.
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

# ---------- stage 3: the platform (z 0-11) ----------
rect(0, 0, 12, 2, 2)                      # monorail platform, level 1
for x in (4, 5, 6, 7): m[0][x] = 'E'      # the waiting monorail car
h[2][1] = 1; h[2][10] = 1                 # escalators up to the platform
f[1][5] = 'L'; f[1][6] = 'L'              # ladders onto the platform edge
m[0][1] = 'C'; m[0][10] = 'C'             # luggage on the platform
m[1][3] = 'w'; m[1][8] = 'w'              # departure boards
m[4][1] = 'X'; m[4][10] = 'X'             # pillars
m[5][3] = 'n'; m[6][3] = 'n'; m[5][8] = 'w'   # a duct run and a ticket kiosk
for x, z in ((2, 7), (5, 7), (6, 7), (9, 7)): m[z][x] = 'C'   # benches and bags
m[9][4] = 'w'; m[9][7] = 'w'              # vending stands
m[9][5] = 'M'                             # MG nest spot covering the hall
m[10][1] = 'C'; m[10][10] = 'C'
m[11][0] = 'w'; m[11][11] = 'w'           # corridor mouths from the vault level

# ---------- stage 2: the vault and baggage hall (z 12-23) ----------
rect(2, 12, 8, 2, 4, 'w')                 # the vault block, level 2 walls
rect(3, 12, 6, 1, 0, '.')                 # inside the vault
m[12][5] = 'I'                            # the data key
m[13][5] = 'K'; h[13][5] = 0              # the safe door
rect(0, 14, 1, 7, 2); rect(11, 14, 1, 7, 2)   # side offices, level 1 (one tile wide, corridors beside them)
f[14][0] = 'L'; f[14][11] = 'L'           # ladders up from the vault corridors
f[20][0] = 'L'; f[20][11] = 'L'           # ladders up from the hall
f[17][0] = '='; f[17][11] = '_'           # broken office walkways: marked gap left (mediums too), lights only right
m[16][1] = 'C'; m[16][10] = 'C'; m[18][1] = 'w'; m[18][10] = 'w'
m[15][2] = 'X'; m[15][9] = 'X'; m[20][2] = 'X'; m[20][9] = 'X'
for x, z in ((4, 17), (7, 17), (4, 18), (5, 18), (6, 18), (7, 18)): m[z][x] = 'C'   # the baggage carousel
f[16][5] = 'r'; f[16][6] = 'r'            # vault rails over the carousel belt
m[21][3] = 'C'; m[21][8] = 'C'; m[22][5] = 'w'; m[22][6] = 'w'
# the security shutters between concourse and hall, z 23
rect(0, 23, 12, 1, 4, 'w')
m[23][0] = 'n'; h[23][0] = 0; m[22][0] = 'n'   # crawl vent run, lights only
for x in (4, 5, 6, 7): m[23][x] = 'D'; h[23][x] = 0   # the shutters
m[23][11] = 'K'; h[23][11] = 0            # side door

# ---------- stage 1: the concourse (z 24-35) ----------
rect(0, 24, 2, 8, 2); rect(10, 24, 2, 8, 2)   # mezzanine, level 1
h[32][1] = 1; h[32][10] = 1               # escalators up to the mezzanine
f[24][1] = 'L'; f[24][10] = 'L'           # ladders down by the shutters
h[28][0] = 4; h[28][11] = 4; f[28][0] = 'L'; f[28][11] = 'L'   # lookout perches above the mezzanine
m[26][5] = 'T'                            # the mainframe
m[25][4] = 'w'; m[25][6] = 'w'            # server cabinets
m[27][2] = 'X'; m[27][9] = 'X'
for x, z in ((4, 28), (7, 28), (3, 30), (8, 30), (5, 31)): m[z][x] = 'C'   # ticket desks and crates
m[29][5] = 'w'; m[29][6] = 'w'            # information kiosk
m[26][0] = 'C'; m[26][11] = 'C'           # cover on the mezzanine
for x in (2, 3, 8, 9): f[32][x] = 'r'     # ticket barriers (vault or walk through the middle)
m[33][0] = 'w'; m[33][11] = 'w'
for x in (2, 3, 8, 9): m[34][x] = 'P'

H_ROWS = [''.join(str(v) for v in r) for r in h]
M_ROWS = [''.join(r) for r in m]
F_ROWS = [''.join(r) for r in f]
ZIPS = [[0, 28, 2, 20], [11, 28, 9, 20], [0, 14, 2, 8]]

STAGES = [
  dict(name='The concourse', objectives=[dict(type='hack', label='Hack the mainframe', targets=[[5, 26]], need=3, clears=[[4, 23], [5, 23], [6, 23], [7, 23]])], spawns=None, addTurns=0,
       enemies=[['marksman', 0, 25], ['marksman', 11, 25], ['trooper', 4, 27], ['trooper', 7, 27], ['heavy', 5, 24], ['engineer', 9, 26]], reinf=[[3, [['trooper', 1, 24]]]]),
  dict(front=23, name='The vault', objectives=[dict(type='plant', label='Crack the safe', targets=[[5, 13]], need=3)], spawns=[[4, 23], [5, 23], [6, 23], [7, 23]], addTurns=8,
       enemies=[['marksman', 0, 15], ['marksman', 11, 19], ['trooper', 3, 16], ['trooper', 8, 16], ['heavy', 5, 15], ['medic', 6, 14], ['engineer', 1, 19]], reinf=[[3, [['trooper', 0, 12], ['trooper', 11, 12]]]]),
  dict(front=11, name='The platform', objectives=[dict(type='extract')], spawns=[[3, 15], [4, 15], [7, 15], [8, 15]], addTurns=8,
       enemies=[['trooper', 2, 4], ['trooper', 9, 4], ['heavy', 5, 3], ['marksman', 0, 1], ['marksman', 11, 1], ['medic', 6, 5], ['infiltrator', 4, 8]], reinf=[[2, [['trooper', 4, 0], ['trooper', 7, 0]]], [4, [['heavy', 6, 0]]]]),
]
SECONDARIES = [dict(id='door', type='hack', stage=0, targets=[[11, 23]], need=2, label='Hack the side door'),
               dict(id='mg', type='mg', stage=2, targets=[[5, 9]], need=2, label='Build an MG nest')]
POINTS = [dict(type='supply', x=11, z=30), dict(type='supply', x=1, z=22), dict(type='supply', x=11, z=8)]
TRAPS = [dict(type='barrels', x=2, z=25), dict(type='steam', x=10, z=28, line=[[9, 29], [9, 30], [9, 31]]),
         dict(type='fuel', x=3, z=14, area=[[2, 14], [3, 15], [2, 15], [3, 14]]), dict(type='barrels', x=8, z=21),
         dict(type='steam', x=0, z=5, line=[[1, 5], [1, 6], [1, 7]])]
TERMINAL = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, turns=10)

if __name__ == '__main__':
    for z in range(H): print(f'{z:2} {H_ROWS[z]}  {M_ROWS[z]}  {F_ROWS[z]}')
