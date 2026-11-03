#!/usr/bin/env python3
"""Harbour Row: a 20 x 20 shanty district for the Control mode. One live zone
at a time (market, pump house, clinic, water tower, canal bridge); the team
alone inside it at the end of a round scores. Enemy edge is the north (z=0),
the player deploys on the south edge (z=19). Heights in half-levels: 0
ground, odd = ramp, 2 level 1, 4 level 2."""
W, H = 20, 20
h = [[0] * W for _ in range(H)]
m = [['.'] * W for _ in range(H)]
f = [['.'] * W for _ in range(H)]

def rect(x, z, w, d, hv=None, ch=None):
    for zz in range(z, z + d):
        for xx in range(x, x + w):
            if hv is not None: h[zz][xx] = hv
            if ch is not None: m[zz][xx] = ch

# ---------- water tower (NW, zone on top, level 2) ----------
rect(3, 3, 3, 3, 4)
h[6][4] = 3; h[7][4] = 2; h[8][4] = 1          # stair run up from the south
f[4][3] = 'L'; f[4][5] = 'L'                    # ladders on the west and east faces
m[2][1] = 'C'; m[5][1] = 'C'; m[2][6] = 'w'; m[7][6] = 'C'; m[9][2] = 'w'; m[10][2] = 'w'

# ---------- pump house (NE, zone on a level-1 deck) ----------
rect(14, 3, 3, 3, 2)
h[4][13] = 1; h[6][15] = 1                      # ramps from the west and south
m[3][14] = 'C'; m[5][16] = 'C'                  # pump gear on the deck
m[2][13] = 'C'; m[6][18] = 'C'; m[7][12] = 'C'; m[2][9] = 'w'; m[2][8] = 'w'; m[3][10] = 'C'

# ---------- market (centre, ground) ----------
for x, z in ((8, 8), (12, 8), (8, 12), (12, 12)): m[z][x] = 'C'   # stalls
m[10][12] = 'X'                                   # the square's pillar
m[10][6] = 'n'; m[10][7] = 'n'                    # crawl duct in from the west
f[13][9] = 'r'; f[13][11] = 'r'                   # market fence, vault it or use the middle
f[6][10] = 'r'
m[14][7] = 'C'; m[5][7] = 'C'; m[6][12] = 'C'

# ---------- clinic (SW, walled compound) ----------
rect(2, 13, 5, 1, 0, 'w'); rect(2, 17, 5, 1, 0, 'w'); rect(2, 14, 1, 3, 0, 'w'); rect(6, 14, 1, 3, 0, 'w')
m[13][4] = '.'; m[15][6] = '.'                   # the north and east doors
m[16][9] = 'C'; m[17][11] = 'C'; m[11][3] = 'C'; m[18][1] = 'C'

# ---------- canal and bridge (SE) ----------
for z in range(12, 20): m[z][13] = '~'
m[15][13] = '.'; m[18][13] = '.'                 # the two bridges
m[12][15] = 'C'; m[16][17] = 'w'; m[16][18] = 'w'; m[19][16] = 'C'

# ---------- rooftop run (east) ----------
rect(16, 9, 3, 2, 2); rect(16, 12, 3, 2, 2)     # two roofs, level 1
f[9][16] = 'L'; f[13][18] = 'L'                  # ladders up
f[10][18] = 's'                                  # climb step from the east alley
f[11][17] = '='                                  # broken walkway between the roofs: marked gap
m[8][16] = 'C'; m[14][16] = 'C'

for x in (8, 9, 10, 11): m[19][x] = 'P'

H_ROWS = [''.join(str(v) for v in r) for r in h]
M_ROWS = [''.join(r) for r in m]
F_ROWS = [''.join(r) for r in f]
ZIPS = [[5, 5, 8, 9], [16, 5, 12, 8], [18, 12, 15, 17]]
ZONES = [dict(name='The market', x=10, z=10), dict(name='The pump house', x=15, z=4), dict(name='The clinic', x=4, z=15), dict(name='The water tower', x=4, z=4), dict(name='The canal bridge', x=13, z=15)]
ESPAWNS = [[8, 0], [9, 0], [10, 0], [11, 0], [6, 0], [13, 0]]
POOL = ['trooper', 'engineer', 'heavy', 'medic', 'infiltrator', 'trooper', 'marksman']
ENEMIES = [['trooper', 8, 1], ['engineer', 11, 1], ['heavy', 5, 1], ['medic', 14, 1]]
# Two "stages" for the validator only: reach every zone from the player's spawns and from the enemy's.
STAGES = [dict(name='Control', objectives=[dict(type='control', targets=[[z['x'], z['z']] for z in ZONES])], spawns=None, enemies=ENEMIES, reinf=[]),
          dict(name='Control (enemy side)', objectives=[dict(type='control', targets=[[z['x'], z['z']] for z in ZONES])], spawns=ESPAWNS, enemies=[], reinf=[])]
POINTS = [dict(type='supply', x=1, z=17), dict(type='supply', x=18, z=2)]
TRAPS = [dict(type='barrels', x=12, z=13), dict(type='barrels', x=7, z=5), dict(type='fuel', x=16, z=8, area=[[15, 8], [16, 8], [15, 7], [16, 7]]),
         dict(type='steam', x=19, z=5, line=[[18, 4], [18, 5], [18, 6]])]
CONTROL = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, stages=STAGES, secondaries=[], points=POINTS, traps=TRAPS, turns=24, zones=ZONES, espawns=ESPAWNS, pool=POOL)

if __name__ == '__main__':
    for z in range(H): print(f'{z:2} {H_ROWS[z]}  {M_ROWS[z]}  {F_ROWS[z]}')
