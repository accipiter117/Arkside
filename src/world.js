/* ===================== WORLD: the Ark around each map (overhaul stage C) =====================
   Turns each map from a board in a void into a slice of the Ark: a deck
   apron on stilts round the board, neighbouring stacks and shacks dropping
   into the sea, moored boats, rope bridges, spray at the stilts, light fog
   and the white Ark skyline with its needle tower. Each district theme
   (container, founders, industrial) gets its own prop kit, scattered by a
   seeded generator on the apron so props never block a tile.
   Static props are merged into one mesh per material (worldBake), so a
   whole kit costs a few draw calls. Low graphics thins the props, drops the
   distant detail and the dusk point lights. Called from buildScene. */

// ---------- merging ----------
function worldMerge(parts){let nv=0,ni=0;for(const{g}of parts){nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count}
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),uv=new Float32Array(nv*2),idx=nv>65535?new Uint32Array(ni):new Uint16Array(ni);let vo=0,io=0;const v=new THREE.Vector3(),nm=new THREE.Matrix3();
  for(const{g,m}of parts){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;nm.getNormalMatrix(m);
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);pos[(vo+i)*3]=v.x;pos[(vo+i)*3+1]=v.y;pos[(vo+i)*3+2]=v.z;
      if(n){v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();nor[(vo+i)*3]=v.x;nor[(vo+i)*3+1]=v.y;nor[(vo+i)*3+2]=v.z}if(u){uv[(vo+i)*2]=u.getX(i);uv[(vo+i)*2+1]=u.getY(i)}}
    const cnt=g.index?g.index.count:p.count;if(g.index)for(let i=0;i<cnt;i++)idx[io+i]=g.index.getX(i)+vo;else for(let i=0;i<cnt;i++)idx[io+i]=i+vo;
    if(m.determinant()<0)for(let i=io;i<io+cnt;i+=3){const t=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=t}vo+=p.count;io+=cnt}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.setIndex(new THREE.BufferAttribute(idx,1));out.computeBoundingSphere();return out}
// Merge every static mesh in a group into one mesh per material and add
// them to the scene. Meshes marked userData.live (animated) stay as they are.
function worldBake(grp,shadow=true){grp.updateMatrixWorld(true);const by=new Map(),live=[];
  grp.traverse(o=>{if(!o.isMesh)return;if(o.userData.live){live.push(o);return}const mt=o.material;if(!by.has(mt))by.set(mt,[]);by.get(mt).push({g:o.geometry,m:o.matrixWorld.clone()})});
  for(const[mt,parts]of by){const m=new THREE.Mesh(worldMerge(parts),mt);m.castShadow=shadow&&HI();m.receiveShadow=true;scene.add(m)}
  for(const o of live){const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();o.matrixWorld.decompose(p,q,s);o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);scene.add(o)}}

