/* ===================== UNIT MODELS =====================
   The animated Toon Shooter soldiers, the creator head and procedural
   weapons they wear, and a plain capsule fallback. */
// Unit shading: a bold three-band toon ramp plus a stepped rim light, for
// Brink's "bold forms". toonRim() patches any MeshToonMaterial.
let UNIT_TEX=null;const unitTex=()=>UNIT_TEX||(UNIT_TEX=(()=>{const t=new THREE.DataTexture(new Uint8Array([92,92,92,255,178,178,178,255,255,255,255,255]),3,1,THREE.RGBAFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t})());
function toonRim(m){m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>',
  'float rimF=1.0-clamp(dot(normalize(geometry.normal),normalize(geometry.viewDir)),0.0,1.0);gl_FragColor.rgb+=vec3(0.26,0.29,0.34)*smoothstep(0.66,0.74,rimF);\n#include <dithering_fragment>')};
  m.customProgramCacheKey=()=>'toonRim';return m}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
// Fallback if the soldier models can't load: a plain capsule soldier in the
// look's colours with the creator head and a procedural gun. No animation.
function capsuleSoldier(look,outline){const F=FACTIONS[look.faction],K=opKit(),g=new THREE.Group(),c1=F.pal[look.primary],c2=F.pal[look.secondary];
  const legs=K.mesh(new THREE.CylinderGeometry(.16,.14,.8,10),c2,g,0,.4,0);
  const body=K.mesh(new THREE.CylinderGeometry(.24,.2,.55,12),c1,g,0,1.07,0);body.scale.z=.7;
  const hd=opHead(look,K);hd.position.set(0,1.55,.01);g.add(hd);
  const W=weaponModel(look.weapon||'rifle',look.faction==='security'?'#3a4048':'#7a5331','#2b2e32','#4a4f55',K.box,K.cylZ,K.mesh,F.accent);W.g.position.set(.18,.95,.22);g.add(W.g);
  if(outline)addOutlines(g,.016);g.scale.setScalar(.5);return g}
function weaponModel(k,fur,metal,metal2,box,cylZ,mesh,acc){const g=new THREE.Group();let fore=V3(0,-.03,.3),barrels=null;
  const grip=box(.04,.1,.05,metal,g,0,-.06,0);grip.rotation.x=.25;
  if(k==='rifle'){box(.065,.1,.34,metal2,g,0,.01,.08);box(.05,.09,.2,fur,g,0,-.01,-.19);box(.07,.08,.2,fur,g,0,0,.32);cylZ(.015,.2,metal,g,0,.01,.52);box(.05,.14,.07,metal,g,0,-.1,.13).rotation.x=.25;box(.035,.05,.12,metal,g,0,.08,.1);fore=V3(0,-.04,.3)}
  else if(k==='smg'){box(.065,.1,.26,metal2,g,0,.01,.05);cylZ(.026,.2,metal,g,0,.015,.28);box(.04,.17,.05,metal,g,0,-.12,.06);box(.015,.06,.15,metal,g,0,-.0,-.14);box(.03,.02,.06,acc,g,0,.07,.06);fore=V3(0,-.04,.18)}
  else if(k==='mpistol'){box(.05,.07,.2,metal2,g,0,.02,.06);box(.035,.16,.04,metal,g,0,-.1,0);box(.03,.07,.03,metal,g,0,-.07,.12);fore=V3(0,-.06,.12)}
  else if(k==='shotgun'){box(.07,.1,.2,metal2,g,0,.01,.02);cylZ(.018,.5,metal,g,0,.03,.33);cylZ(.016,.42,metal2,g,0,-.01,.3);box(.065,.065,.14,fur,g,0,-.015,.3);box(.05,.09,.22,fur,g,0,-.01,-.2);fore=V3(0,-.04,.3)}
  else if(k==='lmg'){box(.1,.13,.38,metal2,g,0,.02,.08);box(.06,.09,.2,fur,g,0,0,-.2);cylZ(.038,.3,metal,g,0,.02,.42);cylZ(.016,.18,metal,g,0,.02,.64);box(.1,.12,.12,'#3d4a2d',g,0,-.1,.08);box(.02,.06,.16,metal,g,0,.12,.1);fore=V3(0,-.04,.34)}
  else if(k==='minigun'){box(.16,.16,.3,metal2,g,0,.02,0);cylZ(.06,.06,acc,g,0,.02,.16);barrels=new THREE.Group();barrels.position.set(0,.02,.45);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;cylZ(.016,.55,metal,barrels,Math.cos(a)*.045,Math.sin(a)*.045,0,6)}cylZ(.07,.04,metal2,barrels,0,0,.2);g.add(barrels);
    box(.03,.12,.03,metal,g,0,.15,0);box(.03,.03,.14,metal,g,0,.21,.06);const belt=mesh(new THREE.TorusGeometry(.12,.025,5,10,Math.PI),'#b8933f',g,-.09,-.06,-.04);belt.rotation.y=Math.PI/2;fore=V3(0,.2,.1)}
  else if(k==='sniper'){box(.06,.09,.36,metal2,g,0,.01,.05);box(.05,.1,.24,fur,g,0,-.01,-.2);cylZ(.016,.4,metal,g,0,.02,.42);cylZ(.03,.2,metal,g,0,.1,.08);fore=V3(0,-.04,.28)}
  else if(k==='turret'){box(.1,.1,.3,metal2,g,0,0,.1)}
  return{g,fore,barrels}}

