/* ===================== BASE CHARACTERS (Quaternius Universal Base Characters, CC0) =====================
   The new unit bodies. Two skinned templates (male, female) are embedded as
   base_m / base_f in ARK_GLB with eight hair pieces. They have no clips of
   their own: at load, prepBase() bakes the Toon Shooter clips onto them
   with retarget.js. buildBase() then clones a template per unit, toon
   shades it with the skin tone tinted and clothing painted by bone region
   (so tops, sleeves, gloves, trousers and boots follow the creator look
   without a UV map), scales bones for the light / medium / heavy builds,
   adds hair and beard meshes, the existing procedural gear and headgear,
   a procedural weapon in the right hand, and pins the left hand to the
   weapon's foregrip with a two-bone IK solve every frame. buildRigged()
   hands over to buildBase() when UNIT_STYLE is 'base'. */
const BASE={ok:false,tpl:{},hair:{},mats:new Map()};
let UNIT_STYLE='base';
const BASE_ALIAS={Torso:'spine_03',Head:'Head',Hips:'pelvis',UpperArmL:'upperarm_l',UpperArmR:'upperarm_r',LowerLegL:'calf_l',LowerLegR:'calf_r',UpperLegL:'thigh_l',UpperLegR:'thigh_r'};
// creator hair option -> hair piece (female gets the female buzz)
const BASE_HAIR={shaved:null,buzz:'hair_buzzed',crop:'hair_parted',mohawk:'hair_buzzed',spiky:'hair_parted',slick:'hair_parted',topknot:'hair_buns',dreads:'hair_long'};
// Builds: thickness scale of limbs and torso (the bone's length axis is left alone), head scale, overall height.
const BASE_BUILD={light:{limb:.9,torso:.93,head:1,h:.97,arm:1,fore:1,thigh:1,calf:1,shoulder:1},medium:{limb:1,torso:1,head:1,h:1,arm:1,fore:1,thigh:1,calf:1,shoulder:1},heavy:{limb:1.16,torso:1.2,head:1.03,h:1.03,arm:1,fore:1,thigh:1,calf:1,shoulder:1}};
// Tuner hook (lab/body-tuner.html): replaces the tables above with the values pasted back from the tuner.
function baseTune(t){if(!t)return;if(t.BASE_ARM){for(const k of['ik','poleOut','poleDown'])if(t.BASE_ARM[k]!=null)BASE_ARM[k]=t.BASE_ARM[k];for(const sd of['l','r'])if(t.BASE_ARM[sd])Object.assign(BASE_ARM[sd],t.BASE_ARM[sd])}for(const k of['BASE_BUILD','BASE_GUN_SCALE','BASE_FIT','BASE_GEAR'])if(t[k]){const tgt={BASE_BUILD,BASE_GUN_SCALE,BASE_FIT,BASE_GEAR}[k];for(const b in t[k])tgt[b]=typeof t[k][b]==='object'&&!Array.isArray(t[k][b])?Object.assign({},tgt[b]||{},t[k][b]):t[k][b]}if(t.BASE_GUN_OFF)BASE_GUN_OFF.fromArray(t.BASE_GUN_OFF)}
function baseTuneExport(){return{BASE_BUILD,BASE_GUN_SCALE,BASE_FIT,BASE_GEAR,BASE_ARM,BASE_GUN_OFF:BASE_GUN_OFF.toArray()}}
// Clothing regions by dominant bone: 0 skin, 1 torso, 2 legs, 3 upper arm, 4 forearm, 5 hands, 6 feet
const BASE_REGION={pelvis:2,spine_01:1,spine_02:1,spine_03:1,clavicle_l:1,clavicle_r:1,upperarm_l:3,upperarm_r:3,lowerarm_l:4,lowerarm_r:4,hand_l:5,hand_r:5,thigh_l:2,thigh_r:2,calf_l:2,calf_r:2,foot_l:6,foot_r:6,ball_l:6,ball_r:6};
const regionOf=n=>{if(BASE_REGION[n]!=null)return BASE_REGION[n];if(/^(index|middle|ring|pinky|thumb)_/.test(n))return 5;if(/ball_/.test(n))return 6;return 0};