// ---------- textures (procedural, ours) ----------
let WTX=null;
function worldTex(){if(WTX)return WTX;const R=rng(911);WTX={};
  const noise=(g,s,n,a,cols)=>{for(let i=0;i<n;i++){g.fillStyle=cols[i%cols.length];g.globalAlpha=R()*a;g.fillRect(R()*s,R()*s,1+R()*3,1+R()*3)}g.globalAlpha=1};
  WTX.rust=cvTex((g,s)=>{g.fillStyle='#7a5e4c';g.fillRect(0,0,s,s);noise(g,s,700,.5,['#8f6b52','#4a382c','#a0583a','#5e4a3c']);g.strokeStyle='#3a2c22';g.lineWidth=3;g.strokeRect(1,1,s-2,s-2);
    g.fillStyle='#2b211a';for(const[x,y]of[[8,8],[s-8,8],[8,s-8],[s-8,s-8]]){g.beginPath();g.arc(x,y,3,0,7);g.fill()}g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1.5;for(let y=10;y<s;y+=14)for(let x=(y/14)%2?6:12;x<s;x+=14){g.beginPath();g.moveTo(x,y);g.lineTo(x+5,y-4);g.stroke()}});
  WTX.planks=cvTex((g,s)=>{for(let i=0;i<6;i++){g.fillStyle=['#8b6a48','#7a5c3e','#94734f'][i%3];g.fillRect(0,i*s/6,s,s/6-2);g.fillStyle='#3d2c1e';g.fillRect(0,i*s/6+s/6-2,s,2)}noise(g,s,500,.35,['#5a4330','#a88560']);g.fillStyle='#2a1d14';for(let i=0;i<6;i++){g.fillRect(6,i*s/6+6,3,3);g.fillRect(s-9,i*s/6+6,3,3)}});
  WTX.conc=cvTex((g,s)=>{g.fillStyle='#8f8a82';g.fillRect(0,0,s,s);noise(g,s,900,.4,['#77736c','#a6a199','#6b5a4a']);g.strokeStyle='#6c6862';g.lineWidth=2;g.strokeRect(1,1,s-2,s-2);g.fillStyle='rgba(0,0,0,.08)';for(let i=0;i<5;i++){g.beginPath();g.arc(R()*s,R()*s,6+R()*16,0,7);g.fill()}});
  WTX.grate=cvTex((g,s)=>{g.clearRect(0,0,s,s);g.strokeStyle='#6d6a64';g.lineWidth=4;for(let i=0;i<=s;i+=s/8){g.beginPath();g.moveTo(i,0);g.lineTo(i,s);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(s,i);g.stroke()}g.strokeStyle='#3a3834';g.lineWidth=6;g.strokeRect(0,0,s,s)});
  WTX.shack=cvTex((g,s)=>{g.fillStyle='#d2c4b0';g.fillRect(0,0,s,s);for(let x=0;x<s;x+=10){g.fillStyle='rgba(0,0,0,.16)';g.fillRect(x,0,3,s)}noise(g,s,500,.45,['#4a2a1a','#b06a3a','#2a1a12']);});
  WTX.chev=cvTex((g,s)=>{g.clearRect(0,0,s,s);g.fillStyle='#f3b33d';for(let i=0;i<2;i++){const o=i*s*.34;g.beginPath();g.moveTo(s*.16,s*.22+o);g.lineTo(s*.5,s*.06+o);g.lineTo(s*.84,s*.22+o);g.lineTo(s*.84,s*.38+o);g.lineTo(s*.5,s*.22+o);g.lineTo(s*.16,s*.38+o);g.closePath();g.fill()}});
  WTX.holo=cvTex((g,s)=>{g.clearRect(0,0,s,s);g.strokeStyle='#7fe8ff';g.lineWidth=3;g.strokeRect(6,6,s-12,s-12);g.fillStyle='#7fe8ff';g.font='bold 22px sans-serif';g.textAlign='center';g.fillText('ARK',s/2,s/2-4);g.font='bold 13px sans-serif';g.fillText('AUTHORITY',s/2,s/2+16);
    g.globalAlpha=.35;for(let y=0;y<s;y+=4)g.fillRect(0,y,s,1)});
  WTX.grateW=cvTex((g,s)=>{const gr=g.createLinearGradient(0,0,s,s);gr.addColorStop(0,'#123a46');gr.addColorStop(1,'#1d5563');g.fillStyle=gr;g.fillRect(0,0,s,s);g.fillStyle='rgba(255,255,255,.08)';for(let i=0;i<14;i++)g.fillRect(R()*s,R()*s,8+R()*16,2);g.drawImage(WTX.grate.image,0,0,s,s)});
  WTX.hazard=TX.hazard;return WTX}

// ---------- prop pieces ----------
const WM={};const wm=(c,tex,o)=>{const k=c+'|'+(tex||'')+(o?JSON.stringify(o):'');return WM[k]||(WM[k]=new THREE.MeshLambertMaterial(Object.assign({color:c},tex?{map:worldTex()[tex]}:{},o||{})))};
function wbox(g,w,h,d,mat,x,y,z,ry=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.rotation.y=ry;g.add(m);return m}
function wcyl(g,r1,r2,h,mat,x,y,z,seg=10){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);m.position.set(x,y,z);g.add(m);return m}
function wsph(g,r,mat,x,y,z){const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),mat);m.position.set(x,y,z);g.add(m);return m}