// Creator head: face shape, expression, hair, facial hair, markings, headgear
// and face gear, centred on the skull. Used by both the procedural body and
// the rigged models (attached to the Head bone). K holds the mesh helpers.
function opHead(look,K){
  const{mesh,box,sph,cylZ}=K,F=FACTIONS[look.faction],sec=look.faction==='security';
  const c1=F.pal[look.primary],c2=F.pal[look.secondary],skin=SKIN[look.skin],skinD=shade(skin,-18),hair=HAIRC[look.hairCol],acc=F.accent,ink='#16120e';
  const hd=new THREE.Group();
  const fs={long:[.86,1.16,.95],square:[1,1.02,1],angular:[.88,1.1,.95],broad:[1.1,.97,1.02]}[look.face]||[1,1,1];
  // Brink faces: a little longer, with a wider, squarer jaw.
  sph(.15,skin,hd,0,.01,0,[fs[0],fs[1]*1.1,fs[2]]);
  if(look.face==='square'||look.face==='broad')box(.235*fs[0],.1,.18,skin,hd,0,-.11,.02);else box(.185*fs[0],.095,.165,skin,hd,0,-.11,.02);
  for(const sd of[-1,1])sph(.035,skinD,hd,sd*.15*fs[0],0,0,[.6,1,1]);
  const ez=.142*fs[2];
  for(const sd of[-1,1]){box(.05,.024,.01,'#f1ece2',hd,sd*.055,.02,ez);box(.028,.028,.012,ink,hd,sd*.055,.02,ez+.003)}
  const er={neutral:0,grim:.28,smirk:0,snarl:.45}[look.expr]||0;
  for(const sd of[-1,1]){const b=box(.065,.02,.012,shade(hair,-10),hd,sd*.055,.062+(look.expr==='smirk'&&sd>0?.014:0),ez+.002);b.rotation.z=-sd*er}
  box(.032,.06,.04,skinD,hd,0,-.015,ez+.012);
  if(look.expr==='snarl'){box(.07,.025,.01,'#3a1d18',hd,0,-.075,ez-.004);box(.05,.008,.012,'#efe9dc',hd,0,-.07,ez)}else{const mo=box(.06,.012,.01,'#3b2219',hd,0,-.075,ez-.004);if(look.expr==='smirk')mo.rotation.z=.18}
  const lowShell=(c,o)=>{const m=mesh(new THREE.SphereGeometry(.154,14,8,-Math.PI*.15,Math.PI*1.3,Math.PI*.52,Math.PI*.4),c,hd,0,0,0,o);m.scale.set(...fs);m.rotation.y=Math.PI*.5;return m};
  if(look.facial==='stubble')lowShell(shade(skin,-28));
  if(look.facial==='beard'){lowShell(hair);sph(.08,hair,hd,0,-.14,.06,[1.3,.8,1])}
  if(look.facial==='goatee')box(.05,.06,.03,hair,hd,0,-.13,ez-.01);
  if(look.facial==='moustache'||look.facial==='goatee')box(.08,.02,.02,hair,hd,0,-.055,ez+.004);
  if(look.facial==='chops')for(const sd of[-1,1])box(.03,.1,.08,hair,hd,sd*.13*fs[0],-.05,.04);
  if(look.mark==='scar'){const sc=box(.008,.09,.006,'#e7ad9d',hd,-.055,.02,ez+.012);sc.rotation.z=.3}
  if(look.mark==='tattoo')for(let i=0;i<3;i++){const tl=box(.008,.05,.006,'#1f2a35',hd,.085+i*.012,-.01-i*.01,ez-.02);tl.rotation.z=-.4}
  if(look.mark==='paint')box(.26*fs[0],.04,.01,sec?'#123a5a':'#151311',hd,0,.02,ez-.004);
  if(look.mark==='patch'){box(.05,.04,.012,ink,hd,-.055,.02,ez+.008);const st=box(.3,.01,.01,ink,hd,0,.05,ez-.03);st.rotation.z=-.25}
  const covered=['beanie','cap','bandana','helmet','riothelm'].includes(look.headgear);
  const cap=(r,c,ang=.44)=>{const m=mesh(new THREE.SphereGeometry(r,16,10,0,Math.PI*2,0,Math.PI*ang),c,hd,0,.005,-.008);m.scale.set(...fs);m.rotation.x=-.28;return m};
  if(look.hair!=='shaved'){
    if(covered||look.hair==='buzz')cap(.154,look.hair==='buzz'?shade(hair,35):hair);
    else if(look.hair==='mohawk'){cap(.153,shade(hair,40));box(.04,.12,.26,hair,hd,0,.16*fs[1],-.01)}
    else{cap(.16,hair);
      if(look.hair==='spiky')for(let i=0;i<7;i++){const a=i/7*Math.PI*2,c=mesh(new THREE.ConeGeometry(.035,.1,5),hair,hd,Math.cos(a)*.07,.15*fs[1],Math.sin(a)*.07-.01);c.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5)}
      if(look.hair==='slick')sph(.07,hair,hd,.03,.11*fs[1],.07,[1.6,.6,1.2]);
      if(look.hair==='topknot')sph(.055,hair,hd,0,.17*fs[1],-.06);
      if(look.hair==='dreads')for(let i=0;i<9;i++){const a=Math.PI*.15+i/8*Math.PI*.7,d=mesh(new THREE.CylinderGeometry(.018,.014,.26,5),hair,hd,Math.cos(a)*.15*fs[0],-.06,-Math.sin(a)*.13);d.rotation.x=.2}
      if(look.hair==='crop')box(.2*fs[0],.03,.06,hair,hd,0,.11*fs[1],.1)}}
  const hg=look.headgear;
  if(hg==='beanie'){cap(.172,c2,.5);const r=mesh(new THREE.CylinderGeometry(.168*fs[0],.168*fs[0],.05,16,1,true),shade(c2,-18),hd,0,.06,-.01);r.scale.z=fs[2]}
  if(hg==='cap'){cap(.168,c1,.48);box(.17,.014,.12,shade(c1,-25),hd,0,.085,.15);sph(.02,acc,hd,0,.14*fs[1],.12)}
  if(hg==='bandana'){cap(.166,shade(acc,-15),.47);sph(.03,shade(acc,-25),hd,0,.06,-.16);box(.03,.1,.02,shade(acc,-25),hd,.03,-.01,-.17).rotation.z=.3}
  if(hg==='helmet'){const hc=sec?'#3b4652':'#4d5233';const h=cap(.19,hc,.55);const rim=mesh(new THREE.TorusGeometry(.18*fs[0],.015,5,18),shade(hc,-20),hd,0,.045,-.01);rim.rotation.x=Math.PI/2+.28;box(.05,.04,.03,'#26292c',hd,0,.15*fs[1],.12);for(const sd of[-1,1])box(.012,.14,.012,'#222',hd,sd*.13*fs[0],-.06,.03)}
  if(hg==='riothelm'){cap(.2,'#d6dce0',.62);box(.03,.012,.2,acc,hd,0,.2*fs[1],0);const vz=mesh(new THREE.SphereGeometry(.205,16,8,-Math.PI*.38,Math.PI*.76,Math.PI*.35,Math.PI*.3),'#1d3b52',hd,0,0,0,{transparent:true,opacity:.6});vz.scale.set(...fs)}
  if(hg==='headset'){const b=mesh(new THREE.TorusGeometry(.165*fs[0],.012,5,16,Math.PI),'#24272a',hd,0,0,0);b.rotation.y=Math.PI/2;for(const sd of[-1,1]){const cu=mesh(new THREE.CylinderGeometry(.04,.04,.03,10),'#2f3337',hd,sd*.155*fs[0],0,0);cu.rotation.z=Math.PI/2}const mic=box(.01,.01,.12,'#24272a',hd,-.13,-.07,.08);mic.rotation.y=.5;box(.012,.08,.012,acc,hd,.172*fs[0],0,0)}
  if(hg==='goggles'){const b=mesh(new THREE.TorusGeometry(.158*fs[0],.014,5,18),'#25221f',hd,0,.07,-.005);b.rotation.x=Math.PI/2+.1;for(const sd of[-1,1]){const l=cylZ(.035,.03,'#3f6f7d',hd,sd*.05,.09,.13)}}
  const fg=look.facegear;
  if(fg==='mask')lowShell(sec?shade(c2,-20):shade(acc,-20));
  if(fg==='respirator'){box(.09,.08,.05,'#2c2e30',hd,0,-.07,ez+.01);for(const sd of[-1,1]){const f=mesh(new THREE.CylinderGeometry(.035,.035,.05,10),'#4a4d50',hd,sd*.075,-.085,ez-.01);f.rotation.z=Math.PI/2;f.rotation.y=sd*.5}}
  if(fg==='shades')box(.17,.035,.015,'#111315',hd,0,.025,ez+.012);
  if(fg==='hud')box(.22,.03,.012,'#38e0ff',hd,0,.025,ez+.012,{transparent:true,opacity:.65,emissive:'#1aa0c0'});
  return hd}