function prepBase(){const src=RIG.tpl.sec;if(!src||!RIG.raw.bm)return;
  // Toon world height sets the scale: the new bodies must stand as tall as the old ones on the board.
  src.root.updateMatrixWorld(true);const sb=new THREE.Box3().setFromObject(src.root);const toonH=(sb.max.y-sb.min.y)*RIG_SCALE;
  for(const[k,key]of[['bm','m'],['bf','f']]){const g=RIG.raw[k];if(!g)continue;const root=g.scene;rtSaveRest(root);
    const tpl={key,root,bones:{},clips:{},geoms:new Set(),meshes:[]};
    root.traverse(o=>{if(o.isBone)tpl.bones[o.name]=o;if(o.geometry)tpl.geoms.add(o.geometry);if(o.isMesh){o.frustumCulled=false;tpl.meshes.push(o);o.userData.role=o.material.name}});
    for(const n of RIG_CLIPS)if(src.clips[n])tpl.clips[n]=retargetClip(src.root,root,src.clips[n]);
    root.traverse(o=>{if(o.isBone&&o.userData.rtRest){o.position.fromArray(o.userData.rtRest.p);o.quaternion.fromArray(o.userData.rtRest.q)}});root.updateMatrixWorld(true);
    const bb=new THREE.Box3().setFromObject(root);tpl.height=bb.max.y-bb.min.y;tpl.scale=toonH/tpl.height;tpl.P=.5/tpl.scale;
    const H=tpl.bones.Head;tpl.headInv=H.matrixWorld.clone().invert();
    tpl.bindQ={};for(const[a,b]of Object.entries(BASE_ALIAS)){const bo=tpl.bones[b];if(bo)tpl.bindQ[a]=bo.getWorldQuaternion(new THREE.Quaternion())}
    // Region attribute from the dominant skin weight, and the head's size from its vertices.
    const hb=new THREE.Box3();for(const m of tpl.meshes){if(!m.isSkinnedMesh||m.geometry.attributes.region)continue;const g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,pos=g.attributes.position,n=pos.count,reg=new Float32Array(n),names=m.skeleton.bones.map(b=>b.name),v=new THREE.Vector3();
      for(let i=0;i<n;i++){let best=0,bw=-1;const W4=[sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)],I4=[si.getX(i),si.getY(i),si.getZ(i),si.getW(i)];for(let j=0;j<4;j++){if(W4[j]>bw){bw=W4[j];best=I4[j]}}const bn=names[best]||'';reg[i]=regionOf(bn);if(bn==='Head'&&m.userData.role==='Skin')hb.expandByPoint(v.fromBufferAttribute(pos,i))}
      g.setAttribute('region',new THREE.BufferAttribute(reg,1))}
    tpl.headC=hb.getCenter(new THREE.Vector3());tpl.headR=(hb.max.x-hb.min.x)/2;tpl.headTop=hb.max.y;
    // Weapon frame in the right hand: forward is the model's facing (toes), up is up.
    const hand=tpl.bones.hand_r,fwd=tpl.bones.ball_l.getWorldPosition(new THREE.Vector3()).sub(tpl.bones.foot_l.getWorldPosition(new THREE.Vector3())).setY(0).normalize();
    const up=new THREE.Vector3(0,1,0),xA=new THREE.Vector3().crossVectors(up,fwd).normalize(),yA=new THREE.Vector3().crossVectors(fwd,xA);
    const qW=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA,yA,fwd)),qH=hand.getWorldQuaternion(new THREE.Quaternion());
    tpl.gunQ=qH.invert().multiply(qW);tpl.gunScale=tpl.P/hand.getWorldScale(new THREE.Vector3()).x;tpl.fwd=fwd;
    BASE.tpl[key]=tpl}
  for(const k in RIG.raw)if(/^hair_/.test(k))BASE.hair[k]=RIG.raw[k].scene;
  BASE.ok=!!BASE.tpl.m}

