/* ===================== UNIT MODELS =====================
   Procedural operatives (the fallback and the Classic look), the shared
   creator head, procedural weapons, and the rigged Toon Shooter pipeline. */
let UNIT_TEX=null;const unitTex=()=>UNIT_TEX||(UNIT_TEX=toonTex());
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function buildOperative(look,wkey,cls){
  const F=FACTIONS[look.faction],sec=look.faction==='security';
  const c1=F.pal[look.primary],c2=F.pal[look.secondary],skin=SKIN[look.skin],skinD=shade(skin,-18),hair=HAIRC[look.hairCol],acc=F.accent;
  const fur=sec?'#3a4048':'#7a5331',metal='#2b2e32',metal2='#4a4f55',boot=sec?'#1f2328':'#2e2620',ink='#16120e';
  const glove=look.gloves==='tactical'?'#2b2e31':look.gloves==='fingerless'?'#3a3430':skin;
  const MC={},M=(c,o)=>{const k=c+(o?JSON.stringify(o):'');return MC[k]||(MC[k]=new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:unitTex()},o||{})))};
  const mesh=(geo,c,p,x=0,y=0,z=0,o)=>{const m=new THREE.Mesh(geo,M(c,o));m.position.set(x,y,z);p.add(m);return m};
  const box=(w,h,d,c,p,x,y,z,o)=>mesh(new THREE.BoxGeometry(w,h,d),c,p,x,y,z,o);
  const sph=(r,c,p,x,y,z,s=[1,1,1])=>{const m=mesh(new THREE.SphereGeometry(r,12,9),c,p,x,y,z);m.scale.set(...s);return m};
  const cylZ=(r,len,c,p,x,y,z,seg=10)=>{const m=mesh(new THREE.CylinderGeometry(r,r,len,seg),c,p,x,y,z);m.rotation.x=Math.PI/2;return m};
  const limb=(a,b,r,c,p,joint=true)=>{const d=new THREE.Vector3().subVectors(b,a),len=d.length();const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.9,len,10),M(c));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V3(0,1,0),d.normalize());p.add(m);if(joint)sph(r,c,p,a.x,a.y,a.z);return m};
  const B={light:{sw:.25,hw:.15,lr:.085,ar:.062,th:.5,td:.22,ll:.88,hs:1.02},medium:{sw:.3,hw:.17,lr:.1,ar:.075,th:.56,td:.26,ll:.86,hs:1},heavy:{sw:.42,hw:.23,lr:.14,ar:.11,th:.62,td:.36,ll:.8,hs:.88}}[look.body]||{sw:.3,hw:.17,lr:.1,ar:.075,th:.56,td:.26,ll:.86,hs:1};
  const root=new THREE.Group(),hips=new THREE.Group();hips.position.y=B.ll;root.add(hips);
  box(B.hw*2+.07,.2,B.td*.92,c2,hips,0,0,0);box(B.hw*2+.09,.06,B.td*.98,'#2a2622',hips,0,.09,0);box(.07,.06,.02,'#9c9c94',hips,0,.09,B.td*.49);
  const legs=[];
  for(const sd of[-1,1]){const pv=new THREE.Group();pv.position.set(sd*B.hw*.6,-.04,0);hips.add(pv);legs.push(pv);
    const knee=V3(0,-.42,.03),ank=V3(0,-B.ll+.13,0);limb(V3(0,0,0),knee,B.lr,c2,pv);limb(knee,ank,B.lr*.88,c2,pv);
    box(B.lr*2.7,.17,B.lr*4,boot,pv,0,-B.ll+.09,B.lr*.7);box(B.lr*2.8,.04,B.lr*4.1,'#141110',pv,0,-B.ll+.01,B.lr*.7);
    if(look.legs==='cargo')box(.03,.12,.11,shade(c2,-18),pv,sd*(B.lr+.012),-.22,.01);
    if(look.legs==='armoured'){box(B.lr*1.9,.13,.07,'#2b2d30',pv,0,-.42,.06+B.lr*.7);box(B.lr*1.7,.16,.05,shade(c2,-30),pv,0,-.2,B.lr+.01)}}
  const torso=new THREE.Group();torso.position.y=.1;hips.add(torso);
  const tankTop=look.top==='tank',sleeve=tankTop?skin:c1,longSl=['long','hoodie','jacket'].includes(look.top);
  const chest=mesh(new THREE.CylinderGeometry(B.sw/.72,(B.hw+.04)/.72,B.th,4,1),c1,torso,0,B.th/2,0);chest.rotation.y=Math.PI/4;chest.scale.z=B.td/(2*B.sw)*1.45;chest.scale.x=1;
  if(tankTop){box(B.sw*.5,.04,B.td*.7,skin,torso,0,B.th-.01,0)}
  if(look.top==='jacket'){box(.08,B.th*.92,.02,shade(c2,25),torso,0,B.th*.5,B.td*.5+.005);for(const sd of[-1,1]){const cl=box(.1,.12,.03,shade(c1,-15),torso,sd*.08,B.th-.04,B.td*.48);cl.rotation.z=sd*.4}}
  if(look.top==='hoodie'){const hd=mesh(new THREE.TorusGeometry(.12,.055,6,14,Math.PI),shade(c1,-12),torso,0,B.th-.01,-.03);hd.rotation.x=-Math.PI/2.2;hd.rotation.z=Math.PI;box(B.sw*1.1,.13,.02,shade(c1,-10),torso,0,B.th*.22,B.td*.42)}
  const S_R=V3(B.sw*.95,B.th-.07,0),S_L=V3(-B.sw*.95,B.th-.07,0);
  sph(B.ar*1.45,sleeve,torso,S_R.x,S_R.y,S_R.z);sph(B.ar*1.45,sleeve,torso,S_L.x,S_L.y,S_L.z);
  // weapon
  const gun=new THREE.Group(),W=weaponModel(wkey||'rifle',fur,metal,metal2,box,cylZ,mesh,acc);const gs=look.body==='heavy'?1.15:look.body==='light'?.92:1;
  gun.add(W.g);gun.scale.setScalar(gs);const G=V3(B.sw*.38,B.th*.3,B.td*.5+.13);gun.position.copy(G);gun.rotation.x=.1;torso.add(gun);
  const F2=W.fore.clone().multiplyScalar(gs).applyEuler(gun.rotation).add(G);
  const E_R=V3(B.sw*1.05,B.th*.22,.0),E_L=V3(-B.sw*.7,B.th*.2,B.td*.5+.05);
  limb(S_R,E_R,B.ar,sleeve,torso);limb(E_R,G,B.ar*.9,longSl?c1:skin,torso);limb(S_L,E_L,B.ar,sleeve,torso);limb(E_L,F2,B.ar*.9,longSl?c1:skin,torso);
  if(longSl){for(const[e,h]of[[E_R,G],[E_L,F2]]){const c=e.clone().lerp(h,.82);sph(B.ar*.98,shade(c1,-25),torso,c.x,c.y,c.z)}}
  sph(B.ar*1.4,glove,torso,G.x,G.y-.02,G.z);sph(B.ar*1.4,glove,torso,F2.x,F2.y-.02,F2.z);
  if(!tankTop)box(.025,.08,.08,acc,torso,S_R.x+B.ar*1.3,S_R.y-.12,0);
  // armour
  const vest=shade(c2,-42),zf=B.td*.5;
  if(look.armour==='carrier'){box(B.sw*1.35,B.th*.58,.06,vest,torso,0,B.th*.58,zf+.03);box(B.sw*1.35,B.th*.58,.06,vest,torso,0,B.th*.58,-zf-.03);for(const sd of[-1,0,1])box(.11,.1,.06,shade(vest,14),torso,sd*.13,B.th*.33,zf+.07);box(.16,.04,.005,'#e6e1d4',torso,0,B.th*.78,zf+.062);for(const sd of[-1,1])box(.07,.03,B.td+.12,vest,torso,sd*B.sw*.45,B.th-.01,0)}
  if(look.armour==='rig'){const rc=shade(c2,-30);box(B.sw*1.5,.12,.07,rc,torso,0,B.th*.32,zf+.035);for(let i=0;i<4;i++)box(.07,.09,.05,'#2f3134',torso,-B.sw*.55+i*B.sw*.37,B.th*.42,zf+.05);for(const sd of[-1,1]){const st=box(.05,B.th*.7,.02,rc,torso,sd*B.sw*.42,B.th*.62,zf+.02);st.rotation.z=sd*.08}}
  if(look.armour==='riot'){const rp='#d4dadf';box(B.sw*1.5,B.th*.7,.09,rp,torso,0,B.th*.55,zf+.04);box(B.sw*1.5,B.th*.7,.07,rp,torso,0,B.th*.55,-zf-.03);box(.05,B.th*.6,.005,acc,torso,0,B.th*.56,zf+.09);
    for(const s of[S_R,S_L]){sph(B.ar*2.1,rp,torso,s.x*1.03,s.y+.02,s.z,[1,.7,1]);box(B.ar*2.2,.02,.03,acc,torso,s.x*1.05,s.y+.05,B.ar*1.4)}mesh(new THREE.TorusGeometry(.1,.035,6,14),'#a7b1b8',torso,0,B.th+.01,0).rotation.x=Math.PI/2}
  if(look.armour==='scrap'){const p1=box(B.sw*.85,B.th*.45,.05,'#8b4a2a',torso,-B.sw*.3,B.th*.62,zf+.03);p1.rotation.z=.12;const p2=box(B.sw*.7,B.th*.4,.05,'#7f858b',torso,B.sw*.35,B.th*.55,zf+.035);p2.rotation.z=-.1;
    const ty=mesh(new THREE.TorusGeometry(B.ar*1.5,B.ar*.6,6,12),'#262626',torso,S_L.x*1.05,S_L.y+.02,0);ty.rotation.y=Math.PI/2;const sp=box(.06,B.th*.9,.02,'#4a3423',torso,0,B.th*.55,zf+.06);sp.rotation.z=.6}
  // class gear
  if(cls==='soldier'){const bd=box(.06,B.th*1.05,.03,'#5a4128',torso,0,B.th*.55,zf+.075);bd.rotation.z=-.62;for(let i=-3;i<=3;i++){const sh=box(.03,.05,.02,'#c9a046',torso,Math.sin(.62)*i*.06,B.th*.55+Math.cos(.62)*i*.06,zf+.09);sh.rotation.z=-.62}
    for(const sd of[-1,1])sph(.045,'#556036',hips,sd*(B.hw+.03),.02,B.td*.3)}
  if(cls==='medic'){box(B.sw*1.1,B.th*.55,.14,'#e8e6df',torso,0,B.th*.55,-zf-.1);box(.12,.04,.005,'#2c9d68',torso,0,B.th*.58,-zf-.175);box(.04,.12,.005,'#2c9d68',torso,0,B.th*.58,-zf-.175);
    const m=S_L.clone().lerp(E_L,.45);const ab=mesh(new THREE.CylinderGeometry(B.ar*1.08,B.ar*1.08,.05,10),'#f2f2ee',torso,m.x,m.y,m.z);ab.quaternion.setFromUnitVectors(V3(0,1,0),E_L.clone().sub(S_L).normalize())}
  if(cls==='engineer'){box(B.sw*1.1,B.th*.5,.12,'#4a4f55',torso,0,B.th*.55,-zf-.08);const tk=mesh(new THREE.CylinderGeometry(.06,.06,B.th*.7,10),'#d9771f',torso,B.sw*.3,B.th*.6,-zf-.17);mesh(new THREE.CylinderGeometry(.06,.06,B.th*.7,10),'#d9771f',torso,-B.sw*.3,B.th*.6,-zf-.17);
    box(.1,.1,.08,'#6b5233',hips,-(B.hw+.04),-.02,0);const wr=box(.025,.16,.02,'#9aa0a5',hips,-(B.hw+.06),.06,.04);wr.rotation.z=.3;const lamp=sph(.035,'#ffe08a',torso,S_R.x,S_R.y+.06,.06)}
  if(cls==='operative'){box(B.sw*.9,B.th*.4,.1,'#25292d',torso,0,B.th*.6,-zf-.07);const an=mesh(new THREE.CylinderGeometry(.008,.008,.45,5),'#25292d',torso,B.sw*.3,B.th+.18,-zf-.07);sph(.022,'#38e0ff',torso,B.sw*.3,B.th+.42,-zf-.07);
    const w=E_L.clone().lerp(F2,.55);box(.07,.05,.09,'#25292d',torso,w.x,w.y+.03,w.z);box(.05,.006,.06,'#38e0ff',torso,w.x,w.y+.058,w.z)}
  // head
  mesh(new THREE.CylinderGeometry(.065*(look.body==='heavy'?1.5:1),.075*(look.body==='heavy'?1.5:1),.12,8),skinD,torso,0,B.th+.05,0);
  const hd=opHead(look,{mesh,box,sph,cylZ});hd.position.set(0,B.th+.2,.01);hd.scale.setScalar(B.hs);torso.add(hd);
  root.userData.anim={legs,torso,gun,barrels:W.barrels||null};
  return root}
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
  sph(.15,skin,hd,0,0,0,fs);
  if(look.face==='square'||look.face==='broad')box(.2*fs[0],.09,.18,skin,hd,0,-.1,.02);else box(.15*fs[0],.08,.16,skin,hd,0,-.1,.02);
  for(const sd of[-1,1])sph(.035,skinD,hd,sd*.15*fs[0],0,0,[.6,1,1]);
  const ez=.142*fs[2];
  for(const sd of[-1,1]){box(.05,.024,.01,'#f1ece2',hd,sd*.055,.02,ez);box(.022,.022,.012,ink,hd,sd*.055,.02,ez+.003)}
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
   buildOperative), held by a group that converts them to the rig's scale. */