/* ---------- rigged units: Quaternius Toon Shooter soldiers (CC0) ----------
   Two GLBs (embedded as base64 in ARK_GLB by tools/build.py) share one
   43-bone skeleton. Each unit is a SkeletonUtils clone. We recolour the
   model's own materials from the creator look, hide its head and attach the
   creator head, armour and gear to bones, and drive it with the model's clips.
   Attachments are built in "procedural units" (the same numbers as
   the old procedural body), held by a group that converts them to the rig's scale. */
const RIG={ok:false,failed:false,tpl:{},mats:new Map()};
const RIG_SCALE=.52;               // rig units -> world units (neck height matches the procedural body)
const RIG_P=.5/RIG_SCALE;          // procedural units -> rig units
const RIG_WEAPON={rifle:'AK',smg:'SMG',mpistol:'Pistol',sniper:'Sniper'};
const RIG_WEAPONS=['AK','SMG','Pistol','Sniper'];
// Body types, tuned by Matthew in the body tuner on the current models.
// Each entry is an [x,y,z] scale on that bone (L and R both, as three.js
// drops the dots: UpperArm.L is UpperArmL). Scales multiply down the bone
// chain on purpose (no counter-scaling): sizes were tuned that way. root
// scales the whole unit; head sizes the creator head (fixHolder).
const RIG_BUILD={
  light:{root:[0.93,0.99,0.93],Hips:[0.91,1.04,0.91],Abdomen:[0.88,0.99,0.88],Torso:[1.25,0.98,1.25],head:1.24,Shoulder:[0.75,1,0.75],UpperArm:[1.41,1.11,1.41],LowerArm:[0.5,0.5,0.5],UpperLeg:[0.67,1,0.67],LowerLeg:[0.65,1.1,0.65],Foot:[0.84,1.16,0.84]},
  medium:{root:[1,1.09,1],Hips:[0.79,0.96,0.79],Abdomen:[1.03,1.04,1.03],Torso:[1.33,1.07,1.33],Neck:[1.6,1.6,1.6],head:1.28,Shoulder:[0.66,1.4,0.66],UpperArm:[0.91,1.19,0.91],LowerArm:[0.5,0.5,0.5],UpperLeg:[1,1,1.17],LowerLeg:[0.71,1,0.71]},
  heavy:{root:[1.2,1.16,1.2],Hips:[1.12,1,1.12],Abdomen:[1.6,1.21,1.6],Torso:[0.88,0.78,0.88],Neck:[0.5,1.22,0.5],head:1.41,Shoulder:[1.36,1.06,1.36],UpperArm:[1.05,0.69,1.05],LowerArm:[0.5,0.5,0.5],UpperLeg:[1.45,0.92,1.45],LowerLeg:[0.67,1,0.67],Foot:[1.19,1.44,1.19]}};
// Gun size multiplier on top of each gun's own scale (stock and procedural),
// tuned with the 0.5 forearms above. The sniper wasn't in the tuner, so it
// uses the rifle's value.
const RIG_GUN_SCALE={mpistol:1.78,smg:1.35,rifle:1.65,shotgun:1.80,sniper:1.65,lmg:1.80,minigun:1.80};
// Limb bones keep their rest positions from us, not the clips: only these
// bones' positions really animate (feet and pole targets are IK-style
// targets; Body bobs; upper legs sway a little).
const RIG_POS_ANIMATED=new Set(['Root','Body','FootL','FootR','PoleTargetL','PoleTargetR','UpperLegL','UpperLegR']);
const RIG_CLIPS=['Idle','Walk','Run','Run_Gun','Walk_Shoot','Idle_Shoot','HitReact','Duck','Death','Jump','Jump_Idle','Jump_Land','Wave','Yes','No','Punch'];

