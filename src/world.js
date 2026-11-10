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
const WM={};const wm=(c,tex,o)=>{const k=c+'|'+(tex||'')+(o?JSON.stringify(o):'');return WM[k]||(WM[k]=new THREE.MeshLambertMaterial(Object.assign({color:c},tex?{map:worldTex()[tex]||TX[tex]}:{},o||{})))};
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
  const th=tileTheme(t),n=(Math.sin(t.x*.9+t.z*.37)+Math.sin(t.z*.71-t.x*.23)*1.2+2.2)/4.4;
  if(th==='founders')return n<.18?'planks':'';if(th==='industrial')return n<.3?'grateW':n<.62?'rust':'conc';return n<.32?'planks':n<.7?'rust':'conc'}

/* ===================== ENVIRONMENT DETAIL (update 18) =====================
   Tiles and cover with more to look at:
   - envMap(): wear variants of any tile texture (oil and rust stains,
     cracks and paint marks, bolts and litter), picked per tile by hash so
     the ground stops repeating.
   - envTileDetail(): contact shadows where a floor tile meets a wall,
     crate or higher platform, and scattered decals (puddles, oil, litter,
     painted bay marks). High graphics only, static, shared materials.
   - envCover(): rebuilt cover per district: shipping-container crates,
     wooden crate stacks and planters; sandbag walls, jersey barriers and
     security barriers; and the new sheet walls (corrugated panels, steel
     hoarding, frosted glass) that heavies shoulder-charge through. */
