#!/usr/bin/env python3
"""Shared helpers for the rebuilt maps (Container City onward): a grid of
heights (half-levels), map letters and feature letters, and building stamps
that also record the building for the renderer (src/world.js BUILDINGS).

Walkable-roof buildings raise their footprint to the roof; solid buildings
fill it with 'B'; roofed interiors (warehouse, cellblock) wall the edge with
'B' except doors; open halls (hall, atrium) put pillars 'X' at the corners;
decks take a height per tile; yards only give the ground a use."""
ROOF = ('home', 'cantina', 'office', 'tower', 'bridge', 'apt', 'wallw', 'ctrl')
SOLID = ('shack', 'pump', 'tank', 'stack', 'distillery', 'radio', 'shrine', 'magnet', 'block', 'spire', 'kiosk', 'silo', 'refinery', 'piperack')
WALLED = ('warehouse', 'cellblock')
OPEN = ('hall', 'atrium')

class Grid:
    def __init__(self, W, H):
        self.W, self.H = W, H
        self.h = [[0] * W for _ in range(H)]
        self.m = [['.'] * W for _ in range(H)]
        self.f = [['.'] * W for _ in range(H)]
        self.bld = []
    def rect(self, x, z, w, d, hv=None, ch=None):
        for zz in range(z, z + d):
            for xx in range(x, x + w):
                if hv is not None: self.h[zz][xx] = hv
                if ch is not None: self.m[zz][xx] = ch
    def put(self, ch, *pts):
        for x, z in pts: self.m[z][x] = ch
    def ladder(self, *pts):
        for x, z in pts: self.f[z][x] = 'L'
    def b(self, t, x, z, w, d, lv=0, face='s', doors=(), col=None, st=None, hs=None, use=None, rot=None):
        b = dict(t=t, x=x, z=z, w=w, d=d, lv=lv, face=face)
        if doors: b['doors'] = [list(p) for p in doors]
        for k, v in (('col', col), ('st', st), ('use', use), ('rot', rot)):
            if v is not None: b[k] = v
        self.bld.append(b)
        if t in ROOF: self.rect(x, z, w, d, lv, '.')
        elif t in SOLID: self.rect(x, z, w, d, 0, 'B')
        elif t == 'deck':
            cells = [(xx, zz) for zz in range(z, z + d) for xx in range(x, x + w)]
            for i, (xx, zz) in enumerate(cells): self.h[zz][xx] = hs[i] if hs else lv; self.m[zz][xx] = '.'
        elif t in WALLED:
            self.rect(x, z, w, d, 0, '.')
            for zz in range(z, z + d):
                for xx in range(x, x + w):
                    if (xx in (x, x + w - 1) or zz in (z, z + d - 1)) and (xx, zz) not in doors: self.m[zz][xx] = 'B'
        elif t in OPEN:
            self.rect(x, z, w, d, 0, '.')
            for (xx, zz) in ((x, z), (x + w - 1, z), (x, z + d - 1), (x + w - 1, z + d - 1)): self.m[zz][xx] = 'X'
        return b
    def rows(self):
        return ([''.join(str(v) for v in r) for r in self.h], [''.join(r) for r in self.m], [''.join(r) for r in self.f])
    def show(self):
        H_, M_, F_ = self.rows()
        for z in range(self.H): print(f'{z:2} {H_[z]}  {M_[z]}  {F_[z]}')