function b64buf(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer}
RIG.ready=new Promise(res=>{
  const fail=e=>{if(!RIG.failed){RIG.failed=true;console.warn('Unit models unavailable, using procedural units',e||'')}res(false)};
  if(typeof THREE==='undefined'||!THREE.GLTFLoader||!THREE.SkeletonUtils||typeof ARK_GLB==='undefined')return fail();
  const keys=Object.keys(ARK_GLB);let n=0;
  for(const k of keys){try{new THREE.GLTFLoader().parse(b64buf(ARK_GLB[k]),'',g=>{try{RIG.tpl[k]=prepRig(g,k)}catch(e){return fail(e)}if(++n===keys.length){RIG.ok=true;res(true)}},fail)}catch(e){fail(e)}}
});
RIG.wait=ms=>Promise.race([RIG.ready,new Promise(r=>setTimeout(()=>r(false),ms))]);

// Material roles. Soldier_ct: Character_Main (jacket), Pants, Grey (pads),
// Skin. Soldier_t: Enemy_Red (hoodie), Grey (trousers), Skin.
function rigRole(name,key){if(/^Skin/.test(name))return'skin';if(name==='Character_Main'||name==='Enemy_Red')return'main';if(name==='Pants')return'pants';if(name==='Grey')return key==='res'?'pants':'pads';return null}

function prepRig(g,key){
  const root=g.scene,clips={};
  // Clips animate scale on every bone (always 1). Drop those tracks so body
  // type bone scaling survives playback.
  for(const c of g.animations){c.tracks=c.tracks.filter(t=>!t.name.endsWith('.scale')&&!(t.name.endsWith('.position')&&!RIG_POS_ANIMATED.has(t.name.split('.')[0])));clips[c.name]=c}
  const tpl={key,root,clips,bones:{},weapons:{},geoms:new Set()};
  root.traverse(o=>{if(o.isBone){tpl.bones[o.name]=o;o.userData.rest=o.position.toArray()}if(RIG_WEAPONS.includes(o.name))tpl.weapons[o.name]=o;if(o.geometry)tpl.geoms.add(o.geometry);
    if(o.isMesh){let a=o,head=false;while(a&&!head){head=(!a.isBone&&/^Head(_\d+)?$/.test(a.name))||/^Character_Enemy_Head/.test(a.name);a=a.parent}if(head)o.userData.rigHead=true;
      for(const m of[].concat(o.material)){m.userData.role=rigRole(m.name,key);m.userData.orig=m.color.clone().convertLinearToSRGB()}}});
  // Bind-pose world rotation of each bone we attach to, so attachments can be
  // written in body space (y up, z forward) whatever the bone's own axes.
  root.updateMatrixWorld(true);
  tpl.bindQ={};for(const b of['Torso','Head','Hips','UpperArmL','UpperArmR','LowerLegL','LowerLegR','UpperLegL','UpperLegR']){const bo=tpl.bones[b];if(bo)tpl.bindQ[b]=bo.getWorldQuaternion(new THREE.Quaternion())}
  // Pose in Idle to measure how the stock rifle sits, so procedural weapons
  // (shotgun, LMG, minigun) can copy its grip and aim.
  const mx=new THREE.AnimationMixer(root);mx.clipAction(clips.Idle).play();mx.update(0);root.updateMatrixWorld(true);
  const ak=tpl.weapons.AK,hand=ak.parent,inv=new THREE.Matrix4().copy(ak.matrixWorld).invert(),bb=new THREE.Box3();
  ak.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv))}});
  const sz=bb.getSize(new THREE.Vector3()),ax=sz.x>=sz.y&&sz.x>=sz.z?'x':sz.y>=sz.z?'y':'z',dirL=new THREE.Vector3();dirL[ax]=Math.abs(bb.max[ax])>=Math.abs(bb.min[ax])?1:-1;
  const fwd=dirL.clone().transformDirection(ak.matrixWorld).normalize(),up=new THREE.Vector3(0,1,0),xA=new THREE.Vector3().crossVectors(up,fwd).normalize(),yA=new THREE.Vector3().crossVectors(fwd,xA);
  const qW=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA,yA,fwd)),qH=hand.getWorldQuaternion(new THREE.Quaternion());
  tpl.gunQ=qH.invert().multiply(qW);tpl.gunPos=ak.position.clone();tpl.gunScale=RIG_P/hand.getWorldScale(new THREE.Vector3()).x;tpl.hand=hand.name;
  tpl.muzzle={};for(const k of RIG_WEAPONS)tpl.muzzle[k]=rigMuzzle(tpl.weapons[k]);
  mx.stopAllAction();mx.uncacheRoot(root);
  return tpl}
function rigMuzzle(w){const b=new THREE.Box3(),inv=new THREE.Matrix4().copy(w.matrixWorld).invert();w.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv))}});
  const sz=b.getSize(new THREE.Vector3()),ax=sz.x>=sz.y&&sz.x>=sz.z?'x':sz.y>=sz.z?'y':'z',p=b.getCenter(new THREE.Vector3());p[ax]=Math.abs(b.max[ax])>=Math.abs(b.min[ax])?b.max[ax]:b.min[ax];return p}