const EVC={};
function envMap(base,k){if(!base||!k)return base;const id=(base.uuid||base.id)+'|'+k;if(EVC[id])return EVC[id];const img=base.image,s=img.width;const R=rng(k*977+s);
  const t=cvTex((g)=>{g.drawImage(img,0,0);
    if(k===1){// stains
      for(let i=0;i<3;i++){const x=R()*s,y=R()*s,r=s*(.08+R()*.16),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(20,14,8,.32)');gr.addColorStop(.7,'rgba(40,24,10,.14)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,s,s)}
      for(let i=0;i<2;i++){const x=R()*s,y=R()*s,r=s*(.05+R()*.08),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(140,70,30,.35)');gr.addColorStop(1,'rgba(140,70,30,0)');g.fillStyle=gr;g.fillRect(0,0,s,s)}}
    else if(k===2){// cracks and a painted mark
      g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1.2;for(let c=0;c<2;c++){let x=R()*s,y=R()*s;g.beginPath();g.moveTo(x,y);for(let i=0;i<6;i++){x+=(R()-.5)*s*.25;y+=(R()-.5)*s*.25;g.lineTo(x,y)}g.stroke()}
      g.globalAlpha=.55;g.fillStyle=R()<.5?'#e8c23a':'#f2f2ee';const y=s*(.2+R()*.6);g.fillRect(s*.08,y,s*.84,s*.05);g.globalAlpha=.25;g.fillStyle='#000';for(let i=0;i<40;i++)g.fillRect(s*.08+R()*s*.84,y+R()*s*.05,2,2);g.globalAlpha=1}
    else{// bolts, scuffs and a scrap of litter
      g.fillStyle='rgba(0,0,0,.35)';for(const[x,y]of[[.1,.1],[.9,.1],[.1,.9],[.9,.9]]){g.beginPath();g.arc(x*s,y*s,s*.022,0,7);g.fill()}
      g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=2;for(let i=0;i<5;i++){const x=R()*s,y=R()*s;g.beginPath();g.moveTo(x,y);g.lineTo(x+(R()-.5)*s*.3,y+(R()-.5)*s*.08);g.stroke()}
      g.save();g.translate(R()*s,R()*s);g.rotate(R()*3);g.fillStyle='rgba(235,228,210,.75)';g.fillRect(-s*.06,-s*.04,s*.12,s*.08);g.restore()}
    // edge wear: a worn, lighter rim with dark grime just inside
    g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=3;g.strokeRect(2,2,s-4,s-4);g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=4;g.strokeRect(6,6,s-12,s-12)},s);
  t.wrapS=base.wrapS;t.wrapT=base.wrapT;return EVC[id]=t}
// Side texture with rust or dirt drips running down from the top edge.
function envDrip(base,k){if(!base)return base;const id=(base.uuid||base.id)+'|drip'+k;if(EVC[id])return EVC[id];const img=base.image,s=img.width,R=rng(k*311+7);
  return EVC[id]=cvTex(g=>{g.drawImage(img,0,0);for(let i=0;i<5+k*2;i++){const x=R()*s,w=2+R()*5,l=s*(.25+R()*.6),gr=g.createLinearGradient(0,0,0,l);gr.addColorStop(0,'rgba(90,45,20,.5)');gr.addColorStop(1,'rgba(90,45,20,0)');g.fillStyle=gr;g.fillRect(x,0,w,l)}
    const gr=g.createLinearGradient(0,s*.7,0,s);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=gr;g.fillRect(0,0,s,s)},s)}

let ETX=null;
function envTex(){if(ETX)return ETX;const R=rng(4242);ETX={};
  const grain=(g,s,n,a)=>{for(let i=0;i<n;i++){const v=R()<.5?0:255;g.fillStyle=`rgba(${v},${v},${v},${a*R()})`;g.fillRect(R()*s,R()*s,1+R()*2,1+R()*2)}};
  ETX.ao=cvTex((g,s)=>{const gr=g.createLinearGradient(0,0,0,s);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.45,'rgba(0,0,0,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.clearRect(0,0,s,s);g.fillStyle=gr;g.fillRect(0,0,s,s)},64);
  ETX.burlap=cvTex((g,s)=>{g.fillStyle='#ffffff';g.fillRect(0,0,s,s);g.strokeStyle='rgba(90,70,40,.22)';g.lineWidth=1;for(let i=0;i<s;i+=3){g.beginPath();g.moveTo(i,0);g.lineTo(i,s);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(s,i);g.stroke()}grain(g,s,700,.18);
    g.strokeStyle='rgba(60,40,20,.5)';g.lineWidth=2;g.setLineDash([5,4]);g.beginPath();g.moveTo(s*.85,0);g.lineTo(s*.85,s);g.stroke();g.setLineDash([])});
  ETX.door=cvTex((g,s)=>{g.fillStyle='#e8e8e8';g.fillRect(0,0,s,s);for(let x=0;x<s;x+=s/10){const gr=g.createLinearGradient(x,0,x+s/10,0);gr.addColorStop(0,'rgba(255,255,255,.3)');gr.addColorStop(.5,'rgba(0,0,0,.18)');gr.addColorStop(1,'rgba(255,255,255,.1)');g.fillStyle=gr;g.fillRect(x,0,s/10,s)}
    g.fillStyle='rgba(0,0,0,.55)';g.fillRect(s/2-1,0,2,s);g.fillStyle='#55585c';for(const x of[.2,.38,.62,.8]){g.fillRect(x*s-2,4,4,s-8);g.fillRect(x*s-6,s*.45,12,8)}
    g.fillStyle='rgba(255,255,255,.85)';g.font=`bold ${s*.09}px sans-serif`;g.fillText('ARKU 2107',s*.08,s*.16);g.font=`${s*.06}px sans-serif`;g.fillText('MAX GR 30,480 KG',s*.08,s*.25);
    grain(g,s,500,.15);for(let i=0;i<5;i++){const x=R()*s,gr=g.createLinearGradient(0,0,0,s*.6);gr.addColorStop(0,'rgba(110,50,20,.45)');gr.addColorStop(1,'rgba(110,50,20,0)');g.fillStyle=gr;g.fillRect(x,0,3,s*.6)}},256);
  ETX.crate=cvTex((g,s)=>{g.fillStyle='#d9b88a';g.fillRect(0,0,s,s);for(let y=0;y<s;y+=s/5){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y,s,2);g.fillStyle='rgba(90,55,20,.12)';for(let i=0;i<5;i++)g.fillRect(R()*s,y+4+R()*(s/5-8),20+R()*40,1)}
    g.fillStyle='#a77b4a';g.fillRect(0,0,s,s*.1);g.fillRect(0,s*.9,s,s*.1);g.fillRect(0,0,s*.1,s);g.fillRect(s*.9,0,s*.1,s);g.save();g.translate(s/2,s/2);g.rotate(Math.PI/4);g.fillRect(-s*.7,-s*.05,s*1.4,s*.1);g.restore();
    g.fillStyle='rgba(40,25,10,.7)';g.font=`bold ${s*.12}px sans-serif`;g.textAlign='center';g.fillText('ARK-07',s/2,s*.62);g.fillStyle='rgba(0,0,0,.4)';for(const[x,y]of[[.05,.05],[.95,.05],[.05,.95],[.95,.95]]){g.beginPath();g.arc(x*s,y*s,s*.02,0,7);g.fill()}grain(g,s,600,.12)},256);
  ETX.steel=cvTex((g,s)=>{g.fillStyle='#e4e6e8';g.fillRect(0,0,s,s);grain(g,s,900,.12);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;g.strokeRect(3,3,s-6,s-6);g.beginPath();g.moveTo(s/2,0);g.lineTo(s/2,s);g.stroke();
    g.fillStyle='rgba(0,0,0,.45)';for(let y=10;y<s;y+=s/6)for(const x of[8,s/2-7,s/2+7,s-8]){g.beginPath();g.arc(x,y,2.2,0,7);g.fill()}
    for(let i=0;i<4;i++){const x=R()*s,gr=g.createLinearGradient(0,0,0,s);gr.addColorStop(0,'rgba(120,60,25,.35)');gr.addColorStop(1,'rgba(120,60,25,0)');g.fillStyle=gr;g.fillRect(x,0,3,s)}});
  ETX.sheet=cvTex((g,s)=>{g.fillStyle='#ffffff';g.fillRect(0,0,s,s);for(let x=0;x<s;x+=10){const gr=g.createLinearGradient(x,0,x+10,0);gr.addColorStop(0,'rgba(255,255,255,.3)');gr.addColorStop(.55,'rgba(0,0,0,.25)');gr.addColorStop(1,'rgba(0,0,0,.04)');g.fillStyle=gr;g.fillRect(x,0,10,s)}
    for(let i=0;i<4;i++){const x=R()*s,y=R()*s,r=8+R()*22,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(140,60,20,.6)');gr.addColorStop(1,'rgba(140,60,20,0)');g.fillStyle=gr;g.fillRect(0,0,s,s)}
    g.fillStyle='rgba(30,30,30,.6)';for(const y of[6,s/2,s-6])for(let x=5;x<s;x+=20){g.beginPath();g.arc(x,y,1.6,0,7);g.fill()}grain(g,s,500,.15)});
  ETX.frost=cvTex((g,s)=>{const gr=g.createLinearGradient(0,0,0,s);gr.addColorStop(0,'#f4fbff');gr.addColorStop(1,'#cfe6f2');g.fillStyle=gr;g.fillRect(0,0,s,s);g.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<3;i++){g.save();g.translate(R()*s,0);g.rotate(.5);g.fillRect(0,-s,6+R()*10,s*3);g.restore()}
    g.fillStyle='rgba(56,182,232,.55)';g.fillRect(0,s*.62,s,s*.04);g.fillStyle='rgba(30,60,80,.35)';g.font=`bold ${s*.08}px sans-serif`;g.textAlign='center';g.fillText('ARK AUTHORITY',s/2,s*.56)});
  ETX.puddle=cvTex((g,s)=>{g.clearRect(0,0,s,s);g.fillStyle='#ffffff';g.beginPath();for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=s*(.3+R()*.16);g.lineTo(s/2+Math.cos(a)*r,s/2+Math.sin(a)*r*.75)}g.closePath();g.fill();g.globalCompositeOperation='source-atop';const gr=g.createLinearGradient(0,0,s,s);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(150,170,190,1)');g.fillStyle=gr;g.fillRect(0,0,s,s)},64);
  ETX.oil=cvTex((g,s)=>{g.clearRect(0,0,s,s);for(let i=0;i<4;i++){const x=s*(.3+R()*.4),y=s*(.3+R()*.4),r=s*(.12+R()*.2),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(15,12,10,.75)');gr.addColorStop(.8,'rgba(15,12,10,.3)');gr.addColorStop(1,'rgba(15,12,10,0)');g.fillStyle=gr;g.fillRect(0,0,s,s)}},64);
  ETX.litter=cvTex((g,s)=>{g.clearRect(0,0,s,s);const cols=['#e9e4d6','#c8321f','#2f6eb8','#d8b04a','#8a8f94'];for(let i=0;i<7;i++){g.save();g.translate(s*(.15+R()*.7),s*(.15+R()*.7));g.rotate(R()*6);g.fillStyle=cols[i%cols.length];g.fillRect(-s*.06,-s*.04,s*.04+R()*s*.1,s*.03+R()*s*.06);g.restore()}},64);
  ETX.bay=cvTex((g,s)=>{g.clearRect(0,0,s,s);g.fillStyle='rgba(236,196,58,.8)';g.fillRect(0,0,s,s*.07);g.fillRect(0,s*.93,s,s*.07);for(let i=0;i<5;i++){g.save();g.translate(s*.2+i*s*.15,s/2);g.rotate(.7);g.fillRect(-s*.03,-s*.35,s*.06,s*.7);g.restore()}g.globalCompositeOperation='destination-out';for(let i=0;i<120;i++)g.fillRect(R()*s,R()*s,2,2)},128);
  return ETX}

// Contact shadows and decals on a tile (called from tileMesh after setBase,
// so fog-of-war tinting leaves these shared dark materials alone).
const EMAT={};
function envMat(k){if(EMAT[k])return EMAT[k];const T=envTex();
  const o={ao:{map:T.ao,color:0x000000,opacity:.42},oil:{map:T.oil,color:0xffffff,opacity:.85},litter:{map:T.litter,color:0xffffff,opacity:.95},bay:{map:T.bay,color:0xffffff,opacity:.85},puddle:{map:T.puddle,color:0x8fa8bb,opacity:.5}}[k];
  return EMAT[k]=new THREE.MeshBasicMaterial({map:o.map,color:o.color,transparent:true,opacity:o.opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2})}
function envTileDetail(t,m,ty){if(!HI()||t.type==='ramp')return;const dec=(geo,mat,x,z,rz)=>{const d=new THREE.Mesh(geo,mat);d.rotation.x=-Math.PI/2;d.rotation.z=rz||0;d.position.set(x,ty+.004,z);d.userData.tile=t;d.renderOrder=1;m.add(d);return d};
  for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(!n)continue;const wall=(n.h-t.h>=.5&&n.type!=='ramp')||(n.obj&&n.obj!=='rail'&&n.obj!=='pt'&&n.obj!=='wall');if(!wall)continue;
    const d=dec(new THREE.PlaneGeometry(.98,.34),envMat('ao'),dx*.32,dz*.32,Math.atan2(dx,-dz));}
  if(t.obj||t.zone||t.exit||t.cp||t.ladder||t.step)return;const r=hsh(t.x,t.z,21)%13,rot=(hsh(t.x,t.z,22)%628)/100,th=TH;
  if(r===0&&th!==THEMES.founders)dec(new THREE.PlaneGeometry(.7,.7),envMat('oil'),((hsh(t.x,t.z,23)%30)-15)/100,((hsh(t.x,t.z,24)%30)-15)/100,rot);
  else if(r===1&&th!==THEMES.founders)dec(new THREE.PlaneGeometry(.6,.6),envMat('litter'),0,0,rot);
  else if(r===2)dec(new THREE.PlaneGeometry(.8,.62),envMat('puddle'),0,0,rot);
  else if(r===3&&th===THEMES.industrial)dec(new THREE.PlaneGeometry(.96,.96),envMat('bay'),0,0,(hsh(t.x,t.z,25)%2)*Math.PI/2)}

// ---------- cover ----------
function envCover(t,g,theme){const M2=(c,map,extra)=>new THREE.MeshLambertMaterial(Object.assign({color:c},map?{map}:{},extra||{})),T=envTex(),W2=worldTex();
  const box=(w,h,d,mat,y,x=0,z=0,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.rotation.y=ry;g.add(m);return m};
  const cyl=(r1,r2,h,mat,x,y,z,seg=8)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);m.position.set(x,y,z);g.add(m);return m};
  // which way a run of walls goes: along x unless the neighbours line up along z
  const runZ=()=>{const s=o=>o&&o.obj===t.obj;return(s(tileAt(t.x,t.z-1))||s(tileAt(t.x,t.z+1)))&&!(s(tileAt(t.x-1,t.z))||s(tileAt(t.x+1,t.z)))};
  if(t.obj==='crate'){
    if(theme==='c'){const col=pickC(CONT_COLS,t,4),side=M2(col,TX.corr),end=M2(col,T.door),top=M2(new THREE.Color(col).multiplyScalar(.9),TX.corr),ry=hsh(t.x,t.z,5)%2?Math.PI/2:0;
      const b=box(.94,.84,.94,[end,end,top,side,side,side],.42);b.rotation.y=ry;const dk=M2('#2b2b2b');
      for(const sx of[-.45,.45])for(const sz of[-.45,.45])for(const sy of[.04,.8]){box(.08,.08,.08,dk,sy,sx,sz)}
      for(const sz of[-.45,.45])box(.94,.05,.05,dk,.83,0,sz,ry);if(hsh(t.x,t.z,6)%3===0){const tarp=box(.7,.04,.6,M2(['#2f6eb8','#c8321f','#d8a030'][hsh(t.x,t.z,7)%3]),.87,.05,0);tarp.rotation.z=.04}}
    else if(theme==='i'){const wd=M2('#ffffff',T.crate),st=M2('#3a3d40');box(.86,.1,.86,M2('#9a7a52',W2.planks),.05);
      const a=box(.74,.62,.74,wd,.41,-.04,-.03);box(.76,.04,.76,st,.3,-.04,-.03);const b=box(.48,.42,.48,wd,.93,.1,.08,.4);box(.5,.04,.5,st,.93,.1,.08,.4);
      if(hsh(t.x,t.z,8)%2){const dr=cyl(.15,.15,.44,M2('#2f6e8a'),.3,.32,.3,12);cyl(.155,.155,.04,M2('#222'),.3,.5,.3,12)}}
    else{const wh=M2('#f4f6f7',TX.white),bl=M2('#38b6e8');box(.88,.52,.88,wh,.26);box(.92,.06,.92,wh,.55);box(.8,.03,.8,M2('#5a3e2a'),.58);box(.9,.02,.04,new THREE.MeshBasicMaterial({color:0x8fe2ff}),.12,0,.445);
      const hedge=M2('#4f8f4a'),h2=M2('#5fa358');for(const[x,yy,z,r,m]of[[-.2,.78,-.18,.24,hedge],[.18,.8,-.15,.26,h2],[0,.84,.16,.28,hedge],[-.18,.95,.1,.18,h2],[.2,.92,.2,.17,hedge]]){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),m);c.position.set(x,yy,z);g.add(c)}}}
  if(t.obj==='wall'){
    if(theme==='c'){const cols=['#b9a27a','#a99068','#c4ae86','#9c8862'],ry=runZ()?Math.PI/2:0,grp=new THREE.Group();grp.rotation.y=ry;g.add(grp);
      const bag=(x,y,z,k)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.5,10,6),M2(cols[(hsh(t.x,t.z,k)+k)%cols.length],T.burlap));m.scale.set(.3,.13,.2);m.position.set(x,y,z);m.rotation.y=((hsh(t.x,t.z,k+3)%20)-10)/100;grp.add(m)};
      let k=0;for(const z of[-.1,.1])for(let i=-1;i<=1;i++)bag(i*.29,.07,z,k++);for(let i=-1;i<=1;i++)bag(i*.29+.03,.2,0,k++);for(let i=0;i<2;i++)bag((i-.5)*.3,.33,0,k++);
      if(t.fort){const pl=new THREE.Mesh(new THREE.BoxGeometry(.9,.5,.04),M2('#7d8388',TX.side));pl.position.set(0,.3,-.2);grp.add(pl)}}
    else if(theme==='i'){const ry=runZ()?Math.PI/2:0,sh=new THREE.Shape();sh.moveTo(-.22,0);sh.lineTo(.22,0);sh.lineTo(.18,.08);sh.lineTo(.08,.16);sh.lineTo(.07,.44);sh.lineTo(-.07,.44);sh.lineTo(-.08,.16);sh.lineTo(-.18,.08);sh.closePath();
      const geo=new THREE.ExtrudeGeometry(sh,{depth:.9,bevelEnabled:false});geo.translate(0,0,-.45);const conc=M2('#b4b2ac',W2.conc),jb=new THREE.Mesh(geo,conc);jb.rotation.y=ry+Math.PI/2;g.add(jb);
      const band=new THREE.Mesh(new THREE.BoxGeometry(.9,.09,.15),M2('#ffffff',TX.hazard));band.position.y=.36;band.rotation.y=ry;g.add(band);
      for(const s of[-.28,.28]){const lp=new THREE.Mesh(new THREE.TorusGeometry(.05,.012,4,10,Math.PI),M2('#6b4a32'));lp.position.set(ry?0:s,.44,ry?s:0);lp.rotation.y=ry;g.add(lp)}
      if(t.fort)box(.95,.2,.5,M2('#7d8388',TX.side),.55,0,0,ry)}
    else{const ry=runZ()?Math.PI/2:0,wh=M2('#f2f4f5',TX.white);box(.9,.3,.42,wh,.15,0,0,ry);box(.82,.14,.34,wh,.37,0,0,ry);box(.84,.04,.36,M2('#22282c'),.46,0,0,ry);
      const glow=box(.86,.035,.02,new THREE.MeshBasicMaterial({color:0x5fd8ff}),.26,0,0,ry);glow.position.set(ry?.215:0,.26,ry?0:.215);const glow2=glow.clone();glow2.position.set(ry?-.215:0,.26,ry?0:-.215);g.add(glow2);
      if(t.fort)box(.92,.36,.06,M2('#bfe6ff',null,{transparent:true,opacity:.5}),.64,0,0,ry)}}
  if(t.obj==='sheet'){const ry=runZ()?Math.PI/2:0,grp=new THREE.Group();grp.rotation.y=ry;g.add(grp);const b2=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);grp.add(m);return m};
    if(theme==='c'){const post=M2('#6a4c32',W2.planks);for(const x of[-.44,.44])b2(.08,1.45,.08,post,x,.72,0);const cols=['#a4462c','#7d8a8f','#c98a2a','#3d5f7a','#8f7a5a'];
      for(let i=0;i<3;i++){const c=cols[(hsh(t.x,t.z,30+i))%cols.length],p=b2(.33,1.25+(i%2)*.12,.03,M2(c,T.sheet),-.3+i*.3,.66,.02*(i%2?1:-1));p.rotation.z=((hsh(t.x,t.z,40+i)%10)-5)/100}
      b2(.95,.08,.05,post,0,.95,.06);if(hsh(t.x,t.z,33)%2)b2(.3,.24,.035,M2('#c4ae86',T.burlap),.15,.4,-.04);t.sheetCol=0x8a6a4a}
    else if(theme==='i'){const fr=M2('#3a3f45');for(const x of[-.45,.45]){b2(.07,1.5,.07,fr,x,.75,0);b2(.08,.04,.4,fr,x,.02,0)}b2(.86,1.3,.04,M2('#c9ccce',T.steel),0,.72,0);b2(.86,.14,.05,M2('#ffffff',TX.hazard),0,.14,0);b2(.9,.05,.06,fr,0,1.39,0);t.sheetCol=0x8a9096}
    else{const fr=M2('#f4f6f7',TX.white);b2(.9,.08,.12,fr,0,.04,0);b2(.9,.06,.1,fr,0,1.4,0);for(const x of[-.44,.44])b2(.06,1.4,.1,fr,x,.72,0);b2(.82,1.3,.03,M2('#ffffff',T.frost,{transparent:true,opacity:.86}),0,.72,0);b2(.82,.03,.04,new THREE.MeshBasicMaterial({color:0x5fd8ff}),0,.1,0);t.sheetCol=0xd8eef8}}}

