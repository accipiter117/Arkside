#!/usr/bin/env python3
"""Service Lift (x5) and Service Lift: Lockdown (x5d). 12 x 36, three stages,
climbing from the industrial decks up into the Founders' Ark. The bottom two
thirds use the industrial look and the top third (z 0-11) the Founders' white
halls (THEME_ROWS).

Stage 1, the foundry floor (z 24-35): escort the maintenance bot up the
conveyor road to the cargo lift. Conveyor rails to vault, hoarding (sheet
walls) a heavy can charge through, catwalks along both sides.
Stage 2, the gantries (z 12-23): a deep casting pit split by gantry
walkways at level 2. Lights and mediums jump the pit gaps, heavies take the
gantry bridges or build the deployable bridge. Repair the cargo lift.
Stage 3, the atrium (z 0-11): the Founders' atrium with glass-walled
balconies, planters and frosted-glass partitions. Hack the broadcast core.

Rows run top (z=0) to bottom (z=35); attackers start at the bottom. Heights
in half-levels: 0 ground, odd = ramp, 2 level 1, 4 level 2.
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

# ---------- stage 3: the atrium (z 0-11), Founders' look ----------
rect(0, 0, 12, 2, 2)                      # the broadcast gallery, level 1
m[0][5] = 'T'                             # the broadcast core
m[1][3] = 'w'; m[1][8] = 'w'; m[0][1] = 'C'; m[0][10] = 'C'
h[2][3] = 1; h[2][8] = 1                  # grand stairs up to the gallery
f[1][0] = 'L'; f[1][11] = 'L'
# balconies down both sides, level 1, glass edged, frosted partitions on them
rect(0, 3, 2, 7, 2); rect(10, 3, 2, 7, 2)
m[5][1] = 'F'; m[5][10] = 'F'; m[8][0] = 'C'; m[8][11] = 'C'
f[9][1] = 's'; f[9][10] = 's'             # climb steps from the atrium floor
# the atrium floor: planters, a fountain, partitions
m[4][4] = 'C'; m[4][7] = 'C'; m[6][5] = 'X'; m[6][6] = 'X'
m[8][3] = 'F'; m[8][8] = 'F'; m[7][4] = 'w'; m[7][7] = 'w'
m[9][4] = 'w'; m[9][7] = 'w'; m[9][2] = 'C'; m[9][9] = 'C'
m[3][5] = 'M'
# the lift lobby: the cargo lift doors open from the gantries into the atrium
rect(0, 11, 12, 1, 4, 'w')               # the bulkhead between the decks and the Ark
for x in (5, 6): m[11][x] = 'D'; h[11][x] = 0   # the cargo lift doors
m[11][0] = 'n'; h[11][0] = 0              # a duct for the lights
m[11][11] = 'g'; h[11][11] = 0            # a service gap for lights and mediums

# ---------- stage 2: the gantries (z 12-23) ----------
m[12][5] = 'T'                            # the cargo lift controls
m[12][3] = 'C'; m[12][8] = 'C'
# the casting pit, z 14-20: gaps everywhere except the walkways
for z in range(14, 21):
    for x in range(W): f[z][x] = '_'
for z in range(14, 21):                   # side gantries, level 2, the full length of the pit
    for x in (0, 11): f[z][x] = '.'; h[z][x] = 4
for x in range(W): f[17][x] = '.'; h[17][x] = 4   # the cross gantry at level 2
for z in (14, 15, 16): f[z][2] = '.'; h[z][2] = 4      # a spur to the west (jump the one-tile gap from the side gantry)
for z in (18, 19, 20): f[z][9] = '.'; h[z][9] = 4      # and one to the east
h[20][5] = 1; h[19][5] = 2; h[18][5] = 3                # the deployable bridge climbs from the foundry edge to the cross gantry
f[15][1] = '='; f[19][10] = '='           # marked gaps for mediums
# the pit edges at ground level with stairs up to the side gantries
rect(0, 13, 12, 1, 0); rect(0, 21, 12, 1, 0)
h[13][0] = 3; h[13][1] = 2; h[13][2] = 1  # stairs down from the west gantry to the lift landing
h[21][11] = 3; h[21][10] = 2; h[21][9] = 1  # and up from the foundry side on the east
f[21][0] = 'L'; h[21][0] = 4              # a ladder on the west side, foundry end
h[13][11] = 4; f[13][11] = 'L'
m[22][2] = 'w'; m[22][5] = 'w'; m[22][9] = 'C'; m[13][7] = 'w'
m[23][0] = 'C'; m[23][4] = 'F'; m[23][7] = 'F'; m[23][11] = 'C'

# ---------- stage 1: the foundry floor (z 24-35) ----------
# catwalks either side, level 2, with stairs and ladders
rect(0, 25, 2, 8, 4); rect(10, 25, 2, 8, 4)
h[33][1] = 3; h[34][1] = 2; h[35][1] = 1  # west catwalk stairs
f[29][10] = 'L'; f[26][1] = 'L'
m[27][0] = 'C'; m[30][1] = 'w'; m[27][11] = 'C'; m[31][10] = 'w'
# the conveyor road up the middle (the escort path runs up x 5)
for z in (26, 29, 32): f[z][3] = 'r'; f[z][7] = 'r'   # conveyor rails to vault
m[25][3] = 'X'; m[25][8] = 'X'                         # furnace tanks
m[28][2] = 'F'; m[28][3] = 'F'; m[28][8] = 'F'; m[28][9] = 'F'   # hoarding
m[31][2] = 'C'; m[31][9] = 'C'; m[30][4] = 'w'; m[30][7] = 'w'
m[27][6] = 'w'; m[33][4] = 'C'; m[33][7] = 'C'
m[24][2] = 'w'; m[24][9] = 'w'
for x in (4, 5, 6, 7): m[35][x] = 'P'

H_ROWS = [''.join(str(v) for v in r) for r in h]
M_ROWS = [''.join(r) for r in m]
F_ROWS = [''.join(r) for r in f]
ZIPS = [[0, 25, 3, 22], [11, 25, 8, 22], [0, 3, 3, 9]]
ESCORT = [[5, z] for z in range(34, 22, -1)]

STAGES = [
  dict(name='The foundry floor', objectives=[dict(type='escort', path=ESCORT, hp=320)], spawns=None, addTurns=0,
       enemies=[['marksman', 0, 26], ['marksman', 11, 28], ['trooper', 4, 27], ['trooper', 6, 25], ['heavy', 6, 24], ['engineer', 8, 24]], reinf=[[3, [['trooper', 3, 23]]], [5, [['infiltrator', 10, 23]]]]),
  dict(front=23, name='The gantries', objectives=[dict(type='repair', label='Repair the cargo lift', targets=[[5, 12]], need=4, clears=[[5, 11], [6, 11]])], spawns=[[4, 24], [5, 24], [6, 24], [7, 24]], addTurns=8,
       enemies=[['marksman', 0, 15], ['marksman', 11, 19], ['trooper', 2, 15], ['trooper', 9, 19], ['heavy', 6, 13], ['medic', 4, 12], ['infiltrator', 9, 17]], reinf=[[3, [['trooper', 1, 13], ['trooper', 10, 13]]]]),
  dict(front=11, name='The atrium', objectives=[dict(type='hack', label='Hack the broadcast core', targets=[[5, 0]], need=4)], spawns=[[3, 13], [4, 13], [5, 13], [6, 13]], addTurns=8,
       enemies=[['trooper', 4, 2], ['trooper', 7, 2], ['heavy', 6, 1], ['marksman', 1, 4], ['marksman', 10, 4], ['medic', 5, 5], ['infiltrator', 8, 9]], reinf=[[2, [['trooper', 2, 0], ['trooper', 9, 0]]], [4, [['heavy', 6, 0]]]]),
]
SECONDARIES = [dict(id='mg', type='mg', stage=2, targets=[[5, 3]], need=2, label='Build an MG nest')]
POINTS = [dict(type='supply', x=11, z=34), dict(type='supply', x=0, z=22), dict(type='bridge', x=4, z=21, tiles=[[5, 18], [5, 19], [5, 20]]),
          dict(type='searchlight', x=11, z=3, dir=[-1, 0], len=8)]
TRAPS = [dict(type='steam', x=8, z=34, line=[[8, 33], [8, 32], [8, 31]]), dict(type='barrels', x=9, z=30),
         dict(type='gantry', x=1, z=21, tiles=[[1, 17], [2, 17], [3, 17], [4, 17]]), dict(type='barrels', x=2, z=21),
         dict(type='fuel', x=11, z=24, area=[[8, 23], [9, 23], [8, 22], [10, 23]])]
THEME_ROWS = [[0, 11, 'founders']]
INDUSTRIAL = dict(h=H_ROWS, m=M_ROWS, feat=F_ROWS, zips=ZIPS, stages=STAGES, secondaries=SECONDARIES, points=POINTS, traps=TRAPS, themeRows=THEME_ROWS, turns=10)

if __name__ == '__main__':
    for z in range(H): print(f'{z:2} {H_ROWS[z]}  {M_ROWS[z]}  {F_ROWS[z]}')
