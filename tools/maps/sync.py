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
    if 'stages' in d and mid in ('x4', 'x5'): layers['stages'] = d['stages']
    done = []
    for key, val in layers.items():
        block, ok = replace_key(block, key, val, quoted)
        if ok: done.append(key)
    src = src[:m.start()] + block + src[m.end():]
    print(mid, 'synced', ', '.join(done))
open(ENGINE, 'w', encoding='utf-8').write(src)
