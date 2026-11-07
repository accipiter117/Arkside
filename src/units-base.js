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
const BASE_BUILD={light:{limb:.9,torso:.93,head:1,h:.97},medium:{limb:1,torso:1,head:1,h:1},heavy:{limb:1.16,torso:1.2,head:1.03,h:1.03}};
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
function thick(bone,k){const c=bone.children.find(o=>o.isBone);const s=[k,k,k];if(c){const p=c.position,ax=Math.abs(p.x)>=Math.abs(p.y)&&Math.abs(p.x)>=Math.abs(p.z)?0:Math.abs(p.y)>=Math.abs(p.z)?1:2;s[ax]=1}bone.scale.set(s[0],s[1],s[2])}

function buildBase(look,wkey,cls,opts={}){const tpl=BASE.tpl[look.sex==='female'?'f':'m']||BASE.tpl.m;if(!tpl)return null;
  const root=THREE.SkeletonUtils.clone(tpl.root),bones={},meshes=[],outline=opts.outline!==false,K=opKit(),col=rigColours(look);
  root.traverse(o=>{if(o.isBone)bones[o.name]=o;if(o.isMesh)meshes.push(o)});
  for(const m of meshes){const role=m.userData.role,src=m.material;if(role==='Skin')m.material=baseClothMat(look,src.map);else if(role==='Eyes')m.material=baseEyeMat(src.map);else m.material=new THREE.MeshToonMaterial({color:HAIRC[look.hairCol],gradientMap:unitTex(),skinning:true});m.castShadow=true;m.receiveShadow=true}
  // Builds.
  const B=BASE_BUILD[look.body]||BASE_BUILD.medium;
  for(const n of['upperarm_l','upperarm_r','lowerarm_l','lowerarm_r','thigh_l','thigh_r','calf_l','calf_r'])thick(bones[n],B.limb);
  for(const n of['spine_01','spine_02','spine_03','pelvis'])thick(bones[n],B.torso);
  bones.Head.scale.setScalar(B.head);
  // Alias map so the existing gear builders find the bones they expect.
  const al={};for(const[a,b]of Object.entries(BASE_ALIAS))al[a]=bones[b];
  const atpl={bindQ:tpl.bindQ,P:tpl.P,fit:BASE_FIT,gear:BASE_GEAR};
  // Hair, beard, headgear and face gear on the head.
  const H=bones.Head,hairKey=BASE_HAIR[look.hair]&&(look.sex==='female'&&look.hair==='buzz'?'hair_buzzedf':BASE_HAIR[look.hair]);
  const addHair=(key,colour)=>{const src=BASE.hair[key];if(!src)return;src.updateMatrixWorld(true);src.traverse(o=>{if(o.isMesh){const m=new THREE.Mesh(o.geometry,baseFlatMat(colour));m.castShadow=true;const mw=new THREE.Matrix4().multiplyMatrices(tpl.headInv,o.matrixWorld);mw.decompose(m.position,m.quaternion,m.scale);m.scale.multiplyScalar(1/B.head);m.userData.hairPiece=true;H.add(m)}})};
  const covered=['beanie','cap','bandana','helmet','riothelm'].includes(look.headgear);
  if(hairKey&&!(covered&&hairKey!=='hair_buzzed'&&hairKey!=='hair_buzzedf'))addHair(hairKey,HAIRC[look.hairCol]);
  if(['beard','goatee','chops'].includes(look.facial))addHair('hair_beard',HAIRC[look.hairCol]);
  if(look.headgear!=='none'||look.facegear!=='none'||look.mark!=='none'){const hh=new THREE.Group();const s=tpl.headR/.15*1.08;hh.quaternion.copy(tpl.bindQ.Head).invert();hh.scale.setScalar(s/B.head);
    const c=tpl.headC.clone().applyMatrix4(tpl.headInv);hh.position.copy(c);hh.position.y+=tpl.headR*.2/B.head;hh.userData.attach=true;const hd=opHead(look,Object.assign({},K,{gearOnly:true}));hh.add(hd);H.add(hh)}
  // Armour, pauldrons, kneepads, class gear.
  rigGear(look,cls,atpl,al,K,col);
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
  const rig=new BaseAnim(root,tpl.clips,{bones,gun,fore:W.fore.clone()});rig.gun=gun;rig.muzzle=muzzle;rig.barrels=W.barrels||null;rig.bones=bones;
  holder.userData.rig=rig;return holder}
const BASE_GUN_OFF=new THREE.Vector3(0,0,0);
// Offsets (procedural units, body space) for pauldrons and kneepads on the new bones.
const BASE_GEAR={pad:[-.01,-.03,0],knee:[0,-.06,-.03]};
// Weapon size on the new hands (multiplies the procedural model's own units).
const BASE_GUN_SCALE={rifle:.85,smg:.8,mpistol:.75,shotgun:.85,lmg:.9,minigun:.85,dmr:.9,sniper:.9};
// Chest fit for the gear builder, in procedural units: [half shoulder width, chest front, chest centre height, chest back].
const BASE_FIT={light:[.25,.19,.05,.16],medium:[.27,.2,.05,.17],heavy:[.32,.24,.04,.2]};

/* Two-bone IK: pin the left hand to the weapon's foregrip after each animation update. */
class BaseAnim extends RigAnim{
  constructor(root,clips,ik){super(root,clips);this.ik=ik;this._v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];this._q=[new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion()]}
  update(dt){super.update(dt);this.solve()}
  solve(){const{bones,gun,fore}=this.ik;if(!gun||!gun.visible||this.base==='Death'&&this.curName==='Death')return;const ua=bones.upperarm_l,la=bones.lowerarm_l,hd=bones.hand_l;if(!ua||!la||!hd)return;
    const[a,b,c,t,tmp]=this._v,[q1,q2,pw]=this._q;ua.parent.updateWorldMatrix(true,false);ua.updateWorldMatrix(false,false);la.updateWorldMatrix(false,false);hd.updateWorldMatrix(false,false);gun.updateWorldMatrix(true,false);
    t.copy(fore).applyMatrix4(gun.matrixWorld);
    for(let it=0;it<3;it++){ua.getWorldPosition(a);la.getWorldPosition(b);hd.getWorldPosition(c);
      const L1=a.distanceTo(b),L2=b.distanceTo(c),d=Math.min(L1+L2-.001,Math.max(.01,a.distanceTo(t)));
      // elbow angle by the cosine rule, rotated about the current bend axis
      const cur=tmp.copy(a).sub(b).angleTo(c.clone().sub(b)),want=Math.acos(Math.max(-1,Math.min(1,(L1*L1+L2*L2-d*d)/(2*L1*L2))));
      const axis=tmp.copy(a).sub(b).cross(c.clone().sub(b));if(axis.lengthSq()>1e-8){axis.normalize();q1.setFromAxisAngle(axis,want-cur);la.getWorldQuaternion(q2);q2.premultiply(q1);la.parent.getWorldQuaternion(pw);la.quaternion.copy(pw.invert().multiply(q2));la.updateWorldMatrix(false,false);hd.updateWorldMatrix(false,false)}
      // aim the whole arm at the target
      hd.getWorldPosition(c);const from=tmp.copy(c).sub(a).normalize(),to=c.clone().copy(t).sub(a).normalize();q1.setFromUnitVectors(from,to);ua.getWorldQuaternion(q2);q2.premultiply(q1);ua.parent.getWorldQuaternion(pw);ua.quaternion.copy(pw.invert().multiply(q2));ua.updateWorldMatrix(false,false);la.updateWorldMatrix(false,false);hd.updateWorldMatrix(false,false)}}}
