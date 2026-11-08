#!/usr/bin/env python3
"""Tidewater Run (x4) and Tidewater Hold (x4d). 12 x 36, three stages, in the
shanty district (container theme) after a storm surge.

Stage 1, the rooftops (z 24-35): shack roofs at levels 1 to 3 with gaps
between them, sheet-walled roof shacks and a stair run for the heavies. Cut
the spotter relay on the mast roof.
Stage 2, the drowned market (z 12-23): ground level, flooded channels one
tile wide (lights and mediums jump them, heavies use the plank bridges),
stalls with sheet-wall backs. Restart the drainage pump.
Stage 3, the docks (z 0-11): a warehouse of sheet walls round the floodgate
key, piers into the sea split by one-tile channels, a crane over the dock
front. Carry the key to a boat at the pier ends.

Rows run top (sea, z=0) to bottom (south roofs, z=35); attackers start at the
bottom. Heights in half-levels: 0 ground, odd = ramp, 2 level 1, 4 level 2,
6 level 3.
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

# ---------- stage 3: the docks (z 0-11) ----------
rect(0, 0, 12, 4, 0, '~')                 # the sea
rect(1, 0, 3, 4, 0, '.')                  # west pier
rect(5, 0, 2, 4, 0, '.')                  # middle pier
rect(8, 0, 3, 4, 0, '.')                  # east pier
for x in (2, 5, 6, 9): m[0][x] = 'E'      # boats waiting at the pier ends
m[2][1] = 'C'; m[1][3] = 'w'; m[2][6] = 'w'; m[1][9] = 'C'; m[3][10] = 'w'   # bollards and nets
# dock front
m[4][2] = 'w'; m[4][9] = 'w'
m[5][0] = 'C'; m[5][11] = 'X'
# the warehouse round the key: sheet walls (heavies charge through), doorways at (5,7) and (6,10)
for x in range(3, 9): m[7][x] = 'F'; m[10][x] = 'F'
for z in (8, 9): m[z][3] = 'F'; m[z][8] = 'F'
m[7][5] = '.'; m[10][6] = '.'
m[8][5] = 'I'                              # the floodgate key
m[9][7] = 'C'
# dock office (west, level 1, ladder) and container stack (east, level 2, stairs)
rect(0, 6, 2, 5, 2); f[8][1] = 'L'
m[7][0] = 'C'
rect(10, 6, 2, 4, 4); h[11][10] = 1; h[10][10] = 2; h[10][11] = 3   # steps up to the stack
m[6][11] = 'C'; m[8][10] = 'w'
m[11][4] = 'w'; m[11][7] = 'C'

# ---------- stage 2: the drowned market (z 12-23) ----------
# the drainage pump house on a level-1 plinth with steps
rect(4, 12, 4, 2, 2); m[12][6] = 'T'; h[14][5] = 1; h[14][6] = 1
m[12][4] = 'w'; m[13][7] = 'C'
m[13][1] = 'C'; m[13][10] = 'C'; m[12][0] = 'X'; m[12][11] = 'X'
# a flooded channel right across, plank bridges at x 2 and 9
for x in range(W): m[16][x] = '~'
m[16][2] = '.'; m[16][9] = '.'
m[15][4] = 'w'; m[15][7] = 'w'; m[17][0] = 'C'; m[17][11] = 'C'
# stall roofs (level 1) either side, climb steps on their market faces
rect(0, 18, 3, 2, 2); rect(9, 18, 3, 2, 2); f[19][1] = 's'; f[19][10] = 's'
m[18][0] = 'F'; m[18][11] = 'F'
# a second, shorter channel in the middle of the market
for x in range(3, 9): m[20][x] = '~'
m[20][5] = '.'
m[19][4] = 'C'; m[19][7] = 'w'; m[21][3] = 'w'; m[21][8] = 'C'; m[22][6] = 'w'
# the backs of the stalls under the roofs: sheet walls with gaps
for x in (0, 1, 4, 7, 10, 11): m[23][x] = 'F'
m[22][1] = 'C'; m[22][10] = 'C'

# ---------- stage 1: the rooftops (z 24-35) ----------
rect(0, 24, 12, 3, 4)                      # the mast roof block, level 2
rect(4, 24, 4, 2, 6)                       # the mast platform, level 3
m[24][6] = 'T'                             # the spotter relay
f[26][5] = 'L'                             # a ladder up from the alley
m[25][1] = 'F'; m[25][10] = 'F'; m[26][2] = 'C'; m[26][9] = 'w'
for x in range(W): f[27][x] = '_'          # the alley drop between the roof blocks
f[27][2] = '='; f[27][9] = '='
for x in (4, 5, 6, 7): f[27][x] = '.'      # the alley itself, at ground level
rect(4, 27, 4, 6, 0)
h[29][7] = 1; h[28][7] = 2; h[27][7] = 3   # the stair run up to the mast roof
m[29][4] = 'C'; m[31][5] = 'w'; m[30][6] = 'C'
# middle roofs: west level 2 with a ladder up from the alley, east level 2 with a water-tank perch
rect(0, 28, 4, 5, 4); f[30][3] = 'L'
m[30][1] = 'F'; m[30][2] = 'F'; m[28][0] = 'C'
rect(8, 28, 4, 5, 4); f[31][8] = 'L'
h[29][10] = 6; f[29][10] = 'L'             # the water tank, level 3
m[31][9] = 'F'; m[31][10] = 'F'; m[28][11] = 'w'
# the gap between the middle roofs and the south roofs
for x in (0, 1, 2, 3, 8, 9, 10, 11): f[33][x] = '_'
f[33][1] = '='; f[33][10] = '='
rect(4, 33, 4, 1, 2)                       # a plank bridge at level 1 over the alley
# south roofs: level 2 either side, level 1 in the middle
rect(0, 34, 4, 2, 4); rect(8, 34, 4, 2, 4); rect(4, 34, 4, 2, 2)
m[35][4] = 'w'; m[35][7] = 'w'
for x, z in ((1, 34), (2, 34), (9, 34), (10, 34)): m[z][x] = 'P'

H_ROWS = [''.join(str(v) for v in r) for r in h]
M_ROWS = [''.join(r) for r in m]
F_ROWS = [''.join(r) for r in f]
ZIPS = [[11, 25, 10, 21], [0, 25, 1, 21], [11, 8, 8, 5]]

STAGES = [
  dict(name='The rooftops', objectives=[dict(type='hack', label='Cut the spotter relay', targets=[[6, 24]], need=3)], spawns=None, addTurns=0,
       enemies=[['marksman', 4, 24], ['trooper', 1, 29], ['trooper', 10, 30], ['heavy', 6, 28], ['infiltrator', 9, 25], ['medic', 2, 25]], reinf=[[3, [['trooper', 5, 24]]]]),
  dict(front=23, name='The drowned market', objectives=[dict(type='repair', label='Restart the drainage pump', targets=[[6, 12]], need=4)], spawns=[[2, 25], [3, 25], [8, 25], [9, 25]], addTurns=8,
       enemies=[['marksman', 1, 18], ['marksman', 10, 18], ['trooper', 3, 15], ['trooper', 8, 15], ['heavy', 5, 13], ['engineer', 6, 17], ['infiltrator', 4, 21]], reinf=[[3, [['trooper', 1, 12], ['trooper', 11, 13]]]]),
  dict(front=11, name='The docks', objectives=[dict(type='extract')], spawns=[[2, 14], [3, 14], [8, 14], [9, 14]], addTurns=8,
       enemies=[['trooper', 4, 5], ['trooper', 7, 5], ['heavy', 6, 9], ['marksman', 10, 7], ['marksman', 0, 8], ['medic', 5, 3], ['infiltrator', 9, 2]], reinf=[[2, [['trooper', 1, 1], ['trooper', 10, 1]]], [4, [['heavy', 6, 1]]]]),
]
SECONDARIES = [dict(id='mg', type='mg', stage=1, targets=[[5, 17]], need=2, label='Build an MG nest')]
POINTS = [dict(type='supply', x=11, z=35), dict(type='supply', x=0, z=14), dict(type='zipanchor', x=3, z=12, zip=[2, 13, 4, 8])]
TRAPS = [dict(type='barrels', x=5, z=30), dict(type='fuel', x=2, z=21, area=[[1, 20], [2, 20], [1, 21], [2, 22]]),
         dict(type='flood', x=11, z=15, tiles=[[9, 16], [10, 15], [10, 17]]),
         dict(type='crane', x=11, z=4, area=[[5, 4], [6, 4], [5, 5], [6, 5]], crate=[5, 4]),
         dict(type='barrels', x=8, z=11)]
# ground: planks on the roofs and piers, deck plate in the market and on the dock front
MAT = []
for z in range(H):
    row = ''
    for x in range(W):
        row += 'p' if z >= 24 or z <= 3 or (m[z][x] == '.' and z in (16, 20)) else ('d' if (x + z) % 3 else 'c')
    MAT.append(row)
TIDEWATER = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, mat=MAT, channels=True, turns=10)

if __name__ == '__main__':
    for z in range(H): print(f'{z:2} {H_ROWS[z]}  {M_ROWS[z]}  {F_ROWS[z]}')
