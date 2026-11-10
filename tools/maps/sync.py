#!/usr/bin/env python3
"""Copy the map layers from tools/maps (long.py: x1 to x5) into src/engine.js
so the game ships exactly what the validator checked. Replaces the h, map,
feat, zips, points and traps arrays of each operation in place; briefs,
stages and everything else in engine.js are left alone. Run after editing
a map source, then python3 tools/build.py."""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from long import L
ENGINE = os.path.join(HERE, '..', '..', 'src', 'engine.js')
src = open(ENGINE, encoding='utf-8').read()

def span(text, start):
    """Index just past the ']' matching the '[' at text[start]."""
    depth = 0; i = start; instr = None
    while i < len(text):
        c = text[i]
        if instr:
            if c == '\\': i += 1
            elif c == instr: instr = None
        elif c in '"\'': instr = c
        elif c == '[': depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0: return i + 1
        i += 1
    raise ValueError('unbalanced')

def replace_key(block, key, value, quoted):
    k = ('"%s":' % key) if quoted else ('%s:' % key)
    i = block.find(k)
    if i < 0: return block, False
    a = i + len(k)
    if block[a] != '[': raise ValueError(key)
    b = span(block, a)
    return block[:a] + json.dumps(value, separators=(',', ':')) + block[b:], True

for mid, d in L.items():
    quoted = mid != 'x1'
    if quoted:
        m = re.search(r'OPERATIONS\.push\(\{"id":"%s".*?\}\);\n' % mid, src, re.S)
    else:
        m = re.search(r"const OPERATIONS=\[\{id:'x1'.*?\n  secondaries:.*?\n", src, re.S)
    assert m, mid
    block = m.group(0)
    layers = dict(h=d['h'], map=d['m'], feat=d['feat'], zips=d.get('zips', []), points=d.get('points', []), traps=d.get('traps', []))
    if 'mat' in d: layers['mat'] = d['mat']
    if 'themeRows' in d: layers['themeRows'] = d['themeRows']
    if 'stages' in d and mid != 'c1': layers['stages'] = d['stages']
    if 'secondaries' in d and mid != 'c1': layers['secondaries'] = d['secondaries']
    if mid == 'c1':
        layers['zones'] = d['zones']; layers['espawns'] = d['espawns']
    for k in ('bld', 'tunnels', 'vents', 'winches', 'extras'):
        if k in d: layers[k] = d[k]
    done = []
    for key, val in layers.items():
        block, ok = replace_key(block, key, val, quoted)
        if not ok and quoted and key in ('bld', 'tunnels', 'vents', 'winches', 'extras', 'mat', 'themeRows'):
            i = block.find('"zips":'); assert i > 0, (mid, key)
            block = block[:i] + '"%s":%s,' % (key, json.dumps(val, separators=(',', ':'))) + block[i:]; ok = True
        if ok: done.append(key)
    # scalars: the turn count, and whether lights and mediums can jump water
    if 'turns' in d:
        block, n = re.subn(r'("turns"|\bturns):\d+', lambda mm: '%s:%d' % (mm.group(1), d['turns']), block, count=1)
        if n: done.append('turns')
    if d.get('channels') and 'channels' not in block:
        block = block.replace('"long":true,', '"long":true,"channels":true,', 1); done.append('channels')
    # Harbour Row keeps its own stage shape (size, pool); only the enemy line-up moves
    if mid == 'c1':
        i = block.find('"enemies":'); a = i + len('"enemies":'); b = span(block, a)
        block = block[:a] + json.dumps(d['stages'][0]['enemies'], separators=(',', ':')) + block[b:]; done.append('enemies')
    src = src[:m.start()] + block + src[m.end():]
    print(mid, 'synced', ', '.join(done))
open(ENGINE, 'w', encoding='utf-8').write(src)
