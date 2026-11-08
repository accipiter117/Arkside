/* ===================== OUTFITS v2 (preview, lab only) =====================
   Faction clothing and weapons rebuilt for the Universal Base bodies.
   Not used by the game yet: lab/outfit-preview.html shows them next to
   the current look for sign-off.

   Fitted pieces are "shells": copies of the body's own triangles for a
   region (chosen by height, side and skin weights), pushed out along the
   normals and skinned to the same skeleton, so a sleeve or a plate bends
   with the arm or chest the way the body does. Small hard parts (buckles,
   pouches, the helmet, insignia) are rigid and ride a bone. Coordinates in
   the rules are normalised by body height: h is 0 at the soles and 1 at
   the crown, x is across (+ is the model's left), z is front (+).
   Vertex colours give panels, stripes and wear without extra draw calls. */

const OF_MATS=new Map();
function ofMat(kind,col){const k=kind+'|'+col;let m=OF_MATS.get(k);if(m)return m;
  const o={gradientMap:unitTex(),color:col};if(kind==='skin'||kind==='skinV')o.skinning=true;if(kind==='skinV'||kind==='rigidV')o.vertexColors=true;
  m=toonRim(new THREE.MeshToonMaterial(o));OF_MATS.set(k,m);return m}

// One level of midpoint subdivision of the body (cached), so narrow pieces
// like straps and trim cut cleanly. Skin weights of a new vertex are the
// average of its two parents, keeping the four strongest bones.
const OF_SUB=new WeakMap();
function ofSub(body){const g00=body.geometry;let g=OF_SUB.get(g00);if(g)return g;g=ofSub1(ofSub1(g00));OF_SUB.set(g00,g);return g}
function ofSub1(g0){let g;
  const pos=g0.attributes.position,nor=g0.attributes.normal,si=g0.attributes.skinIndex,sw=g0.attributes.skinWeight,reg=g0.attributes.region,idx=g0.index,n0=pos.count;
  const P=Array.from(pos.array),N=Array.from(nor.array),SI=Array.from(si.array),SW=Array.from(sw.array),R=reg?Array.from(reg.array):new Array(n0).fill(0);
  const edges=new Map();const mid=(a,b)=>{const k=a<b?a*1e6+b:b*1e6+a;let m=edges.get(k);if(m!=null)return m;m=P.length/3;
    for(let j=0;j<3;j++){P.push((P[a*3+j]+P[b*3+j])/2);N.push((N[a*3+j]+N[b*3+j])/2)}
    const w=new Map();for(const v of[a,b])for(let j=0;j<4;j++){const bi=SI[v*4+j],ww=SW[v*4+j]/2;if(ww>0)w.set(bi,(w.get(bi)||0)+ww)}
    const top=[...w.entries()].sort((x,y)=>y[1]-x[1]).slice(0,4);let sum=0;for(const t of top)sum+=t[1];for(let j=0;j<4;j++){SI.push(top[j]?top[j][0]:0);SW.push(top[j]?top[j][1]/sum:0)}
    R.push(R[a]===R[b]?R[a]:Math.min(R[a],R[b]));edges.set(k,m);return m};
  const I=[],nt=idx?idx.count/3:n0/3,ix=k=>idx?idx.getX(k):k;
  for(let t=0;t<nt;t++){const a=ix(t*3),b=ix(t*3+1),c=ix(t*3+2),ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);I.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca)}
  g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));const na=new THREE.Float32BufferAttribute(N,3);g.setAttribute('normal',na);
  for(let i=0;i<na.count;i++){const x=na.getX(i),y=na.getY(i),z=na.getZ(i),l=Math.hypot(x,y,z)||1;na.setXYZ(i,x/l,y/l,z/l)}
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));g.setAttribute('region',new THREE.Float32BufferAttribute(R,1));g.setIndex(I);
  return g}

// Body geometry info, cached per template mesh geometry.
const OF_INFO=new WeakMap();
function ofInfo(body){const g=body.geometry;let I=OF_INFO.get(g);if(I)return I;
  const pos=g.attributes.position,n=pos.count;g.computeBoundingBox();const bb=g.boundingBox,H=bb.max.y-bb.min.y,cx=(bb.max.x+bb.min.x)/2;
  // the body's own centre line in z, measured at chest height, so "front" means in front of the torso
  let zs=0,zn=0;for(let i=0;i<n;i++){const h=(pos.getY(i)-bb.min.y)/H;if(h>.6&&h<.75&&Math.abs(pos.getX(i)-cx)<H*.08){zs+=pos.getZ(i);zn++}}
  const cz=zn?zs/zn:0,names=body.skeleton.bones.map(b=>b.name);
  // landmarks from the bind pose (bone positions in mesh space), normalised like the rules
  const L={},bp=nm=>{const bi=names.indexOf(nm);if(bi<0)return null;const p=new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(body.skeleton.boneInverses[bi]).invert());return{h:(p.y-bb.min.y)/H,x:(p.x-cx)/H,z:(p.z-cz)/H}};
  const _L0=0;for(const[k,nm]of[['neck','neck_01'],['head','Head'],['chest','spine_03'],['belly','spine_01'],['waist','pelvis'],['shoulder','upperarm_l'],['elbow','lowerarm_l'],['wrist','hand_l'],['hip','thigh_l'],['knee','calf_l'],['ankle','foot_l']])L[k]=bp(nm);
  L.belt=(L.waist.h+L.belly.h)/2;
  // front and back surface of the torso by height (centre strip), for placing rigid parts flush
  const fz=new Map(),bz=new Map();for(let i=0;i<n;i++){const x=(pos.getX(i)-cx)/H;if(Math.abs(x)>.03)continue;const hb=Math.round((pos.getY(i)-bb.min.y)/H*100),z=(pos.getZ(i)-cz)/H;if(hb<40||hb>90)continue;fz.set(hb,Math.max(fz.get(hb)??-9,z));bz.set(hb,Math.min(bz.get(hb)??9,z))}
  const front=h=>fz.get(Math.round(h*100))??.06,back=h=>bz.get(Math.round(h*100))??-.06;
  const fxz=new Map();for(let i=0;i<n;i++){const hb=Math.round((pos.getY(i)-bb.min.y)/H*100);if(hb<40||hb>90)continue;const xb=Math.round((pos.getX(i)-cx)/H*50),z=(pos.getZ(i)-cz)/H,k=hb*1000+xb;fxz.set(k,Math.max(fxz.get(k)??-9,z))}
  const frontAt=(h,x)=>fxz.get(Math.round(h*100)*1000+Math.round(x*50))??front(h);
  I={H,y0:bb.min.y,cx,cz,names,n,L,front,back,frontAt};OF_INFO.set(g,I);return I}