/* ===================== BUILDINGS (update 20) =====================
   Real buildings on the battlefield instead of plain raised blocks. A map
   lists them in M.bld; the map source (tools/maps) also stamps their tiles
   into h/map, so movement, cover and sight work through the normal rules:
   - roof buildings (home, cantina, office, tower, bridge): footprint tiles
     are raised to the roof (walkable); the building is drawn round them.
   - solid buildings (shack, pump, tank): footprint tiles are 'B' (blocks
     movement and sight, full cover); drawn as the building.
   - roofed interiors (hall, warehouse): the floor is walkable at ground
     level; walls are 'B' tiles with door gaps; the roof fades out while a
     unit of yours is inside, or the selected unit can move inside.
   Entries: {t:type, x, z, w, d, lv (roof height digit), col, face:'n'|'s'|'e'|'w',
   doors:[[x,z],...]}. Visuals are procedural and per district colours. */
const BLD_FACE={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]};
let BLD=[],BLD_T=null;
function bldTex(){if(BLD_T)return BLD_T;const R=rng(515);BLD_T={};
  BLD_T.window=cvTex((g,s)=>{g.fillStyle='#2a3036';g.fillRect(0,0,s,s);g.fillStyle='#8a6a3a';g.fillRect(4,4,s-8,s-8);g.fillStyle='#ffd28a';g.fillRect(8,8,s-16,s-16);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(s/2-2,6,4,s-12);g.fillRect(6,s/2-2,s-12,4)},64);
  BLD_T.shut=cvTex((g,s)=>{g.fillStyle='#d8d8d8';g.fillRect(0,0,s,s);for(let y=0;y<s;y+=6){g.fillStyle='rgba(0,0,0,.22)';g.fillRect(0,y,s,2)}g.fillStyle='rgba(120,55,20,.35)';for(let i=0;i<6;i++)g.fillRect(R()*s,R()*s,3+R()*8,2+R()*20)},64);
  BLD_T.stripe=cvTex((g,s)=>{for(let x=0;x<s;x+=16){g.fillStyle=(x/16)%2?'#f2ead8':'#c8321f';g.fillRect(x,0,16,s)}},64);
  BLD_T.glass=cvTex((g,s)=>{g.fillStyle='#4a5a66';g.fillRect(0,0,s,s);for(let x=0;x<s;x+=16){g.fillStyle='#8fb6cc';g.fillRect(x+2,6,12,s-12)}},64);
  const signT=(txt,bg,fg)=>cvTex((g,s2)=>{g.fillStyle=bg;g.fillRect(0,0,s2,s2);g.fillStyle=fg;g.font=`bold ${s2*.3}px sans-serif`;g.textAlign='center';g.fillText(txt,s2/2,s2*.62)},128);
  BLD_T.sMarket=signT('MARKET','#c8321f','#fff3d0');BLD_T.sFish=signT('FISH','#2f6e8a','#f2ead8');BLD_T.sClinic=signT('+ CLINIC','#f4f4f4','#c8321f');BLD_T.sWorks=signT('WORKS','#2b2b2b','#ffb347');BLD_T.sWater=signT('WATER','#2f8a86','#f2ead8');BLD_T.sNoodle=signT('NOODLES','#c8321f','#ffe14a');BLD_T.sRadio=signT('RADIO','#1d2226','#7fe8ff');
  BLD_T.bars=cvTex((g,s2)=>{g.fillStyle='#1d2a33';g.fillRect(0,0,s2,s2);g.fillStyle='#bfe6ff';g.fillRect(6,6,s2-12,s2-12);g.fillStyle='#4a5560';for(let x=10;x<s2-6;x+=10)g.fillRect(x,6,4,s2-12)},64);
  BLD_T.sSec=signT('ARK SECURITY','#f4f6f7','#2a7fbd');BLD_T.sMess=signT('MESS','#2a7fbd','#f4f6f7');BLD_T.sCells=signT('BLOCK C','#22272c','#f4f6f7');
  BLD_T.neon=cvTex((g,s)=>{g.clearRect(0,0,s*2,s);g.font=`bold ${s*.5}px sans-serif`;g.textAlign='center';g.fillStyle='#ff5fa2';g.shadowColor='#ff5fa2';g.shadowBlur=10;g.fillText('BAR',s/2,s*.68)},128);
  BLD_T.water=cvTex((g,s)=>{g.fillStyle='#c9c3b8';g.fillRect(0,0,s,s);for(let x=0;x<s;x+=10){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,0,3,s)}g.fillStyle='rgba(30,40,50,.75)';g.font=`bold ${s*.18}px sans-serif`;g.textAlign='center';g.fillText('H2O',s/2,s*.58);g.fillStyle='rgba(120,55,20,.35)';for(let i=0;i<8;i++)g.fillRect(R()*s,0,3,s*.6*R())},128);
  return BLD_T}
// Footprint helpers in world units
function bldBox(b){const a=W(b.x,b.z),c=W(b.x+b.w-1,b.z+b.d-1);return{x0:a.x-.5,x1:c.x+.5,z0:a.z-.5,z1:c.z+.5,cx:(a.x+c.x)/2,cz:(a.z+c.z)/2,w:b.w,d:b.d}}
function bldInside(b,x,z){return x>=b.x&&x<b.x+b.w&&z>=b.z&&z<b.z+b.d}
// Parse: mark tiles (called after parseMap)
function bldParse(m){BLD=(m.bld||[]).map(o=>Object.assign({},o));for(const b of BLD)for(let z=b.z;z<b.z+b.d;z++)for(let x=b.x;x<b.x+b.w;x++){const t=tileAt(x,z);if(!t)continue;t.bld=b;
    if(['home','cantina','office','tower','apt','wallw'].includes(b.t))t.bldSkin=true;if(b.t==='bridge'||b.t==='deck'){t.bldSkin=true;t.bridge=true}
    if(t.obj==='bldg')t.bldHide=true}
  S.tunnels=(m.tunnels||[]).map(a=>({x1:a[0],z1:a[1],x2:a[2],z2:a[3]}));for(const tn of S.tunnels){const a=tileAt(tn.x1,tn.z1),c=tileAt(tn.x2,tn.z2);if(a)a.tunnel=true;if(c)c.tunnel=true}}