// Toon material with the skin texture tinted and clothing painted by region.
function baseClothMat(look,map){const F=FACTIONS[look.faction],c1=F.pal[look.primary],c2=F.pal[look.secondary],skin=SKIN[look.skin];
  const longS=['long','hoodie','jacket'].includes(look.top),sleeve=longS?c1:null,fore=longS?c1:(look.gloves==='tactical'?'#2b2d30':null),hands=look.gloves==='tactical'?'#2b2d30':look.gloves==='fingerless'?'#3a3330':null;
  const legs=look.legs==='jeans'?'#3b4a63':look.legs==='armoured'?shade(c2,-25):c2,boots='#2a2622',top=look.top==='tank'?shade(c1,-10):c1;
  const key=[skin,top,sleeve,fore,hands,legs,boots].join('|');let m=BASE.mats.get(key);if(m)return m;
  const base=new THREE.Color(SKIN[0]),tint=new THREE.Color(skin);tint.r=Math.min(1.2,tint.r/base.r);tint.g=Math.min(1.2,tint.g/base.g);tint.b=Math.min(1.2,tint.b/base.b);const lum=.3*tint.r+.59*tint.g+.11*tint.b,soft=.35;tint.r=tint.r+(lum-tint.r)*soft;tint.g=tint.g+(lum-tint.g)*soft;tint.b=tint.b+(lum-tint.b)*soft;const lift=look.skin>=4?1.25:look.skin===3?1.1:1;tint.multiplyScalar(lift);
  m=new THREE.MeshToonMaterial({color:tint,map,gradientMap:unitTex(),skinning:true});
  const cl=[null,top,legs,sleeve,fore,hands,boots].map(c=>c?[...new THREE.Color(c).toArray(),1]:[0,0,0,0]);
  m.onBeforeCompile=sh=>{sh.uniforms.uCloth={value:cl.map(a=>new THREE.Vector4(...a))};
    sh.vertexShader='attribute float region;varying float vRegion;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRegion=region;');
    sh.fragmentShader='uniform vec4 uCloth[7];varying float vRegion;\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n{int r=int(vRegion+0.5);vec4 c=uCloth[r];if(c.a>0.5){float lum=dot(texelColor.rgb,vec3(0.3,0.59,0.11));diffuseColor.rgb=c.rgb*(0.88+0.12*lum/0.6);}}')
      .replace('#include <dithering_fragment>','float rimF=1.0-clamp(dot(normalize(geometry.normal),normalize(geometry.viewDir)),0.0,1.0);gl_FragColor.rgb+=vec3(0.22,0.25,0.3)*smoothstep(0.66,0.74,rimF);\n#include <dithering_fragment>')};
  m.customProgramCacheKey=()=>'baseCloth';BASE.mats.set(key,m);return m}
function baseFlatMat(col){const k='flat|'+col;let m=BASE.mats.get(k);if(!m){m=toonRim(new THREE.MeshToonMaterial({color:col,gradientMap:unitTex()}));BASE.mats.set(k,m)}return m}
function baseEyeMat(map){let m=BASE.mats.get('eyes');if(!m){m=new THREE.MeshToonMaterial({map,gradientMap:unitTex(),skinning:true});BASE.mats.set('eyes',m)}return m}

// Scale a bone's thickness (the two axes that are not its length axis).
function lenAxis(bone){const c=bone.children.find(o=>o.isBone);if(!c)return 1;const p=c.position;return Math.abs(p.x)>=Math.abs(p.y)&&Math.abs(p.x)>=Math.abs(p.z)?0:Math.abs(p.y)>=Math.abs(p.z)?1:2}
function thick(bone,k,len=1){const ax=lenAxis(bone),s=[k,k,k];s[ax]=len;bone.scale.set(s[0],s[1],s[2]);// children must not inherit the length stretch
  for(const c of bone.children)if(c.isBone){const cs=[1,1,1];cs[ax]=1/len;c.scale.set(cs[0],cs[1],cs[2]);c.userData.inv=cs}}