// Shared materials: one per (role colour, skinned) so units with the same
// colours share them.
function rigMat(hex,skinned){const k=hex+(skinned?'|s':'');let m=RIG.mats.get(k);if(!m){m=toonRim(new THREE.MeshToonMaterial({color:hex,gradientMap:unitTex(),skinning:skinned}));RIG.mats.set(k,m)}return m}
const RIG_OL={};function rigOutlineMat(skinned,plain){const k=plain?'p':skinned?'s':'r';if(!RIG_OL[k]){const m=new THREE.MeshBasicMaterial({color:0x17140f,side:THREE.BackSide,skinning:skinned});if(plain)return RIG_OL[k]=m;m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed += normalize(normal) * 0.026;')};m.customProgramCacheKey=()=>'ol'+k;RIG_OL[k]=m}return RIG_OL[k]}

function rigColours(look){const F=FACTIONS[look.faction],sec=look.faction==='security',c1=F.pal[look.primary],c2=F.pal[look.secondary];
  return{main:c1,pants:c2,pads:sec?shade(c2,-35):shade(c2,-20),skin:SKIN[look.skin]}}

// Holder that lets us write attachments in procedural units and body space.
function rigHolder(tpl,bones,name,x=0,y=0,z=0){const bone=bones[name];if(!bone)return null;const h=new THREE.Group();h.quaternion.copy(tpl.bindQ[name]).invert();h.scale.setScalar(RIG_P);h.userData.off=new THREE.Vector3(x,y,z);h.position.set(x,y,z).applyQuaternion(h.quaternion).multiplyScalar(RIG_P);bone.add(h);return h}

// Give a holder an absolute size (procedural units x k) and offset whatever
// scale its bone inherits from the body type or the collapsed head.
function fixHolder(root,h,k){root.updateMatrixWorld(true);const ws=h.parent.getWorldScale(new THREE.Vector3()),rs=root.getWorldScale(new THREE.Vector3());ws.divide(rs);
  h.scale.set(RIG_P*k/ws.x,RIG_P*k/ws.y,RIG_P*k/ws.z);h.position.copy(h.userData.off).applyQuaternion(h.quaternion).multiplyScalar(RIG_P).divide(ws)}
// Build a rigged operative. Returns null if the models aren't loaded.
// opts.outline (default true) adds inverted-hull outlines.
function buildRigged(look,wkey,cls,opts={}){
  if(!RIG.ok)return null;
  const sec=look.faction==='security',tpl=RIG.tpl[look.model||(sec?'sec':'res')]||RIG.tpl[sec?'sec':'res'];
  const root=THREE.SkeletonUtils.clone(tpl.root),bones={},meshes=[],weapons={};
  root.traverse(o=>{if(o.isBone)bones[o.name]=o;if(RIG_WEAPONS.includes(o.name))weapons[o.name]=o;if(o.isMesh)meshes.push(o)});
  const col=rigColours(look),outline=opts.outline!==false;
  // Recolour, sharing materials between units.
  const pauldrons=look.armour==='riot'||look.armour==='scrap';
  for(const m of meshes){if(m.userData.rigHead||(pauldrons&&/^ShoulderPad/.test(m.name))){m.visible=false;continue}
    const mats=[].concat(m.material).map(mt=>{const r=mt.userData.role;return rigMat(r?col[r]:'#'+mt.userData.orig.getHexString(),!!m.isSkinnedMesh)});
    m.material=Array.isArray(m.material)?mats:mats[0];m.castShadow=true;m.receiveShadow=true}
  // Weapon: stock model if the rig has it, otherwise a procedural one in the same grip.
  const wk=wkey||'rifle',stock=RIG_WEAPON[wk];let gun=null,muzzle=null,barrels=null;
  for(const k of RIG_WEAPONS)weapons[k].visible=k===stock;
  const GS=(RIG_BUILD[look.body]||{}).legacy?1:(RIG_GUN_SCALE[wk]||1);
  if(stock){gun=weapons[stock];gun.scale.multiplyScalar(GS);muzzle=tpl.muzzle[stock].clone()}
  else{const hand=bones[tpl.hand],K=opKit(),fur=sec?'#3a4048':'#7a5331',W=weaponModel(wk,fur,'#2b2e32','#4a4f55',K.box,K.cylZ,K.mesh,FACTIONS[look.faction].accent);
    gun=new THREE.Group();gun.add(W.g);gun.position.copy(tpl.gunPos);gun.quaternion.copy(tpl.gunQ);const gs=look.body==='heavy'?1.1:1;gun.scale.setScalar(tpl.gunScale*gs*GS);hand.add(gun);barrels=W.barrels||null;
    const bb=new THREE.Box3();W.g.updateMatrixWorld(true);W.g.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrix))}});muzzle=new THREE.Vector3(0,(bb.max.y+bb.min.y)/2,bb.max.z);gun.userData.proc=true}
  // Head: the creator head on the Head bone.
  // The stock face is skinned into the Security body mesh, so we collapse
  // the Head bone to hide it and scale our head holder back up (fixHolder).
  const K=opKit(),hd=opHead(look,K),hh=rigHolder(tpl,bones,'Head',0,.14,.02);hh.userData.attach=true;hh.add(hd);bones.Head.scale.setScalar(.01);
  // Neck filler so heads sit on the collar.
  K.mesh(new THREE.CylinderGeometry(.06,.07,.14,8),shade(SKIN[look.skin],-18),hh,0,-.1,0);
  // Armour, pauldrons, kneepads and class gear.
  rigGear(look,cls,tpl,bones,K,col);
  // Body type.
  const B=RIG_BUILD[look.body]||{};const each=(k,f)=>{for(const n of[k,k+'L',k+'R'])if(bones[n])f(bones[n])};
  for(const[k,v]of Object.entries(B)){if(['root','head','s','p','hand','legacy'].includes(k))continue;each(k,b=>b.scale.set(...v))}
  // Older format (kept so the lab can show the previous proportions): even
  // scales (s), joint positions (p) and a finger shrink with guns counter-scaled.
  if(B.legacy){for(const[k,v]of Object.entries(B.s||{}))each(k,b=>b.scale.setScalar(v));
    for(const[k,v]of Object.entries(B.p||{}))each(k,b=>{const r=b.userData.rest;if(r)b.position.set(r[0]*v[0],r[1]*v[1],r[2]*v[2])});
    if(B.hand)for(const f of['Index1','Middle1','Pinky1','Thumb1'])each(f,b=>{b.scale.multiplyScalar(B.hand);for(const c of b.children)if(!c.isBone)c.scale.multiplyScalar(1/B.hand)})}
  fixHolder(root,hh,B.head||1);
  const holder=new THREE.Group();holder.add(root);root.scale.setScalar(RIG_SCALE);if(B.root)holder.scale.set(...B.root);
  // Outlines: skinned hulls share the skeleton; rigid parts get scaled hulls.
  if(outline){for(const m of meshes){if(!m.visible||(m.parent&&!m.parent.visible&&RIG_WEAPONS.includes(m.parent.name)))continue;let ol;
      if(m.isSkinnedMesh){ol=new THREE.SkinnedMesh(m.geometry,rigOutlineMat(true));ol.bind(m.skeleton,m.bindMatrix)}else ol=new THREE.Mesh(m.geometry,rigOutlineMat(false));
      ol.position.copy(m.position);ol.quaternion.copy(m.quaternion);ol.scale.copy(m.scale);ol.userData.isOutline=true;ol.castShadow=false;ol.frustumCulled=m.frustumCulled;m.parent.add(ol)}
  }
  // Merge each attachment holder (head, gear, procedural gun) into a few meshes.
  for(const k in bones)for(const c of[...bones[k].children])if(c.isGroup&&c.userData.attach)bakeGroup(c,outline);
  if(gun&&gun.userData.proc&&!barrels)bakeGroup(gun,outline);else if(gun&&gun.userData.proc&&outline)addOutlines(gun,.014);
  // Skinned meshes are culled by their bind-pose bounds; animation moves them,
  // so disable culling (units are few and small).
  root.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
  const rig=new RigAnim(root,tpl.clips);rig.gun=gun;rig.muzzle=muzzle;rig.barrels=barrels;rig.bones=bones;
  holder.userData.rig=rig;return holder}

