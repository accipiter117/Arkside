/* ===================== TERRAIN KIT (proposal) =====================
   Procedural tile objects for more varied maps: homes, squares and bars
   of the shanty decks; malls, theatres and plazas of the Founders' Ark;
   the works of the industrial decks; and a few new ground types. Each
   entry builds one tile's worth of model into a THREE.Group with the
   same proportions the engine uses (tile 1 x 1, half cover about 0.5
   high, full cover 1.3 or more). The `rule` is the proposed gameplay
   rule; `cover` is none, half or full; `sight` says whether it blocks
   line of sight; `move` says how the tile can be entered.
   Rendered on lab/terrain-review.html. Nothing here is wired into the
   game yet: adopt an entry by giving it a map letter in parseMap and
   calling its build from objMesh. */
const TK={};
TK.tex=(name,s=128)=>{TK._tx=TK._tx||{};if(TK._tx[name])return TK._tx[name];const c=document.createElement('canvas');c.width=c.height=s;const g=c.getContext('2d');
  const noise=(a,n)=>{for(let i=0;i<n;i++){g.fillStyle=`rgba(0,0,0,${a*Math.random()})`;g.fillRect(Math.random()*s,Math.random()*s,2+Math.random()*4,2+Math.random()*4)}};
  g.fillStyle='#fff';g.fillRect(0,0,s,s);
  if(name==='corr'){for(let x=0;x<s;x+=8){g.fillStyle=x%16?'#d9d9d9':'#ffffff';g.fillRect(x,0,8,s)}noise(.12,80)}
  if(name==='wood'){g.fillStyle='#e8d6b8';g.fillRect(0,0,s,s);for(let y=0;y<s;y+=16){g.fillStyle=y%32?'#d8c29c':'#e2cfae';g.fillRect(0,y,s,15)}noise(.1,120)}
  if(name==='conc'){g.fillStyle='#e9e9e9';g.fillRect(0,0,s,s);noise(.16,220)}
  if(name==='white'){g.fillStyle='#fafafa';g.fillRect(0,0,s,s);noise(.03,40)}
  if(name==='hazard'){g.fillStyle='#f2c230';g.fillRect(0,0,s,s);g.fillStyle='#222';for(let i=-s;i<s*2;i+=24){g.beginPath();g.moveTo(i,0);g.lineTo(i+12,0);g.lineTo(i+12-s,s);g.lineTo(i-s,s);g.closePath();g.fill()}}
  if(name==='canvas'){g.fillStyle='#f0e4c8';g.fillRect(0,0,s,s);for(let y=0;y<s;y+=22){g.fillStyle='#d9ccae';g.fillRect(0,y,s,10)}noise(.06,60)}
  if(name==='brick'){g.fillStyle='#e0d0c0';g.fillRect(0,0,s,s);g.fillStyle='#c9b7a4';for(let y=0;y<s;y+=16)for(let x=((y/16)%2)*16;x<s;x+=32)g.fillRect(x+1,y+1,30,14);noise(.1,100)}
  if(name==='grate'){g.fillStyle='#bdbdbd';g.fillRect(0,0,s,s);g.fillStyle='#4a4a4a';for(let y=4;y<s;y+=12)for(let x=4;x<s;x+=12)g.fillRect(x,y,8,8)}
  if(name==='tile'){g.fillStyle='#f4f4f4';g.fillRect(0,0,s,s);g.strokeStyle='#cfd4d6';g.lineWidth=2;for(let i=0;i<=s;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,s);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(s,i);g.stroke()}}
  if(name==='tarp'){g.fillStyle='#e6e6e6';g.fillRect(0,0,s,s);for(let i=0;i<s;i+=10){g.fillStyle=i%20?'#dcdcdc':'#f0f0f0';g.fillRect(0,i,s,10)}noise(.08,80)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return TK._tx[name]=t};
TK.mat=(col,tex,extra)=>new THREE.MeshLambertMaterial(Object.assign({color:col},tex?{map:TK.tex(tex)}:{},extra||{}));
TK.glow=col=>new THREE.MeshBasicMaterial({color:col});
TK.box=(g,w,h,d,mat,x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=m.receiveShadow=true;g.add(m);return m};
TK.cyl=(g,r1,r2,h,mat,x,y,z,seg=10)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
TK.ANIM=[];
const SHANTY=['#a4462c','#2f6e8a','#c98a2a','#4f6b3a','#8a2f2a','#c4572a','#3d5f7a','#b8b2a2'];
const pick=(arr,i)=>arr[Math.abs(i)%arr.length];