// Draw every building
function bldBuildAll(){if(!scene)return;const T=bldTex(),lit=!!TM.lamps,lo=!HI();const stat=new THREE.Group();
  const M2=(c,map,o)=>wm(c,map?null:null,Object.assign(map?{map}:{},o||{}));const mt=(c,tex)=>sm(c,tex);
  const box=(p,w,h,d,mat,x,y,z,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof mat==='string'?mt(mat):mat);m.position.set(x,y,z);m.rotation.y=ry;p.add(m);return m};
  const cyl=(p,r1,r2,h,mat,x,y,z,seg=10)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),typeof mat==='string'?mt(mat):mat);m.position.set(x,y,z);p.add(m);return m};
  const winM=lit?new THREE.MeshBasicMaterial({map:T.window}):new THREE.MeshLambertMaterial({map:T.window,color:0x9a9a9a});
  for(const b of BLD){if(b.t==='yard')continue;const B=bldBox(b),top=(b.lv||0)*.25,R=rng(b.x*131+b.z*17+b.w),g=new THREE.Group(),f=BLD_FACE[b.face||'s'],live=new THREE.Group();b.g=g;
    const W2=B.x1-B.x0,D2=B.z1-B.z0,cols=b.col?[b.col]:CONT_COLS,pick=()=>cols[Math.floor(R()*cols.length)];
    // a feature on the facing wall at local offset u (along the wall) and height y
    const face=(obj,u,y,out=.02)=>{if(f[1]){obj.position.set(B.cx+u,y,f[1]>0?B.z1+out:B.z0-out);obj.rotation.y=f[1]>0?0:Math.PI}else{obj.position.set(f[0]>0?B.x1+out:B.x0-out,y,B.cz+u);obj.rotation.y=f[0]>0?Math.PI/2:-Math.PI/2}g.add(obj);return obj};
    const faceLen=f[1]?W2:D2;
    if(b.t==='stack'){// solid tall stack, 3 to 4 storeys of uneven containers, lit windows
      const st=b.st||3;let y0=-.05;for(let i=0;i<st;i++){const c=pick(),cm=mt(c,'corr'),ox=i?(R()-.5)*.35:0,oz=i?(R()-.5)*.35:0,rot=R()<.3&&Math.abs(W2-D2)<.6,ww=W2-.06+(i?R()*.4:0),dd=D2-.06+(i?R()*.3:0);
        const bx=box(g,rot?dd:ww,.98,rot?ww:dd,cm,B.cx+ox,y0+.49,B.cz+oz);box(g,(rot?dd:ww)+.03,.05,(rot?ww:dd)+.03,mt('#2b2b2b'),bx.position.x,y0+.96,bx.position.z);
        for(let u=-faceLen/2+.45;u<faceLen/2-.3;u+=.8)if(R()<.6){const wn=new THREE.Mesh(new THREE.PlaneGeometry(.26,.22),winM);face(wn,u+(f[1]?ox:oz),y0+.6,.02+Math.abs(f[1]?oz:ox)+(i?.15:0))}
        y0+=1}
      b.topY=y0;cyl(g,.06,.06,.7,mt('#3a3a3a'),B.x1-.25,y0+.35,B.z0+.25,6);b.smoke=[B.x1-.25,y0+.75,B.z0+.25];
      if(R()<.8){const tp=new THREE.Mesh(new THREE.PlaneGeometry(W2*.7,D2*.6),sm(['#2f6eb8','#3d6a8a','#4f5a39','#7a3c22'][Math.floor(R()*4)],null,{side:THREE.DoubleSide}));tp.rotation.x=-Math.PI/2+.12;tp.position.set(B.cx-.1,y0+.12,B.cz+.05);g.add(tp)}
      for(let k=0;k<3;k++)cyl(g,.12,.12,.3,mt(['#8a3b24','#3b5b6b','#5f6b4a'][k]),B.x0+.25+k*.26,y0+.15,B.z1-.25,8)}
    else if(b.t==='deck'){// plank boardwalk or stair platforms on posts, each tile at its own height, rails on open edges
      const pl=sm('#8b6a48','planks'),pm=mt('#4a3a2e'),rl=mt('#3a2c22');
      for(let z=b.z;z<b.z+b.d;z++)for(let x=b.x;x<b.x+b.w;x++){const t=tileAt(x,z);if(!t)continue;const p=W(x,z),y=topY(t);box(g,1,.07,1,pl,p.x,y-.035,p.z);
        for(const[sx,sz]of[[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]])box(g,.07,y+.05,.07,pm,p.x+sx,y/2-.02,p.z+sz);
        for(const[dx,dz]of D4){const n=tileAt(x+dx,z+dz);if(n&&Math.abs(n.h-t.h)<=.5&&n.type!=='water'&&n.type!=='gap')continue;if(n&&n.ladder)continue;box(g,dx?.04:.96,.04,dz?.04:.96,rl,p.x+dx*.47,y+.4,p.z+dz*.47);for(const s2 of[-.44,.44])box(g,.04,.4,.04,rl,p.x+dx*.47+(dz?s2:0),y+.2,p.z+dz*.47+(dx?s2:0))}}}
    else if(b.t==='home'||b.t==='cantina'){const st=Math.max(1,Math.round(top));let y0=-.05;
      for(let i=0;i<st;i++){const h=(i===st-1?top-y0:1)-.0,c=pick(),cm=mt(c,'corr');const sh=(R()-.5)*.08;
        const ov=i>0&&R()<.6?.18+R()*.18:0,ovx=f[1]?0:f[0]*ov,ovz=f[1]?f[1]*ov:0;box(g,W2-.04+(i%2?.06:0)+Math.abs(ovx),h-.02,D2-.04+Math.abs(ovz),cm,B.cx+sh+ovx/2,y0+h/2,B.cz+ovz/2);box(g,W2+.02,.05,D2+.02,mt('#2b2b2b'),B.cx,y0+h-.025,B.cz);
        for(const sx of[B.x0+.03,B.x1-.03])for(const sz of[B.z0+.03,B.z1-.03])box(g,.07,.07,.07,mt('#2b2b2b'),sx,y0+h-.04,sz);
        // windows and a door on the facing side
        for(let u=-faceLen/2+.45;u<faceLen/2-.3;u+=.9){if(i===0&&Math.abs(u)<.5){const door=new THREE.Mesh(new THREE.PlaneGeometry(.36,.68),mt('#2a2d31'));face(door,u,y0+.36)}else if(R()<.75){const wn=new THREE.Mesh(new THREE.PlaneGeometry(.3,.24),winM);face(wn,u,y0+.62)}}
        if(i===0&&R()<.8){const aw=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.4,faceLen*.6),.5),b.t==='cantina'?new THREE.MeshLambertMaterial({map:T.stripe,side:THREE.DoubleSide}):sm(['#2f6eb8','#c8321f','#d8a030','#3d6a8a'][Math.floor(R()*4)],null,{side:THREE.DoubleSide}));face(aw,0,y0+.82,.24);aw.rotation.x+=0;aw.rotateX(-1.05)}
        if(R()<.5){const ac=new THREE.Mesh(new THREE.BoxGeometry(.3,.22,.18),mt('#c8ccce'));face(ac,faceLen/2-.35,y0+.75,.09)}
        y0+=h}
      if(b.t==='cantina'){const sign=new THREE.Mesh(new THREE.PlaneGeometry(.9,.45),new THREE.MeshBasicMaterial({map:T.neon,transparent:true}));face(sign,0,top+.3,.05);const fr=new THREE.Mesh(new THREE.BoxGeometry(.95,.5,.04),mt('#222'));face(fr,0,top+.3,.02);const pole=new THREE.Mesh(new THREE.BoxGeometry(.05,.3,.05),mt('#222'));face(pole,0,top+.05,.02);if(lit&&!lo){const l=new THREE.PointLight(0xff5fa2,.7,3,2);face(l,0,top+.3,.5);g.remove(l);scene.add(l)}}
      // roof clutter at the back corners: tank, dish, solar panel
      const rc=[[B.x0+.3,B.z0+.3],[B.x1-.3,B.z0+.3],[B.x0+.3,B.z1-.3],[B.x1-.3,B.z1-.3]].filter(([x,z])=>f[1]?Math.sign(z-B.cz)!==f[1]:Math.sign(x-B.cx)!==f[0]);
      if(rc[0]&&R()<.8){cyl(g,.16,.16,.34,mt('#3b5b6b'),rc[0][0],top+.17,rc[0][1],10);cyl(g,.165,.165,.04,mt('#2a2a2a'),rc[0][0],top+.32,rc[0][1],10)}
      if(rc[1]&&R()<.7){const d=new THREE.Mesh(new THREE.SphereGeometry(.18,10,6,0,Math.PI*2,0,.9),sm('#cfcfcf',null,{side:THREE.DoubleSide}));d.position.set(rc[1][0],top+.35,rc[1][1]);d.rotation.x=-1;g.add(d);cyl(g,.02,.02,.3,mt('#555'),rc[1][0],top+.15,rc[1][1],5)}
      if(R()<.55){const tp=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.4,W2*.6),Math.min(1,D2*.5)),sm(['#2f6eb8','#3d6a8a','#4f5a39','#c7922c'][Math.floor(R()*4)],null,{side:THREE.DoubleSide}));tp.rotation.x=-Math.PI/2+.25;const tc=rc[2]||[B.cx,B.cz];tp.position.set(tc[0],top+.35,tc[1]);g.add(tp);for(const sx of[-.3,.3])cyl(g,.02,.02,.4,mt('#4a3a2e'),tc[0]+sx,top+.2,tc[1]+.25,5)}
      if(R()<.5){cyl(g,.05,.05,.6,mt('#3a3a3a'),B.x0+.2,top+.3,B.cz,6);b.smoke=[B.x0+.2,top+.65,B.cz]}
      if(rc[0]&&!rc[3]&&R()<.4){const cp=rc[0];box(g,.45,.32,.32,sm('#8b6a48','planks'),cp[0],top+.16,cp[1]);const ch=new THREE.Mesh(new THREE.SphereGeometry(.05,6,5),mt('#f4f4f0'));ch.position.set(cp[0]+.28,top+.06,cp[1]);ch.scale.set(1,.9,1.3);g.add(ch)}
      if(rc[3]&&R()<.75){for(let k=0;k<2;k++){box(g,.42,.16,.2,sm('#6b4a2e','planks'),rc[3][0]+(k?.0:0),top+.08,rc[3][1]+(k-.5)*.24);for(let j=0;j<3;j++){const lf=new THREE.Mesh(new THREE.IcosahedronGeometry(.06,0),mt(['#4f8f3a','#6fa040','#3f7a30'][j]));lf.position.set(rc[3][0]-.13+j*.13,top+.2,rc[3][1]+(k-.5)*.24);g.add(lf)}}}
      if(R()<.6){const sg=new THREE.Mesh(new THREE.PlaneGeometry(.55,.22),new THREE.MeshBasicMaterial({color:[0xffd28a,0x7fe8ff,0xff8a5f,0xc8ffb0][Math.floor(R()*4)]}));face(sg,faceLen/2-.45,Math.min(top,1)-.12,.06)}
      // low parapet so roofs read as roofs
      for(const[x0,z0,x1,z1]of[[B.x0,B.z0,B.x1,B.z0],[B.x0,B.z1,B.x1,B.z1],[B.x0,B.z0,B.x0,B.z1],[B.x1,B.z0,B.x1,B.z1]]){const len=Math.hypot(x1-x0,z1-z0);box(g,x1===x0?.06:len,.1,z1===z0?.06:len,mt('#3a3a3a'),(x0+x1)/2,top+.05,(z0+z1)/2)}}
    else if(b.t==='office'){const cm=sm('#b9b4aa','conc'),floors=Math.max(1,Math.round(top));
      box(g,W2-.02,top+.05,D2-.02,cm,B.cx,top/2-.025,B.cz);
      for(let i=0;i<floors;i++){const y=i+.6;for(const[ww,dd,x,z,ry]of[[W2-.2,.02,B.cx,B.z1+.005,0],[W2-.2,.02,B.cx,B.z0-.005,0],[.02,D2-.2,B.x0-.005,B.cz,0],[.02,D2-.2,B.x1+.005,B.cz,0]]){const s2=new THREE.Mesh(new THREE.BoxGeometry(ww,.3,dd),lit?new THREE.MeshBasicMaterial({map:T.glass,color:0xffe6b0}):new THREE.MeshLambertMaterial({map:T.glass}));s2.position.set(x,y,z);g.add(s2)}}
      const door=new THREE.Mesh(new THREE.PlaneGeometry(.5,.75),mt('#2a2d31'));face(door,0,.37);for(const[x0,z0,x1,z1]of[[B.x0,B.z0,B.x1,B.z0],[B.x0,B.z1,B.x1,B.z1],[B.x0,B.z0,B.x0,B.z1],[B.x1,B.z0,B.x1,B.z1]]){const len=Math.hypot(x1-x0,z1-z0);box(g,x1===x0?.08:len,.14,z1===z0?.08:len,cm,(x0+x1)/2,top+.07,(z0+z1)/2)}
      box(g,.5,.3,.4,mt('#c8ccce'),B.x0+.4,top+.15,B.z0+.35);cyl(g,.015,.015,1.2,mt('#888'),B.x1-.25,top+.6,B.z0+.25,5)}
    else if(b.t==='shack'||b.t==='pump'){const hgt=b.t==='pump'?1.05:1.3;
      if(b.t==='pump'){box(g,W2-.04,hgt,D2-.04,sm('#9da1a3','conc'),B.cx,hgt/2-.05,B.cz);box(g,W2+.04,.08,D2+.04,mt('#5f6569'),B.cx,hgt-.01,B.cz);
        for(let i=0;i<2;i++){const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,W2+.3,8),mt(i?'#7a6a5a':'#5f6b70'));p.rotation.z=Math.PI/2;face(p,0,.3+i*.18,.1)}const wh=new THREE.Mesh(new THREE.TorusGeometry(.1,.025,6,12),mt('#b8322a'));face(wh,faceLen/2-.3,.55,.2);
        const gen=new THREE.Mesh(new THREE.BoxGeometry(.5,.35,.35),mt('#5f6b4a'));face(gen,-faceLen/2+.4,.17,.3);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0x7dff8a}));face(lamp,-faceLen/2+.4,.4,.3);
        const ex=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.6,6),mt('#444'));ex.position.set(B.x1-.2,hgt+.25,B.z0+.2);g.add(ex)}
      else{const pcols=['#a4462c','#7d8a8f','#c98a2a','#3d5f7a','#8f7a5a','#6b5a4a'];let u=B.x0;
        while(u<B.x1-.01){const w2=Math.min(B.x1-u,.45+R()*.4);box(g,w2,hgt,D2-.06,sm(pcols[Math.floor(R()*pcols.length)],'corr'),u+w2/2,hgt/2-.05,B.cz);u+=w2}
        const ridge=W2>=D2,span=ridge?D2:W2,len=ridge?W2:D2,ang=.42,sl=span/2/Math.cos(ang)+.12;
        for(const sgn of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(ridge?len+.2:sl,.04,ridge?sl:len+.2),sm('#8a5a3a','corr'));if(ridge){r.position.set(B.cx,hgt+Math.tan(ang)*span/4-.03,B.cz+sgn*span/4);r.rotation.x=sgn*ang}else{r.position.set(B.cx+sgn*span/4,hgt+Math.tan(ang)*span/4-.03,B.cz);r.rotation.z=-sgn*ang}g.add(r)}
        const door=new THREE.Mesh(new THREE.PlaneGeometry(.38,.8),mt('#3a2a1e'));face(door,0,.38);if(R()<.7){const wn=new THREE.Mesh(new THREE.PlaneGeometry(.28,.22),winM);face(wn,faceLen/2-.35,.75)}
        cyl(g,.04,.04,.5,mt('#444'),B.x0+.25,hgt+.45,B.z0+.25,6)}}
    else if(b.t==='hall'||b.t==='warehouse'||b.t==='cellblock'||b.t==='atrium'){const wh=b.t==='warehouse'||b.t==='cellblock',fd=b.t==='cellblock'||b.t==='atrium',rh=wh?2.6:2.1,roof=new THREE.Group();b.roof=roof;
      if(wh){// walls on the perimeter, with roller doors over the door gaps
        const doors=new Set((b.doors||[]).map(([x,z])=>x+','+z)),wm2=fd?sm('#eef1f3','white'):sm('#8a8f94','corr');
        for(let z=b.z;z<b.z+b.d;z++)for(let x=b.x;x<b.x+b.w;x++){const edge=x===b.x||x===b.x+b.w-1||z===b.z||z===b.z+b.d-1;if(!edge)continue;const p=W(x,z);
          if(doors.has(x+','+z)){box(roof,1,rh-1.5,1,wm2,p.x,1.5+(rh-1.5)/2,p.z);const sh=new THREE.Mesh(new THREE.BoxGeometry(.96,.3,.96),sm('#d8d8d8',null,{map:T.shut}));sh.position.set(p.x,1.35,p.z);roof.add(sh);continue}
          box(g,1,1.4,1,wm2,p.x,.65,p.z);box(roof,1,rh-1.35,1,wm2,p.x,1.35+(rh-1.35)/2,p.z);if(fd&&R()<.6){const bw=new THREE.Mesh(new THREE.BoxGeometry(1.01,.32,1.01),new THREE.MeshLambertMaterial({map:T.bars}));bw.position.set(p.x,1.0,p.z);g.add(bw)}}
        box(g,W2+.04,.08,.08,mt(fd?'#38b6e8':'#e2b21f'),B.cx,1.38,B.z1+.02);if(b.use==='cells'){const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.45),new THREE.MeshBasicMaterial({map:T.sCells}));face(sg,0,rh-.5,.04)}const sgn=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.4),new THREE.MeshLambertMaterial({map:T.stripe}));sgn.material=sm('#f4f4f4');face(sgn,0,rh-.4,.03)}
      else{// open market hall: posts round the edge
        const pm=mt(fd?'#e9eef1':'#4a3a2e');for(let x=B.x0+.08;x<=B.x1;x+=Math.max(1,(W2-.16)/Math.ceil(W2/2)))for(const z of[B.z0+.08,B.z1-.08])cyl(g,.05,.06,rh,pm,x,rh/2,z,6);for(let z=B.z0+.08;z<=B.z1;z+=Math.max(1,(D2-.16)/Math.ceil(D2/2)))for(const x of[B.x0+.08,B.x1-.08])cyl(g,.05,.06,rh,pm,x,rh/2,z,6);
        const ban=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(2.4,faceLen*.7),.35),new THREE.MeshLambertMaterial({map:T.stripe,side:THREE.DoubleSide}));face(ban,0,rh-.2,.05);
        const st2={market:T.sMarket,fishery:T.sFish,clinic:T.sClinic,mess:T.sMess}[b.use];if(st2){const sg=new THREE.Mesh(new THREE.PlaneGeometry(.9,.45),new THREE.MeshBasicMaterial({map:st2}));face(sg,0,rh+.15,.06)}
        // hanging lanterns under the roof
        for(let i=0;i<Math.min(6,b.w*b.d/4);i++){const lx=B.x0+.6+R()*(W2-1.2),lz=B.z0+.6+R()*(D2-1.2);const ln=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:b.use==='clinic'?0xf4fbff:0xffd28a}));ln.position.set(lx,rh-.35,lz);g.add(ln);cyl(g,.006,.006,.3,mt('#222'),lx,rh-.18,lz,4)}
        if(b.use==='fishery')for(let i=0;i<3;i++){const net=new THREE.Mesh(new THREE.PlaneGeometry(.9,.6),sm('#3a4a3a',null,{side:THREE.DoubleSide,transparent:true,opacity:.7}));net.position.set(B.x0+.5+i*(W2-1)/2,rh-.5,B.z1-.15);net.rotation.y=.1;g.add(net)}}
      // the roof: shallow pitch, overhanging, ribbed tin; skylights on the warehouse
      const ridge=W2>=D2,span=(ridge?D2:W2)+.5,len=(ridge?W2:D2)+.5,ang=wh?.22:.3,sl=span/2/Math.cos(ang)+.05,rm=b.t==='atrium'?sm('#bfe6ff',null,{transparent:true,opacity:.75}):b.t==='cellblock'?sm('#dfe4e7','white'):b.use==='clinic'?sm('#eef0ea'):b.use==='fishery'?sm('#4a6a7a','corr'):sm(wh?'#9a9da0':'#b06a3a','corr');
      for(const sgn of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(ridge?len:sl,.05,ridge?sl:len),rm);if(ridge){r.position.set(B.cx,rh+Math.tan(ang)*span/4,B.cz+sgn*span/4);r.rotation.x=sgn*ang}else{r.position.set(B.cx+sgn*span/4,rh+Math.tan(ang)*span/4,B.cz);r.rotation.z=-sgn*ang}roof.add(r)}
      if(wh)for(let i=-1;i<=1;i+=2){const sk=new THREE.Mesh(new THREE.BoxGeometry(ridge?.6:.5,.06,ridge?.5:.6),new THREE.MeshLambertMaterial({color:0x9fd0e8}));sk.position.set(B.cx+(ridge?i*len/4:span/4*.6),rh+.2,B.cz+(ridge?span/4*.6:i*len/4));sk.rotation.copy(roof.children[1].rotation);roof.add(sk)}
      if(b.use==='clinic'){for(const[w3,d3]of[[.7,.2],[.2,.7]]){const cr=new THREE.Mesh(new THREE.BoxGeometry(w3,.02,d3),sm('#c8321f'));cr.position.set(B.cx,rh+Math.tan(ang)*span/2*.98+.02,B.cz);roof.add(cr)}}
      if(b.use==='works'){const sx=B.x1-.5,sz=B.z0+.5;cyl(g,.22,.28,4.6,sm('#7a4a3a','side'),sx,2.3,sz,12);for(const y of[1.5,3,4.4])cyl(g,.3,.3,.08,mt('#3a3a3a'),sx,y,sz,12);b.smoke=[sx,4.7,sz];
        const fur=new THREE.Mesh(new THREE.PlaneGeometry(.7,.5),new THREE.MeshBasicMaterial({color:0xff7a2a}));face(fur,-faceLen/4,.3,.03);const fr2=new THREE.Mesh(new THREE.PlaneGeometry(.84,.62),mt('#1a1a1a'));face(fr2,-faceLen/4,.3,.02);
        const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.5),new THREE.MeshBasicMaterial({map:T.sWorks}));face(sg,faceLen/4,1.75,.04);if(lit){const l=new THREE.PointLight(0xff7a2a,.9,3.5,2);face(l,-faceLen/4,.4,.6);g.remove(l);scene.add(l)}
        b.sparks=[];}
      roof.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.userData.roofMat=true;o.userData.live=true}});b.roofMeshes=[];roof.traverse(o=>{if(o.isMesh)b.roofMeshes.push(o)});g.add(roof)}
    else if(b.t==='apt'||b.t==='wallw'){// Founders apartments (walkable roof) and the white sea wall you can stand on
      const wh2=sm('#f2f5f7','white'),trim=sm('#38b6e8'),floors=Math.max(1,Math.round(top));box(g,W2-.02,top+.05,D2-.02,wh2,B.cx,top/2-.025,B.cz);
      if(b.t==='apt'){for(let i=0;i<floors;i++){const y=i+.62;for(const[ww,dd,x,z]of[[W2-.16,.02,B.cx,B.z1+.006],[W2-.16,.02,B.cx,B.z0-.006],[.02,D2-.16,B.x0-.006,B.cz],[.02,D2-.16,B.x1+.006,B.cz]]){const s2=new THREE.Mesh(new THREE.BoxGeometry(ww,.32,dd),lit?new THREE.MeshBasicMaterial({map:T.glass,color:0xffe6b0}):new THREE.MeshLambertMaterial({map:T.glass}));s2.position.set(x,y,z);g.add(s2)}
          box(g,W2+.02,.04,D2+.02,trim,B.cx,i+.98,B.cz);if(R()<.7){const bal=new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.2,faceLen*.5),.06,.3),wh2);face(bal,(R()-.5)*faceLen*.4,y-.28,.15);const gl=new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.2,faceLen*.5),.22,.02),sm('#bfe6ff',null,{transparent:true,opacity:.5}));face(gl,bal.position.x?0:0,y-.16,.3);for(let k=0;k<2;k++){const pl=new THREE.Mesh(new THREE.IcosahedronGeometry(.08,0),mt('#5f8f4a'));face(pl,(k-.5)*.4,y-.18,.2)}}}
        for(let i=0;i<2;i++){const sp=new THREE.Mesh(new THREE.BoxGeometry(.55,.03,.35),sm('#2a3a4a'));sp.position.set(B.x0+.45+i*.6,top+.12,B.z0+.35);sp.rotation.x=-.35;g.add(sp)}
        const door=new THREE.Mesh(new THREE.PlaneGeometry(.45,.7),sm('#2a7fbd'));face(door,0,.35)}
      else{for(let u=-faceLen/2+.5;u<faceLen/2;u+=1){const sl=new THREE.Mesh(new THREE.PlaneGeometry(.12,.3),mt('#22272c'));face(sl,u,top-.35)}box(g,W2+.04,.08,D2+.04,trim,B.cx,top-.06,B.cz)}
      for(const[x0,z0,x1,z1]of[[B.x0,B.z0,B.x1,B.z0],[B.x0,B.z1,B.x1,B.z1],[B.x0,B.z0,B.x0,B.z1],[B.x1,B.z0,B.x1,B.z1]]){const len=Math.hypot(x1-x0,z1-z0);box(g,x1===x0?.06:len,.12,z1===z0?.06:len,wh2,(x0+x1)/2,top+.06,(z0+z1)/2)}}
    else if(b.t==='block'||b.t==='spire'){// Founders tower blocks (solid) and the Security Tower spire
      const st=b.st||(b.t==='spire'?8:4),wh2=sm('#f2f5f7','white');if(b.t==='spire'){const r=Math.min(W2,D2)*.46;const sp=new THREE.Mesh(new THREE.CylinderGeometry(r*.72,r,st,28),wh2);sp.position.set(B.cx,st/2-.05,B.cz);g.add(sp);
          for(let y=.8;y<st;y+=1.1){const gl=new THREE.Mesh(new THREE.CylinderGeometry(r*(1-.28*y/st)+.03,r*(1-.28*y/st)+.03,.32,28),lit?new THREE.MeshBasicMaterial({color:0xffe6b0}):sm('#8fcbea'));gl.position.set(B.cx,y,B.cz);g.add(gl)}
          for(const y of[st*.42,st*.7]){const gd=new THREE.Mesh(new THREE.TorusGeometry(r*(1-.28*y/st)+.12,.14,6,28),mt('#5aa35a'));gd.rotation.x=Math.PI/2;gd.position.set(B.cx,y,B.cz);g.add(gd)}
          const cap=new THREE.Mesh(new THREE.SphereGeometry(r*.72,28,12,0,Math.PI*2,0,Math.PI/2),sm('#bfe6ff'));cap.position.set(B.cx,st-.05,B.cz);g.add(cap);const bc=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),new THREE.MeshBasicMaterial({color:0x5fd0ff}));bc.position.set(B.cx,st+r*.72,B.cz);bc.userData.live=true;g.add(bc);ANIM.push((dt,t)=>{bc.visible=(t%1.6)<.8});
          const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.45),new THREE.MeshBasicMaterial({map:T.sSec}));face(sg,0,1.3,r-Math.min(W2,D2)/2+.06)}
        else{box(g,W2-.04,st,D2-.04,wh2,B.cx,st/2-.05,B.cz);for(let i=0;i<st;i++){for(const[ww,dd,x,z]of[[W2-.2,.02,B.cx,B.z1-.01],[W2-.2,.02,B.cx,B.z0+.01],[.02,D2-.2,B.x0+.01,B.cz],[.02,D2-.2,B.x1-.01,B.cz]]){const s2=new THREE.Mesh(new THREE.BoxGeometry(ww,.34,dd),lit&&R()<.7?new THREE.MeshBasicMaterial({map:T.glass,color:0xffe6b0}):new THREE.MeshLambertMaterial({map:T.glass}));s2.position.set(x,i+.6,z);g.add(s2)}box(g,W2,.05,D2,sm('#38b6e8'),B.cx,i+.95,B.cz)}
          box(g,W2*.5,.4,D2*.5,mt('#d8dde0'),B.cx,st+.15,B.cz);cyl(g,.02,.02,1.2,mt('#888'),B.x1-.3,st+.6,B.z0+.3,5)}}
    else if(b.t==='kiosk'){// guard post: white booth, blue light bar, a barrier arm
      box(g,W2-.15,1.15,D2-.15,sm('#f2f5f7','white'),B.cx,.55,B.cz);box(g,W2-.05,.08,D2-.05,mt('#22272c'),B.cx,1.16,B.cz);const lb=new THREE.Mesh(new THREE.BoxGeometry(.3,.06,.08),new THREE.MeshBasicMaterial({color:0x5fd0ff}));lb.position.set(B.cx,1.24,B.cz);g.add(lb);
      const wn=new THREE.Mesh(new THREE.PlaneGeometry(W2-.4,.35),sm('#2a3a4a'));face(wn,0,.75,.02);const arm=new THREE.Mesh(new THREE.BoxGeometry(1.4,.06,.06),sm('#ffffff',null,{map:TX.hazard}));face(arm,faceLen/2+.7,.6,.25)}
    else if(b.t==='distillery'){// water distillery: tin shed, two copper stills with domes and coils, blue water tanks, steam
      box(g,W2-.04,1.1,D2-.04,sm('#8a8f94','corr'),B.cx,.5,B.cz);box(g,W2+.06,.06,D2+.06,mt('#5f6569'),B.cx,1.07,B.cz);
      for(let i=0;i<2;i++){const sx=B.x0+.45+i*(W2-.9),sz=B.cz;cyl(g,.26,.3,.7,'#b8733a',sx,1.45,sz,14);const dm=new THREE.Mesh(new THREE.SphereGeometry(.26,14,8,0,Math.PI*2,0,Math.PI/2),mt('#c88a4a'));dm.position.set(sx,1.8,sz);g.add(dm);
        const coil=new THREE.Mesh(new THREE.TorusGeometry(.14,.025,6,16),mt('#b8733a'));coil.rotation.x=Math.PI/2;coil.position.set(sx,1.95,sz);g.add(coil);cyl(g,.03,.03,.5,'#b8733a',sx+.2,1.95,sz,6).rotation.z=1.2}
      for(let i=0;i<3;i++)cyl(g,.16,.16,.5,'#2f6eb8',B.x0+.3+i*.4,.25,(f[1]>0?B.z1:B.z0)+(f[1]>0?.2:-.2),12);
      const sg=new THREE.Mesh(new THREE.PlaneGeometry(.8,.4),new THREE.MeshBasicMaterial({map:T.sWater}));face(sg,0,.8,.02);b.smoke=[B.x0+.45,2.1,B.cz];b.steam=true}
    else if(b.t==='radio'){// radio shack: a small hut, a lattice mast with a blinking light, dishes and cables
      box(g,W2-.06,1.0,D2-.06,sm('#3d5f7a','corr'),B.cx,.45,B.cz);box(g,W2+.04,.06,D2+.04,mt('#2b2b2b'),B.cx,.97,B.cz);const sg=new THREE.Mesh(new THREE.PlaneGeometry(.7,.35),new THREE.MeshBasicMaterial({map:T.sRadio}));face(sg,0,.75,.02);
      const mx=B.x0+.3,mz=B.z0+.3,mh=4.2;for(const[dx,dz]of[[-.08,-.08],[.08,-.08],[-.08,.08],[.08,.08]]){const l=cyl(g,.015,.015,mh,'#c8ccce',mx+dx,mh/2,mz+dz,4)}for(let y=.4;y<mh;y+=.4)box(g,.18,.015,.015,'#c8ccce',mx,y,mz,(y*3)%2);
      for(let i=0;i<3;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.16+i*.04,10,6,0,Math.PI*2,0,.9),sm('#e9eef1',null,{side:THREE.DoubleSide}));d.position.set(B.x1-.3-i*.05,1.15+i*.5,B.z1-.3);d.rotation.set(-1,i,0);g.add(d)}
      const bl=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xff3a2a}));bl.position.set(mx,mh+.05,mz);bl.userData.live=true;g.add(bl);ANIM.push((dt,t)=>{bl.visible=(t%1.2)<.5});
      for(let i=0;i<4;i++){const ant=cyl(g,.01,.01,.8,'#555',mx+(i-1.5)*.08,mh-.3,mz,4);ant.rotation.z=(i-1.5)*.3}}
    else if(b.t==='shrine'){// a small shrine: stone base, tin canopy on posts, candles that glow, prayer flags
      box(g,W2-.2,.35,D2-.2,sm('#9a958c','conc'),B.cx,.17,B.cz);box(g,W2-.4,.3,D2-.45,mt('#6b4a2e'),B.cx,.5,B.cz);
      for(const sx of[B.x0+.15,B.x1-.15])for(const sz of[B.z0+.15,B.z1-.15])cyl(g,.03,.03,1.3,'#4a3a2e',sx,.65,sz,5);const can=new THREE.Mesh(new THREE.ConeGeometry(Math.max(W2,D2)*.75,.35,4),sm('#c8321f','corr'));can.rotation.y=Math.PI/4;can.position.set(B.cx,1.45,B.cz);g.add(can);
      for(let i=0;i<5;i++){cyl(g,.025,.025,.1,'#f2ead8',B.cx-.2+i*.1,.71,B.cz,6);const fl=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),new THREE.MeshBasicMaterial({color:0xffc062}));fl.position.set(B.cx-.2+i*.1,.79,B.cz);g.add(fl)}
      const FC=['#c8321f','#e3c25a','#2f8a86','#f2ead8','#3d6a8a'];for(let i=0;i<6;i++){const fl=new THREE.Mesh(new THREE.PlaneGeometry(.14,.18),sm(FC[i%5],null,{side:THREE.DoubleSide}));fl.position.set(B.x0+.15+i*(W2-.3)/5,1.15-Math.sin(i/5*Math.PI)*.15,B.z1-.15);g.add(fl)}
      if(lit&&!lo){const l=new THREE.PointLight(0xffb060,.6,2.5,2);l.position.set(B.cx,.9,B.cz);scene.add(l)}}
    else if(b.t==='magnet'){// scrap-yard magnet crane: a tower, a boom, a cable and a magnet holding a car shell
      const ym='#e2b21f';cyl(g,.2,.28,.3,'#3a3a3a',B.cx,.15,B.cz,10);box(g,.3,3.2,.3,mt(ym),B.cx,1.75,B.cz);box(g,.6,.5,.5,mt('#3a3d40'),B.cx,3.3,B.cz);
      const ang=b.rot||-.6,L4=3.6,bx=B.cx+Math.cos(ang)*L4/2,bz=B.cz+Math.sin(ang)*L4/2;box(g,L4,.18,.18,mt(ym),bx,3.6,bz,-ang);const ex=B.cx+Math.cos(ang)*(L4-.2),ez=B.cz+Math.sin(ang)*(L4-.2);
      cyl(g,.015,.015,1.6,'#222',ex,2.8,ez,4);cyl(g,.3,.3,.12,'#2a2a2a',ex,1.95,ez,14);const car=new THREE.Mesh(new THREE.BoxGeometry(.9,.35,.5),sm('#7a3c22'));car.position.set(ex,1.65,ez);car.rotation.set(.15,ang,.2);g.add(car);const cab=new THREE.Mesh(new THREE.BoxGeometry(.5,.25,.45),sm('#6a3420'));cab.position.set(ex+.05,1.88,ez);cab.rotation.copy(car.rotation);g.add(cab)}
    else if(b.t==='tower'){const lm=mt('#5a4a3a');for(const sx of[B.x0+.12,B.x1-.12])for(const sz of[B.z0+.12,B.z1-.12])box(g,.08,top+.02,.08,lm,sx,top/2,sz);
      for(let y=.4;y<top-.2;y+=.6){box(g,W2-.2,.04,.04,lm,B.cx,y,B.z0+.12);box(g,W2-.2,.04,.04,lm,B.cx,y,B.z1-.12);box(g,.04,.04,D2-.2,lm,B.x0+.12,y,B.cz);box(g,.04,.04,D2-.2,lm,B.x1-.12,y,B.cz)}
      box(g,W2,.08,D2,mt('#6b5236'),B.cx,top-.04,B.cz);for(const[x,z,w,d]of[[B.cx,B.z0+.03,W2,.05],[B.cx,B.z1-.03,W2,.05],[B.x0+.03,B.cz,.05,D2],[B.x1-.03,B.cz,.05,D2]])box(g,w,.4,d,sm('#8a6a48','planks'),x,top+.2,z);
      for(const sx of[B.x0+.06,B.x1-.06])for(const sz of[B.z0+.06,B.z1-.06])box(g,.05,.95,.05,lm,sx,top+.47,sz);const cr=new THREE.Mesh(new THREE.ConeGeometry(Math.max(W2,D2)*.8,.4,4),sm('#8a5a3a','corr'));cr.rotation.y=Math.PI/4;cr.position.set(B.cx,top+1.1,B.cz);g.add(cr)}
    else if(b.t==='tank'){const lh=1.5,lm=mt('#6a6d72');for(const sx of[B.x0+.2,B.x1-.2])for(const sz of[B.z0+.2,B.z1-.2])box(g,.1,lh,.1,lm,sx,lh/2,sz);for(const y of[.5,1.1]){box(g,W2-.4,.05,.05,lm,B.cx,y,B.z0+.2);box(g,W2-.4,.05,.05,lm,B.cx,y,B.z1-.2)}
      const r=Math.min(W2,D2)*.48,tk=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1.2,20),new THREE.MeshLambertMaterial({map:T.water}));tk.position.set(B.cx,lh+.6,B.cz);g.add(tk);const cap=new THREE.Mesh(new THREE.ConeGeometry(r*1.04,.35,20),mt('#8a8f94'));cap.position.set(B.cx,lh+1.37,B.cz);g.add(cap);cyl(g,.05,.05,lh,mt('#5f6b70'),B.cx,lh/2,B.cz,8)}
    else if(b.t==='bridge'){const ax=b.w>=b.d,pl=sm('#8b6a48','planks'),rope=mt('#3a2c22');box(g,ax?W2:.8,.06,ax?.8:D2,pl,B.cx,top-.03,B.cz);
      for(const s2 of[-.42,.42]){box(g,ax?W2:.025,.025,ax?.025:D2,rope,B.cx+(ax?0:s2),top+.42,B.cz+(ax?s2:0));for(let k=0;k<=(ax?W2:D2);k+=.5)box(g,.03,.42,.03,rope,ax?B.x0+k:B.cx+s2,top+.21,ax?B.cz+s2:B.z0+k)}}
    stat.add(g)}
  // merge the static parts into one mesh per material (roofs stay live so they can fade)
  // cables with bulbs strung between neighbouring rooftops
  const tall=BLD.filter(b=>['home','stack','office','cantina','tower'].includes(b.t)),cab=new THREE.Group(),bulbM=new THREE.MeshBasicMaterial({color:lit?0xffd28a:0xb8a070});let nc=0;
  for(let i=0;i<tall.length&&nc<(lo?4:10);i++)for(let j=i+1;j<tall.length&&nc<(lo?4:10);j++){const A=bldBox(tall[i]),C=bldBox(tall[j]),ya=(tall[i].topY??(tall[i].lv||0)*.25)+.6,yc=(tall[j].topY??(tall[j].lv||0)*.25)+.6,d=Math.hypot(A.cx-C.cx,A.cz-C.cz);if(d<2.5||d>6.5)continue;
    const a2=new THREE.Vector3(A.cx,ya,A.cz),c2=new THREE.Vector3(C.cx,yc,C.cz),pts=[];for(let k=0;k<=12;k++){const t=k/12,v=a2.clone().lerp(c2,t);v.y-=Math.sin(t*Math.PI)*.45;pts.push(v)}
    cab.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x1a1a1a})));for(let k=2;k<12;k+=3){const bb=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),bulbM);bb.position.copy(pts[k]);bb.position.y-=.05;stat.add(bb)}nc++}
  {const homes=BLD.filter(b=>b.t==='home'||b.t==='stack');let nl=0;const CL=['#e3672a','#d8d0b8','#3d6a8a','#8a3b24','#e3c25a','#6b8a4a','#f2f2ee'];
   for(let i=0;i<homes.length&&nl<(lo?3:8);i++)for(let j=i+1;j<homes.length&&nl<(lo?3:8);j++){const A=bldBox(homes[i]),C=bldBox(homes[j]),d=Math.hypot(A.cx-C.cx,A.cz-C.cz);if(d<2||d>4.5)continue;
     const y=Math.min(1.1,((homes[i].lv||4)*.25),((homes[j].lv||4)*.25))+.25,a2=new THREE.Vector3(A.cx,y,A.cz),c2=new THREE.Vector3(C.cx,y,C.cz);
     // start and end on the facing walls rather than the centres
     const dir=c2.clone().sub(a2).normalize();a2.addScaledVector(dir,Math.min(A.w,A.d)/2);c2.addScaledVector(dir,-Math.min(C.w,C.d)/2);const L3=a2.distanceTo(c2);if(L3<.8)continue;
     cab.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a2,c2]),new THREE.LineBasicMaterial({color:0x2a2a2a})));
     for(let k=1;k<Math.floor(L3/.32);k++){const c=new THREE.Mesh(new THREE.PlaneGeometry(.22,.3),sm(CL[(k+nl)%CL.length],null,{side:THREE.DoubleSide}));c.position.copy(a2).lerp(c2,k/Math.floor(L3/.32));c.position.y-=.17;c.rotation.y=-Math.atan2(c2.z-a2.z,c2.x-a2.x);stat.add(c)}nl++}}
  scene.add(cab);
  // a rusting hull and moored boats off the docks (map extras)
  for(const e of M.extras||[]){const p=W(e.x,e.z);if(e.t==='hull'){const hg=new THREE.Group(),rm=sm('#6a3a22','corr'),L2=e.len||9;const hull=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,L2,16,1,false,0,Math.PI),rm);hull.rotation.set(0,0,Math.PI/2);hull.scale.set(1,1,.8);hull.position.y=.2;hg.add(hull);
      const dk=new THREE.Mesh(new THREE.BoxGeometry(L2,.12,2.4),sm('#4a3a2e','planks'));dk.position.y=.25;hg.add(dk);const br=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.4,1.6),sm('#d8d2c0','corr'));br.position.set(-L2*.3,1,0);hg.add(br);
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,3.2,6),mt('#3a3a3a'));mast.position.set(.8,1.8,0);mast.rotation.z=.25;hg.add(mast);hg.position.set(p.x,-.7,p.z);hg.rotation.set(.08,e.rot||0,.18);stat.add(hg)}
    else if(e.t==='boat'){const bt=boatProp(rng(e.x*7+e.z));bt.position.set(p.x,-.28,p.z);bt.rotation.y=e.rot||0;scene.add(bt)}}
  worldBake(stat);
  // chimney smoke
  if(!lo){const puffs=[],pm=new THREE.MeshLambertMaterial({color:0x8a8a8a,transparent:true,opacity:.4,depthWrite:false});for(const b of BLD)if(b.smoke)for(let k=0;k<3;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(.12,6,5),pm.clone());if(b.steam)m.material.color.set(0xf2f2f2);m.userData.s=b.smoke;m.userData.ph=k/3;scene.add(m);puffs.push(m)}
    if(puffs.length)ANIM.push((dt,t)=>{for(const m of puffs){const k=(t*.25+m.userData.ph)%1,[x,y,z]=m.userData.s;m.position.set(x+k*.4,y+k*1.6,z+k*.2);m.scale.setScalar(.6+k*2.2);m.material.opacity=.4*(1-k)}})}
  // vent grates: a louvred box with a dark mouth; winch lifts: a davit at the roof edge, pulley, rope and foot loop
  for(const v of S.vents||[])for(const[x,z]of[[v.x1,v.z1],[v.x2,v.z2]]){const t=G[z][x],p=W(x,z),y=topY(t),vg=new THREE.Group();const fr=new THREE.Mesh(new THREE.BoxGeometry(.56,.14,.56),sm('#5f6569'));fr.position.y=.07;vg.add(fr);
    const mouth=new THREE.Mesh(new THREE.PlaneGeometry(.44,.44),new THREE.MeshBasicMaterial({color:0x07090b}));mouth.rotation.x=-Math.PI/2;mouth.position.y=.145;vg.add(mouth);for(let i=0;i<4;i++){const sl=new THREE.Mesh(new THREE.BoxGeometry(.44,.02,.04),sm('#9aa4ad'));sl.position.set(0,.15,-.15+i*.1);sl.rotation.x=.5;vg.add(sl)}
    const tag=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,.12),new THREE.MeshBasicMaterial({color:0x5fe8c0}));tag.position.set(.22,.15,.22);vg.add(tag);vg.position.set(p.x,y,p.z);vg.traverse(o=>{if(o.isMesh)o.userData.tile=t});scene.add(vg)}
  for(const w of S.winches||[]){const a=G[w.z1][w.x1],b=G[w.z2][w.x2],pa=W(w.x1,w.z1),pb=W(w.x2,w.z2),ya=topY(a),yb=topY(b),dx=Math.sign(pa.x-pb.x),dz=Math.sign(pa.z-pb.z),wg=new THREE.Group(),Y2=sm('#e2b21f'),D2=sm('#2b2e32');
    const ex=pb.x+dx*.45,ez=pb.z+dz*.45;const post=new THREE.Mesh(new THREE.BoxGeometry(.09,.9,.09),Y2);post.position.set(pb.x+dx*.3,yb+.45,pb.z+dz*.3);wg.add(post);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(dx?.55:.09,.09,dz?.55:.09),Y2);arm.position.set(pb.x+dx*.5,yb+.88,pb.z+dz*.5);wg.add(arm);const pul=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.05,12),D2);pul.rotation.set(dz?Math.PI/2:0,0,dx?Math.PI/2:0);pul.position.set(pb.x+dx*.72,yb+.82,pb.z+dz*.72);wg.add(pul);
    const rope=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,yb+.82-ya-.1,5),sm('#c9b48c'));rope.position.set(pb.x+dx*.72,(yb+.82+ya+.1)/2,pb.z+dz*.72);wg.add(rope);const loop=new THREE.Mesh(new THREE.TorusGeometry(.09,.02,6,12),sm('#c8321f'));loop.position.set(pb.x+dx*.72,ya+.12,pb.z+dz*.72);wg.add(loop);
    const crank=new THREE.Mesh(new THREE.BoxGeometry(.3,.22,.22),D2);crank.position.set(pb.x-dx*.1,yb+.11,pb.z-dz*.1);wg.add(crank);const drum=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.26,10),Y2);drum.rotation.set(dz?0:Math.PI/2,0,dz?Math.PI/2:0);drum.position.set(pb.x-dx*.1,yb+.27,pb.z-dz*.1);wg.add(drum);
    const tag=new THREE.Mesh(new THREE.PlaneGeometry(.4,.4),new THREE.MeshBasicMaterial({color:0xffd23a,transparent:true,opacity:.5,depthWrite:false}));tag.rotation.x=-Math.PI/2;tag.position.set(pa.x,ya+.02,pa.z);wg.add(tag);wg.traverse(o=>{if(o.isMesh)o.castShadow=HI()});scene.add(wg)}
  // tunnel mouths: manhole rims with a dark hole
  for(const tn of S.tunnels||[])for(const[x,z]of[[tn.x1,tn.z1],[tn.x2,tn.z2]]){const t=G[z][x],p=W(x,z);const rim=new THREE.Mesh(new THREE.TorusGeometry(.26,.05,6,16),sm('#3a3d40'));rim.rotation.x=Math.PI/2;rim.position.set(p.x,topY(t)+.03,p.z);scene.add(rim);
    const hole=new THREE.Mesh(new THREE.CircleGeometry(.24,16),new THREE.MeshBasicMaterial({color:0x07090b}));hole.rotation.x=-Math.PI/2;hole.position.set(p.x,topY(t)+.025,p.z);scene.add(hole);
    const lid=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.03,16),sm('#5a5d60'));lid.position.set(p.x+.28,topY(t)+.02,p.z+.12);lid.rotation.z=.15;scene.add(lid)}
  // roofs fade while the squad is inside or can move inside
  ANIM.push(dt=>{const sel=typeof S!=='undefined'&&S.sel&&S.reach?S.reach:null;for(const b of BLD){if(!b.roof)continue;let inside=!!window.ROOFS_LIFTED;
      for(const u of units)if(u.team==='p'&&!u.down&&!u.gone&&bldInside(b,u.x,u.z)){inside=true;break}
      if(!inside&&sel)for(let z=b.z+1;z<b.z+b.d-1&&!inside;z++)for(let x=b.x+1;x<b.x+b.w-1;x++)if(sel.d.has(key(x,z))){inside=true;break}
      const tgt=inside?.12:1;for(const o of b.roofMeshes||[]){{o.material.opacity+=(tgt-o.material.opacity)*Math.min(1,dt*6);o.material.depthWrite=o.material.opacity>.9;o.visible=o.material.opacity>.05}}}})}

