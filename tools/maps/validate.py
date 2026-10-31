import heapq,sys
import os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));from maps import M
OBJ='CwXT'
def parse(d):
    N=len(d['h']);G=[]
    for z in range(N):
        row=[]
        for x in range(N):
            hc=d['h'][z][x];ch=d['m'][z][x]
            assert len(d['h'][z])==N and len(d['m'][z])==N,(z,d['h'][z],d['m'][z])
            t=dict(x=x,z=z,h=int(hc)/2,ch=ch,water=ch=='~',obj=ch in OBJ,pas={'n':'light','g':'nonheavy'}.get(ch))
            row.append(t)
        G.append(row)
    return G,N
def step(body,a,b):
    if b['water'] or b['obj']:return 0
    if b['pas']=='light' and body!='light':return 0
    if b['pas']=='nonheavy' and body=='heavy':return 0
    up=b['h']-a['h']
    if abs(up)<=.5:return 1
    if up>0:
        if body=='heavy':return 0
        if up<=1:return 1 if body=='light' else 2
        if up<=2 and body=='light':return 2
        return 0
    dn=-up
    if dn<=1:return 1
    if dn<=2 and body!='heavy':return 1
    return 0
def reach_all(G,N,body,starts):
    dist={};pq=[]
    for s in starts:dist[s]=0;heapq.heappush(pq,(0,s))
    while pq:
        d,(x,z)=heapq.heappop(pq)
        if d>dist[(x,z)]:continue
        for dx,dz in((1,0),(-1,0),(0,1),(0,-1)):
            nx,nz=x+dx,z+dz
            if not(0<=nx<N and 0<=nz<N):continue
            c=step(body,G[z][x],G[nz][nx])
            if not c:continue
            if d+c<dist.get((nx,nz),1e9):dist[(nx,nz)]=d+c;heapq.heappush(pq,(d+c,(nx,nz)))
    return dist
ok=True
for k,d in M.items():
    G,N=parse(d)
    spawns=[(t['x'],t['z']) for r in G for t in r if t['ch'] in 'PQ']
    for e in d['enemies']:
        t=G[e[2]][e[1]]
        if t['water'] or t['obj'] or t['pas']:print(k,'BAD enemy tile',e,t['ch']);ok=False
    for w in d['reinf']:
        for e in w[1]:
            t=G[e[2]][e[1]]
            if t['water'] or t['obj'] or t['pas']:print(k,'BAD reinf tile',e,t['ch']);ok=False
    targets={'T':[],'H':[],'S':[],'E':[],'I':[],'Z':[]}
    for r in G:
        for t in r:
            if t['ch'] in targets:targets[t['ch']].append((t['x'],t['z']))
            if t['ch'] in 'HSEIZPQ' and (t['h']!=int(t['h'])):print(k,'feature on stair',t['x'],t['z'])
    lv={}
    for r in G:
        for t in r:
            if not t['water']:lv[t['h']]=lv.get(t['h'],0)+1
    out=[k,'levels',lv]
    for body in('light','medium','heavy'):
        R=reach_all(G,N,body,spawns)
        def near(p):return min([R.get((p[0]+dx,p[1]+dz),999) for dx in(-1,0,1) for dz in(-1,0,1)])
        res={}
        for ch,ps in targets.items():
            if not ps:continue
            if ch=='T':res[ch]=[near(p) for p in ps]
            else:res[ch]=[R.get(p,999) for p in ps]
        res['tiles']=len(R)
        out.append((body,res))
    print(*out)
print('OK' if ok else 'FAIL')
