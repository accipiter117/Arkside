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

/* ---------- Security: Ark Authority trooper ----------
   Clean issued kit: navy undersuit, white hard plates with blue trim,
   black belt, gloves and boots, visored helmet, chest badge and radio.
   Rules use the bind-pose landmarks (I.L): the arms are straight out to
   the sides there, so along the arm is |x|. */
function ofSecurity(ctx){const{look,meshes,bones,outline}=ctx,body=meshes.find(m=>m.userData.role==='Skin');if(!body)return;const I=ofInfo(body),L=I.L;
  const navy=FACTIONS.security.pal[look.primary]||'#2b3d55',white='#e1e6e9',edgeC='#9aa4ab',blk='#23272c',blue='#2a7fbd',steel='#4a5e73';
  const V=ofMat('skinV','#ffffff'),sh=L.shoulder.x,el=L.elbow.x,wr=L.wrist.x,armY=L.shoulder.h;
  // undersuit: everything below the neck except hands and feet; darker side panels on torso and legs
  ofShell(body,v=>{if(v.r<1||v.r>4||v.h>L.neck.h-.008)return false;const side=Math.abs(v.nx)>.8&&v.r<=2;return{off:.0022,col:side?shade(navy,-25):navy}},V,outline);
  // boots and gloves
  ofShell(body,v=>{if(!(v.r===6||(v.r===2&&v.h<L.ankle.h+.06)))return false;return{off:.0055,col:v.h<.018?'#121416':v.h>L.ankle.h+.05?'#3a3f45':blk}},V,outline);
  ofShell(body,v=>{if(!(v.r===5||(v.r===4&&v.ax>wr-.012)))return false;return{off:.003,col:blk}},V,outline);
  // chest and back plates, flattened so they read as hard armour
  ofShell(body,v=>{if(v.r>1||v.h<L.belly.h+.015||v.h>L.neck.h-.012)return false;const lim=sh-.012-(v.h>armY?(v.h-armY)*1.6:0);if(v.ax>lim)return false;
    const edge=v.h<L.belly.h+.028||v.h>L.neck.h-.024||v.ax>lim-.01,band=v.h<L.belly.h+.06;return{off:.014,col:edge?edgeC:band?blue:white}},V,outline,{smooth:true,flat:.9});
  // segmented abdomen guard and belt
  ofShell(body,v=>{if(v.r>2||v.h<L.belt+.012||v.h>L.belly.h+.015||v.ax>.12)return false;return{off:.01,col:Math.floor((v.h-L.belt)*110)%2?steel:shade(steel,-20)}},V,outline);
  ofShell(body,v=>{if(v.r<1||v.r>2||Math.abs(v.h-L.belt)>.012||v.ax>.17)return false;return{off:.012,col:blk}},V,outline);
  // shoulder caps over the top of the joint
  ofShell(body,v=>{if(v.r!==1&&v.r!==3)return false;if(v.ax<sh-.03||v.ax>sh+.045||v.h<armY-.012)return false;return{off:.015,col:v.ax>sh+.035?blue:white}},V,outline,{smooth:true});
  // forearm guards (top and outer side) and knee pads
  ofShell(body,v=>{if(v.r!==4||v.ax<el+.02||v.ax>wr-.025||v.ny<-.35)return false;return{off:.008,col:v.ax>wr-.035||v.ax<el+.03?edgeC:white}},V,outline,{smooth:true});
  ofShell(body,v=>{if(v.r!==2||v.z<L.knee.z+.005||v.h<L.knee.h-.028||v.h>L.knee.h+.03)return false;return{off:.009,col:(v.h<L.knee.h-.02||v.h>L.knee.h+.022)?edgeC:white}},V,outline,{smooth:true});
  // rigid: badge, radio on the left chest, belt pouches and buckle
  const T=ofFrame(body,bones.spine_03),Pl=ofFrame(body,bones.pelvis),dk=ofMat('rigid',blk),pm=ofMat('rigid','#353b42');
  const ch=L.chest.h+.03,fz=I.front(ch)+.016;
  const badge=new THREE.Mesh(new THREE.PlaneGeometry(.026,.026),new THREE.MeshBasicMaterial({map:ofTex().ark,transparent:true}));badge.position.set(-.045,ch,fz+.002);T.add(badge);
  ofBox(T,.02,.032,.012,dk,.045,ch,fz+.004,0,0,.05);ofCyl(T,.0018,.0018,.03,dk,.052,ch+.03,fz+.003,5);
  const bz=I.front(L.belt)+.014;for(const sx of[-.07,.07])ofBox(Pl,.028,.026,.02,pm,sx,L.belt-.005,I.frontAt(L.belt-.005,sx)+.016,0,-Math.sign(sx)*.35,0);ofBox(Pl,.024,.016,.006,ofMat('rigid','#9aa4ad'),0,L.belt,bz+.004);
  ofBake(T,outline);ofBake(Pl,outline);
  ofHelmetSec(ctx)}

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