// Build a skinned shell. rule(v) returns false to drop a vertex, or an object
// {off, col} (offset in body heights, vertex colour). A triangle is kept when
// all three of its vertices are kept.
function ofShell(body,rule,mat,outline,opt={}){const g=ofSub(body),I=ofInfo(body),pos=g.attributes.position,nor=g.attributes.normal,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,reg=g.attributes.region,idx=g.index;
  const n=g.attributes.position.count,keep=new Int32Array(n).fill(-1),offs=new Float32Array(n),cols=[];let cnt=0;const v={};
  const W=name=>{const bi=I.names.indexOf(name);if(bi<0)return 0;let w=0;for(let j=0;j<4;j++){const ii=[si.getX(v.i),si.getY(v.i),si.getZ(v.i),si.getW(v.i)][j];if(ii===bi)w+=[sw.getX(v.i),sw.getY(v.i),sw.getZ(v.i),sw.getW(v.i)][j]}return w};
  const res=[];
  for(let i=0;i<n;i++){v.i=i;v.h=(pos.getY(i)-I.y0)/I.H;v.x=(pos.getX(i)-I.cx)/I.H;v.z=(pos.getZ(i)-I.cz)/I.H;v.r=reg?Math.round(reg.getX(i)):0;v.ny=nor.getY(i);v.nz=nor.getZ(i);v.nx=nor.getX(i);v.w=W;v.ax=Math.abs(v.x);v.L=I.L;
    const r=rule(v);res.push(r||null)}
  const tri=[];const ix=idx?(k=>idx.getX(k)):(k=>k),nt=(idx?idx.count:n)/3;
  for(let t=0;t<nt;t++){const a=ix(t*3),b=ix(t*3+1),c=ix(t*3+2);if(res[a]&&res[b]&&res[c])tri.push(a,b,c)}
  if(!tri.length)return null;
  // flatten: pull the front (and back) of a plate towards the furthest point at that height, so it reads as a hard plate, not muscles
  const flatZ=new Map(),FB=30;if(opt.flat){for(const o of tri){const h=Math.round((pos.getY(o)-I.y0)/I.H*FB),z=pos.getZ(o),e=flatZ.get(h)||[-1e9,1e9];e[0]=Math.max(e[0],z);e[1]=Math.min(e[1],z);flatZ.set(h,e)}}
  const flatAt=y=>{const f=(y-I.y0)/I.H*FB,a=Math.floor(f),t=f-a,A=flatZ.get(a)||flatZ.get(a+1),B=flatZ.get(a+1)||A;if(!A)return null;return[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t]};
  const map=new Map(),P=[],N=[],SI=[],SW=[],C=[],out=[];
  for(const o of tri){let k=map.get(o);if(k==null){k=map.size;map.set(o,k);const r=res[o],d=(r.off||0)*I.H;
      let pz=pos.getZ(o);if(opt.flat){const e=flatAt(pos.getY(o));if(e){const nz=nor.getZ(o);if(nz>.2)pz+=(e[0]-pz)*opt.flat*Math.min(1,nz*1.5);else if(nz<-.2)pz+=(e[1]-pz)*opt.flat*Math.min(1,-nz*1.5)}}
      P.push(pos.getX(o)+nor.getX(o)*d+(r.dx||0)*I.H,pos.getY(o)+nor.getY(o)*d+(r.dy||0)*I.H,pz+nor.getZ(o)*d+(r.dz||0)*I.H);N.push(nor.getX(o),nor.getY(o),nor.getZ(o));
      SI.push(si.getX(o),si.getY(o),si.getZ(o),si.getW(o));SW.push(sw.getX(o),sw.getY(o),sw.getZ(o),sw.getW(o));const c=new THREE.Color(r.col||'#ffffff');C.push(c.r,c.g,c.b)}out.push(k)}
  const ng=new THREE.BufferGeometry();ng.setAttribute('position',new THREE.Float32BufferAttribute(P,3));ng.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
  ng.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));ng.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));ng.setAttribute('color',new THREE.Float32BufferAttribute(C,3));ng.setIndex(out);
  if(opt.smooth)ng.computeVertexNormals();
  const m=new THREE.SkinnedMesh(ng,mat);m.bind(body.skeleton,body.bindMatrix);m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;body.parent.add(m);
  if(outline&&opt.outline){const ol=new THREE.SkinnedMesh(ng,rigOutlineMat(true));ol.bind(body.skeleton,body.bindMatrix);ol.frustumCulled=false;ol.userData.isOutline=true;body.parent.add(ol)}
  return m}

// A group that sits on a bone but takes positions in the body mesh's own
// (bind pose) space, so rigid parts can be placed with the same coordinates
// as the shells. Normalised: (x, h, z) as in the rules, sizes in body heights.
function ofFrame(body,bone){const I=ofInfo(body);body.updateMatrixWorld(true);bone.updateMatrixWorld(true);
  const M=new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(body.matrixWorld).multiply(new THREE.Matrix4().makeTranslation(I.cx,I.y0,I.cz)).multiply(new THREE.Matrix4().makeScale(I.H,I.H,I.H));
  const f=new THREE.Group();f.matrixAutoUpdate=false;f.matrix.copy(M);bone.add(f);return f}
function ofBox(p,w,h,d,mat,x,y,z,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;p.add(m);return m}
function ofCyl(p,r1,r2,h,mat,x,y,z,seg=10,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;p.add(m);return m}
// Rigid bits get toon outlines from the existing bake (one mesh per material).
function ofBake(f,outline){f.userData.attach=true;bakeGroup(f,outline)}

