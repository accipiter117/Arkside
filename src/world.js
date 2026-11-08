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