/* ---------- the catalogue ---------- */
TK.LIST=[
// ===== Shanty decks (Container City) =====
{id:'shack',district:'shanty',name:'Shack',rule:'A home. Full cover, blocks sight. Grenades blow the tarp off (becomes half cover).',cover:'full',sight:'blocks',move:'blocked',
 build(g,i){const c=pick(SHANTY,i);TK.box(g,.9,1.05,.9,TK.mat(c,'corr'),0,.52,0);TK.box(g,1,.06,1,TK.mat('#5d6b73','tarp'),0,1.08,0).rotation.z=.06;TK.box(g,.3,.3,.03,TK.mat('#1d1f22'),.2,.55,.46);const w=TK.box(g,.22,.22,.02,TK.glow('#ffd27a'),.2,.55,.465);TK.box(g,.2,.4,.03,TK.mat('#3a2a1e','wood'),-.25,.2,.46);TK.cyl(g,.03,.03,.5,TK.mat('#555'),-.35,1.3,-.3,6)}},
{id:'shackdoor',district:'shanty',name:'Shack, door open',rule:'Walk through the home. Passable; half cover from its walls for whoever stands in the doorway.',cover:'half',sight:'blocks',move:'open',
 build(g,i){const c=pick(SHANTY,i+1);TK.box(g,.2,1.05,.9,TK.mat(c,'corr'),-.4,.52,0);TK.box(g,.2,1.05,.9,TK.mat(c,'corr'),.4,.52,0);TK.box(g,1,.9,.2,TK.mat(c,'corr'),0,.6,-.4);TK.box(g,1,.06,1,TK.mat('#6b5a4a','tarp'),0,1.08,0);TK.box(g,.6,.03,.9,TK.mat('#8a7560','wood'),0,.02,0)}},
{id:'stall',district:'shanty',name:'Market stall',rule:'Half cover, see-through. Lights vault it. A grenade scatters the goods.',cover:'half',sight:'open',move:'blocked',
 build(g,i){TK.box(g,.9,.5,.5,TK.mat('#8a6a46','wood'),0,.25,.1);for(const x of[-.4,.4])TK.cyl(g,.025,.025,1.3,TK.mat('#6a5540'),x,.65,-.35,6);const aw=TK.box(g,1,.03,.7,TK.mat(pick(['#c4572a','#2f6e8a','#c98a2a'],i),'canvas'),0,1.25,-.1);aw.rotation.x=.25;for(let k=0;k<4;k++)TK.box(g,.14,.14,.14,TK.mat(pick(['#d94a3a','#e3b53a','#4f9a52','#e9e2c8'],k),null),-.3+k*.2,.57,.1)}},
{id:'cantina',district:'shanty',name:'Cantina bar',rule:'Full cover counter with a lit sign: a light source at night. Shots at it smash bottles (noise alerts).',cover:'full',sight:'open',move:'blocked',
 build(g,i){TK.box(g,.95,.75,.45,TK.mat('#5a3e2a','wood'),0,.37,.2);TK.box(g,1,.05,.5,TK.mat('#2a2d31'),0,.77,.2);for(let k=0;k<5;k++)TK.cyl(g,.03,.03,.18,TK.mat(pick(['#3f9a52','#b8862a','#8a2f2a','#e9e2c8'],k),null,{transparent:true,opacity:.9}),-.36+k*.18,.88,.15,6);for(const x of[-.45,.45])TK.cyl(g,.02,.02,1.5,TK.mat('#555'),x,.75,-.38,6);const s=TK.box(g,.9,.22,.04,TK.glow('#ff5fa0'),0,1.45,-.38);const b=TK.box(g,.7,.1,.02,TK.glow('#fff1a0'),0,1.45,-.35);TK.ANIM.push(tt=>{s.visible=Math.sin(tt*7)>-.9})}},
{id:'watertank',district:'shanty',name:'Water tank',rule:'Full cover on stilts with a ladder to the top: a perch one level up.',cover:'full',sight:'blocks',move:'ladder',
 build(g,i){for(const x of[-.35,.35])for(const z of[-.35,.35])TK.cyl(g,.03,.03,.8,TK.mat('#6a6a6a'),x,.4,z,6);TK.cyl(g,.44,.44,.75,TK.mat('#3d5f7a','corr'),0,1.17,0,16);TK.cyl(g,.46,.46,.06,TK.mat('#2a3540'),0,1.56,0,16);for(let y=.2;y<1.5;y+=.25)TK.box(g,.3,.03,.03,TK.mat('#d4a52a'),.5,y,0);for(const x of[.36,.64])TK.box(g,.03,1.55,.03,TK.mat('#d4a52a'),x,.78,0)}},
{id:'firebarrel',district:'shanty',name:'Fire barrel',rule:'Half cover and a light at night: anyone within 2 tiles is lit for the enemy.',cover:'half',sight:'open',move:'blocked',
 build(g,i){TK.cyl(g,.26,.26,.6,TK.mat('#4a4440','conc'),0,.3,0,12);const f=TK.cyl(g,.05,.2,.3,TK.glow('#ff9a2a'),0,.72,0,7);const f2=TK.cyl(g,.03,.12,.2,TK.glow('#ffe08a'),0,.78,0,6);TK.ANIM.push(tt=>{f.scale.y=1+Math.sin(tt*9)*.25;f2.scale.y=1+Math.cos(tt*11)*.3})}},
{id:'sandbags',district:'shanty',name:'Sandbag line',rule:'Half cover that counts as fortified (+1 cover tier against grenades). Engineers build it.',cover:'half',sight:'open',move:'blocked',
 build(g,i){const m=TK.mat('#bda77e');for(let r=0;r<3;r++)for(let k=-1;k<=1;k++){const s=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),m);s.scale.set(.31,.12,.44);s.position.set(k*.3+(r%2?.15:0),.11+r*.19,0);g.add(s)}}},
{id:'nets',district:'shanty',name:'Drying nets',rule:'Half cover you can see through, but it blocks grenades from rolling. Burns.',cover:'half',sight:'open',move:'blocked',
 build(g,i){for(const x of[-.42,.42])TK.cyl(g,.025,.025,1.2,TK.mat('#6a5540'),x,.6,0,6);TK.box(g,.86,.02,.02,TK.mat('#6a5540'),0,1.15,0);const n=TK.box(g,.84,.9,.01,TK.mat('#7a8a6a','grate',{transparent:true,opacity:.55}),0,.65,0);for(let k=0;k<3;k++)TK.cyl(g,.05,.05,.08,TK.mat('#d0c6a8'),-.25+k*.25,.3,.03,6)}},
{id:'shrine',district:'shanty',name:'Shrine',rule:'Half cover. Standing next to it steadies nerves: +5 accuracy for the turn (shanty only).',cover:'half',sight:'open',move:'blocked',
 build(g,i){TK.box(g,.6,.4,.5,TK.mat('#8a7560','brick'),0,.2,0);TK.box(g,.7,.05,.6,TK.mat('#5a3e2a','wood'),0,.42,0);for(let k=0;k<4;k++){TK.cyl(g,.03,.03,.1,TK.mat('#f4ecd0'),-.2+k*.13,.5,.1,6);const c=TK.cyl(g,.015,.03,.05,TK.glow('#ffd27a'),-.2+k*.13,.57,.1,5);TK.ANIM.push(tt=>c.scale.y=1+Math.sin(tt*8+k)*.3)}TK.box(g,.3,.4,.05,TK.mat('#c4572a'),0,.7,-.2);for(let k=0;k<5;k++)TK.box(g,.06,.06,.01,TK.mat(pick(['#e3b53a','#d94a3a','#4f9a52'],k)),-.25+k*.12,.9,-.2)}},
{id:'coop',district:'shanty',name:'Pallet stack',rule:'Half cover. Lights and mediums climb onto it (a climb step).',cover:'half',sight:'open',move:'climb',
 build(g,i){for(let k=0;k<3;k++){TK.box(g,.9,.04,.9,TK.mat('#a88a60','wood'),0,.04+k*.16,0);for(const x of[-.35,0,.35])TK.box(g,.1,.1,.9,TK.mat('#8a7050','wood'),x,.11+k*.16,0)}}},
{id:'plank',district:'shanty',name:'Plank walkway',rule:'A narrow plank over water: lights and mediums only, no stopping to fight on it (no cover).',cover:'none',sight:'open',move:'narrow',
 build(g,i){TK.box(g,1,.05,.98,TK.mat('#2a5a78',null,{transparent:true,opacity:.8}),0,-.1,0);TK.box(g,1,.05,.3,TK.mat('#b98e5c','wood'),0,.02,0);for(const z of[-.1,.1])for(const x of[-.4,.4])TK.cyl(g,.02,.02,.3,TK.mat('#6a5540'),x,-.05,z,6)}},
{id:'mud',district:'shanty',name:'Mud and bilge',rule:'A slow tile: costs 2 moves to enter. No cover. Civilians avoid it.',cover:'none',sight:'open',move:'slow',
 build(g,i){const m=TK.box(g,.98,.03,.98,TK.mat('#4a3a2a','conc'),0,.015,0);for(let k=0;k<4;k++){const p=new THREE.Mesh(new THREE.CircleGeometry(.08+Math.random()*.1,8),TK.mat('#5a6a5a',null,{transparent:true,opacity:.7}));p.rotation.x=-Math.PI/2;p.position.set((Math.random()-.5)*.7,.035,(Math.random()-.5)*.7);g.add(p)}}},