// Texture for insignia and stencils.
let OF_TX=null;
function ofTex(){if(OF_TX)return OF_TX;OF_TX={};const cv=(s,draw)=>{const c=document.createElement('canvas');c.width=c.height=s;draw(c.getContext('2d'),s);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t};
  OF_TX.ark=cv(64,(g,s)=>{g.fillStyle='#e9eef1';g.fillRect(0,0,s,s);g.fillStyle='#2a7fbd';g.beginPath();g.moveTo(s/2,6);g.lineTo(s-8,s*.42);g.lineTo(s/2,s-6);g.lineTo(8,s*.42);g.closePath();g.fill();g.fillStyle='#e9eef1';g.beginPath();g.moveTo(s/2,18);g.lineTo(s-20,s*.42);g.lineTo(s/2,s-18);g.lineTo(20,s*.42);g.closePath();g.fill();g.fillStyle='#2a7fbd';g.fillRect(s/2-3,14,6,s-28)});
  OF_TX.res=cv(64,(g,s)=>{g.clearRect(0,0,s,s);g.strokeStyle='#e8e0d0';g.lineWidth=7;g.lineCap='round';g.beginPath();g.arc(s/2,s/2,s*.36,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(s*.28,s*.7);g.lineTo(s*.5,s*.24);g.lineTo(s*.72,s*.7);g.stroke()});
  OF_TX.sheet=cv(64,(g,s)=>{g.fillStyle='#ffffff';g.fillRect(0,0,s,s);for(let x=0;x<s;x+=8){g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x+5,0,3,s)}for(let i=0;i<5;i++){g.fillStyle='rgba(120,55,20,.35)';g.beginPath();g.arc(Math.random()*s,Math.random()*s,4+Math.random()*9,0,7);g.fill()}});
  return OF_TX}

function ofHead(ctx){const{tpl,bones,HS}=ctx,H=bones.Head,g=new THREE.Group(),s=tpl.headR/.15*1.08;g.quaternion.copy(tpl.bindQ.Head).invert();g.scale.set(s/HS[0],s/HS[1],s/HS[2]);
  const c=tpl.headC.clone().applyMatrix4(tpl.headInv);c.y+=tpl.headR*.2;g.position.set(c.x/HS[0],c.y/HS[1],c.z/HS[2]);g.userData.attach=true;H.add(g);return g}
function ofHelmetSec(ctx){const g=ofHead(ctx),wh=ofMat('rigid','#e3e8eb'),dk=ofMat('rigid','#1d2226'),bl=new THREE.MeshBasicMaterial({color:0x5fd0ff});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.172,20,12,0,Math.PI*2,0,Math.PI*.56),wh);dome.position.set(0,.01,-.008);dome.scale.set(1,1.02,1.08);g.add(dome);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.178,.18,.03,20,1,true),dk);rim.position.set(0,-.02,-.008);rim.scale.set(1,1,1.08);g.add(rim);
  const visor=new THREE.Mesh(new THREE.SphereGeometry(.18,24,8,Math.PI*.5-Math.PI*.34,Math.PI*.68,Math.PI*.4,Math.PI*.17),new THREE.MeshToonMaterial({color:0x1b2a36,gradientMap:unitTex(),transparent:true,opacity:.9}));visor.position.set(0,-.03,.0);visor.scale.set(1.03,1,1.3);visor.userData.noBake=true;g.add(visor);
  const glow=new THREE.Mesh(new THREE.TorusGeometry(.181,.0045,4,24,Math.PI*.6),bl);glow.rotation.set(Math.PI/2,0,Math.PI*.2);glow.position.set(0,-.012,.0);glow.scale.set(1.03,1.3,1);g.add(glow);
  for(const sx of[-1,1]){const ear=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.03,14),dk);ear.rotation.z=Math.PI/2;ear.position.set(sx*.172,-.03,0);g.add(ear)}
  const ridge=new THREE.Mesh(new THREE.BoxGeometry(.03,.02,.24),ofMat('rigid','#2a7fbd'));ridge.position.set(0,.17,-.02);g.add(ridge);
  bakeGroup(g,ctx.outline)}

/* ---------- Outfits by slot ----------
   Every creator slot has a piece per faction, in the faction's style:
   Security is issued kit in two or three crisp blocks (palette main colour,
   white plates, black leather, one blue accent); Resistance is scavenged
   kit in bold blocks (palette main colour for the top, sand or the second
   colour below, dark leather, one teal accent).
   Slots: top, armour, legs, gloves, headgear, facegear, plus class kit. */
const OF_STYLE={
  security:{plate:'#e1e6e9',plateE:'#9aa4ab',dark:'#23272c',darkS:'#353b42',acc:'#2a7fbd',accD:'#1f5f8e',metal:'#4a5e73',cloth2:'#3a4048',hood:'#2b3d55',skin:true},
  resistance:{plate:'#6f767b',plateE:'#5a4030',dark:'#3a2418',darkS:'#5a3a24',acc:'#2f8a86',accD:'#226a67',metal:'#7d8286',cloth2:'#857350',hood:'#857350'}};
// Bold versions of the creator palettes (the creator's own colours, a touch more saturated for the new look).
const OF_PAL={security:['#2b3d55','#465b70','#d4d9dc','#22272c','#5f7f9a','#7d848a'],resistance:['#7c321f','#857350','#4d5a32','#5a4636','#9a3d26','#2e2b28']};
function ofKit(ctx){const{look,meshes,bones,outline}=ctx,body=meshes.find(m=>m.userData.role==='Skin');if(!body)return null;const I=ofInfo(body),L=I.L,f=look.faction,St=OF_STYLE[f],sec=f==='security';
  const c1=OF_PAL[f][look.primary]||OF_PAL[f][0],c2raw=OF_PAL[f][look.secondary]||OF_PAL[f][1],c2=c2raw===c1?(sec?'#3a4048':'#857350'):c2raw;
  return{ctx,look,body,bones,outline,I,L,St,sec,c1,c2,V:ofMat('skinV','#ffffff'),sh:L.shoulder.x,el:L.elbow.x,wr:L.wrist.x,
    S:(rule,o)=>ofShell(body,rule,ofMat('skinV','#ffffff'),outline,o||{}),F:bone=>ofFrame(body,bones[bone]||bones.spine_03),done:f2=>{f2.userData.attach=true;bakeGroup(f2,outline)}}}