// A shack or container stack on stilts in the sea, with windows that light at dusk.
function worldShack(g,R,x,z,lit,theme){const s=new THREE.Group();const levels=1+Math.floor(R()*3),cols=CONT_COLS;
  for(let i=0;i<levels;i++){const c=cols[Math.floor(R()*cols.length)],w=1.6+R()*1.4,d=1+R()*.8;const b=wbox(s,w,.9,d,theme==='founders'?wm('#eef2f4'):wm(c,'corr'),(R()-.5)*.4,.45+i*.92,(R()-.5)*.3,R()<.3?Math.PI/2:0);
    if(R()<.7){const win=new THREE.Mesh(new THREE.PlaneGeometry(.26,.2),lit?new THREE.MeshBasicMaterial({color:R()<.5?0xffc062:0xffe0a0}):wm('#3a4048'));win.position.set(b.position.x+(R()-.5)*w*.5,b.position.y+.08,b.position.z+d/2+.01);s.add(win)}}
  if(theme!=='founders'&&R()<.6){const roof=wbox(s,2,.06,1.5,wm('#6e5a44','corr'),0,levels*.92+.02,0);roof.rotation.z=.12}
  for(const[sx,sz]of[[-.7,-.4],[.7,-.4],[-.7,.4],[.7,.4]])wcyl(s,.07,.08,1.4,wm('#3d3128'),sx,-.7,sz,6);
  s.position.set(x,-.25,z);s.rotation.y=R()*Math.PI*2;g.add(s);return s}

