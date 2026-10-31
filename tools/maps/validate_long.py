import heapq,sys,copy
import os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));from long import L
BLOCK='CwXTDKY'
def parse(d):
    NZ=len(d['h']);NX=len(d['h'][0]);G=[]
    for z in range(NZ):
        assert len(d['h'][z])==NX and len(d['m'][z])==NX,(z,d['h'][z],d['m'][z])
        G.append([dict(x=x,z=z,h=int(d['h'][z][x])/2,ch=d['m'][z][x]) for x in range(NX)])
    return G,NX,NZ
def blocked(t):return t['ch']=='~' or t['ch'] in BLOCK
def step(body,a,b):
    if blocked(b):return 0
    if b['ch']=='n' and body!='light':return 0
    if b['ch']=='g' and body=='heavy':return 0
    up=b['h']-a['h']
    if abs(up)<=.5:return 1
    if up>0:
        if body=='heavy':return 0
        if up<=1:return 1 if body=='light' else 2
        if up<=2 and body=='light':return 2
        return 0
    return 1 if (-up<=1 or (-up<=2 and body!='heavy')) else 0
def reach(G,NX,NZ,body,starts):
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
            R=reach(G,NX,NZ,body,sp);res={}
            for o in st['objectives']:
                if 'targets' in o:res[o['type']]=[near(R,p) for p in o['targets']]
                if o['type']=='escort':res['path']=[near(R,p) for p in (o['path'][0],o['path'][-1])];bad=[p for p in o['path'] if blocked(G[p[1]][p[0]]) and G[p[1]][p[0]]['ch']!='D']
                if o['type']=='escort' and bad:print('PATH BLOCKED',bad);ok=False
                if o['type']=='extract':
                    it=[(t['x'],t['z']) for r in G for t in r if t['ch']=='I'];ex=[(t['x'],t['z']) for r in G for t in r if t['ch']=='E']
                    res['item']=[R.get(p,999) for p in it];res['exit']=[R.get(p,999) for p in ex]
            for sc in d['secondaries']:
                if sc['stage']==si:res[sc['id']]=[near(R,p) for p in sc['targets']]
            out.append((body,res))
        print(k,'stage',si,out)
        # apply stage completion effects
        for o in st['objectives']:
            for p in o.get('clears',[])+o.get('targets',[]) if o['type']=='plant' else []:G[p[1]][p[0]]['ch']='.'
        for sc in d['secondaries']:
            if sc['stage']==si:
                for p in sc['targets']:
                    t=G[p[1]][p[0]]
                    if sc['type']=='hack':t['ch']='.'
                    if sc['type']=='build':t['ch']='.'
    print('OK' if ok else 'FAIL')