// Cover inside or beside a building with a job is drawn as that job's props:
// market stalls and produce, fish crates and drying racks, clinic cots and
// supply boxes, foundry gas bottles and workbenches, bar tables. Same cover
// rules (crate = full, wall = half, heavies charge through half cover).
function bldProp(t,g){const b=t.bld,use=b&&(b.use||(b.t==='cantina'?'bar':null));if(!use)return false;const R=rng(t.x*97+t.z*31),M3=c=>sm(c),box=(w,h,d,c,x,y,z,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='string'?sm(c):c);m.position.set(x,y,z);m.rotation.y=ry;g.add(m);return m},
  cyl=(r1,r2,h,c,x,y,z,seg=8)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),sm(c));m.position.set(x,y,z);g.add(m);return m},ball=(r,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,0),sm(c));m.position.set(x,y,z);g.add(m);return m};
  const wood=sm('#9a7a52','planks');
  if(use==='market'){if(t.obj==='wall'){box(.9,.08,.5,wood,0,.46,0);box(.85,.42,.45,'#6b4a2e',0,.21,0);for(const x of[-.42,.42])box(.04,1.1,.04,'#4a3a2e',x,.55,-.2);const can=new THREE.Mesh(new THREE.PlaneGeometry(1,.6),new THREE.MeshLambertMaterial({map:bldTex().stripe,side:THREE.DoubleSide}));can.position.set(0,1.1,0);can.rotation.x=-1.25;g.add(can);
      for(let i=0;i<6;i++)ball(.06,['#e3672a','#e3c25a','#6fa040','#c8321f'][i%4],-.3+(i%3)*.3,.56,-.08+Math.floor(i/3)*.16);return true}
    if(t.obj==='crate'){for(const[x,z,r]of[[-.22,-.2,.2],[.2,-.18,-.1],[0,.22,.3]]){box(.38,.3,.32,wood,x,.15,z,r);for(let i=0;i<4;i++)ball(.07,['#e3672a','#6fa040','#e3c25a','#8a3b24'][(i+Math.round(x*10))&3],x-.1+(i%2)*.2,.34,z-.06+Math.floor(i/2)*.12)}box(.4,.3,.34,wood,0,.46,0,.2);return true}}
  if(use==='fishery'){if(t.obj==='crate'){for(let i=0;i<5;i++){const x=(i%3-1)*.3,z=i<3?-.15:.18,y=i<3?.12:.12;box(.28,.22,.36,'#2f6eb8',x,y,z);for(let k=0;k<3;k++){const f=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),sm('#c8d0d6'));f.scale.set(1,.5,2.2);f.position.set(x-.07+k*.07,y+.13,z);g.add(f)}}box(.34,.3,.4,'#3d6a8a',0,.4,.18);return true}
    if(t.obj==='wall'){for(const x of[-.42,.42]){const a=box(.04,1.1,.04,'#4a3a2e',x,.5,0);a.rotation.z=x>0?.12:-.12}box(.9,.03,.03,'#4a3a2e',0,1.02,0);box(.9,.03,.03,'#4a3a2e',0,.65,0);for(let i=0;i<7;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),sm('#b8a88a'));f.scale.set(.6,2.2,.4);f.position.set(-.36+i*.12,(i%2?.52:.88),0);g.add(f)}return true}}
  if(use==='clinic'){if(t.obj==='crate'){box(.8,.06,.4,'#9aa4ad',0,.4,0);for(const[x,z]of[[-.36,-.16],[.36,-.16],[-.36,.16],[.36,.16]])box(.03,.4,.03,'#7a848a',x,.2,z);box(.76,.08,.36,'#f4f4f0',0,.47,0);box(.4,.05,.37,'#c8321f',.15,.52,0);box(.18,.06,.3,'#ffffff',-.28,.53,0);
      cyl(.012,.012,1.1,'#9aa4ad',.45,.55,.25,5);box(.1,.14,.03,'#bfe6ff',.45,1.05,.25);return true}
    if(t.obj==='wall'){box(.5,.35,.4,'#f4f4f0',-.18,.18,0);box(.4,.3,.35,'#e9eef1',.25,.15,.05,.3);box(.24,.06,.01,'#c8321f',-.18,.25,.205);box(.06,.24,.01,'#c8321f',-.18,.25,.206);box(.45,.28,.36,'#f4f4f0',-.1,.49,0,.1);return true}}
  if(use==='works'){if(t.obj==='crate'){for(let i=0;i<5;i++)cyl(.09,.09,.75,['#2f6e8a','#c8321f','#4f6b3a','#e3c25a','#2f6e8a'][i],-.24+(i%3)*.24,.38,i<3?-.15:.15,10);box(.8,.05,.05,'#3a3a3a',0,.6,-.28);return true}
    if(t.obj==='wall'){box(.9,.06,.5,'#5a5d60',0,.48,0);for(const x of[-.4,.4])for(const z of[-.2,.2])box(.05,.45,.05,'#3a3d40',x,.23,z);box(.15,.12,.12,'#2b2b2b',.3,.57,0);box(.3,.1,.2,'#8a8f94',-.2,.56,.05);const sp=new THREE.Mesh(new THREE.SphereGeometry(.04,6,4),new THREE.MeshBasicMaterial({color:0xffd27a}));sp.position.set(.3,.66,0);g.add(sp);return true}}
  if(use==='school'){if(t.obj==='wall'){for(const x of[-.22,.22]){box(.36,.04,.3,wood,x,.38,0);for(const sx of[-.15,.15])box(.03,.36,.03,'#4a3a2e',x+sx,.19,.12);box(.3,.04,.18,wood,x,.24,.3)}return true}
    if(t.obj==='crate'){box(.9,.6,.05,'#2a3a2e',0,.75,0);box(.94,.05,.08,wood,0,1.06,0);box(.94,.05,.08,wood,0,.44,0);for(const x of[-.35,.35]){const lg=box(.04,1.1,.04,'#4a3a2e',x,.55,.08);lg.rotation.x=-.12}
      for(let i=0;i<3;i++)box(.18,.012,.006,'#f2f2ee',-.25+i*.22,.8+(i%2)*.12,-.03);return true}}
  if(use==='noodles'&&t.obj==='wall'){box(.9,.5,.45,'#7a3c22',0,.25,0);box(.95,.05,.5,wood,0,.52,0);cyl(.12,.12,.16,'#9aa4ad',-.2,.62,0,12);for(let k=0;k<2;k++){const st2=new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),new THREE.MeshLambertMaterial({color:0xf2f2f2,transparent:true,opacity:.45}));st2.position.set(-.2,.8+k*.15,0);g.add(st2)}
    for(const x of[-.42,.42])box(.04,1.3,.04,'#3a2a1e',x,.65,-.2);box(.95,.04,.5,'#c8321f',0,1.3,-.05);for(const x of[-.3,.3]){const ln=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),new THREE.MeshBasicMaterial({color:0xff5a3a}));ln.position.set(x,1.12,.15);g.add(ln)}
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(.6,.25),new THREE.MeshBasicMaterial({map:bldTex().sNoodle}));sg.position.set(0,1.4,.2);g.add(sg);for(const x of[-.3,0,.3])cyl(.08,.08,.04,'#c8321f',x,.28,.42,8);return true}
  if(use==='scrap'){if(t.obj==='crate'){const mm=['#7a3c22','#5a5d60','#8a8f94','#3d5f7a','#6a4a2e'];for(let i=0;i<7;i++){const m=box(.2+R()*.35,.08+R()*.18,.2+R()*.3,mm[i%5],(R()-.5)*.5,.1+i*.09,(R()-.5)*.5,R()*3);m.rotation.z=(R()-.5)*.6}
      const car=box(.7,.28,.42,'#8a3b24',0,.75,0,.4);car.rotation.z=.25;return true}
    if(t.obj==='wall'){for(let i=0;i<3;i++){const ty=new THREE.Mesh(new THREE.TorusGeometry(.2,.08,6,12),sm('#1f1f1f'));ty.rotation.x=Math.PI/2;ty.position.set(i===2?.05:(i-.5)*.42,.08+(i===2?.16:0),0);g.add(ty)}return true}}
  if(use==='coop'&&t.obj==='crate'){box(.8,.5,.6,wood,0,.25,0);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.7,.35),sm('#c8ccce',null,{side:THREE.DoubleSide,transparent:true,opacity:.5}));mesh.position.set(0,.3,.31);g.add(mesh);
    const rf=box(.9,.05,.7,sm('#8a5a3a','corr'),0,.55,0);rf.rotation.x=.15;for(let i=0;i<3;i++){const ch=new THREE.Mesh(new THREE.SphereGeometry(.06,6,5),sm(i?'#f4f4f0':'#a5722f'));ch.position.set(-.25+i*.25,.06,.45);ch.scale.set(1,.9,1.3);g.add(ch);const cm=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,.02),sm('#c8321f'));cm.position.set(-.25+i*.25,.13,.51);g.add(cm)}return true}
  if(use==='garden'&&t.obj==='wall'){box(.9,.3,.45,sm('#6b4a2e','planks'),0,.15,0);box(.86,.04,.41,'#3a2a1e',0,.31,0);for(let i=0;i<6;i++){const lf=new THREE.Mesh(new THREE.IcosahedronGeometry(.08+R()*.05,0),sm(['#4f8f3a','#6fa040','#3f7a30'][i%3]));lf.position.set(-.35+i*.14,.4,(R()-.5)*.2);g.add(lf)}
    for(let i=0;i<2;i++)ball(.05,'#c8321f',-.2+i*.4,.42,.1);return true}
  if(use==='mess'){if(t.obj==='wall'){box(.9,.05,.45,'#f4f6f7',0,.45,0);for(const x of[-.35,.35])box(.05,.43,.05,'#9aa4ad',x,.22,0);for(const z of[-.32,.32])box(.85,.04,.14,'#2a7fbd',0,.27,z);for(let i=0;i<3;i++)cyl(.07,.07,.03,'#e9eef1',-.25+i*.25,.49,0,10);return true}
    if(t.obj==='crate'){box(.9,.5,.5,'#e9eef1',0,.25,0);box(.92,.05,.52,'#9aa4ad',0,.52,0);for(let i=0;i<3;i++)box(.22,.08,.3,'#c8ccce',-.3+i*.3,.6,0);return true}}
  if(use==='cells'){if(t.obj==='crate'){box(.85,.08,.4,'#9aa4ad',0,.35,-.2);box(.82,.07,.36,'#e9eef1',0,.42,-.2);box(.85,.08,.4,'#9aa4ad',0,.8,-.2);box(.82,.07,.36,'#e9eef1',0,.87,-.2);for(const x of[-.4,.4])box(.04,1,.04,'#7a848a',x,.5,-.2);box(.3,.9,.3,'#c8ccce',.3,.45,.25);return true}
    if(t.obj==='wall'){for(let i=0;i<9;i++)box(.025,.95,.025,'#5a6570',-.4+i*.1,.47,0);box(.9,.04,.04,'#5a6570',0,.95,0);box(.9,.04,.04,'#5a6570',0,.05,0);return true}}
  if(use==='plaza'){if(t.obj==='wall'){box(.9,.08,.35,'#d8dde0',0,.4,0);for(const x of[-.35,.35])box(.1,.38,.3,'#c8ccce',x,.19,0);box(.9,.3,.06,'#f4f6f7',0,.6,-.15);return true}
    if(t.obj==='crate'){box(.8,.5,.8,sm('#f4f6f7','white'),0,.25,0);box(.84,.05,.84,'#38b6e8',0,.52,0);cyl(.04,.06,.45,'#6a4a30',0,.75,0,6);for(const[x,y,z,r]of[[0,1.1,0,.3],[.12,.98,.1,.22],[-.12,1,-.08,.2]])ball(r,'#4f9a52',x,y,z);return true}}
  if(use==='armoury'&&t.obj==='crate'){box(.85,1.1,.3,'#22272c',0,.55,-.2);for(let i=0;i<5;i++)box(.05,.6,.04,'#3a4048',-.32+i*.16,.6,-.04);box(.6,.3,.4,'#3a4048',0,.15,.22);box(.62,.03,.42,'#2a7fbd',0,.31,.22);return true}
  if(use==='bar'&&t.obj==='wall'){cyl(.32,.32,.05,'#7a5331',0,.5,0,14);cyl(.05,.08,.5,'#3a3a3a',0,.25,0,8);for(const[x,z]of[[-.38,0],[.38,0],[0,.38]]){cyl(.1,.1,.04,'#c8321f',x,.32,z,10);cyl(.025,.025,.32,'#3a3a3a',x,.16,z,5)}
    for(let i=0;i<3;i++)cyl(.025,.03,.14,['#4f8f3a','#8a5a2a','#d8d0b8'][i],-.1+i*.1,.6,.04,6);return true}
  return false}