const RIG={ok:false,failed:false,tpl:{},mats:new Map()};
const RIG_SCALE=.52;               // rig units -> world units (neck height matches the procedural body)
const RIG_P=.5/RIG_SCALE;          // procedural units -> rig units
const RIG_WEAPON={rifle:'AK',smg:'SMG',mpistol:'Pistol',sniper:'Sniper'};
const RIG_WEAPONS=['AK','SMG','Pistol','Sniper'];
// Body types scale bones, not the whole model. [x,y,z] per bone (three.js
// drops the dots from bone names: UpperArm.L is UpperArmL). Head values
// are relative to the scaled torso so heavies get a slightly smaller head.
const RIG_BUILD={
  light:{root:[.96,1.05,.96],Torso:[.9,1,.9],Shoulder:[1.02,1,1.02],UpperArm:[.92,1,.92],UpperLeg:[.88,1,.88],Hips:[.92,1,.92],head:1.16},
  medium:{head:1.15},
  heavy:{root:[1.03,1,1.03],Abdomen:[1.1,1,1.08],Torso:[1.14,1.04,1.12],Shoulder:[.95,.95,.95],UpperArm:[1.1,1,1.1],UpperLeg:[1.16,1,1.16],LowerLeg:[.97,1,.97],Hips:[1.12,1,1.1],head:1.04}};