// ===== The Ark (Founders' district) =====
{id:'glass',district:'ark',name:'Glass storefront',rule:'Blocks movement, not sight or shots. One hit shatters it into rubble (half cover, passable).',cover:'none',sight:'open',move:'blocked',
 build(g,i){TK.box(g,.98,1.5,.1,TK.mat('#bfe6ff',null,{transparent:true,opacity:.35}),0,.75,0);for(const x of[-.48,0,.48])TK.box(g,.05,1.5,.12,TK.mat('#e8ecee'),x,.75,0);TK.box(g,1,.06,.14,TK.mat('#e8ecee'),0,1.52,0);TK.box(g,.6,.08,.02,TK.glow('#38b6e8'),0,1.3,.07)}},
{id:'planter',district:'ark',name:'Planter bed',rule:'Half cover with soft edges: bullets that hit it still spray dirt (no damage).',cover:'half',sight:'open',move:'blocked',
 build(g,i){TK.box(g,.9,.42,.6,TK.mat('#f4f6f7','white'),0,.21,0);TK.box(g,.8,.04,.5,TK.mat('#5a3e2a'),0,.44,0);for(const[x,z,r]of[[-.25,0,.2],[.1,.1,.22],[.3,-.1,.16]]){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(r,0),TK.mat('#4f9a52'));c.position.set(x,.55,z);g.add(c)}}},
{id:'fountain',district:'ark',name:'Fountain',rule:'A pool: impassable, no cover, you can shoot across it. Its rim is half cover.',cover:'none',sight:'open',move:'blocked',
 build(g,i){TK.cyl(g,.48,.48,.2,TK.mat('#f4f6f7','white'),0,.1,0,20);TK.cyl(g,.4,.4,.16,TK.mat('#5fc8ff',null,{transparent:true,opacity:.6}),0,.14,0,20);TK.cyl(g,.06,.08,.5,TK.mat('#f4f6f7'),0,.4,0,10);const j=TK.cyl(g,.02,.05,.3,TK.glow('#bfe6ff'),0,.8,0,6);TK.ANIM.push(tt=>j.scale.y=1+Math.sin(tt*5)*.2)}},
{id:'marquee',district:'ark',name:'Theatre marquee',rule:'Full cover pillar with a holographic billboard: a light source, and a distraction (enemies glance at it: −5 to their overwatch).',cover:'full',sight:'blocks',move:'blocked',
 build(g,i){TK.box(g,.7,1.6,.5,TK.mat('#f2f4f5','white'),0,.8,0);const h=TK.box(g,.8,.9,.02,TK.glow('#38e0ff'),0,1.1,.27);const h2=TK.box(g,.6,.2,.03,TK.glow('#ffffff'),0,1.3,.28);TK.box(g,.74,.06,.54,TK.mat('#38b6e8'),0,1.63,0);TK.ANIM.push(tt=>{h.material.opacity=.7+Math.sin(tt*3)*.2;h.material.transparent=true;h2.position.y=1.0+((tt*.4)%1)*.6})}},
{id:'bench',district:'ark',name:'Plaza bench',rule:'Half cover; vault it in a straight line like a rail.',cover:'half',sight:'open',move:'vault',
 build(g,i){TK.box(g,.9,.06,.35,TK.mat('#e9d9b8','wood'),0,.42,.1);TK.box(g,.9,.3,.05,TK.mat('#e9d9b8','wood'),0,.6,-.08);for(const x of[-.35,.35]){TK.box(g,.06,.42,.3,TK.mat('#8a9096'),x,.21,.1)}}},
{id:'kiosk',district:'ark',name:'Vending kiosk',rule:'Full cover. Engineers can pop it for a one-off supply (heal 20 or refresh).',cover:'full',sight:'blocks',move:'blocked',
 build(g,i){TK.box(g,.7,1.4,.6,TK.mat('#f2f4f5','white'),0,.7,0);TK.box(g,.5,.7,.03,TK.glow('#5fc8ff'),0,.9,.31);for(let k=0;k<6;k++)TK.box(g,.1,.1,.02,TK.mat(pick(['#d94a3a','#e3b53a','#4f9a52'],k)),-.15+(k%3)*.15,1.05-Math.floor(k/3)*.2,.33);TK.box(g,.74,.06,.64,TK.mat('#38b6e8'),0,1.43,0)}},
{id:'turnstile',district:'ark',name:'Turnstile',rule:'A vault rail: lights hop it free, mediums for one move, heavies walk round.',cover:'none',sight:'open',move:'vault',
 build(g,i){for(const x of[-.4,.4])TK.box(g,.08,.9,.08,TK.mat('#e8ecee'),x,.45,0);TK.box(g,.9,.06,.06,TK.mat('#e8ecee'),0,.9,0);const r=new THREE.Group();r.position.y=.5;for(let k=0;k<3;k++){const a=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.4),TK.mat('#8a9096'));a.position.z=.2;const h=new THREE.Group();h.rotation.y=k*Math.PI*2/3;h.add(a);r.add(h)}g.add(r);TK.ANIM.push(tt=>r.rotation.y=tt*.6)}},
{id:'boom',district:'ark',name:'Checkpoint barrier',rule:'A gate variant: blocks movement, not sight. Hack the post to raise it (2 progress, Operatives double).',cover:'none',sight:'open',move:'hack',
 build(g,i){TK.box(g,.2,.8,.2,TK.mat('#f2f4f5','white'),-.42,.4,0);TK.box(g,.12,.12,.02,TK.glow('#ff5a2a'),-.42,.6,.11);const arm=TK.box(g,.9,.07,.07,TK.mat('#ffffff','hazard'),.05,.72,0);TK.box(g,.08,.72,.08,TK.mat('#8a9096'),.44,.36,0)}},
{id:'statue',district:'ark',name:'Founders’ statue',rule:'Full cover, blocks sight. A monument: Security near it get +1 morale (accuracy) as a district perk.',cover:'full',sight:'blocks',move:'blocked',
 build(g,i){TK.box(g,.8,.5,.8,TK.mat('#f4f6f7','white'),0,.25,0);TK.box(g,.6,.1,.6,TK.mat('#dfe3e5'),0,.55,0);const b=TK.cyl(g,.16,.2,.9,TK.mat('#c7ccd0','conc'),0,1.05,0,10);const h=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),TK.mat('#c7ccd0'));h.position.y=1.6;g.add(h);TK.box(g,.5,.08,.2,TK.mat('#c7ccd0'),.1,1.35,0).rotation.z=.4;TK.box(g,.06,.06,.5,TK.glow('#38b6e8'),0,.61,0)}},
{id:'escalator',district:'ark',name:'Escalator',rule:'A ramp tile dressed as an escalator: the only way up a level for heavies in a mall.',cover:'none',sight:'open',move:'ramp',
 build(g,i){const r=TK.box(g,.9,.06,1.1,TK.mat('#5a5f64','grate'),0,.25,0);r.rotation.x=-.45;for(const x of[-.47,.47]){const s=TK.box(g,.05,.5,1.1,TK.mat('#bfe6ff',null,{transparent:true,opacity:.4}),x,.45,0);s.rotation.x=-.45}for(let k=0;k<5;k++){const st=TK.box(g,.86,.02,.08,TK.mat('#e8ecee'),0,.03+k*.11,.45-k*.22)}}},
{id:'adpylon',district:'ark',name:'Ad hologram',rule:'No cover, no block: a thin pylon that lights 2 tiles around it at night.',cover:'none',sight:'open',move:'open',
 build(g,i){TK.cyl(g,.04,.06,1.4,TK.mat('#e8ecee'),.3,.7,.3,8);const h=TK.box(g,.5,.7,.01,TK.glow('#9fe0ff'),.3,1.75,.3);h.material.transparent=true;h.material.opacity=.6;TK.ANIM.push(tt=>{h.rotation.y=tt*.8;h.material.opacity=.45+Math.sin(tt*4)*.15})}},