// Shared mesh helpers.
function opKit(){const MC={},M=(c,o)=>{const k=c+(o?JSON.stringify(o):'');return MC[k]||(MC[k]=new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:unitTex()},o||{})))};
  const mesh=(geo,c,p,x=0,y=0,z=0,o)=>{const m=new THREE.Mesh(geo,M(c,o));m.position.set(x,y,z);p.add(m);m.castShadow=true;return m};
  const box=(w,h,d,c,p,x,y,z,o)=>mesh(new THREE.BoxGeometry(w,h,d),c,p,x,y,z,o);
  const sph=(r,c,p,x,y,z,s=[1,1,1])=>{const m=mesh(new THREE.SphereGeometry(r,12,9),c,p,x,y,z);m.scale.set(...s);return m};
  const cylZ=(r,len,c,p,x,y,z,seg=10)=>{const m=mesh(new THREE.CylinderGeometry(r,r,len,seg),c,p,x,y,z);m.rotation.x=Math.PI/2;return m};
  return{M,mesh,box,sph,cylZ}}

// Rigid attachments in body space. Torso holder origin is at the Torso bone
// (mid chest); numbers are procedural units (1 = about half a metre... ish).
function rigGear(look,cls,tpl,bones,K,col){const{mesh,box,sph}=K,sec=look.faction==='security',acc=FACTIONS[look.faction].accent,c2=col.pants;
  const T=rigHolder(tpl,bones,'Torso');T.userData.attach=true;
  // Per-body fit: half shoulder width, chest front, chest centre height. The
  // Torso bone already scales evenly with the body type.
  // Per faction and build fit, measured from each model's chest in Idle with
  // the tuned proportions: [half shoulder width, chest front, chest centre
  // height, chest back]. Security's own chest pouches sit further forward, so
  // its plates sit further out. The Torso bone carries the build's scale.
  const FIT={'resistance-light':[.29,.205,.15,.17],'resistance-medium':[.3,.215,.15,.17],'resistance-heavy':[.3,.245,.14,.22],
    'security-light':[.29,.295,.15,.17],'security-medium':[.3,.295,.15,.17],'security-heavy':[.3,.385,.14,.22]}[look.faction+'-'+look.body]||[.3,.2,.15,.17],[sw,zf,Y,zb]=FIT,vest=shade(c2,-42);
  // Front plates keep their outer face just off the chest and grow deeper
  // where the chest sits further out, so there's no gap behind them.
  const pd=.06+Math.max(0,zf-.21),pz=zf+.05-pd/2;
  if(look.armour==='carrier'){box(sw*1.5,.3,pd,vest,T,0,Y,pz);box(sw*1.5,.3,.06,vest,T,0,Y,-zb-.03);for(const sd of[-1,0,1])box(.11,.1,.06,shade(vest,14),T,sd*.14,Y-.08,zf+.07);box(.16,.04,.005,'#e6e1d4',T,0,Y+.1,zf+.055)}
  if(look.armour==='rig'){const rc=shade(c2,-30);box(sw*1.6,.12,.07,rc,T,0,Y-.12,zf+.03);for(let i=0;i<4;i++)box(.07,.09,.05,'#2f3134',T,-sw*.6+i*sw*.4,Y-.06,zf+.06);for(const sd of[-1,1]){const st=box(.05,.36,.02,rc,T,sd*sw*.45,Y+.06,zf+.02);st.rotation.z=sd*.08}}
  if(look.armour==='riot'){const rp='#d4dadf';box(sw*1.45,.32,pd,rp,T,0,Y,pz);box(sw*1.45,.32,.06,rp,T,0,Y,-zb-.03);box(.05,.26,.005,acc,T,0,Y,zf+.055);mesh(new THREE.TorusGeometry(.1,.035,6,14),'#a7b1b8',T,0,Y+.22,0).rotation.x=Math.PI/2}
  if(look.armour==='scrap'){const p1=box(sw*.9,.24,.05,'#8b4a2a',T,-sw*.32,Y+.04,zf+.03);p1.rotation.z=.12;const p2=box(sw*.75,.2,.05,'#7f858b',T,sw*.36,Y,zf+.035);p2.rotation.z=-.1;const sp=box(.06,.42,.02,'#4a3423',T,0,Y,zf+.06);sp.rotation.z=.6}
  // Pauldrons (riot and scrap) on the upper arms.
  if(look.armour==='riot'||look.armour==='scrap')for(const s of['L','R']){const A=rigHolder(tpl,bones,'UpperArm'+s);if(!A)continue;A.userData.attach=true;const sd=s==='L'?1:-1;
    if(look.armour==='riot'){sph(.13,'#d4dadf',A,sd*.03,.06,0,[1,.7,1.1]);box(.15,.02,.03,acc,A,sd*.03,.1,.1)}else{const ty=mesh(new THREE.TorusGeometry(.09,.04,6,12),'#262626',A,sd*.02,.04,0);ty.rotation.z=Math.PI/2}}
  // Kneepads with armoured legs, riot and carrier armour.
  if(look.legs==='armoured'||look.armour==='riot')for(const s of['L','R']){const L=rigHolder(tpl,bones,'LowerLeg'+s);if(!L)continue;L.userData.attach=true;box(.13,.13,.07,look.armour==='riot'?'#d4dadf':'#2b2d30',L,0,0,.1)}
  // Class gear on the back (and a chest bandolier for soldiers).
  const back=-zb-.06;
  if(cls==='soldier'){const bd=box(.06,.5,.03,'#5a4128',T,0,Y,zf+.075);bd.rotation.z=-.62;for(let i=-3;i<=3;i++){const s=box(.03,.05,.02,'#c9a046',T,Math.sin(.62)*i*.06,Y+Math.cos(.62)*i*.06,zf+.09);s.rotation.z=-.62}
    box(.3,.22,.12,sec?'#3a4048':'#5a4128',T,0,Y-.04,back)}
  if(cls==='medic'){box(.34,.32,.14,'#e8e6df',T,0,Y,back-.02);box(.12,.04,.005,'#2c9d68',T,0,Y+.02,back-.095);box(.04,.12,.005,'#2c9d68',T,0,Y+.02,back-.095)}
  if(cls==='engineer'){box(.32,.28,.1,'#4a4f55',T,0,Y,back);for(const sd of[-1,1])mesh(new THREE.CylinderGeometry(.055,.055,.38,10),'#d9771f',T,sd*.09,Y+.02,back-.09);sph(.035,'#ffe08a',T,-sw*.8,Y+.18,.08)}
  if(cls==='operative'){box(.28,.24,.1,'#25292d',T,0,Y,back);mesh(new THREE.CylinderGeometry(.008,.008,.48,5),'#25292d',T,.09,Y+.34,back);sph(.022,'#38e0ff',T,.09,Y+.6,back)}
  // Faction patch on the back.
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(.12,.08),new THREE.MeshBasicMaterial({color:acc,side:THREE.DoubleSide}));fl.position.set(0,Y+.2,back-.01);T.add(fl)}