// Scales multiply down the chain (Abdomen > Torso > Shoulder > arms), so
// Shoulder counter-scales to keep heavy hands a sensible size.
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
  for(const c of g.animations){c.tracks=c.tracks.filter(t=>!t.name.endsWith('.scale'));clips[c.name]=c}
  const tpl={key,root,clips,bones:{},weapons:{}};
  root.traverse(o=>{if(o.isBone)tpl.bones[o.name]=o;if(RIG_WEAPONS.includes(o.name))tpl.weapons[o.name]=o;
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
function rigMat(hex,skinned){const k=hex+(skinned?'|s':'');let m=RIG.mats.get(k);if(!m){m=new THREE.MeshToonMaterial({color:hex,gradientMap:unitTex(),skinning:skinned});RIG.mats.set(k,m)}return m}
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
  for(const m of meshes){if(m.userData.rigHead){m.visible=false;continue}
    const mats=[].concat(m.material).map(mt=>{const r=mt.userData.role;return rigMat(r?col[r]:'#'+mt.userData.orig.getHexString(),!!m.isSkinnedMesh)});
    m.material=Array.isArray(m.material)?mats:mats[0];m.castShadow=true;m.receiveShadow=true}
  // Weapon: stock model if the rig has it, otherwise a procedural one in the same grip.
  const wk=wkey||'rifle',stock=RIG_WEAPON[wk];let gun=null,muzzle=null,barrels=null;
  for(const k of RIG_WEAPONS)weapons[k].visible=k===stock;
  if(stock){gun=weapons[stock];muzzle=tpl.muzzle[stock].clone()}
  else{const hand=bones[tpl.hand],K=opKit(),fur=sec?'#3a4048':'#7a5331',W=weaponModel(wk,fur,'#2b2e32','#4a4f55',K.box,K.cylZ,K.mesh,FACTIONS[look.faction].accent);
    gun=new THREE.Group();gun.add(W.g);gun.position.copy(tpl.gunPos);gun.quaternion.copy(tpl.gunQ);const gs=look.body==='heavy'?1.1:1;gun.scale.setScalar(tpl.gunScale*gs);hand.add(gun);barrels=W.barrels||null;
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
  const B=RIG_BUILD[look.body]||{};for(const[k,v]of Object.entries(B)){if(k==='root'||k==='head')continue;for(const n of[k,k+'L',k+'R'])if(bones[n])bones[n].scale.set(...v)}
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

// Shared mesh helpers (same signatures as inside buildOperative).
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
  const sw=.3,zf={light:.18,medium:.2,heavy:.25}[look.body]||.2,vest=shade(c2,-42),Y=.15; // zf: chest front, further out on heavies (bone scaling pushes the jacket forward) // half shoulder width, chest front, chest centre
  if(look.armour==='carrier'){box(sw*1.5,.3,.06,vest,T,0,Y,zf+.02);box(sw*1.5,.3,.06,vest,T,0,Y,-zf-.03);for(const sd of[-1,0,1])box(.11,.1,.06,shade(vest,14),T,sd*.14,Y-.08,zf+.07);box(.16,.04,.005,'#e6e1d4',T,0,Y+.1,zf+.055)}
  if(look.armour==='rig'){const rc=shade(c2,-30);box(sw*1.6,.12,.07,rc,T,0,Y-.12,zf+.03);for(let i=0;i<4;i++)box(.07,.09,.05,'#2f3134',T,-sw*.6+i*sw*.4,Y-.06,zf+.06);for(const sd of[-1,1]){const st=box(.05,.36,.02,rc,T,sd*sw*.45,Y+.06,zf+.02);st.rotation.z=sd*.08}}
  if(look.armour==='riot'){const rp='#d4dadf';box(sw*1.45,.32,.06,rp,T,0,Y,zf+.02);box(sw*1.45,.32,.06,rp,T,0,Y,-zf+.02);box(.05,.26,.005,acc,T,0,Y,zf+.055);mesh(new THREE.TorusGeometry(.1,.035,6,14),'#a7b1b8',T,0,Y+.22,0).rotation.x=Math.PI/2}
  if(look.armour==='scrap'){const p1=box(sw*.9,.24,.05,'#8b4a2a',T,-sw*.32,Y+.04,zf+.03);p1.rotation.z=.12;const p2=box(sw*.75,.2,.05,'#7f858b',T,sw*.36,Y,zf+.035);p2.rotation.z=-.1;const sp=box(.06,.42,.02,'#4a3423',T,0,Y,zf+.06);sp.rotation.z=.6}
  // Pauldrons (riot and scrap) on the upper arms.
  if(look.armour==='riot'||look.armour==='scrap')for(const s of['L','R']){const A=rigHolder(tpl,bones,'UpperArm'+s);if(!A)continue;A.userData.attach=true;const sd=s==='L'?1:-1;
    if(look.armour==='riot'){sph(.13,'#d4dadf',A,sd*.03,.06,0,[1,.7,1.1]);box(.15,.02,.03,acc,A,sd*.03,.1,.1)}else{const ty=mesh(new THREE.TorusGeometry(.09,.04,6,12),'#262626',A,sd*.02,.04,0);ty.rotation.z=Math.PI/2}}
  // Kneepads with armoured legs, riot and carrier armour.
  if(look.legs==='armoured'||look.armour==='riot')for(const s of['L','R']){const L=rigHolder(tpl,bones,'LowerLeg'+s);if(!L)continue;L.userData.attach=true;box(.13,.13,.07,look.armour==='riot'?'#d4dadf':'#2b2d30',L,0,0,.1)}
  // Class gear on the back (and a chest bandolier for soldiers).
  const back=-zf-.06;
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
    if(outline&&!o.userData.noOutline&&!(mt.transparent)){o.geometry.computeBoundingBox();o.geometry.boundingBox.getSize(v);const s=o.scale,k=new THREE.Vector3(1+2*t/Math.max(.02,v.x*Math.abs(s.x)),1+2*t/Math.max(.02,v.y*Math.abs(s.y)),1+2*t/Math.max(.02,v.z*Math.abs(s.z)));
      const c=o.geometry.boundingBox.getCenter(new THREE.Vector3());ol.push({g:o.geometry,m:m.clone().multiply(new THREE.Matrix4().makeTranslation(c.x,c.y,c.z)).multiply(new THREE.Matrix4().makeScale(k.x,k.y,k.z)).multiply(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z))})}}
  for(const c of[...h.children])h.remove(c);
  for(const[mt,parts]of byMat){const m=new THREE.Mesh(mergeGeos(parts),mt);m.castShadow=true;m.receiveShadow=true;h.add(m)}
  if(ol.length){const m=new THREE.Mesh(mergeGeos(ol),rigOutlineMat(false,true));m.userData.isOutline=true;h.add(m)}}