// ===== Industrial decks =====
{id:'pipes',district:'industrial',name:'Pipe bundle',rule:'Half cover; lights vault it. Shoot a valve to vent steam along it.',cover:'half',sight:'open',move:'vault',
 build(g,i){for(const[y,r]of[[.12,.12],[.34,.1],[.5,.07]]){const p=TK.cyl(g,r,r,1,TK.mat(pick(['#8a9096','#b8862a','#5f6569'],Math.round(y*10))),0,y,0,10);p.rotation.z=Math.PI/2}for(const x of[-.3,.3])TK.box(g,.08,.56,.3,TK.mat('#2a2d31'),x,.28,0);TK.cyl(g,.06,.06,.04,TK.mat('#c8321f'),.1,.6,0,8)}},
{id:'generator',district:'industrial',name:'Generator',rule:'Full cover. Loud: standing next to it hides your footsteps (no alert from moving). Explodes like barrels if destroyed.',cover:'full',sight:'blocks',move:'blocked',
 build(g,i){TK.box(g,.9,.8,.7,TK.mat('#4f6b3a','conc'),0,.4,0);TK.box(g,.92,.06,.72,TK.mat('#ffffff','hazard'),0,.83,0);TK.cyl(g,.05,.05,.5,TK.mat('#2a2d31'),.3,1.05,-.2,8);const fan=new THREE.Group();fan.position.set(-.2,.5,.36);for(let k=0;k<4;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(.04,.24,.02),TK.mat('#9aa4ad'));b.position.y=.1;const h=new THREE.Group();h.rotation.z=k*Math.PI/2;h.add(b);fan.add(h)}g.add(fan);TK.ANIM.push(tt=>fan.rotation.z=tt*6);const l=TK.box(g,.08,.08,.02,TK.glow('#4fd18a'),.3,.6,.36)}},
{id:'conveyor',district:'industrial',name:'Conveyor',rule:'Passable. Ending a turn on it carries you one tile along at the start of the next.',cover:'none',sight:'open',move:'open',
 build(g,i){TK.box(g,1,.12,.7,TK.mat('#2a2d31'),0,.06,0);const belt=TK.box(g,1,.03,.6,TK.mat('#555a5f','grate'),0,.13,0);belt.material.map.repeat.set(4,1);for(const x of[-.48,.48])TK.cyl(g,.08,.08,.7,TK.mat('#8a9096'),x,.1,0,8).rotation.x=Math.PI/2;TK.ANIM.push(tt=>belt.material.map.offset.x=-(tt*.4)%1)}},
{id:'cargonet',district:'industrial',name:'Cargo net',rule:'Full cover crate pile under a net: lights climb it (climb step), heavies walk round.',cover:'full',sight:'blocks',move:'climb',
 build(g,i){TK.box(g,.8,.6,.8,TK.mat('#a88a60','wood'),0,.3,0);TK.box(g,.6,.4,.6,TK.mat('#8a7050','wood'),.05,.8,-.05);const n=TK.box(g,.95,1.05,.95,TK.mat('#6a7a5a','grate',{transparent:true,opacity:.35}),0,.53,0);for(const[x,z]of[[-.45,-.45],[.45,.45],[-.45,.45],[.45,-.45]])TK.cyl(g,.02,.02,.2,TK.mat('#2a2d31'),x,.1,z,6)}},
{id:'drums',district:'industrial',name:'Fuel drums',rule:'Half cover that burns: shoot it and the spill burns 2 turns on the tiles around it.',cover:'half',sight:'open',move:'blocked',
 build(g,i){for(const[x,z,c]of[[-.22,-.15,'#c8321f'],[.22,-.15,'#e2b21f'],[0,.22,'#c8321f']]){TK.cyl(g,.2,.2,.6,TK.mat(c,'corr'),x,.3,z,12);TK.cyl(g,.21,.21,.04,TK.mat('#2a2d31'),x,.12,z,12);TK.cyl(g,.21,.21,.04,TK.mat('#2a2d31'),x,.5,z,12)}const d=TK.box(g,.5,.01,.3,TK.mat('#3a3a2a',null,{transparent:true,opacity:.6}),.2,.01,.4)}},
{id:'console',district:'industrial',name:'Control desk',rule:'A terminal variant for hack objectives: half cover, and it lights up as progress is made.',cover:'half',sight:'open',move:'blocked',
 build(g,i){TK.box(g,.9,.5,.5,TK.mat('#3a4046','conc'),0,.25,0);const p=TK.box(g,.86,.3,.04,TK.mat('#2a2d31'),0,.6,-.1);p.rotation.x=-.6;for(let k=0;k<4;k++){const l=TK.box(g,.08,.05,.01,TK.glow(k<2?'#4fd18a':'#ff5a2a'),-.3+k*.2,.63,-.08);l.rotation.x=-.6}TK.box(g,.3,.04,.2,TK.glow('#38e0ff'),0,.53,.12)}},
{id:'gantry',district:'industrial',name:'Gantry stairs',rule:'A ramp dressed as steel stairs: everyone goes up. Plant a charge on the support to drop it.',cover:'none',sight:'open',move:'ramp',
 build(g,i){for(let k=0;k<5;k++)TK.box(g,.9,.04,.2,TK.mat('#5a5f64','grate'),0,.06+k*.11,.4-k*.2);for(const x of[-.46,.46]){const r=TK.box(g,.03,.03,1.05,TK.mat('#e2b21f'),x,.55,0);r.rotation.x=-.45;for(let k=0;k<3;k++)TK.box(g,.03,.4,.03,TK.mat('#e2b21f'),x,.25+k*.11,.35-k*.35)}TK.box(g,.08,.5,.08,TK.mat('#5a5f64'),-.4,.25,-.45)}},
{id:'ventfloor',district:'industrial',name:'Steam vent',rule:'A floor hazard: passable, but anyone ending a turn on it is scalded (15) and loses sight for a turn.',cover:'none',sight:'open',move:'open',
 build(g,i){TK.box(g,.98,.03,.98,TK.mat('#5a5f64','grate'),0,.015,0);const s=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),TK.mat('#dfe6ea',null,{transparent:true,opacity:.5}));s.position.y=.3;g.add(s);TK.ANIM.push(tt=>{s.position.y=.25+((tt*.5)%1)*.5;s.material.opacity=.5*(1-((tt*.5)%1))})}},