// torso garment: sleeves 'none' (tank), 'short', 'elbow', 'long'; open front below the chest; collar band
function ofTorso(K,{col,colD,off=.005,sleeves='long',open=0,collar=true,hood=false,zip=null,yoke=null}){const{L,sh,el,wr}=K;const lim={none:sh-.035,short:sh+.055,elbow:el-.03,long:wr-.022}[sleeves];
  K.S(v=>{if(!(v.r===1||v.r===2||v.r===3||v.r===4))return false;if(v.r===2&&v.h<L.belt-.012)return false;if(v.h>L.neck.h-.004)return false;if(v.r>=3&&v.ax>lim)return false;if(sleeves==='none'&&v.ax>lim)return false;
    if(open&&v.z>0&&v.ax<(v.h<L.chest.h?open:open*.4))return false;
    const cuff=sleeves!=='none'&&v.ax>lim-.025&&v.r>=3,hem=v.h<L.belt+.012,col2=collar&&v.h>L.neck.h-.026,z=zip&&v.z>0&&v.ax<.006,y=yoke&&v.h>L.shoulder.h-.03&&v.ax<K.sh+.03;
    return{off:cuff?off+.004:col2?off+.007:off,col:z?zip:y?yoke:(cuff||hem||col2)?colD:col}},{smooth:true})}
function ofLegs(K,{col,colD,off=.0045,stripe=null,patch=null,pads=null}){const{L}=K;
  K.S(v=>{if(v.r<1||v.r>2||v.h<K.L.ankle.h+.04||v.h>L.belt+.006)return false;const st=stripe&&Math.abs(v.nx)>.85&&v.r===2,pt=patch&&v.x>0&&v.z>L.knee.z-.01&&Math.abs(v.h-L.knee.h)<.03,hem=v.h<L.ankle.h+.055;return{off:hem?off+.002:off,col:st?stripe:pt?patch:hem?colD:col}},{smooth:true});
  if(pads)K.S(v=>{if(v.r!==2||v.z<L.knee.z+.005||v.h<L.knee.h-.028||v.h>L.knee.h+.03)return false;return{off:.009,col:(v.h<L.knee.h-.02||v.h>L.knee.h+.022)?pads[1]:pads[0]}},{smooth:true})}
function ofBoots(K,col,sole){K.S(v=>{if(!(v.r===6||(v.r===2&&v.h<K.L.ankle.h+.06)))return false;return{off:.0065,col:v.h<.016?sole:col}})}
function ofGloves(K,kind,col){if(kind==='none')return;const{wr}=K;
  if(kind==='tactical')K.S(v=>(v.r===5||(v.r===4&&v.ax>wr-.02))?{off:.004,col}:false);
  else K.S(v=>((v.r===4||v.r===5)&&v.ax>wr-.03&&v.ax<wr+.035)?{off:.0045,col}:false)}
function ofBelt(K,col){const{L}=K;K.S(v=>(v.r>=1&&v.r<=2&&Math.abs(v.h-L.belt)<.012&&v.ax<.18)?{off:.016,col}:false)}
function ofStrap(K,col,width=.012,off=.02,side=1){const{L,sh}=K,ax=side*.08,ah=L.neck.h-.03,bx=-side*.09,bh=L.belt+.015,dx=bx-ax,dh=bh-ah,len=Math.hypot(dx,dh);
  K.S(v=>{if(v.r>2&&v.r!==3)return false;if(v.r===3&&v.ax>sh+.02)return false;const d=Math.abs(dx*(v.h-ah)-dh*(v.x-ax))/len;if(d>width)return false;const t=((v.x-ax)*dx+(v.h-ah)*dh)/(len*len);if(t<-.08||t>1.05)return false;return{off,col}},{smooth:true});return{ax,ah,bx,bh}}
function ofSkirt(K,col,colD,closed){const{L,I}=K,top=L.belt-.012,bot=L.knee.h+.035,ph=top-bot,Sk=K.F('pelvis'),cm=ofMat('rigid',col),cd=ofMat('rigid',colD);
  const parts=closed?[[Math.PI*.12,Math.PI*1.76]]:[[Math.PI+.03,.6*Math.PI],[Math.PI-.03-.6*Math.PI,.6*Math.PI]];
  for(const[st,arc]of parts){const sk=new THREE.Mesh(new THREE.CylinderGeometry(.118,.15,ph,20,1,true,st,arc),cm);sk.material.side=THREE.DoubleSide;sk.position.set(0,bot+ph/2,L.hip.z-.004);sk.scale.set(1.05,1,.9);Sk.add(sk);
    const hem=new THREE.Mesh(new THREE.CylinderGeometry(.1495,.1505,.014,20,1,true,st,arc),cd);hem.material.side=THREE.DoubleSide;hem.position.set(0,bot+.007,L.hip.z-.004);hem.scale.set(1.05,1,.9);Sk.add(hem)}
  K.done(Sk)}
function ofCowl(K,col,colD){const{L,sh}=K;K.S(v=>{if(v.r>1&&v.r!==3)return false;if(v.h>L.neck.h+.01)return false;const dd=Math.hypot(v.ax*.85,L.neck.h-v.h);if(dd>.085)return false;if(v.z>0&&v.ax<(L.neck.h-v.h)*.7)return false;return{off:.028,col:dd>.075?colD:col}},{smooth:true})}
function ofNeckScarf(K,col,colD){const{L}=K;K.S(v=>{if(v.r>1||v.h<L.neck.h-.03||v.h>L.neck.h+.014||v.ax>.06-(L.neck.h-v.h)*.4)return false;return{off:.036,col:v.h>L.neck.h?col:colD}},{smooth:true})}
function ofPouches(K,frame,list,col){const fr=K.F(frame),m=ofMat('rigid',col);for(const[x,h,w,hh,d,ry]of list)ofBox(fr,w,hh,d,m,x,h,K.I.frontAt(h,x)+d/2+.006,0,ry||0,0);K.done(fr)}