/* ---------- rig animation controller ----------
   One AnimationMixer per unit. A looping "base" state (Idle, Duck, Death)
   plus one-shot or temporary clips (shoot, hit, walk) that return to base. */
class RigAnim{
  constructor(root,clips){this.mixer=new THREE.AnimationMixer(root);this.clips=clips;this.actions={};this.base='Idle';this.cur=null;this.curName='';this.hold=null;
    this.mixer.addEventListener('finished',e=>{if(e.action===this.cur&&this.oneShot){this.oneShot=false;this.play(this.hold||this.base)}});this.play('Idle')}
  act(n){return this.actions[n]||(this.clips[n]&&(this.actions[n]=this.mixer.clipAction(this.clips[n])))}
  play(name,o={}){const a=this.act(name);if(!a)return;if(a===this.cur&&!o.once&&!o.restart){a.setEffectiveTimeScale(o.speed||1);return}
    a.reset();a.enabled=true;a.setEffectiveTimeScale(o.speed||1);a.setEffectiveWeight(1);a.setLoop(o.once||o.clamp?THREE.LoopOnce:THREE.LoopRepeat,Infinity);a.clampWhenFinished=!!o.clamp;
    if(this.cur&&this.cur!==a){a.play();this.cur.crossFadeTo(a,o.fade??.2,false)}else a.play();this.cur=a;this.curName=name;this.oneShot=!!o.once&&!o.clamp}
  setBase(name){if(this.base===name)return;this.base=name;if(this.hold||this.oneShot)return;
    if(name==='Death')this.play('Death',{clamp:true,fade:.12});else this.play(name,{fade:this.curName==='Death'?.5:.25})}
  // Temporary looping clip (walking). release() returns to base.
  hold_(name,speed){this.hold=name;this.oneShot=false;this.play(name,{speed})}
  release(){this.hold=null;if(!this.oneShot)this.base==='Death'?this.play('Death',{clamp:true}):this.play(this.base)}
  once(name,speed=1){if(this.base==='Death'&&name!=='Death')return;this.play(name,{once:true,speed,fade:.08})}
  update(dt){this.mixer.update(dt)}}

// Hit flash for rigged units: materials are shared between units, so swap in
// a flat colour briefly instead of fading the emissive.
const RIG_FLASH={};
function rigFlash(model,col,ms=130){const k=col+'';const fm=sk=>RIG_FLASH[k+sk]||(RIG_FLASH[k+sk]=new THREE.MeshBasicMaterial({color:col,skinning:sk}));
  model.traverse(o=>{if(o.isMesh&&!o.userData.isOutline&&!o.userData.m0){o.userData.m0=o.material;o.material=fm(!!o.isSkinnedMesh)}});
  setTimeout(()=>model.traverse(o=>{if(o.userData.m0){o.material=o.userData.m0;delete o.userData.m0}}),ms)}
// World position of a rigged unit's muzzle.
function rigMuzzleWorld(rig,out){return rig.gun.localToWorld(out.copy(rig.muzzle))}

/* ---------- draw-call reduction ----------
   Heads, gear and procedural guns are built from dozens of small meshes.
   bakeGroup merges everything under a holder into one mesh per material,
   plus (optionally) one outline mesh, so a unit costs a few draw calls
   instead of a hundred. */
function mergeGeos(parts){let nv=0,ni=0;for(const{g}of parts){nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count}
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),idx=nv>65535?new Uint32Array(ni):new Uint16Array(ni);let vo=0,io=0;const v=new THREE.Vector3(),nm=new THREE.Matrix3();
  for(const{g,m}of parts){const p=g.attributes.position,n=g.attributes.normal;nm.getNormalMatrix(m);
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);pos.set([v.x,v.y,v.z],(vo+i)*3);if(n){v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();nor.set([v.x,v.y,v.z],(vo+i)*3)}}
    if(g.index)for(let i=0;i<g.index.count;i++)idx[io+i]=g.index.getX(i)+vo;else for(let i=0;i<p.count;i++)idx[io+i]=i+vo;
    // mirrored parts (negative scale) need their winding flipped
    if(m.determinant()<0)for(let i=io;i<io+(g.index?g.index.count:p.count);i+=3){const t=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=t}
    vo+=p.count;io+=g.index?g.index.count:p.count}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setIndex(new THREE.BufferAttribute(idx,1));out.computeBoundingSphere();return out}