// ---------- the build ----------
function worldBuild(theme){if(!scene)return;const T=worldTex(),R=rng((M.id||'x').charCodeAt(0)*977+(M.id||'x').charCodeAt(1)*131+NX*7+NZ),lo=!HI(),lit=!!TM.lamps;
  const half={x:NX/2,z:NZ/2},AP=1.8,top=-.05,stat=new THREE.Group();
  // light fog that thickens with distance
  scene.fog.near=lo?40:26;scene.fog.far=lo?125:105;
  // deck apron round the board, on stilts
  const apMat=theme==='founders'?wm('#e2e6e8','conc'):theme==='industrial'?wm('#9a958c','rust'):wm('#a08a74','planks');
  const rim=[[0,-(half.z+AP/2),NX+AP*2,AP],[0,half.z+AP/2,NX+AP*2,AP],[-(half.x+AP/2),0,AP,NZ],[half.x+AP/2,0,AP,NZ]];
  for(const[x,z,w,d]of rim){const m=wbox(stat,w,.18,d,apMat,x,top-.09,z);m.material.map&&(m.material.map.repeat&&0)}
  const stM=wm(theme==='founders'?'#cfd5d8':'#4a3a2e');
  for(let x=-half.x-AP;x<=half.x+AP;x+=2)for(const z of[-half.z-AP+.15,half.z+AP-.15])wcyl(stat,.1,.12,1.6,stM,x,top-.9,z,6);
  for(let z=-half.z-AP;z<=half.z+AP;z+=2)for(const x of[-half.x-AP+.15,half.x+AP-.15])wcyl(stat,.1,.12,1.6,stM,x,top-.9,z,6);
  // railings on the apron's outer edge (gaps where bridges go)
  const railM=wm(theme==='founders'?'#f4f6f7':theme==='industrial'?'#e2b21f':'#c98a2c'),bridges=[];
  const edgeLen={x:NX+AP*2,z:NZ+AP*2};
  for(const sgn of[-1,1]){wbox(stat,edgeLen.x,.05,.05,railM,0,top+.42,sgn*(half.z+AP-.05));wbox(stat,.05,.05,edgeLen.z,railM,sgn*(half.x+AP-.05),top+.42,0);
    for(let x=-edgeLen.x/2;x<=edgeLen.x/2;x+=1.2)wbox(stat,.05,.42,.05,railM,x,top+.21,sgn*(half.z+AP-.05));for(let z=-edgeLen.z/2;z<=edgeLen.z/2;z+=1.2)wbox(stat,.05,.42,.05,railM,sgn*(half.x+AP-.05),top+.21,z)}
  // neighbouring stacks and shacks on stilts, dropping into the sea, some with rope bridges
  const nN=(theme==='founders'?6:12)>>(lo?1:0);
  for(let i=0;i<nN;i++){const side=Math.floor(R()*4),along=(R()-.5)*(side<2?NX:NZ),out=half.x+AP+2.2+R()*3;
    const[x,z]=side===0?[along,-(half.z+AP+2.2+R()*3)]:side===1?[along,half.z+AP+2.2+R()*3]:side===2?[-out,along*(NZ/NX)]:[out,along*(NZ/NX)];
    worldShack(stat,R,x,z,lit,theme);if(i<(lo?1:3))bridges.push([x,z,side])}
  for(const[x,z,side]of bridges){const ex=side<2?x:Math.sign(x)*(half.x+AP),ez=side<2?Math.sign(z)*(half.z+AP):z,len=Math.hypot(x-ex,z-ez);if(len<1)continue;
    const b=new THREE.Group();wbox(b,len,.05,.5,wm('#8b6a48','planks'),0,0,0);for(const sz of[-.25,.25]){wbox(b,len,.02,.02,wm('#3a2c22'),0,.4,sz);for(let k=-len/2;k<=len/2;k+=.5)wbox(b,.02,.4,.02,wm('#3a2c22'),k,.2,sz)}
    b.position.set((x+ex)/2,top+.1,(z+ez)/2);b.rotation.y=-Math.atan2(z-ez,x-ex);stat.add(b)}
  // the Ark's needle tower in the distance (with the existing skyline)
  if(!lo){const ark=new THREE.Group(),wmat=wm('#f2f5f7',null,{emissive:0x1a2024});wcyl(ark,.25,3.4,34,wmat,0,16,0,18);wcyl(ark,4.6,5.4,3,wmat,0,1.5,0,20);wsph(ark,.5,wm('#bfe6ff',null,{emissive:0x335566}),0,33.2,0);
    for(let i=0;i<5;i++){const h=6+R()*10;wcyl(ark,1.2+R(),1.6+R(),h,wmat,(R()-.5)*16,h/2,(R()-.5)*6,14)}ark.position.set(-30,-.4,-52);stat.add(ark)}
  // ---------- prop kits on the apron ----------
  const spots=[];for(let i=0;i<(lo?14:34);i++){const side=Math.floor(R()*4),t=R()-.5,o=.35+R()*(AP-.7);
    spots.push(side===0?[t*(NX+AP),-(half.z+o),0]:side===1?[t*(NX+AP),half.z+o,Math.PI]:side===2?[-(half.x+o),t*(NZ+AP),Math.PI/2]:[half.x+o,t*(NZ+AP),-Math.PI/2])}
  const at=(i)=>{const s=spots[i%spots.length];return{x:s[0],z:s[1],r:s[2]}};let si=0;const next=()=>at(si++);
  const live=[];const liveAdd=m=>{m.userData.live=true;live.push(m);return m};
  if(theme==='container'){// shanty: laundry, tarps, barrels, tanks, generators, plants, dishes, scrap, graffiti
    const CL=[0xe3672a,0xd8d0b8,0x3d6a8a,0x8a3b24,0xe3c25a,0x6b8a4a];
    for(let k=0;k<(lo?1:3);k++){const a=next(),b=next(),y=top+1.6;const pa=new THREE.Vector3(a.x,y,a.z),pb=new THREE.Vector3(b.x,y,b.z);if(pa.distanceTo(pb)>6||pa.distanceTo(pb)<1.2){continue}
      for(const p of[pa,pb])wcyl(stat,.03,.04,1.7,wm('#4a3a2e'),p.x,top+.85,p.z,5);const line=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,pa.distanceTo(pb),4),wm('#222'));line.position.copy(pa).lerp(pb,.5);line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),pb.clone().sub(pa).normalize());stat.add(line);
      const n=Math.floor(pa.distanceTo(pb)/.4);for(let i=1;i<n;i++){const c=new THREE.Mesh(new THREE.PlaneGeometry(.26,.34),wm('#'+CL[(i+k)%CL.length].toString(16).padStart(6,'0'),null,{side:THREE.DoubleSide}));c.position.copy(pa).lerp(pb,i/n);c.position.y-=.19;c.rotation.y=-Math.atan2(pb.z-pa.z,pb.x-pa.x);c.userData.sway=i*1.7+k;liveAdd(c);stat.add(c)}}
    for(let k=0;k<(lo?2:5);k++){const p=next();const g=new THREE.Group();const r=R();
      if(r<.25){for(let j=0;j<3;j++){wcyl(g,.18,.18,.5,wm(j%2?'#3b5b6b':'#a8432a'),(j-1)*.4,.25,0,10);wcyl(g,.185,.185,.06,wm('#2a2a2a'),(j-1)*.4,.42,0,10)}}
      else if(r<.45){wcyl(g,.38,.38,.9,wm('#3b5b6b'),0,.45,0,14);wcyl(g,.4,.4,.06,wm('#2a2a2a'),0,.92,0,14)}
      else if(r<.62){wbox(g,.7,.42,.42,wm('#5f6b4a'),0,.21,0);wcyl(g,.05,.05,.3,wm('#333'),.22,.55,0,6)}
      else if(r<.8){for(let j=0;j<3;j++){wcyl(g,.15,.12,.22,wm('#6a6d72'),(j-1)*.35,.11,0,10);wsph(g,.2,wm('#4f7a3a'),(j-1)*.35,.32,0)}}
      else{const d=new THREE.Mesh(new THREE.SphereGeometry(.34,12,8,0,Math.PI*2,0,.9),wm('#cfcfcf',null,{side:THREE.DoubleSide}));d.position.y=.9;d.rotation.x=-1;g.add(d);wcyl(g,.03,.03,.9,wm('#555'),0,.45,0,5)}
      g.position.set(p.x,top,p.z);g.rotation.y=p.r+R()*.6;stat.add(g)}
    for(let k=0;k<(lo?1:3);k++){const p=next();const t=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.2),wm(['#d8682e','#3d6a8a','#c7922c'][k%3],null,{side:THREE.DoubleSide}));t.position.set(p.x,top+1.25,p.z);t.rotation.set(-1.2,p.r,0);stat.add(t);for(const dx of[-.8,.8])wcyl(stat,.025,.03,1.3,wm('#4a3a2e'),p.x+Math.cos(p.r)*dx,top+.65,p.z-Math.sin(p.r)*dx,5)}
    for(let k=0;k<(lo?1:3);k++){const p=next();for(let j=0;j<5;j++){const b=wbox(stat,.2+R()*.3,.06+R()*.1,.2+R()*.3,wm(['#5b4a3a','#6a6d72','#8a3b24'][j%3]),p.x+(R()-.5)*.6,top+.05,p.z+(R()-.5)*.6,R()*3)}}}
  else if(theme==='founders'){// security: planters, bollards, cameras, light pylons, holo signs
    for(let k=0;k<(lo?3:7);k++){const p=next();const g=new THREE.Group();const r=R();
      if(r<.35){wbox(g,.9,.42,.5,wm('#f2f4f5'),0,.21,0);for(let j=0;j<3;j++)wsph(g,.18,wm('#5f8f4a'),(j-1)*.28,.5,0)}
      else if(r<.6){for(let j=0;j<3;j++){wcyl(g,.07,.08,.45,wm('#e8ecee'),(j-1)*.4,.22,0,10);wcyl(g,.075,.075,.05,wm('#2fa8d8'),(j-1)*.4,.4,0,10)}}
      else{wcyl(g,.05,.07,2.4,wm('#e8ecee'),0,1.2,0,8);wbox(g,.5,.08,.16,wm('#e8ecee'),.2,2.4,0);wbox(g,.42,.04,.12,new THREE.MeshBasicMaterial({color:lit?0xdff6ff:0xcfe6f2}),.2,2.35,0)}
      g.position.set(p.x,top,p.z);g.rotation.y=p.r;stat.add(g)}
    for(let k=0;k<(lo?1:3);k++){const p=next();wcyl(stat,.04,.05,1.6,wm('#e8ecee'),p.x,top+.8,p.z,6);const cam=new THREE.Group();wbox(cam,.16,.12,.28,wm('#2a2f33'),0,0,.08);wcyl(cam,.04,.04,.04,new THREE.MeshBasicMaterial({color:0xff4a3a}),0,0,.23,8).rotation.x=Math.PI/2;cam.position.set(p.x,top+1.62,p.z);cam.userData.cam=R()*6;liveAdd(cam);stat.add(cam)}
    for(let k=0;k<(lo?0:2);k++){const p=next();wcyl(stat,.03,.03,1.1,wm('#c8d0d4'),p.x,top+.55,p.z,6);const h=new THREE.Mesh(new THREE.PlaneGeometry(.9,.6),new THREE.MeshBasicMaterial({map:T.holo,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));h.position.set(p.x,top+1.4,p.z);h.rotation.y=p.r;h.userData.holo=k;liveAdd(h);stat.add(h)}}
  else{// industrial: pipes, valves, steam, hazard stripes, catwalks
    for(const sgn of[-1,1]){const pz=sgn*(half.z+AP-.45);for(let j=0;j<2;j++){const p=wcyl(stat,.09+j*.03,.09+j*.03,NX+AP,wm(j?'#7a6a5a':'#5f6b70'),0,top+.18+j*.24,pz+j*.2*sgn,10);p.rotation.z=Math.PI/2}
      for(let x=-half.x;x<=half.x;x+=3){const v=new THREE.Group();wcyl(v,.13,.13,.08,wm('#b8322a'),0,0,0,10).rotation.x=Math.PI/2;v.position.set(x,top+.45,pz-.12*sgn);stat.add(v)}}
    for(let k=0;k<(lo?2:4);k++){const p=next();const h=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.4),wm('#ffffff','hazard'));h.rotation.x=-Math.PI/2;h.rotation.z=p.r;h.position.set(p.x,top+.005,p.z);stat.add(h)}
    for(let k=0;k<(lo?0:2);k++){const p=next();const c=new THREE.Group();wbox(c,2.2,.06,.7,new THREE.MeshLambertMaterial({map:T.grate,transparent:true,alphaTest:.3,side:THREE.DoubleSide}),0,1.2,0);for(const sx of[-1,1])for(const sz of[-.3,.3])wcyl(c,.03,.03,1.2,wm('#e2b21f'),sx,.6,sz,5);c.position.set(p.x,top,p.z);c.rotation.y=p.r;stat.add(c)}
    if(!lo)for(let k=0;k<3;k++){const p=next();for(let j=0;j<3;j++){const st=new THREE.Mesh(new THREE.SphereGeometry(.14,6,5),new THREE.MeshLambertMaterial({color:0xf2f2f2,transparent:true,opacity:.45,depthWrite:false}));st.position.set(p.x,top+.5,p.z);st.userData.steam={x:p.x,z:p.z,ph:j/3,y0:top+.5};liveAdd(st);stat.add(st)}}}
  worldBake(stat);
  // ---------- animation for the live bits ----------
  const sway=live.filter(m=>m.userData.sway!=null),cams=live.filter(m=>m.userData.cam!=null),holo=live.filter(m=>m.userData.holo!=null),steam=live.filter(m=>m.userData.steam);
  if(live.length)ANIM.push((dt,t)=>{for(const c of sway)c.rotation.x=Math.sin(t*2+c.userData.sway)*.25;for(const c of cams)c.rotation.y=Math.sin(t*.4+c.userData.cam)*1.1;
    for(const h of holo)h.material.opacity=.6+.25*Math.sin(t*3+h.userData.holo);for(const s of steam){const k=((t*.35+s.userData.steam.ph)%1);s.position.y=s.userData.steam.y0+k*1.4;s.scale.setScalar(.6+k*1.6);s.material.opacity=.45*(1-k)}});
  // spray where the sea meets the stilts (High only)
  if(!lo){const spray=[];const sm2=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.6,depthWrite:false});for(let i=0;i<14;i++){const side=i%4,t=R()-.5;const x=side<2?t*(NX+AP*2):(side===2?-1:1)*(half.x+AP),z=side<2?(side===0?-1:1)*(half.z+AP):t*(NZ+AP*2);
      const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,0),sm2.clone());m.position.set(x,-.3,z);m.userData.ph=R()*6;scene.add(m);spray.push(m)}
    ANIM.push((dt,t)=>{for(const m of spray){const k=(Math.sin(t*1.3+m.userData.ph)+1)/2;m.position.y=-.32+k*.25;m.scale.setScalar(.6+k);m.material.opacity=.55*k}})}
  // dusk and night: a few warm bulbs over the apron
  if(lit&&!lo){for(let i=0;i<3;i++){const p=next();const l=new THREE.PointLight(0xffb060,.8,5,2);l.position.set(p.x,top+1.8,p.z);scene.add(l)}}}

// Ground variety: a floor material per tile, from map data (M.mat rows, one
// letter per tile: d deck, p planks, c concrete, g grating over water) or a
// seeded pattern per district. Purely visual.
const GROUND={d:'rust',p:'planks',c:'conc',g:'grateW'};
function groundOf(t){if(M.mat&&M.mat[t.z]&&GROUND[M.mat[t.z][t.x]])return GROUND[M.mat[t.z][t.x]];
  const th=THEME_OF[M.id]||'container',n=(Math.sin(t.x*.9+t.z*.37)+Math.sin(t.z*.71-t.x*.23)*1.2+2.2)/4.4;
  if(th==='founders')return n<.18?'planks':'';if(th==='industrial')return n<.3?'grateW':n<.62?'rust':'conc';return n<.32?'planks':n<.7?'rust':'conc'}