// ---------- armour ----------
function ofArmour(K){const{look,sec,St,L,I,sh,el,wr}=K,a=look.armour;
  if(a==='riot'||(a==='scrap'&&sec)){// Security riot plates: white hard plates, shoulder caps, forearm guards, abdomen guard
    K.S(v=>{if(v.r>1||v.h<L.belly.h+.015||v.h>L.neck.h-.012)return false;const lim=sh-.012-(v.h>L.shoulder.h?(v.h-L.shoulder.h)*1.6:0);if(v.ax>lim)return false;const edge=v.h<L.belly.h+.028||v.h>L.neck.h-.024||v.ax>lim-.01,band=v.h<L.belly.h+.06;return{off:.016,col:edge?St.plateE:band?St.acc:St.plate}},{smooth:true,flat:.9});
    K.S(v=>{if(v.r>2||v.h<L.belt+.012||v.h>L.belly.h+.015||v.ax>.12)return false;return{off:.012,col:Math.floor((v.h-L.belt)*110)%2?St.metal:shade(St.metal,-20)}});
    K.S(v=>{if(v.r!==1&&v.r!==3)return false;if(v.ax<sh-.03||v.ax>sh+.045||v.h<L.shoulder.h-.012)return false;return{off:.018,col:v.ax>sh+.035?St.acc:St.plate}},{smooth:true});
    K.S(v=>{if(v.r!==4||v.ax<el+.02||v.ax>wr-.025||v.ny<-.35)return false;return{off:.011,col:v.ax>wr-.035||v.ax<el+.03?St.plateE:St.plate}},{smooth:true});return}
  if(a==='scrap'){// Resistance scrap: corrugated pauldron on the left shoulder and a patched chest plate
    K.S(v=>{if(v.x<0||(v.r!==1&&v.r!==3))return false;if(v.ax<sh-.045||v.ax>sh+.06||v.h<L.shoulder.h-.006)return false;const e=v.ax>sh+.05||v.ax<sh-.037;return{off:.03,col:e?'#5a4030':Math.floor(v.ax*140)%2?'#6f767b':'#61686d'}});
    K.S(v=>{if(v.r>1||v.z<0||v.h<L.chest.h-.03||v.h>L.chest.h+.06||v.x<-.01||v.x>.09)return false;return{off:.022,col:Math.floor(v.x*120)%2?'#7a4a2a':'#6a3e22'}},{smooth:true,flat:.8});
    const fr=K.F('upperarm_l'),rv=ofMat('rigid','#4a3020');for(const dx of[-.02,.02])for(const dz of[-.03,.03])ofCyl(fr,.004,.004,.006,rv,sh+dx,L.shoulder.h+.05,L.shoulder.z+dz,6);K.done(fr);
    ofStrap(K,St.dark,.009,.026,-1);return}
  if(a==='carrier'){// plate carrier: a slab front and back in a dark second colour, with a row of pouches
    const cc=sec?'#3a4048':'#6b5a3a',ce=shade(cc,-22);
    K.S(v=>{if(v.r>2||v.h<L.belt+.02||v.h>L.neck.h-.03)return false;const lim=sh-.03;if(v.ax>lim)return false;const edge=v.ax>lim-.01||v.h<L.belt+.032;return{off:.02,col:edge?ce:cc}},{smooth:true,flat:.95});
    K.S(v=>{if(v.r!==1&&v.r!==3)return false;if(v.ax<sh-.06||v.ax>sh-.025||v.h<L.shoulder.h)return false;return{off:.022,col:ce}});
    ofPouches(K,'spine_03',[[-.06,L.belly.h+.025,.03,.035,.02],[-.02,L.belly.h+.025,.03,.035,.02],[.02,L.belly.h+.025,.03,.035,.02],[.06,L.belly.h+.025,.03,.035,.02]],shade(cc,-12));
    if(sec)ofPouches(K,'spine_03',[[-.05,L.chest.h+.045,.03,.012,.004]],St.acc);return}
  if(a==='rig'){// chest rig: straps over both shoulders and a row of mag pouches across the stomach
    const rc=St.dark;for(const sd of[-1,1])K.S(v=>{if(v.r>1&&v.r!==3)return false;if(sd*v.x<0)return false;const x0=.055;if(Math.abs(v.ax-x0)>.013)return false;if(v.h<L.belly.h)return false;if(v.r===3)return false;return{off:.016,col:rc}},{smooth:true});
    ofPouches(K,'spine_01',[[-.07,L.belly.h-.005,.03,.04,.022],[-.025,L.belly.h-.005,.03,.04,.022],[.025,L.belly.h-.005,.03,.04,.022],[.07,L.belly.h-.005,.03,.04,.022]],rc);
    K.S(v=>{if(v.r>2||Math.abs(v.h-(L.belly.h-.03))>.008||v.ax>.15)return false;return{off:.018,col:rc}});return}}