function bakeGroup(h,outline,t=.014){
  const rel=o=>{const m=new THREE.Matrix4();let a=o;while(a&&a!==h){a.updateMatrix();m.premultiply(a.matrix);a=a.parent}return m};
  const byMat=new Map(),ol=[],v=new THREE.Vector3(),list=[];
  h.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&!o.userData.isOutline)list.push(o)});
  if(list.length<2)return;
  for(const o of list){const m=rel(o),mt=o.material;if(!byMat.has(mt))byMat.set(mt,[]);byMat.get(mt).push({g:o.geometry,m});
    // Small parts (buckles, pouches, eyes, antennae) get no hull: at game size
    // their outlines just read as ragged dark edges.
    if(outline&&!o.userData.noOutline&&!(mt.transparent)&&(o.geometry.computeBoundingBox(),o.geometry.boundingBox.getSize(v),Math.max(v.x*Math.abs(o.scale.x),v.y*Math.abs(o.scale.y),v.z*Math.abs(o.scale.z))>=.09)){const s=o.scale,k=new THREE.Vector3(1+2*t/Math.max(.02,v.x*Math.abs(s.x)),1+2*t/Math.max(.02,v.y*Math.abs(s.y)),1+2*t/Math.max(.02,v.z*Math.abs(s.z)));
      const c=o.geometry.boundingBox.getCenter(new THREE.Vector3());ol.push({g:o.geometry,m:m.clone().multiply(new THREE.Matrix4().makeTranslation(c.x,c.y,c.z)).multiply(new THREE.Matrix4().makeScale(k.x,k.y,k.z)).multiply(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z))})}}
  for(const c of[...h.children])h.remove(c);
  for(const[mt,parts]of byMat){const m=new THREE.Mesh(mergeGeos(parts),mt);m.castShadow=true;m.receiveShadow=true;m.userData.own=true;h.add(m)}
  if(ol.length){const m=new THREE.Mesh(mergeGeos(ol),rigOutlineMat(false,true));m.userData.isOutline=true;m.userData.own=true;h.add(m)}}

// Free a unit model's own GPU data (merged attachments, procedural parts).
// Shared body geometry and shared materials are left alone.
function disposeUnitModel(m){if(!m)return;const rig=m.userData.rig;if(rig){rig.mixer.stopAllAction();rig.mixer.uncacheRoot(rig.mixer.getRoot())}
  m.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh)return;const shared=o.geometry&&RIG.tpl&&Object.values(RIG.tpl).some(t=>t.geoms&&t.geoms.has(o.geometry));
    if(!shared&&!(o.parent&&RIG_WEAPONS.includes(o.parent.name)))o.geometry&&o.geometry.dispose()})}

/* ---------- 3D portraits ----------
   Head-and-shoulders snapshots of each operative's own model, used for
   every portrait in the menus. Rendered offscreen a couple per frame,
   cached in memory by look (re-rendered on reload, never saved: a PNG per
   operative would bloat the save). portraitHTML() returns an <img> at once;
   if the snapshot isn't ready yet it fills in when it is. */
const PORTRAIT={cache:new Map(),queue:[],r:null,scene:null,cam:null,pending:false,size:168};
function portraitKey(l){return['faction','body','cls','weapon','skin','face','expr','facial','mark','hair','hairCol','headgear','facegear','top','armour','legs','gloves','primary','secondary'].map(k=>l[k]).join('|')}
function portraitHTML(look){const k=portraitKey(look),src=PORTRAIT.cache.get(k);
  if(src)return `<img class="p3d" src="${src}" alt="">`;
  if(!PORTRAIT.queue.some(q=>q.k===k))PORTRAIT.queue.push({k,look:{...look}});portraitPump();
  return `<img class="p3d" data-pk="${esc(k)}" alt="">`}
function portraitPump(){if(PORTRAIT.pending||!PORTRAIT.queue.length)return;PORTRAIT.pending=true;
  RIG.ready.then(()=>requestAnimationFrame(function step(){const t0=performance.now();
    while(PORTRAIT.queue.length&&performance.now()-t0<24){const q=PORTRAIT.queue.shift();let src=PORTRAIT.cache.get(q.k);
      if(!src){try{src=portraitRender(q.look)}catch(e){console.warn('portrait failed',e);src=''}if(src){PORTRAIT.cache.set(q.k,src);if(PORTRAIT.cache.size>160)PORTRAIT.cache.delete(PORTRAIT.cache.keys().next().value)}}
      if(src)document.querySelectorAll('img[data-pk]').forEach(i=>{if(i.dataset.pk===q.k){i.src=src;i.removeAttribute('data-pk')}})}
    if(PORTRAIT.queue.length)requestAnimationFrame(step);else PORTRAIT.pending=false}))}
function portraitRender(look){
  if(!PORTRAIT.r){const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(PORTRAIT.size,PORTRAIT.size,false);PORTRAIT.r=r;
    const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xdcefff,0x6a5a4a,.8));const sun=new THREE.DirectionalLight(0xfff1dc,.85);sun.position.set(-2,3,4);sc.add(sun);const rim=new THREE.DirectionalLight(0xbfe4ff,.55);rim.position.set(3,2,-3);sc.add(rim);
    PORTRAIT.scene=sc;PORTRAIT.cam=new THREE.PerspectiveCamera(20,1,.05,20)}
  const m=buildRigged(look,look.weapon,look.cls,{outline:true})||capsuleSoldier(look,true);m.rotation.y=-.38;PORTRAIT.scene.add(m);
  const rig=m.userData.rig;if(rig){rig.play('Idle');rig.update(.35)}m.updateMatrixWorld(true);
  const head=new THREE.Vector3();if(rig&&rig.bones.Neck)rig.bones.Neck.getWorldPosition(head);else head.set(0,.8,0);head.y+=.1;
  const cam=PORTRAIT.cam;cam.position.set(head.x+.18,head.y+.1,head.z+1.6);cam.lookAt(head.x,head.y-.05,head.z);
  PORTRAIT.r.render(PORTRAIT.scene,cam);const src=PORTRAIT.r.domElement.toDataURL('image/png');
  PORTRAIT.scene.remove(m);disposeUnitModel(m);return src}
