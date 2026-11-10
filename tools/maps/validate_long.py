import heapq,sys,copy
import os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));from long import L
BLOCK='CwXTDKYFB'
def parse(d):
    NZ=len(d['h']);NX=len(d['h'][0]);G=[]
    feat=d.get('feat') or ['.'*NX]*NZ
    for z in range(NZ):
        assert len(d['h'][z])==NX and len(d['m'][z])==NX,(z,d['h'][z],d['m'][z])
        G.append([dict(x=x,z=z,h=int(d['h'][z][x])/2,ch=d['m'][z][x],f=feat[z][x] if x<len(feat[z]) else '.') for x in range(NX)])
    return G,NX,NZ
# Movement rules, mirroring moveCost/moveLinks in src/mechanics.js (update 18):
# ladder L (light/medium 1 a level, heavy 2); climb one level (light 1,
# medium 2 or 1 on a step s, heavy mantle 2); two levels (light 2, medium 3);
# drop (light/medium three levels, heavy two); vault rail r (light 2,
# medium 3); gap _ or marked = (light 2, medium 3 or 2 marked, +1 landing up a
# level; landings up to a level up or down); zipline (light/medium 1);
# heavies shoulder-charge through barricades w and sheet walls F (2).
SMASH='wF'
def blocked(t):return t['ch']=='~' or t['ch'] in BLOCK or t['f'] in 'r_='
def step(body,a,b):
    up=b['h']-a['h']
    if b['ch'] in SMASH and t_ok(b) and body=='heavy' and abs(up)<=.5:return 2
    if blocked(b):return 0
    if b['ch']=='n' and body!='light':return 0
    if b['ch']=='g' and body=='heavy':return 0
    if abs(up)<=.5:return 1
    if up>0:
        lv=int(-(-up//1))
        if b['f']=='L':return 2*lv if body=='heavy' else lv
        if body=='heavy':return 2 if up<=1 else 0
        if up<=1:return 1 if (body=='light' or b['f']=='s') else 2
        if up<=2:return 2 if body=='light' else 3
        return 0
    dn=-up
    if dn<=2 or (dn<=3 and body!='heavy'):return 1
    if a['f']=='L' or b['f']=='L':lv=int(-(-dn//1));return 2*lv if body=='heavy' else lv
    return 0
def t_ok(t):return t['ch']!='~' and t['f'] not in 'r_='
CH=False;TUN=[];VEN=[];WIN=[]
def links(G,NX,NZ,body,x,z,zips):
    a=G[z][x]
    for dx,dz in((1,0),(-1,0),(0,1),(0,-1)):
        mx,mz,bx,bz=x+dx,z+dz,x+2*dx,z+2*dz
        if not(0<=bx<NX and 0<=bz<NZ):continue
        m,b=G[mz][mx],G[bz][bx]
        if blocked(b):continue
        if b['ch']=='n' and body!='light':continue
        if b['ch']=='g' and body=='heavy':continue
        dh=b['h']-a['h']
        if m['f']=='r' and abs(m['h']-a['h'])<=.5 and abs(dh)<=.5:
            if body=='light':yield bx,bz,2
            elif body=='medium':yield bx,bz,3
        if (m['f'] in '_=' or (m['ch']=='~' and CH)) and abs(dh)<=1:
            if body=='light':yield bx,bz,2
            elif body=='medium':yield bx,bz,(2 if m['f']=='=' else 3)+(1 if dh>.5 else 0)
    if body=='light':
        for x1,z1,x2,z2 in VEN:
            for (ax,az,bx,bz) in ((x1,z1,x2,z2),(x2,z2,x1,z1)):
                if (ax,az)==(x,z) and not blocked(G[bz][bx]):yield bx,bz,1
    if body!='heavy':
        for x1,z1,x2,z2 in WIN:
            if (x1,z1)==(x,z) and not blocked(G[z2][x2]):yield x2,z2,1
    for x1,z1,x2,z2 in TUN:
        for (ax,az,bx,bz) in ((x1,z1,x2,z2),(x2,z2,x1,z1)):
            if (ax,az)==(x,z) and not blocked(G[bz][bx]):yield bx,bz,2+(abs(bx-ax)+abs(bz-az)+7)//8
    if body!='heavy':
        for x1,z1,x2,z2 in zips:
            if (x1,z1)==(x,z) and not blocked(G[z2][x2]):yield x2,z2,1
def reach(G,NX,NZ,body,starts,zips=()):
    dist={};pq=[]
    for s in starts:dist[s]=0;heapq.heappush(pq,(0,s))
    while pq:
        d,(x,z)=heapq.heappop(pq)
        if d>dist[(x,z)]:continue
        for dx,dz in((1,0),(-1,0),(0,1),(0,-1)):
            nx,nz=x+dx,z+dz
            if not(0<=nx<NX and 0<=nz<NZ):continue
            c=step(body,G[z][x],G[nz][nx])
            if c and d+c<dist.get((nx,nz),1e9):dist[(nx,nz)]=d+c;heapq.heappush(pq,(d+c,(nx,nz)))
        for nx,nz,c in links(G,NX,NZ,body,x,z,zips):
            if d+c<dist.get((nx,nz),1e9):dist[(nx,nz)]=d+c;heapq.heappush(pq,(d+c,(nx,nz)))
    return dist
def near(R,p):return min(R.get((p[0]+dx,p[1]+dz),999) for dx in(-1,0,1) for dz in(-1,0,1))
for k,d in L.items():
    G,NX,NZ=parse(d);ok=True;CH=bool(d.get('channels'));TUN=[tuple(t) for t in d.get('tunnels',[])];VEN=[tuple(t) for t in d.get('vents',[])];WIN=[tuple(t) for t in d.get('winches',[])]
    spawns=[(t['x'],t['z']) for r in G for t in r if t['ch']=='P']
    for si,st in enumerate(d['stages']):
        sp=[tuple(p) for p in st['spawns']] if st['spawns'] else spawns
        for e in st['enemies']+[e for w in st['reinf'] for e in w[1]]:
            t=G[e[2]][e[1]]
            if blocked(t) or t['ch'] in 'ngMP':print(k,si,'BAD enemy',e,t['ch']);ok=False
        for p in sp:
            if blocked(G[p[1]][p[0]]):print(k,si,'BAD spawn',p);ok=False
        out=[]
        for body in('light','medium','heavy'):
            R=reach(G,NX,NZ,body,sp,[tuple(z) for z in d.get('zips',[])]);res={}
            for o in st['objectives']:
                if 'targets' in o:res[o['type']]=[near(R,p) for p in o['targets']]
                if o['type']=='escort':res['path']=[near(R,p) for p in (o['path'][0],o['path'][-1])];bad=[p for p in o['path'] if blocked(G[p[1]][p[0]]) and G[p[1]][p[0]]['ch']!='D']
                if o['type']=='escort' and bad:print('PATH BLOCKED',bad);ok=False
                if o['type']=='rescue':
                    ex=[(t['x'],t['z']) for r in G for t in r if t['ch']=='E'];res['exit']=[R.get(p,999) for p in ex]
                if o['type']=='extract':
                    it=[(t['x'],t['z']) for r in G for t in r if t['ch']=='I'];ex=[(t['x'],t['z']) for r in G for t in r if t['ch']=='E']
                    res['item']=[R.get(p,999) for p in it];res['exit']=[R.get(p,999) for p in ex]
            for sc in d['secondaries']:
                if sc['stage']==si:res[sc['id']]=[near(R,p) for p in sc['targets']]
            out.append((body,res))
        print(k,'stage',si,out)
        # apply stage completion effects
        for o in st['objectives']:
            for p in o.get('clears',[])+(o.get('targets',[]) if o['type']=='plant' else []):G[p[1]][p[0]]['ch']='.'
        for sc in d['secondaries']:
            if sc['stage']==si:
                for p in sc['targets']:
                    t=G[p[1]][p[0]]
                    if sc['type']=='hack':t['ch']='.'
                    if sc['type']=='build':t['ch']='.'
    print('OK' if ok else 'FAIL')