// ---------- class kit ----------
function ofClassKit(K,cls){const{L,I,St,sec,bones}=K,fr=K.F('spine_03'),bz=h=>I.back(h)-.004,m=c=>ofMat('rigid',c);
  if(cls==='medic'){ofBox(fr,.11,.11,.05,m(sec?'#e1e6e9':'#b8a77c'),0,L.chest.h,bz(L.chest.h)-.025);const cr=sec?St.acc:'#c8321f';ofBox(fr,.05,.014,.006,m(cr),0,L.chest.h+.01,bz(L.chest.h)-.052);ofBox(fr,.014,.05,.006,m(cr),0,L.chest.h+.01,bz(L.chest.h)-.052);
    const arm=K.F('upperarm_l');ofCyl(arm,.03,.03,.022,m('#f2f2f2'),K.sh+.07,L.shoulder.h,L.shoulder.z,12,0,0,Math.PI/2);ofBox(arm,.006,.016,.004,m('#c8321f'),K.sh+.07,L.shoulder.h+.031,L.shoulder.z);K.done(arm)}
  else if(cls==='engineer'){ofBox(fr,.12,.13,.055,m(sec?'#3a4048':'#5a4636'),0,L.chest.h-.01,bz(L.chest.h)-.028);ofBox(fr,.11,.025,.06,m(sec?St.acc:'#c98a2a'),0,L.chest.h+.06,bz(L.chest.h)-.03);
    ofCyl(fr,.006,.006,.12,m('#9aa4ad'),.05,L.chest.h+.08,bz(L.chest.h)-.02,6,0,0,.3);ofBox(fr,.03,.012,.012,m('#9aa4ad'),.068,L.chest.h+.14,bz(L.chest.h)-.02,0,0,.3)}
  else if(cls==='operative'){ofBox(fr,.07,.09,.035,m(sec?'#22272c':'#3a2418'),.03,L.chest.h-.005,bz(L.chest.h)-.018);ofCyl(fr,.0025,.0025,.16,m('#22272c'),.055,L.chest.h+.1,bz(L.chest.h)-.02,5);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.006,6,4),new THREE.MeshBasicMaterial({color:sec?0x5fd0ff:0x5fe8c0}));tip.position.set(.055,L.chest.h+.18,bz(L.chest.h)-.02);fr.add(tip);
    const arm=K.F('lowerarm_r');ofBox(arm,.05,.012,.035,m('#22272c'),-(K.el+.07),L.shoulder.h+.024,L.shoulder.z,0,0,0);const sc=new THREE.Mesh(new THREE.PlaneGeometry(.04,.028),new THREE.MeshBasicMaterial({color:sec?0x5fd0ff:0x5fe8c0}));sc.rotation.x=-Math.PI/2;sc.position.set(-(K.el+.07),L.shoulder.h+.031,L.shoulder.z);arm.add(sc);K.done(arm)}
  else{ofBox(fr,.1,.1,.045,m(sec?'#3a4048':'#4d5a32'),0,L.chest.h-.01,bz(L.chest.h)-.022);ofBox(fr,.09,.03,.05,m(sec?'#2b3d55':'#3a2418'),0,L.chest.h+.05,bz(L.chest.h)-.025)}
  K.done(fr)}

// ---------- headgear and face gear ----------
const OF_HAIRCOVER=new Set(['beanie','bandana','helmet','riothelm','hood']);
function ofLathe(pts,seg=24,ps=0,pl=Math.PI*2){return new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)).reverse(),seg,ps,pl)}
function ofHeadgear(K){const{look,sec,St,ctx}=K,hgk=look.headgear;if(hgk==='none'&&!(look.top==='hoodie'&&!sec))return;
  if(hgk==='helmet'&&sec){ofHelmetSec(ctx);return}
  const g=ofHead(ctx),m=c=>{const mm=ofMat('rigid',c);return mm},dbl=c=>{const mm=new THREE.MeshToonMaterial({color:c,gradientMap:unitTex(),side:THREE.DoubleSide});return mm};
  const hood=(col,colD)=>{const prof=[[.001,.215],[.07,.205],[.13,.18],[.172,.13],[.19,.07],[.196,0],[.2,-.07],[.212,-.14],[.235,-.2],[.262,-.24]];
    const a=new THREE.Mesh(ofLathe(prof.slice(0,4)),dbl(col)),b=new THREE.Mesh(ofLathe(prof.slice(3),24,Math.PI*.3,Math.PI*1.4),dbl(col));for(const x of[a,b]){x.position.set(0,0,-.025);x.scale.set(1.05,1.02,1.12);g.add(x)}
    const pk=new THREE.Mesh(new THREE.ConeGeometry(.06,.1,10),m(col));pk.position.set(0,.15,-.17);pk.rotation.x=-1.25;g.add(pk);ofCowl(K,col,colD)};
  const k=hgk==='none'?'hood':hgk;
  if(k==='hood'){hood(St.hood,shade(St.hood,-18))}
  else if(k==='beanie'){const col=sec?'#22272c':K.c2;const b=new THREE.Mesh(ofLathe([[.001,.205],[.09,.19],[.15,.15],[.178,.09],[.186,.03],[.188,.0]]),m(col));b.position.set(0,.0,-.012);b.scale.set(1.04,1.04,1.1);g.add(b);
    const fold=new THREE.Mesh(new THREE.CylinderGeometry(.195,.193,.05,24,1,true),dbl(shade(col,-15)));fold.position.set(0,.022,-.012);fold.scale.set(1.04,1,1.1);g.add(fold);if(!sec){const pom=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),m(St.acc));pom.position.set(0,.215,-.012);g.add(pom)}}
  else if(k==='cap'){const col=sec?K.c1:'#4d5a32';const c=new THREE.Mesh(ofLathe([[.001,.19],[.1,.18],[.155,.14],[.176,.09],[.18,.05]]),m(col));c.position.set(0,.0,-.012);c.scale.set(1.04,1,1.1);g.add(c);
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.012,16,1,false,-Math.PI*.5,Math.PI),m(shade(col,-20)));brim.position.set(0,.055,.15);brim.scale.set(1.15,1,.9);brim.rotation.x=.12;g.add(brim);
    if(sec){const bd=new THREE.Mesh(new THREE.PlaneGeometry(.045,.045),new THREE.MeshBasicMaterial({map:ofTex().ark,transparent:true}));bd.position.set(0,.11,.188);bd.rotation.x=-.25;g.add(bd)}}
  else if(k==='bandana'){const col=sec?'#22272c':St.acc;const b=new THREE.Mesh(ofLathe([[.001,.2],[.1,.19],[.16,.14],[.18,.08],[.183,.04]]),m(col));b.position.set(0,.0,-.01);b.scale.set(1.03,1,1.09);g.add(b);
    for(const[a,l]of[[.4,.1],[-.2,.08]]){const t=new THREE.Mesh(new THREE.BoxGeometry(.035,l,.01),m(shade(col,-15)));t.position.set(.02,.03-l/2,-.2);t.rotation.set(.3,0,a);g.add(t)}}
  else if(k==='helmet'){// salvaged helmet: olive dome with a dent band and a strap
    const d=new THREE.Mesh(new THREE.SphereGeometry(.185,20,12,0,Math.PI*2,0,Math.PI*.55),m('#4d5a32'));d.position.set(0,.0,-.01);d.scale.set(1.04,1,1.12);g.add(d);
    const r=new THREE.Mesh(new THREE.TorusGeometry(.185,.012,6,24),m('#3a4426'));r.rotation.x=Math.PI/2;r.position.set(0,-.005,-.01);r.scale.set(1.04,1.12,1);g.add(r);
    const tape=new THREE.Mesh(new THREE.BoxGeometry(.05,.012,.2),m('#b9a476'));tape.position.set(.06,.16,-.01);tape.rotation.z=-.4;g.add(tape)}
  else if(k==='riothelm'){if(sec)ofHelmetSec(ctx);const sh2=new THREE.Mesh(new THREE.SphereGeometry(.2,24,10,Math.PI*.5-Math.PI*.36,Math.PI*.72,Math.PI*.36,Math.PI*.36),new THREE.MeshToonMaterial({color:sec?0xbfe6ff:0xc8d0b0,gradientMap:unitTex(),transparent:true,opacity:.45}));sh2.position.set(0,-.01,.0);sh2.scale.set(1.02,1,1.28);g.add(sh2);
    const chin=new THREE.Mesh(new THREE.TorusGeometry(.17,.016,6,20,Math.PI*.7),m(sec?'#22272c':'#3a2418'));chin.rotation.set(Math.PI/2,0,Math.PI*.15);chin.position.set(0,-.12,.02);chin.scale.set(1.02,1.25,1);g.add(chin);
    if(!sec){const d=new THREE.Mesh(new THREE.SphereGeometry(.185,20,12,0,Math.PI*2,0,Math.PI*.5),m('#5a4636'));d.position.set(0,.0,-.01);d.scale.set(1.04,1,1.12);g.add(d)}}
  else if(k==='headset'){const b=new THREE.Mesh(new THREE.TorusGeometry(.185,.012,6,24,Math.PI),m(St.dark));b.rotation.z=0;b.position.set(0,.0,-.01);g.add(b);
    for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.035,14),m(sec?'#22272c':'#5a3a24'));e.rotation.z=Math.PI/2;e.position.set(sx*.18,-.02,0);g.add(e)}
    const mic=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.15,5),m(St.dark));mic.rotation.set(Math.PI/2,0,.5);mic.position.set(-.13,-.08,.1);g.add(mic);const tip=new THREE.Mesh(new THREE.SphereGeometry(.014,6,4),m(St.acc));tip.position.set(-.07,-.1,.17);g.add(tip)}
  else if(k==='goggles'){const band=new THREE.Mesh(new THREE.TorusGeometry(.172,.011,6,24),m('#2b2622'));band.rotation.x=Math.PI/2-(sec?0:.25);band.position.set(0,sec?.0:.075,0);band.scale.set(1.02,1.1,1);g.add(band);
    for(const sx of[-1,1]){const lens=new THREE.Mesh(new THREE.CylinderGeometry(.036,.038,.03,14),m(sec?'#22272c':'#7a5331'));lens.rotation.x=Math.PI/2-(sec?0:.35);lens.position.set(sx*.048,sec?.0:.12,sec?.17:.14);g.add(lens);
      const gl=new THREE.Mesh(new THREE.CircleGeometry(.028,14),new THREE.MeshBasicMaterial({color:sec?0x5fd0ff:0x9fd6c8}));gl.position.set(sx*.048,sec?.0:.126,sec?.186:.157);gl.rotation.x=sec?0:-.35;g.add(gl)}}
  bakeGroup(g,ctx.outline)}
