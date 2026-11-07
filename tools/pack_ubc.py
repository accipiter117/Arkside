#!/usr/bin/env python3
"""Pack the Quaternius Universal Base Characters (Standard, CC0) into GLBs
for the game. Usage: python3 tools/pack_ubc.py "<path to Universal Base Characters[Standard]>"

Writes assets/models/base_m.glb and base_f.glb (body, eyes and eyebrows
meshes, one skinned skeleton; skin textured with the light base colour at
1024 so the game can tint skin tones; eyes at 256; normal and roughness
maps dropped because the game toon-shades) and assets/models/hair_*.glb
(the eight hair pieces from "Origin at 0", flat materials so hair colour
is a tint). Textures are embedded in the GLB binary chunk."""
import io, json, os, struct, sys
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'models')

def pad4(b, fill=b'\0'):
    return b + fill * ((4 - len(b) % 4) % 4)

def png_bytes(path, size):
    im = Image.open(path).convert('RGBA' if Image.open(path).mode == 'RGBA' else 'RGB')
    if size and im.size[0] > size: im = im.resize((size, size), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); return buf.getvalue()

def write_glb(gltf, bin_data, out):
    js = pad4(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
    bn = pad4(bin_data)
    total = 12 + 8 + len(js) + 8 + len(bn)
    with open(out, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(bn), 0x004E4942)); f.write(bn)

def pack(gltf_path, out, image_plan, material_plan, size_hint):
    """image_plan: original image uri -> (replacement png path or None to drop, size). material_plan(mat) edits materials in place."""
    d = os.path.dirname(gltf_path)
    g = json.load(open(gltf_path))
    bin_data = open(os.path.join(d, g['buffers'][0]['uri']), 'rb').read()
    bin_data = pad4(bin_data)
    # images -> embedded bufferViews
    new_images, img_map = [], {}
    for i, im in enumerate(g.get('images', [])):
        plan = image_plan.get(im['uri'])
        if not plan or plan[0] is None: continue
        data = png_bytes(plan[0], plan[1])
        off = len(bin_data); bin_data += pad4(data)
        g['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)})
        img_map[i] = len(new_images)
        new_images.append({'mimeType': 'image/png', 'bufferView': len(g['bufferViews']) - 1, 'name': os.path.basename(plan[0])})
    g['images'] = new_images
    # textures: keep those whose image survived, remap
    new_tex, tex_map = [], {}
    for i, t in enumerate(g.get('textures', [])):
        if t['source'] in img_map:
            tex_map[i] = len(new_tex); new_tex.append(dict(t, source=img_map[t['source']]))
    g['textures'] = new_tex
    for m in g['materials']:
        pbr = m.setdefault('pbrMetallicRoughness', {})
        for key in ('normalTexture', 'occlusionTexture', 'emissiveTexture'):
            m.pop(key, None)
        pbr.pop('metallicRoughnessTexture', None)
        bct = pbr.get('baseColorTexture')
        if bct and bct['index'] in tex_map: bct['index'] = tex_map[bct['index']]
        else: pbr.pop('baseColorTexture', None)
        pbr['metallicFactor'] = 0; pbr['roughnessFactor'] = 1
        material_plan(m)
    g['buffers'] = [{'byteLength': len(bin_data)}]
    g.pop('extensionsUsed', None)
    write_glb(g, bin_data, out)
    print(os.path.basename(out), os.path.getsize(out) // 1024, 'KB', [m['name'] for m in g['materials']], [im['name'] for im in g['images']])

T = os.path.join(SRC, 'Base Characters', 'Textures')
G = os.path.join(SRC, 'Base Characters', 'Godot - UE')
def body_mats(m):
    if 'Hair' in m['name']: m['pbrMetallicRoughness']['baseColorFactor'] = [1, 1, 1, 1]; m['name'] = 'Brows'
    elif 'Eyes' in m['name']: m['name'] = 'Eyes'
    else: m['name'] = 'Skin'
pack(os.path.join(G, 'Superhero_Male_FullBody.gltf'), os.path.join(OUT, 'base_m.glb'),
     {'T_Eye_Brown.png': (os.path.join(T, 'T_Eye_Brown.png'), 256), 'T_Superhero_Male_Dark.png': (os.path.join(T, 'T_Superhero_Male_Ligh.png'), 1024)}, body_mats, 1024)
pack(os.path.join(G, 'Superhero_Female_FullBody.gltf'), os.path.join(OUT, 'base_f.glb'),
     {'T_Eye_Brown.png': (os.path.join(T, 'T_Eye_Brown.png'), 256), 'T_Superhero_Female_Dark_BaseColor.png': (os.path.join(T, 'T_Superhero_Female_Light_BaseColor.png'), 1024)}, body_mats, 1024)
H = os.path.join(SRC, 'Hairstyles', 'Origin at 0', 'glTF (Godot)')
def hair_mats(m): m['pbrMetallicRoughness']['baseColorFactor'] = [1, 1, 1, 1]; m['name'] = 'Hair'
for f, key in [('Hair_Buzzed', 'buzzed'), ('Hair_BuzzedFemale', 'buzzedf'), ('Hair_SimpleParted', 'parted'), ('Hair_Long', 'long'), ('Hair_Buns', 'buns'), ('Hair_Beard', 'beard'), ('Eyebrows_Regular', 'browsm'), ('Eyebrows_Female', 'browsf')]:
    pack(os.path.join(H, f + '.gltf'), os.path.join(OUT, 'hair_' + key + '.glb'), {}, hair_mats, 0)