/* ---------- Resistance: scavenger ----------
   Layered, patched and mismatched: a work shirt with sleeves rolled to the
   elbow, an open canvas vest over it, patched trousers, worn boots, a
   scarf, a bandolier, a scrap plate strapped on, wrist wraps and goggles
   pushed up on the forehead. */
function ofResistance(ctx){const{look,meshes,bones,outline}=ctx,body=meshes.find(m=>m.userData.role==='Skin');if(!body)return;const I=ofInfo(body),L=I.L;
  const P=FACTIONS.resistance.pal,shirt=P[look.primary]||'#7a3c22',trou=P[look.secondary]||'#8b7b55',vest='#525c3b',leather='#5a3a24';
  const V=ofMat('skinV','#ffffff'),sh=L.shoulder.x,el=L.elbow.x,wr=L.wrist.x;
  // work shirt, sleeves rolled to just above the elbow (the roll is a thicker, lighter cuff)
  ofShell(body,v=>{if(!(v.r===1||v.r===2||v.r===3)||v.h<L.belt-.012)return false;if(v.h>L.neck.h-.006)return false;if(v.ax>el-.03)return false;
    const roll=v.ax>el-.055;return{off:roll?.0095:.0058,col:roll?shade(shirt,25):(v.h>L.neck.h-.02?shade(shirt,-15):shirt)}},V,outline,{smooth:true});
  // open canvas vest: no sleeves, open down the front
  ofShell(body,v=>{if(v.r>2||v.h<L.belt+.01||v.h>L.neck.h-.015)return false;if(v.ax>sh-.02-(v.h>L.shoulder.h-.01?0:.012))return false;if(v.z>0&&v.ax<.012+(v.h>L.chest.h?(v.h-L.chest.h)*.45:0))return false;
    const hem=v.h<L.belt+.025,pocket=v.z>0&&v.ax>.04&&v.ax<.085&&v.h>L.belly.h&&v.h<L.belly.h+.04;return{off:.011,col:hem?shade(vest,-18):pocket?shade(vest,-10):vest}},V,outline,{smooth:true});
  // trousers with a knee patch on the left leg, turned-up hems
  ofShell(body,v=>{if(v.r<1||v.r>2||v.h<L.ankle.h+.035||v.h>L.belt+.006)return false;const patch=v.x>0&&v.z>L.knee.z-.01&&Math.abs(v.h-L.knee.h)<.03;const hem=v.h<L.ankle.h+.06;return{off:hem?.008:.0045,col:patch?'#6b5a3a':hem?shade(trou,-14):trou}},V,outline,{smooth:true});
  // worn boots
  ofShell(body,v=>{if(!(v.r===6||(v.r===2&&v.h<L.ankle.h+.045)))return false;return{off:.0065,col:v.h<.016?'#1c1712':v.h>L.ankle.h+.03?'#4a3626':'#3d2c20'}},V,outline);
  // wrist wraps and fingerless gloves
  ofShell(body,v=>{if(!((v.r===4||v.r===5)&&v.ax>wr-.035&&v.ax<wr+.03))return false;return{off:.005,col:Math.floor(v.ax*260)%2?'#c9b48c':'#b39c74'}},V,outline);
  // belt
  ofShell(body,v=>{if(v.r<1||v.r>2||Math.abs(v.h-L.belt)>.011||v.ax>.17)return false;return{off:.012,col:'#3a2a1e'}},V,outline);
  // scarf, thick and loose round the neck
  ofShell(body,v=>{if(v.r>1||v.h<L.neck.h-.04||v.h>L.neck.h+.012||v.ax>.068-(L.neck.h-v.h)*.4)return false;return{off:.028,col:v.h>L.neck.h-.004?'#4a6676':'#3b5566'}},V,outline,{smooth:true});
  // bandolier: a strap from the left shoulder down to the right hip, front and back
  {const ax=.075,ah=L.neck.h-.025,bx=-.085,bh=L.belt+.02,dx=bx-ax,dh=bh-ah,len=Math.hypot(dx,dh);
   ofShell(body,v=>{if(v.r>1)return false;const d=Math.abs(dx*(v.h-ah)-dh*(v.x-ax))/len;if(d>.013)return false;const t=((v.x-ax)*dx+(v.h-ah)*dh)/(len*len);if(t<-.05||t>1.05)return false;return{off:.016,col:d>.009?'#3a2418':leather}},V,outline,{smooth:true});}
  // rigid: bandolier from the right shoulder to the left hip with pouches, a scrap plate, belt pouches, the scarf's tail
  const T=ofFrame(body,bones.spine_03),Pl=ofFrame(body,bones.pelvis),N=ofFrame(body,bones.neck_01);
  const pm=ofMat('rigid','#6b4a2e'),ax=.075,ah=L.neck.h-.025,bx=-.085,bh=L.belt+.02,ang=Math.atan2(ah-bh,ax-bx);
  for(let i=1;i<6;i++){const t=.18+i*.12,h=ah+(bh-ah)*t,x=ax+(bx-ax)*t;ofBox(T,.018,.024,.013,pm,x,h,I.front(h)+.028,0,0,ang-Math.PI/2+Math.PI/2)}
  ofBox(Pl,.034,.03,.022,ofMat('rigid','#4f5a39'),-.085,L.belt-.02,I.frontAt(L.belt-.02,-.085)+.014,0,.35,0);ofBox(Pl,.026,.032,.02,pm,.09,L.belt-.022,I.frontAt(L.belt-.022,.09)+.012,0,-.5,0);
  ofBake(T,outline);ofBake(Pl,outline);N.parent.remove(N);
  // goggles pushed up on the forehead
  const g=ofHead(ctx),band=new THREE.Mesh(new THREE.TorusGeometry(.162,.011,6,24),ofMat('rigid','#2b2622'));band.rotation.x=Math.PI/2-.25;band.position.set(0,.075,0);band.scale.set(1,1.06,1);g.add(band);
  for(const sx of[-1,1]){const lens=new THREE.Mesh(new THREE.CylinderGeometry(.034,.036,.03,14),ofMat('rigid','#7a5331'));lens.rotation.x=Math.PI/2-.35;lens.position.set(sx*.045,.12,.14);g.add(lens);
    const gl=new THREE.Mesh(new THREE.CircleGeometry(.026,14),new THREE.MeshBasicMaterial({color:0x9fd6c8}));gl.position.set(sx*.045,.126,.157);gl.rotation.x=-.35;g.add(gl)}
  bakeGroup(g,ctx.outline)}

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
  return buildBase(look,wkey,cls,Object.assign({},opts,{bare:true,noGear:true,coverHair:sec,
    weapon:(k,l,K)=>ofWeapon(k,l,K)||weaponModel(k,sec?'#3a4048':'#7a5331','#2b2e32','#4a4f55',K.box,K.cylZ,K.mesh,FACTIONS[l.faction].accent),
    after:ctx=>{ctx.outline=opts.outline!==false;(sec?ofSecurity:ofResistance)(ctx)}}))}