// ===== Anywhere =====
{id:'rubble',district:'any',name:'Rubble',rule:'What a blown shack or shattered storefront leaves: half cover, costs 2 moves to cross.',cover:'half',sight:'open',move:'slow',
 build(g,i){const m=TK.mat('#7d858a','conc');for(let k=0;k<7;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(.15+Math.random()*.25,.1+Math.random()*.2,.15+Math.random()*.25),m);b.position.set((Math.random()-.5)*.7,.1,(Math.random()-.5)*.7);b.rotation.set(Math.random(),Math.random(),Math.random()*.4);g.add(b)}TK.box(g,.3,.05,.5,TK.mat('#8a2f2a','corr'),.2,.15,-.1).rotation.z=.3}},
{id:'highwall',district:'any',name:'High wall',rule:'Two levels tall: blocks sight and movement, cannot be hopped. Only a ladder or a charge gets you past.',cover:'full',sight:'blocks',move:'blocked',
 build(g,i){TK.box(g,1,2,.4,TK.mat('#9da1a3','brick'),0,1,0);TK.box(g,1.02,.08,.44,TK.mat('#5a5f64'),0,2.04,0);for(let k=0;k<4;k++)TK.cyl(g,.02,.02,.3,TK.mat('#5a5f64'),-.4+k*.26,2.2,0,5)}},
{id:'awning',district:'any',name:'Awning',rule:'Overhead cover: no cover from ground fire, but grenades and anything thrown from above bounce off. Passable.',cover:'none',sight:'open',move:'open',
 build(g,i){for(const x of[-.45,.45])TK.cyl(g,.025,.025,1.3,TK.mat('#6a5540'),x,.65,.4,6);const aw=TK.box(g,1,.03,1,TK.mat(pick(['#c4572a','#3d5f7a','#4f6b3a'],i),'canvas'),0,1.35,0);aw.rotation.x=.12}},
];
TK.byDistrict=d=>TK.LIST.filter(e=>d==='all'||e.district===d||e.district==='any');