function buildBase(look,wkey,cls,opts={}){const tpl=BASE.tpl[look.sex==='female'?'f':'m']||BASE.tpl.m;if(!tpl)return null;
  const root=THREE.SkeletonUtils.clone(tpl.root),bones={},meshes=[],outline=opts.outline!==false,K=opKit(),col=rigColours(look);
  root.traverse(o=>{if(o.isBone)bones[o.name]=o;if(o.isMesh)meshes.push(o)});
  for(const m of meshes){const role=m.userData.role,src=m.material;if(role==='Skin')m.material=baseClothMat(look,src.map);else if(role==='Eyes')m.material=baseEyeMat(src.map);else m.material=new THREE.MeshToonMaterial({color:HAIRC[look.hairCol],gradientMap:unitTex(),skinning:true});m.castShadow=true;m.receiveShadow=true}
  // Builds.
  const B=BASE_BUILD[look.body]||BASE_BUILD.medium;
  for(const n of['spine_01','spine_02','spine_03','pelvis'])thick(bones[n],B.torso);
  for(const n of['clavicle_l','clavicle_r'])thick(bones[n],1,B.shoulder||1);
  for(const n of['upperarm_l','upperarm_r'])thick(bones[n],B.limb,B.arm||1);for(const n of['lowerarm_l','lowerarm_r'])thick(bones[n],B.limb,B.fore||1);
  for(const n of['thigh_l','thigh_r'])thick(bones[n],B.limb,B.thigh||1);for(const n of['calf_l','calf_r'])thick(bones[n],B.limb,B.calf||1);
  const FS={long:[.93,1.08,.97],square:[1.04,.98,1.02],angular:[.94,1.04,.96],broad:[1.1,.95,1.05]}[look.face]||[1,1,1];const HS=[B.head*FS[0],B.head*FS[1],B.head*FS[2]];bones.Head.scale.set(HS[0],HS[1],HS[2]);
  // Alias map so the existing gear builders find the bones they expect.
  const al={};for(const[a,b]of Object.entries(BASE_ALIAS))al[a]=bones[b];
  const atpl={bindQ:tpl.bindQ,P:tpl.P,fit:BASE_FIT,gear:BASE_GEAR};
  // Hair, beard, headgear and face gear on the head.
  const H=bones.Head,hairKey=BASE_HAIR[look.hair]&&(look.sex==='female'&&look.hair==='buzz'?'hair_buzzedf':BASE_HAIR[look.hair]);
  const addHair=(key,colour)=>{const src=BASE.hair[key];if(!src)return;src.updateMatrixWorld(true);src.traverse(o=>{if(o.isMesh){const m=new THREE.Mesh(o.geometry,baseFlatMat(colour));m.castShadow=true;const mw=new THREE.Matrix4().multiplyMatrices(tpl.headInv,o.matrixWorld);mw.decompose(m.position,m.quaternion,m.scale);m.position.set(m.position.x/HS[0],m.position.y/HS[1],m.position.z/HS[2]);m.scale.set(m.scale.x/HS[0],m.scale.y/HS[1],m.scale.z/HS[2]);m.userData.hairPiece=true;H.add(m)}})};
  const covered=['beanie','cap','bandana','helmet','riothelm'].includes(look.headgear);
  if(hairKey&&!(covered&&hairKey!=='hair_buzzed'&&hairKey!=='hair_buzzedf'))addHair(hairKey,HAIRC[look.hairCol]);
  if(['beard','goatee','chops'].includes(look.facial))addHair('hair_beard',HAIRC[look.hairCol]);
  if(look.headgear!=='none'||look.facegear!=='none'||look.mark!=='none'||look.facial==='moustache'||look.hair==='mohawk'||look.hair==='spiky'){const hh=new THREE.Group();const s=tpl.headR/.15*1.08;hh.quaternion.copy(tpl.bindQ.Head).invert();hh.scale.set(s/HS[0],s/HS[1],s/HS[2]);
    const c=tpl.headC.clone().applyMatrix4(tpl.headInv);c.y+=tpl.headR*.2;hh.position.set(c.x/HS[0],c.y/HS[1],c.z/HS[2]);hh.userData.attach=true;const hd=opHead(look,Object.assign({},K,{gearOnly:true}));hh.add(hd);H.add(hh)}
  // Armour, pauldrons, kneepads, class gear.
  baseGear(look,cls,atpl,al,K,col);
  // Weapon in the right hand.
  const wk=wkey||'rifle',sec=look.faction==='security',fur=sec?'#3a4048':'#7a5331',W=weaponModel(wk,fur,'#2b2e32','#4a4f55',K.box,K.cylZ,K.mesh,FACTIONS[look.faction].accent);
  const gun=new THREE.Group();gun.add(W.g);gun.quaternion.copy(tpl.gunQ);gun.scale.setScalar(tpl.gunScale*(BASE_GUN_SCALE[wk]||1)*(look.body==='heavy'?1.05:look.body==='light'?.95:1));gun.position.set(0,0,0).add(BASE_GUN_OFF.clone().multiplyScalar(tpl.P));bones.hand_r.add(gun);gun.userData.proc=true;
  const bb=new THREE.Box3();W.g.updateMatrixWorld(true);W.g.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrix))}});const muzzle=new THREE.Vector3(0,(bb.max.y+bb.min.y)/2,bb.max.z);
  // Outlines: skinned hulls share the skeleton; hair pieces get scaled hulls through bakeGroup.
  if(outline)for(const m of meshes){const ol=new THREE.SkinnedMesh(m.geometry,rigOutlineMat(true));ol.bind(m.skeleton,m.bindMatrix);ol.userData.isOutline=true;ol.castShadow=false;ol.frustumCulled=false;m.parent.add(ol)}
  for(const k in bones)for(const c of[...bones[k].children])if(c.isGroup&&c.userData.attach)bakeGroup(c,outline);
  if(!W.barrels)bakeGroup(gun,outline);else if(outline)addOutlines(gun,.014);
  if(outline)for(const m of[...H.children])if(m.userData.hairPiece){const ol=new THREE.Mesh(m.geometry,rigOutlineMat(false));ol.position.copy(m.position);ol.quaternion.copy(m.quaternion);ol.scale.copy(m.scale);ol.userData.isOutline=true;H.add(ol)}
  root.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
  const holder=new THREE.Group();holder.add(root);root.scale.setScalar(tpl.scale);holder.scale.set(1,B.h,1);
  const rig=new BaseAnim(root,tpl.clips,{bones,gun,fore:W.fore.clone(),fwd:tpl.fwd.clone()});rig.gun=gun;rig.muzzle=muzzle;rig.barrels=W.barrels||null;rig.bones=bones;
  holder.userData.rig=rig;return holder}
