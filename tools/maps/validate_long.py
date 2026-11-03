import heapq,sys,copy
import os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));from long import L
BLOCK='CwXTDKY'
def parse(d):
    NZ=len(d['h']);NX=len(d['h'][0]);G=[]
    feat=d.get('feat') or ['.'*NX]*NZ
    for z in range(NZ):
        assert len(d['h'][z])==NX and len(d['m'][z])==NX,(z,d['h'][z],d['m'][z])
        G.append([dict(x=x,z=z,h=int(d['h'][z][x])/2,ch=d['m'][z][x],f=feat[z][x] if x<len(feat[z]) else '.') for x in range(NX)])
    return G,NX,NZ
# Movement rules, mirroring moveCost/moveLinks in src/mechanics.js:
# ladder L (light/medium 1 a level, heavy 2), climb step s (light/medium 1,
# no heavy), vault rail r (straight hop: light 2, medium 3), gap _ (light
# jump 2) and marked gap = (medium 3 too), zipline (light/medium 1).
def blocked(t):return t['ch']=='~' or t['ch'] in BLOCK or t['f'] in 'r_='
def step(body,a,b):
    if blocked(b):return 0
    if b['ch']=='n' and body!='light':return 0
    if b['ch']=='g' and body=='heavy':return 0
    up=b['h']-a['h']
    if abs(up)<=.5:return 1
    if up>0:
        lv=int(-(-up//1))
        if b['f']=='L':return 2*lv if body=='heavy' else lv
        if body=='heavy':return 0
        if up<=1:return 1 if (body=='light' or b['f']=='s') else 2
        if up<=2 and body=='light':return 2
        return 0
    dn=-up
    if dn<=1 or (dn<=2 and body!='heavy'):return 1
    if a['f']=='L' or b['f']=='L':lv=int(-(-dn//1));return 2*lv if body=='heavy' else lv
    return 0
def links(G,NX,NZ,body,x,z,zips):
    a=G[z][x]
    for dx,dz in((1,0),(-1,0),(0,1),(0,-1)):
        mx,mz,bx,bz=x+dx,z+dz,x+2*dx,z+2*dz
        if not(0<=bx<NX and 0<=bz<NZ):continue
        m,b=G[mz][mx],G[bz][bx]
        if blocked(b) or abs(b['h']-a['h'])>.5:continue
        if b['ch']=='n' and body!='light':continue
        if b['ch']=='g' and body=='heavy':continue
        if m['f']=='r' and abs(m['h']-a['h'])<=.5:
            if body=='light':yield bx,bz,2
            elif body=='medium':yield bx,bz,3
        if m['f'] in '_=':
            if body=='light':yield bx,bz,2
            elif body=='medium' and m['f']=='=':yield bx,bz,3
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
    G,NX,NZ=parse(d);ok=True
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
