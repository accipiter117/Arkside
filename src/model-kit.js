const C={skin:'#c99067',skinD:'#9c6a47',skinL:'#e0a77e',hair:'#3a2618',tee:'#7a3c22',teeD:'#5a2a17',rig:'#4f4a36',rigD:'#36332a',khaki:'#8b7b55',khakiD:'#6b5e40',boot:'#2e2620',metal:'#3a3d42',metalD:'#26282c',wood:'#7a5331',acc:'#c9581c',ink:'#1a1210'};
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;


function buildKestrel(mat,seg,pal={},base=true){
  const root=new THREE.Group(),V=(x,y,z)=>new THREE.Vector3(x,y,z),P=c=>pal[c]||c,det=seg>8?2:1;
  const add=(geo,c,x,y,z,sx=1,sy=1,sz=1,parent=root)=>{const m=new THREE.Mesh(geo,mat(P(c)));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m};
  const limb=(a,b,rad,c)=>{const d=new THREE.Vector3().subVectors(b,a),len=d.length();const m=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad*.88,len,seg),mat(P(c)));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());root.add(m);return m};
  if(base)add(new THREE.CylinderGeometry(.75,.8,.08,Math.max(8,seg*2)),'#2b2420',0,-.04,0);
  for(const sx of [-1,1]){limb(V(sx*.14,.92,0),V(sx*.15,.14,0),.12,C.khaki);add(new THREE.BoxGeometry(.22,.15,.34),C.boot,sx*.15,.07,.05);add(new THREE.BoxGeometry(.05,.14,.1),C.khakiD,sx*.24,.62,0)}
  add(new THREE.BoxGeometry(.5,.2,.3),C.khaki,0,.95,0);add(new THREE.BoxGeometry(.52,.06,.32),'#2a2622',0,1.06,0);
  add(new THREE.CylinderGeometry(.31,.25,.62,seg),C.tee,0,1.38,0,1,1,.66);
  add(new THREE.BoxGeometry(.5,.17,.12),C.rig,0,1.2,.17);
  for(const sx of [-1,0,1])add(new THREE.BoxGeometry(.11,.08,.05),C.metal,sx*.15,1.31,.19);
  for(const sx of [-1,1])add(new THREE.BoxGeometry(.06,.4,.04),C.rig,sx*.13,1.47,.17).rotation.x=-.12;
  add(new THREE.CylinderGeometry(.075,.085,.14,seg),C.skinD,0,1.74,0);
  add(new THREE.IcosahedronGeometry(.2,det),C.skin,0,1.95,0,.9,1.15,1);
  add(new THREE.IcosahedronGeometry(.17,det),'#7d5a42',0,1.86,.04,.98,.7,.95);
  add(new THREE.SphereGeometry(.205,seg+1,seg,0,Math.PI*2,0,Math.PI*.42),C.hair,0,1.97,0,.92,1.12,1.02);
  for(const sx of [-1,1]){add(new THREE.BoxGeometry(.04,.025,.02),C.ink,sx*.07,1.97,.175).userData.noOutline=true;add(new THREE.BoxGeometry(.08,.025,.03),C.hair,sx*.07,2.02,.17).userData.noOutline=true;add(new THREE.BoxGeometry(.04,.08,.06),C.skinD,sx*.185,1.95,0)}
  add(new THREE.BoxGeometry(.03,.07,.05),C.skinD,0,1.92,.19).userData.noOutline=true;
  const gun=new THREE.Group();gun.position.set(0,1.3,.4);gun.rotation.z=.55;root.add(gun);
  add(new THREE.BoxGeometry(.62,.09,.07),C.metal,-.05,0,0,1,1,1,gun);add(new THREE.BoxGeometry(.28,.11,.07),C.wood,.38,-.01,0,1,1,1,gun);add(new THREE.BoxGeometry(.2,.07,.075),C.wood,-.28,0,0,1,1,1,gun);
  add(new THREE.CylinderGeometry(.018,.018,.32,seg),C.metalD,-.52,0,0,1,1,1,gun).rotation.z=Math.PI/2;add(new THREE.BoxGeometry(.06,.17,.05),C.metalD,-.08,-.12,0,1,1,1,gun);add(new THREE.BoxGeometry(.16,.04,.04),C.metalD,-.05,.07,0,1,1,1,gun);
  gun.updateMatrixWorld(true);root.updateMatrixWorld(true);
  const grip=gun.position.clone().add(V(.2,-.05,0).applyEuler(gun.rotation)),fore=gun.position.clone().add(V(-.28,-.02,.02).applyEuler(gun.rotation));
  const sR=V(.34,1.6,0),eR=V(.44,1.22,.12),sL=V(-.34,1.6,0),eL=V(-.42,1.36,.2);
  limb(sR,eR,.085,C.tee);limb(eR,grip,.07,C.skin);limb(sL,eL,.085,C.tee);limb(eL,fore,.07,C.skin);
  for(const p of [sR,sL])add(new THREE.IcosahedronGeometry(.1,det-1),C.tee,p.x,p.y,p.z);
  for(const p of [eR,eL,grip,fore])add(new THREE.IcosahedronGeometry(.07,det-1),C.skin,p.x,p.y,p.z);
  add(new THREE.BoxGeometry(.03,.07,.07),C.acc,.47,1.45,.04).rotation.z=.25;
  return root;
}
function addOutlines(root,t){const ol=new THREE.MeshBasicMaterial({color:0x17140f,side:THREE.BackSide}),list=[],v=new THREE.Vector3();
  root.traverse(o=>{if(o.isMesh&&!o.userData.noOutline&&!o.userData.isOutline)list.push(o)});
  for(const m of list){m.geometry.computeBoundingBox();m.geometry.boundingBox.getSize(v);const o=new THREE.Mesh(m.geometry,ol);o.userData.isOutline=true;o.position.copy(m.position);o.quaternion.copy(m.quaternion);
    o.scale.set(m.scale.x*(1+2*t/Math.max(.02,v.x*m.scale.x)),m.scale.y*(1+2*t/Math.max(.02,v.y*m.scale.y)),m.scale.z*(1+2*t/Math.max(.02,v.z*m.scale.z)));m.parent.add(o)}}
function toonTex(){const t=new THREE.DataTexture(new Uint8Array([95,95,95,255,170,170,170,255,255,255,255,255]),3,1,THREE.RGBAFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t}