const BASE_GUN_OFF=new THREE.Vector3(0,0,0);
// Offsets (procedural units, body space) for pauldrons and kneepads on the new bones.
const BASE_GEAR={pad:[-.01,-.03,0],knee:[0,-.06,-.03]};
// Weapon size on the new hands (multiplies the procedural model's own units).
const BASE_GUN_SCALE={rifle:.85,smg:.8,mpistol:.75,shotgun:.85,lmg:.9,minigun:.85,dmr:.9,sniper:.9};
// Chest fit for the gear builder, in procedural units: [half shoulder width, chest front, chest centre height, chest back].
const BASE_FIT={light:[.23,.19,.05,.15],medium:[.25,.2,.05,.16],heavy:[.29,.24,.04,.19]};

/* Two-bone IK: pin the left hand to the weapon's foregrip after each animation update. */
// Arm settings (tuner: Arms panel). ik: how strongly the left hand is pinned to the foregrip (0 = animation only).
// poleOut / poleDown: where the left elbow is steered, in upper-arm lengths outward and downward from the shoulder,
// so it swings out from the ribs instead of folding into the chest. l / r: offsets in degrees applied to each arm
// after the animation (raise = out from the body, fwd = forward swing, twist = roll about the upper arm, bend = elbow).
const BASE_ARM={ik:1,poleOut:1,poleDown:.7,l:{raise:12,fwd:0,twist:0,bend:0},r:{raise:6,fwd:0,twist:0,bend:0}};
class BaseAnim extends RigAnim{
  constructor(root,clips,ik){super(root,clips);this.ik=ik;this.root=root;this._v=[0,1,2,3,4,5,6,7].map(()=>new THREE.Vector3());this._q=[0,1,2,3,4].map(()=>new THREE.Quaternion())}
  // The mixer only rewrites a bone when its animated value changes, so put back the pose it last wrote before
  // updating; otherwise the arm adjustments would stack up frame after frame on held poses.
  update(dt){const B=this.ik.bones,arm=this._arm||(this._arm=['upperarm_l','lowerarm_l','upperarm_r','lowerarm_r','hand_l'].map(n=>B[n]).filter(Boolean));
    if(this._pose)arm.forEach((b,i)=>b.quaternion.copy(this._pose[i]));super.update(dt);this._pose=arm.map(b=>b.quaternion.clone());this.solve()}
  // rotate a bone by a world-space rotation q
  rotW(bone,q){const w=bone.getWorldQuaternion(this._q[3]),pw=bone.parent.getWorldQuaternion(this._q[4]);w.premultiply(q);bone.quaternion.copy(pw.invert().multiply(w));bone.updateWorldMatrix(false,true)}
  axes(){const B=this.ik.bones,fwd=this._v[5].copy(this.ik.fwd).applyQuaternion(this.root.getWorldQuaternion(this._q[0])).setY(0).normalize(),down=this._v[6].set(0,-1,0);return{fwd,down,B}}
  offsets(side){const o=BASE_ARM[side];if(!o)return;const{fwd,down,B}=this.axes(),sfx=side==='l'?'_l':'_r',ua=B['upperarm'+sfx],la=B['lowerarm'+sfx];if(!ua||!la)return;
    const sh=ua.getWorldPosition(new THREE.Vector3()),sp=(B.spine_03||ua.parent).getWorldPosition(new THREE.Vector3()),out=sh.clone().sub(sp).setY(0).normalize(),q=new THREE.Quaternion(),d=Math.PI/180;
    if(o.raise){q.setFromAxisAngle(new THREE.Vector3().crossVectors(down,out).normalize(),o.raise*d);this.rotW(ua,q)}
    if(o.fwd){q.setFromAxisAngle(new THREE.Vector3().crossVectors(down,fwd).normalize(),o.fwd*d);this.rotW(ua,q)}
    if(o.twist){const el=la.getWorldPosition(new THREE.Vector3());q.setFromAxisAngle(el.sub(ua.getWorldPosition(new THREE.Vector3())).normalize(),o.twist*d);this.rotW(ua,q)}
    if(o.bend){const a=ua.getWorldPosition(new THREE.Vector3()),b=la.getWorldPosition(new THREE.Vector3()),c=(B['hand'+sfx]||la).getWorldPosition(new THREE.Vector3());let ax=b.clone().sub(a).cross(c.clone().sub(b));if(ax.lengthSq()<1e-8)ax=b.clone().sub(a).cross(fwd);q.setFromAxisAngle(ax.normalize(),o.bend*d);this.rotW(la,q)}}
  solve(){const{bones,gun,fore}=this.ik;if(!gun||this.base==='Death'&&this.curName==='Death')return;const ua=bones.upperarm_l,la=bones.lowerarm_l,hd=bones.hand_l;if(!ua||!la||!hd)return;
    this.root.updateMatrixWorld(true);
    // right arm first (it carries the gun), then the left arm's own offsets, then pin the left hand to the gun
    this.offsets('r');this.offsets('l');
    const k=Math.max(0,Math.min(1,BASE_ARM.ik));if(!gun.visible||k<=0)return;
    const q0u=ua.quaternion.clone(),q0l=la.quaternion.clone();
    const[a,b,c,t,tmp]=this._v,[q1,q2,pw]=this._q;gun.updateWorldMatrix(true,false);t.copy(fore).applyMatrix4(gun.matrixWorld);
    for(let it=0;it<3;it++){ua.getWorldPosition(a);la.getWorldPosition(b);hd.getWorldPosition(c);
      const L1=a.distanceTo(b),L2=b.distanceTo(c),d=Math.min(L1+L2-.001,Math.max(.01,a.distanceTo(t)));
      const cur=tmp.copy(a).sub(b).angleTo(c.clone().sub(b)),want=Math.acos(Math.max(-1,Math.min(1,(L1*L1+L2*L2-d*d)/(2*L1*L2))));
      const axis=tmp.copy(a).sub(b).cross(c.clone().sub(b));if(axis.lengthSq()>1e-8){axis.normalize();q1.setFromAxisAngle(axis,want-cur);la.getWorldQuaternion(q2);q2.premultiply(q1);la.parent.getWorldQuaternion(pw);la.quaternion.copy(pw.invert().multiply(q2));la.updateWorldMatrix(false,true)}
      hd.getWorldPosition(c);const from=tmp.copy(c).sub(a).normalize(),to=c.clone().copy(t).sub(a).normalize();q1.setFromUnitVectors(from,to);ua.getWorldQuaternion(q2);q2.premultiply(q1);ua.parent.getWorldQuaternion(pw);ua.quaternion.copy(pw.invert().multiply(q2));ua.updateWorldMatrix(false,true)}
    // elbow pole: swing the arm about the shoulder-to-hand line so the elbow points out and down, away from the ribs
    {const sp=(bones.spine_03||ua.parent).getWorldPosition(new THREE.Vector3());ua.getWorldPosition(a);la.getWorldPosition(b);
      const L1=a.distanceTo(b),out=a.clone().sub(sp).setY(0).normalize(),pole=a.clone().addScaledVector(out,BASE_ARM.poleOut*L1).add(new THREE.Vector3(0,-BASE_ARM.poleDown*L1,0));
      const ax=t.clone().sub(a).normalize(),pe=b.clone().sub(a),pp=pole.clone().sub(a);pe.addScaledVector(ax,-pe.dot(ax));pp.addScaledVector(ax,-pp.dot(ax));
      if(pe.lengthSq()>1e-8&&pp.lengthSq()>1e-8){pe.normalize();pp.normalize();let ang=Math.acos(Math.max(-1,Math.min(1,pe.dot(pp))));if(new THREE.Vector3().crossVectors(pe,pp).dot(ax)<0)ang=-ang;q1.setFromAxisAngle(ax,ang);this.rotW(ua,q1)}}
    if(k<1){ua.quaternion.slerpQuaternions?ua.quaternion.slerpQuaternions(q0u,ua.quaternion.clone(),k):THREE.Quaternion.slerp(q0u,ua.quaternion.clone(),ua.quaternion,k);la.quaternion.slerpQuaternions?la.quaternion.slerpQuaternions(q0l,la.quaternion.clone(),k):THREE.Quaternion.slerp(q0l,la.quaternion.clone(),la.quaternion,k);ua.updateWorldMatrix(false,true)}}}