function ofFacegear(K){const{look,sec,St,ctx}=K,f=look.facegear;if(f==='none')return;const g=ofHead(ctx),m=c=>ofMat('rigid',c);
  if(f==='mask'){const col=sec?'#22272c':St.acc;const mk=new THREE.Mesh(new THREE.SphereGeometry(.168,22,8,Math.PI*.5-Math.PI*.4,Math.PI*.8,Math.PI*.6,Math.PI*.3),m(col));mk.material=new THREE.MeshToonMaterial({color:col,gradientMap:unitTex(),side:THREE.DoubleSide});mk.position.set(0,-.005,.004);mk.scale.set(1.05,1,1.2);g.add(mk);if(!sec)ofNeckScarf(K,St.acc,St.accD)}
  else if(f==='respirator'){const col=sec?'#22272c':'#5a4636';const sn=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,.07,12),m(col));sn.rotation.x=Math.PI/2;sn.position.set(0,-.07,.17);g.add(sn);
    for(const sx of[-1,1]){const fl=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.04,10),m(sec?St.acc:'#7a7f84'));fl.rotation.set(Math.PI/2,0,sx*.9);fl.position.set(sx*.07,-.09,.15);g.add(fl)}
    const st=new THREE.Mesh(new THREE.TorusGeometry(.17,.008,4,20),m(St.dark));st.rotation.x=Math.PI/2-.2;st.position.set(0,-.05,-.01);st.scale.set(1.02,1.12,1);g.add(st)}
  else if(f==='shades'){for(const sx of[-1,1]){const l=new THREE.Mesh(new THREE.BoxGeometry(.06,.028,.01),m('#14171a'));l.position.set(sx*.045,.005,.175);l.rotation.y=sx*.2;g.add(l)}ofBox(g,.03,.006,.006,m('#14171a'),0,.012,.18);
    for(const sx of[-1,1])ofBox(g,.006,.006,.14,m('#14171a'),sx*.165,.01,.1)}
  else if(f==='hud'){const v=new THREE.Mesh(new THREE.SphereGeometry(.18,24,6,Math.PI*.5-Math.PI*.3,Math.PI*.6,Math.PI*.46,Math.PI*.07),new THREE.MeshBasicMaterial({color:sec?0x5fd0ff:0x9fe8c0,transparent:true,opacity:.75,side:THREE.DoubleSide}));v.position.set(0,-.01,0);v.scale.set(1.02,1,1.28);g.add(v);
    ofBox(g,.02,.03,.03,m(St.dark),-.175,.0,.08)}
  bakeGroup(g,ctx.outline)}