/* ---------- gear built for the new bodies ----------
   Curved shells instead of boxes: chest plates are cylinder segments that
   follow the ribcage, pauldrons are sphere caps, kneepads are domes, class
   packs are small rounded cases. Sizes come from BASE_FIT per build; the
   torso and limb bones carry the build's thickness so heavies fill out
   without the gear growing into slabs. */
function baseGear(look,cls,tpl,bones,K,col){const{mesh,box,sph}=K,sec=look.faction==='security',acc=FACTIONS[look.faction].accent,c2=col.pants,c1=col.main;
  const T=rigHolder(tpl,bones,'Torso');T.userData.attach=true;const[sw,zf,Y0,zb]=tpl.fit[look.body],Y=Y0-.11,vest=shade(c2,-28);
  // Chest shell: a cylinder segment wrapped round the chest, radius from the shoulder half-width, open at the back.
  const shell=(w,h,depth,colr,y,arc=Math.PI*.78,back=false)=>{const r=w;const m=mesh(new THREE.CylinderGeometry(r,r*.96,h,18,1,true,-arc/2,arc),colr,T,0,y,back?-zb+r*.62-depth:zf-r*.62+depth);m.scale.z=.62;if(back)m.rotation.y=Math.PI;return m};
  const panel=(w,y,colr,arc=Math.PI*.78)=>{const r=w;const m=mesh(new THREE.CylinderGeometry(r*1.012,r*1.012,.012,18,1,true,-arc/2,arc),colr,T,0,y,zf-r*.62+.065);m.scale.z=.62;return m};
  const seam=(h,y,colr)=>box(.012,h,.01,colr,T,0,y,zf+.07);
  const strap=(x,y,z,len,rot,colr)=>{const s=box(.035,len,.015,colr,T,x,y,z);s.rotation.z=rot;return s};
  if(look.armour==='carrier'){shell(sw*.98,.34,.06,vest,Y0-.03);shell(sw*.98,.3,.03,vest,Y0-.03,Math.PI*.6,true);panel(sw*.98,Y0+.06,shade(vest,-30));panel(sw*.98,Y0-.1,shade(vest,-30));seam(.3,Y0-.03,shade(vest,-30));// back
    for(const sd of[-1,0,1]){const p=box(.09,.08,.045,shade(vest,14),T,sd*.12,Y-.1,zf+.03);p.rotation.x=.12}box(.14,.035,.005,'#e6e1d4',T,0,Y+.09,zf+.045);
    for(const sd of[-1,1])strap(sd*sw*.62,Y+.14,zf-.06,.16,sd*.5,shade(vest,-10))}
  if(look.armour==='rig'){const rc=shade(c2,-30);for(const sd of[-1,1]){strap(sd*sw*.38,Y+.02,zf+.01,.4,sd*.14,rc);strap(sd*sw*.38,Y+.02,-zb+.02,.4,-sd*.14,rc)}
    box(sw*1.5,.09,.05,rc,T,0,Y-.13,zf+.01);for(let i=0;i<3;i++){const p=box(.07,.08,.04,'#2f3134',T,-sw*.42+i*sw*.42,Y-.12,zf+.045);p.rotation.x=.1}}
  if(look.armour==='riot'){const rp='#d4dadf';shell(sw*1.02,.36,.065,rp,Y0-.03,Math.PI*.82);shell(sw*1.0,.32,.03,rp,Y0-.03,Math.PI*.6,true);panel(sw*1.02,Y0+.08,'#9aa3aa',Math.PI*.82);panel(sw*1.02,Y0-.09,'#9aa3aa',Math.PI*.82);for(const sd of[-1,1]){const sm=box(.012,.3,.01,'#9aa3aa',T,sd*sw*.45,Y0-.03,zf+.06);sm.rotation.y=sd*.5}
    box(.04,.22,.004,acc,T,0,Y,zf+.055);const ring=mesh(new THREE.TorusGeometry(.07,.015,6,16),'#a7b1b8',T,0,Y0+.16,-.01);ring.rotation.x=Math.PI/2;
    for(const sd of[-1,1]){const g=box(sw*.3,.12,.05,shade(rp,-18),T,sd*sw*.86,Y+.04,zf-.05);g.rotation.y=sd*.6}}
  if(look.armour==='scrap'){const p1=mesh(new THREE.CylinderGeometry(sw*.9,sw*.9,.22,12,1,true,-.9,1.2),'#8b4a2a',T,0,Y+.05,zf-sw*.9+.06);p1.scale.z=.6;p1.rotation.y=.25;
    const p2=mesh(new THREE.CylinderGeometry(sw*.9,sw*.9,.18,12,1,true,.3,1.0),'#7f858b',T,0,Y-.03,zf-sw*.9+.065);p2.scale.z=.6;p2.rotation.y=-.3;
    const sp=box(.05,.42,.015,'#4a3423',T,0,Y,zf+.055);sp.rotation.z=.6;for(const sd of[-1,1])strap(sd*sw*.5,Y+.1,zf-.02,.2,sd*.3,'#3a2a1e')}
  // Pauldrons: a sphere cap sitting on the shoulder.
  if(look.armour==='riot'||look.armour==='scrap')for(const s of['L','R']){const A=rigHolder(tpl,bones,'UpperArm'+s);if(!A)continue;A.userData.attach=true;const sd=s==='L'?1:-1;const po=tpl.gear.pad;
    if(look.armour==='riot'){const cap=mesh(new THREE.SphereGeometry(.11,16,10,0,Math.PI*2,0,Math.PI*.5),'#d4dadf',A,sd*.035+po[0]*sd,.02+po[1],po[2]);cap.scale.set(1,.7,1.1);box(.12,.015,.025,acc,A,sd*.02+po[0]*sd,.08+po[1],.1+po[2])}
    else{const cap=mesh(new THREE.SphereGeometry(.11,10,8,0,Math.PI*2,0,Math.PI*.55),'#5a4a3a',A,sd*.02+po[0]*sd,.03+po[1],po[2]);cap.scale.set(1,.65,1.1);const bolt=sph(.02,'#262626',A,sd*.02+po[0]*sd,.09+po[1],.04+po[2])}}
  // Kneepads: a dome on the shin's front.
  if(look.legs==='armoured'||look.armour==='riot')for(const s of['L','R']){const L=rigHolder(tpl,bones,'LowerLeg'+s);if(!L)continue;L.userData.attach=true;const ko=tpl.gear.knee;
    const d=mesh(new THREE.SphereGeometry(.075,12,8,0,Math.PI*2,0,Math.PI*.5),look.armour==='riot'?'#d4dadf':'#2b2d30',L,ko[0],ko[1],.06+ko[2]);d.rotation.x=Math.PI/2;d.scale.set(1,1.2,.8);
    box(.12,.02,.02,'#1f2124',L,ko[0],ko[1],.03+ko[2])}
  // Class gear on the back, smaller and rounded.
  const back=-zb-.04,rc=(w,h,d,colr,x,y,z)=>{const g=box(w,h,d,colr,T,x,y,z);const e=mesh(new THREE.CylinderGeometry(d/2,d/2,w,8),colr,T,x,y+h/2,z);e.rotation.z=Math.PI/2;const e2=mesh(new THREE.CylinderGeometry(d/2,d/2,w,8),colr,T,x,y-h/2,z);e2.rotation.z=Math.PI/2;return g};
  if(cls==='soldier'){rc(.22,.16,.1,sec?'#3a4048':'#5a4128',0,Y-.04,back-.02);const bd=box(.045,.44,.02,'#5a4128',T,0,Y,zf+.05);bd.rotation.z=-.62;for(let i=-3;i<=3;i++){const s=box(.025,.04,.015,'#c9a046',T,Math.sin(.62)*i*.055,Y+Math.cos(.62)*i*.055,zf+.062);s.rotation.z=-.62}}
  if(cls==='medic'){rc(.24,.22,.11,'#e8e6df',0,Y,back-.03);box(.1,.03,.005,'#2c9d68',T,0,Y+.02,back-.09);box(.03,.1,.005,'#2c9d68',T,0,Y+.02,back-.09)}
  if(cls==='engineer'){rc(.24,.2,.09,'#4a4f55',0,Y,back-.02);for(const sd of[-1,1])mesh(new THREE.CylinderGeometry(.04,.04,.3,10),'#d9771f',T,sd*.08,Y+.02,back-.08);sph(.028,'#ffe08a',T,-sw*.7,Y+.16,.06)}
  if(cls==='operative'){rc(.2,.18,.08,'#25292d',0,Y,back-.02);mesh(new THREE.CylinderGeometry(.007,.007,.4,5),'#25292d',T,.08,Y+.3,back-.02);sph(.018,'#38e0ff',T,.08,Y+.52,back-.02)}
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(.1,.07),new THREE.MeshBasicMaterial({color:acc,side:THREE.DoubleSide}));fl.position.set(0,Y+.16,back-.005);T.add(fl)}