// ---------- the whole outfit ----------
function ofOutfit(ctx){const K=ofKit(ctx);if(!K)return;const{look,sec,St,c1,c2,L}=K;
  // legs
  const legC=sec?(look.legs==='armoured'?c1:c1):(look.legs==='jeans'?'#3b4a63':c2);
  ofLegs(K,{col:legC,colD:shade(legC,-18),stripe:sec&&look.legs==='jeans'?St.acc:null,patch:!sec&&look.legs==='armoured'?'#6b5a3a':null,pads:look.legs==='armoured'?(sec?[St.plate,St.plateE]:['#3a3330','#2a2420']):null});
  if(look.legs==='cargo'){const ps=[];for(const sd of['thigh_l','thigh_r']){const fr=K.F(sd),sx=sd==='thigh_l'?1:-1,hh=(L.hip.h+L.knee.h)/2;ofBox(fr,.012,.05,.05,ofMat('rigid',shade(legC,-12)),sx*(L.hip.x+.05),hh,L.hip.z+.005);K.done(fr)}}
  ofBoots(K,St.dark,sec?'#121416':'#1a120c');
  ofGloves(K,look.gloves,St.dark);
  // top
  const t=look.top,col=c1,colD=shade(c1,-22);
  if(t==='tee')ofTorso(K,{col,colD,sleeves:'short'});
  else if(t==='tank')ofTorso(K,{col,colD,sleeves:'none',collar:false});
  else if(t==='long')ofTorso(K,{col,colD,sleeves:sec?'long':'elbow',zip:sec?St.acc:null});
  else if(t==='hoodie')ofTorso(K,{col,colD,sleeves:'long',off:.008,zip:sec?'#22272c':null,yoke:sec?shade(c1,-12):null});
  else if(t==='jacket'){ofTorso(K,{col,colD,sleeves:'long',off:.007,open:sec?0:.05,zip:sec?St.acc:null,yoke:sec?St.plate:null});ofSkirt(K,col,colD,sec)}
  ofBelt(K,St.dark);
  ofArmour(K);ofClassKit(K,look.cls);ofHeadgear(K);ofFacegear(K);
  // the base Ark Authority badge on every Security top
  if(sec){const T=K.F('spine_03'),ch=L.chest.h+.03,bd=new THREE.Mesh(new THREE.PlaneGeometry(.026,.026),new THREE.MeshBasicMaterial({map:ofTex().ark,transparent:true}));bd.position.set(-.045,ch,K.I.frontAt(ch,-.045)+(look.armour==='riot'?.02:look.armour==='carrier'?.024:.01));T.add(bd);T.userData.attach=true}}

/* ---------- Weapons, faction finishes (the rifle first) ---------- */
function ofWeapon(k,look,K){if(k!=='rifle')return null;const sec=look.faction==='security',g=new THREE.Group(),{box,cylZ}=K;
  if(sec){const bk='#22262b',gm='#30353b',lt='#3a4048';
    box(.06,.09,.36,gm,g,0,.01,.1);box(.062,.02,.3,bk,g,0,.065,.1);for(let i=0;i<6;i++)box(.064,.008,.012,'#15181b',g,0,.077,.0+i*.045);
    box(.05,.075,.22,bk,g,0,-.005,-.2);box(.054,.03,.06,lt,g,0,-.04,-.29);
    box(.068,.07,.22,lt,g,0,.0,.36);cylZ(.014,.16,bk,g,0,.012,.55);cylZ(.022,.05,bk,g,0,.012,.64);
    box(.045,.13,.065,bk,g,0,-.1,.15).rotation.x=.22;box(.04,.1,.05,bk,g,0,-.07,-.01).rotation.x=.3;
    cylZ(.022,.12,'#1a1d20',g,0,.1,.1);const lens=new THREE.Mesh(new THREE.CircleGeometry(.018,12),new THREE.MeshBasicMaterial({color:0x5fd0ff}));lens.position.set(0,.1,.161);g.add(lens);
    cylZ(.016,.06,'#1a1d20',g,.045,.0,.42);const torch=new THREE.Mesh(new THREE.CircleGeometry(.013,10),new THREE.MeshBasicMaterial({color:0xeaf6ff}));torch.position.set(.045,0,.451);g.add(torch);
    box(.008,.02,.08,'#2a7fbd',g,-.035,.02,.08)}
  else{const wd='#8a5a32',wdD='#6a4224',mt='#3a3a36',tape='#c9b48c';
    box(.062,.095,.34,mt,g,0,.01,.08);box(.05,.09,.22,wd,g,0,-.01,-.2);box(.052,.095,.02,wdD,g,0,-.01,-.11);
    box(.07,.08,.2,wd,g,0,0,.32);for(const z of[.26,.3,.38])box(.074,.084,.014,tape,g,0,0,z);
    cylZ(.016,.22,mt,g,0,.01,.53);box(.02,.03,.02,'#5a5a52',g,0,.04,.6);
    const mag=box(.05,.15,.07,'#5a4a32',g,0,-.1,.13);mag.rotation.x=.38;box(.052,.03,.072,tape,g,0,-.09,.13).rotation.x=.38;
    box(.04,.1,.05,mt,g,0,-.07,-.01).rotation.x=.3;box(.03,.04,.1,mt,g,0,.08,.1);
    const rag=box(.04,.06,.012,'#a5462f',g,.03,-.03,.47);rag.rotation.z=.4}
  return{g,fore:new THREE.Vector3(0,-.04,.3),barrels:null}}

// Build a unit in the new outfit (preview).
function buildOutfit(look,wkey,cls,opts={}){const sec=look.faction==='security';
  return buildBase(look,wkey,cls,Object.assign({},opts,{bare:true,noGear:true,coverHair:OF_HAIRCOVER.has(look.headgear)||(!sec&&look.top==='hoodie'&&look.headgear==='none'),
    weapon:(k,l,K)=>ofWeapon(k,l,K)||weaponModel(k,sec?'#3a4048':'#7a5331','#2b2e32','#4a4f55',K.box,K.cylZ,K.mesh,FACTIONS[l.faction].accent),
    after:ctx=>{ctx.outline=opts.outline!==false;ofOutfit(ctx)}}))}
