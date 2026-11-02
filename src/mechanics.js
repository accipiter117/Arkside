/* ===================== MECHANICS: climbing and parkour (overhaul stage D) =====================
   Movement by body type, from references/4-map-drafts.html:

   Feature                          Light      Medium                 Heavy
   Ladder, one level                1 move     1 move                 2 moves
   Climb step (marked ledge)        1 move     1 move                 No
   Vault rail                       Free       1 move                 Walk round
   Gap jump, one tile, same height  1 move     2 moves, marked only   No
   Wall-hop, two levels             2 moves    No                     No
   Zipline, one way                 1 move     1 move                 No
   Drop down                        Two levels Two levels             One level
   Crawl vent                       Yes        No                     No

   Map data (all optional, per mission or operation):
   - feat: rows of letters over the map, one per tile:
       L ladder (climb onto this tile from a lower neighbour, per level)
       s climb step (a marked ledge: climb one level onto it)
       r vault rail (a low rail on the tile: hop over it in a straight line)
       _ gap (a one-tile hole: jump over it in a straight line)
       = marked gap (mediums may jump it too)
   - zips: [[x1,z1,x2,z2], ...] one-way ziplines.
   reach() asks moveCost() for each step and moveLinks() for jumps and zips,
   so the enemy AI, which plans with reach(), uses every route its body
   allows. Vault and gap moves are free for lights in the sense of costing
   the same as walking the tiles (a vault counts as one move). */

// Read the feature layer onto the tiles (called from parseMap).
function parseFeat(m){S.zips=(m.zips||[]).map(z=>({x1:z[0],z1:z[1],x2:z[2],z2:z[3]}));if(!m.feat)return;
  for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++){const c=(m.feat[z]||'')[x],t=G[z][x];if(!c||c==='.'||c===' ')continue;
    if(c==='L')t.ladder=true;else if(c==='s')t.step=true;else if(c==='r'){t.obj='rail'}else if(c==='_'||c==='='){t.type='gap';t.markedGap=c==='=';t.obj=null}}}

// Cost of one orthogonal step from a to b for unit u, or 0 if not allowed.
function moveCost(u,a,b){if(b.type==='water'||b.type==='gap'||b.obj||b.flood)return 0;if(b.pass==='light'&&u.body!=='light')return 0;if(b.pass==='nonheavy'&&u.body==='heavy')return 0;
  const up=b.h-a.h,P=u.perks;if(Math.abs(up)<=.5)return 1;
  if(up>0){// ladder: any body, per level
    if(b.ladder){const lv=Math.ceil(up-.01);return u.body==='heavy'?2*lv:lv}
    if(u.body==='heavy')return 0;
    if(up<=1){if(b.step)return 1;return(u.body==='light'||(P&&P.has('climber')))?1:2}
    if(up<=2&&u.body==='light')return P&&P.has('parkour')?1:2;return 0}
  const dn=-up;if(dn<=1)return 1;if(dn<=2&&u.body!=='heavy')return 1;
  if(a.ladder||b.ladder)return u.body==='heavy'?2*Math.ceil(dn-.01):Math.ceil(dn-.01);return 0}

// Extra links from (x,z): vaults, gap jumps and ziplines. [nx,nz,cost,kind]
function moveLinks(u,x,z){const out=[],a=G[z][x];if(u.body==='turret'||u.cls==='bot'||u.cls==='civ')return out;
  for(const[dx,dz]of D4){const m=tileAt(x+dx,z+dz),b=tileAt(x+2*dx,z+2*dz);if(!m||!b)continue;
    if(b.type==='water'||b.type==='gap'||b.obj||Math.abs(b.h-a.h)>.5)continue;if(b.pass==='light'&&u.body!=='light')continue;if(b.pass==='nonheavy'&&u.body==='heavy')continue;
    if(m.obj==='rail'&&Math.abs(m.h-a.h)<=.5){if(u.body==='light')out.push([b.x,b.z,2,'vault']);else if(u.body==='medium')out.push([b.x,b.z,3,'vault'])}
    if(m.type==='gap'){if(u.body==='light')out.push([b.x,b.z,2,'jump']);else if(u.body==='medium'&&m.markedGap)out.push([b.x,b.z,3,'jump'])}}
  if(u.body!=='heavy')for(const zp of S.zips||[])if(zp.x1===x&&zp.z1===z){const b=G[zp.z2][zp.x2];if(b&&!b.obj)out.push([zp.x2,zp.z2,1,'zip'])}
  return out}
// Vault and gap costs above include the tile walked into (2 = one step plus
// the free vault for lights; 3 = one step plus 1 for mediums).

// ---------- markers on the map ----------
let MECH_TX=null;
function mechTex(){if(MECH_TX)return MECH_TX;MECH_TX={};
  MECH_TX.chev=cvTex((g,s)=>{g.clearRect(0,0,s,s);g.fillStyle='#f3b33d';for(let i=0;i<2;i++){const o=i*s*.34;g.beginPath();g.moveTo(s*.16,s*.26+o);g.lineTo(s*.5,s*.1+o);g.lineTo(s*.84,s*.26+o);g.lineTo(s*.84,s*.42+o);g.lineTo(s*.5,s*.26+o);g.lineTo(s*.16,s*.42+o);g.closePath();g.fill()}});
  return MECH_TX}
function mechDecal(x,z,y,rot,sz=.7){const d=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshLambertMaterial({map:mechTex().chev,transparent:true,depthWrite:false}));d.rotation.x=-Math.PI/2;d.rotation.z=rot;const p=W(x,z);d.position.set(p.x,y+.02,p.z);scene.add(d);return d}
// Ladders, rails, step chevrons, gap edges and zipline cables.
function mechBuild(){if(!scene)return;const lad=new THREE.MeshLambertMaterial({color:0xd4a52a}),railM=new THREE.MeshLambertMaterial({color:0x6f7a80});
  for(const row of G)for(const t of row){const p=W(t.x,t.z);
    if(t.ladder)mechLadder(t);
    if(t.step){let lo=null;for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.h<t.h&&!n.obj&&(!lo||n.h<lo.n.h))lo={n,dx,dz}}mechDecal(t.x,t.z,topY(t),lo?Math.atan2(-lo.dx,lo.dz):0)}
    if(t.obj==='rail'){const g=new THREE.Group(),y=topY(t);const bar=new THREE.Mesh(new THREE.BoxGeometry(.9,.07,.07),railM);bar.position.y=.5;g.add(bar);for(const x of[-.42,.42]){const q=new THREE.Mesh(new THREE.BoxGeometry(.07,.5,.07),railM);q.position.set(x,.25,0);g.add(q)}
      let ax=0;for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.obj==='rail'){ax=dx?0:Math.PI/2;break}}const n1=tileAt(t.x+1,t.z),n2=tileAt(t.x-1,t.z);if(!(n1&&n1.obj==='rail')&&!(n2&&n2.obj==='rail')){const nz=tileAt(t.x,t.z+1);if(nz&&nz.type!=='water'&&!nz.obj)ax=0}
      g.rotation.y=ax;g.position.set(p.x,y,p.z);g.traverse(o=>{if(o.isMesh){o.castShadow=HI();o.userData.tile=t}});scene.add(g);mechDecal(t.x,t.z,y,ax+Math.PI/2,.55)}
    if(t.type==='gap'&&t.markedGap){for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.type!=='gap'&&n.type!=='water'&&!n.obj)mechDecal(n.x,n.z,topY(n),Math.atan2(dx,-dz),.5)}}}
  for(const zp of S.zips||[]){const a=W(zp.x1,zp.z1),b=W(zp.x2,zp.z2);a.y=topY(G[zp.z1][zp.x1])+1.5;b.y=topY(G[zp.z2][zp.x2])+1.1;const mid=a.clone().lerp(b,.5);mid.y-=.35;
    const curve=new THREE.QuadraticBezierCurve3(a,mid,b);scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.018,5,false),new THREE.MeshLambertMaterial({color:0x2a2a2a})));
    for(const[v,t]of[[a,G[zp.z1][zp.x1]],[b,G[zp.z2][zp.x2]]]){const post=new THREE.Mesh(new THREE.BoxGeometry(.07,v.y-topY(t)+.05,.07),new THREE.MeshLambertMaterial({color:0x8a8f94}));post.position.set(v.x+.3,(v.y+topY(t))/2,v.z+.3);scene.add(post)}}}

let MECH_LAD=null;
function mechLadder(t){const p=W(t.x,t.z),lad=MECH_LAD||(MECH_LAD=new THREE.MeshLambertMaterial({color:0xd4a52a}));let lo=null;for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.type!=='water'&&n.type!=='gap'&&!n.obj&&n.h<t.h&&(!lo||n.h<lo.n.h))lo={n,dx,dz}}
      if(lo){const h=topY(t)-topY(lo.n),g=new THREE.Group();for(const sx of[-.18,.18]){const r=new THREE.Mesh(new THREE.BoxGeometry(.04,h+.4,.04),lad);r.position.set(sx,(h+.4)/2,0);g.add(r)}
        for(let y=.22;y<h+.3;y+=.26){const r=new THREE.Mesh(new THREE.BoxGeometry(.36,.03,.03),lad);r.position.set(0,y,0);g.add(r)}
        g.position.set(p.x+lo.dx*.47,topY(lo.n),p.z+lo.dz*.47);g.rotation.y=Math.atan2(lo.dx,lo.dz);g.traverse(o=>{if(o.isMesh){o.castShadow=HI();o.userData.tile=t}});scene.add(g)}}
// Move preview: a dotted arc from where a jump, vault or zipline starts to
// where it lands, drawn with the blue move tiles before you commit.
function mechArcs(r){for(const[k,kind]of r.kind){const pk=r.prev.get(k);if(!pk)continue;const[ax,az]=pk.split(',').map(Number),[bx,bz]=k.split(',').map(Number);
  const a=W(ax,az),b=W(bx,bz);a.y=topY(G[az][ax])+.12;b.y=topY(G[bz][bx])+.12;const pts=[],H=kind==='zip'?-.2:.55;
  for(let i=0;i<=16;i++){const t=i/16,v=a.clone().lerp(b,t);v.y+=Math.sin(t*Math.PI)*H+(kind==='zip'?(1.4*(1-t)+1*t):0);pts.push(v)}
  const g=new THREE.BufferGeometry().setFromPoints(pts),l=new THREE.Line(g,new THREE.LineDashedMaterial({color:kind==='zip'?0x7fe8ff:0xf3b33d,dashSize:.08,gapSize:.06}));l.computeLineDistances();hl.add(l)}}

/* ===================== Interactive points and traps =====================
   Map data (optional): points:[...] and traps:[...], each {type, x, z, ...}.

   Points (worked from an adjacent tile with the action):
   - supply {x,z}: once per mission, heal 30 or refresh cooldowns.
   - searchlight {x,z,dir:[dx,dz],len}: while on, anyone of yours ending a
     move in its beam is spotted and it calls one reinforcement. Hack it
     (2 progress, Operatives double) to switch it off.
   - hatch {x,z,ladder:[x,z]}: repair (Engineers double) to drop a ladder
     onto that tile for everyone.
   - bridge {x,z,tiles:[[x,z],...]}: build to span gap tiles; heavies can cross.
   - zipanchor {x,z,zip:[x1,z1,x2,z2]}: build to rig a zipline.
   Traps (one use each; enemies use them too):
   - crane {x,z,area:[[x,z]x4],crate:[x,z]}: shoot the hook. Cargo drops on
     the 2x2 area: heavy damage and knocked down; the crate stays as cover.
   - barrels {x,z}: shoot or grenade. Blast one tile round; chain reactions.
   - steam {x,z,line:[[x,z]x3]}: shoot the valve. Steam for 2 turns, blocks
     sight, scalds anyone ending a turn in it.
   - fuel {x,z,area:[...]}: shoot the drum. Burns 2 turns, damage each turn.
   - gantry {x,z,tiles:[...]}: plant a charge on the support. The walkway
     drops: anyone on it falls a level and takes damage; the route is gone.
   - flood {x,z,tiles:[...]}: hack the panel. The channel floods for 3 turns:
     impassable, and anyone in it is washed out.
   - shutter {x,z,tiles:[...]}: hack the panel. Slams a corridor shut. */
const PT_INFO={supply:['Supply station','Once per mission: heal 30 or refresh cooldowns.'],searchlight:['Searchlight','Anyone in its beam is spotted and it calls reinforcements. Hack it to switch it off.'],
  hatch:['Ladder hatch','Repair it to drop a ladder that stays down for everyone. Engineers work twice as fast.'],bridge:['Deployable bridge','Build it to span the gap. Heavies can cross it. Engineers work twice as fast.'],
  zipanchor:['Zipline anchor','Build it to rig the zipline. Engineers work twice as fast.']};
const TRAP_INFO={crane:['Crane cargo','Shoot the hook. The cargo drops on a 2×2 area: heavy damage and knocked down. The crate stays as full cover.'],barrels:['Explosive barrels','Shoot or grenade them. Blast one tile round, with chain reactions.'],
  steam:['Steam pipe','Shoot the valve. Steam fills a line for 2 turns: blocks sight and scalds anyone ending a turn in it.'],fuel:['Fuel drum','Shoot the leaking drum. The spill burns for 2 turns and damages anyone in it.'],
  gantry:['Gantry support','Plant a charge on it. The walkway drops: anyone on it falls a level and takes damage, and the route is gone.'],flood:['Floodgate panel','Hack it. The channel floods for 3 turns: impassable, and washes units out.'],
  shutter:['Shutter panel','Hack it. Slams the corridor shut.'],drawbridge:['Harbour drawbridge','Hack it to raise the drawbridge and cut off Security’s reinforcement boat.']};
const TRAP_SHOOT=new Set(['crane','barrels','steam','fuel']),PT_NEED={searchlight:2,hatch:2,bridge:2,zipanchor:2};
const PT_FAST={searchlight:'operative',hatch:'engineer',bridge:'engineer',zipanchor:'engineer',flood:'operative',shutter:'operative',drawbridge:'operative'};
function trapArea(tr){if(tr.type==='crane')return tr.area||[];if(tr.type==='steam')return tr.line||[];if(tr.type==='fuel')return tr.area||[];if(tr.type==='barrels'){const o=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)o.push([tr.x+dx,tr.z+dz]);return o}return tr.tiles||[]}
function beamTiles(p){const o=[];const[dx,dz]=p.dir||[0,1];for(let i=1;i<=(p.len||5);i++)for(const w of[-1,0,1]){const x=p.x+dx*i+(dz?w:0),z=p.z+dz*i+(dx?w:0);if(tileAt(x,z))o.push([x,z])}return o}

function mechInit(m){S.points=(m.points||[]).map((p,i)=>({...p,i,used:false,on:true}));S.traps=(m.traps||[]).map((t,i)=>({...t,i,used:false}));S.hazards=[];S.slCalled=false;
  for(const p of S.points){G[p.z][p.x].point=p;if(p.type!=='supply'||true)G[p.z][p.x].obj=G[p.z][p.x].obj||'pt'}
  for(const t of S.traps){const tl=G[t.z][t.x];tl.trap=t;if(t.type!=='crane')tl.obj=tl.obj||'pt'}}

// ---------- models ----------
function mechModels(){const M2=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));const red=new THREE.MeshBasicMaterial({color:0xff3b2a,side:THREE.DoubleSide});
  const put=(g,t,obj)=>{const p=W(t.x,t.z);g.position.set(p.x,topY(G[t.z][t.x]),p.z);g.traverse(o=>{if(o.isMesh){o.castShadow=HI();o.userData.tile=G[t.z][t.x]}});scene.add(g);obj.mesh=g;return g};
  const target=(g,y)=>{const r=new THREE.Mesh(new THREE.RingGeometry(.12,.19,20),red);r.position.y=y;r.userData.billboard=true;g.add(r);return r};
  for(const p of S.points){const g=new THREE.Group();
    if(p.type==='supply'){const b=new THREE.Mesh(new THREE.BoxGeometry(.5,.7,.36),M2(0x2f6f3f));b.position.y=.35;g.add(b);const l=new THREE.Mesh(new THREE.BoxGeometry(.24,.24,.02),new THREE.MeshBasicMaterial({color:0x7dff9a}));l.position.set(0,.5,.19);g.add(l);p.lamp=l}
    else if(p.type==='searchlight'){const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,1.6,8),M2(0x8a8f94));post.position.y=.8;g.add(post);const head=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.3,12),M2(0x2a2f33));head.rotation.x=Math.PI/2;head.position.y=1.6;g.add(head);
      const beam=new THREE.Mesh(new THREE.ConeGeometry(1.3,(p.len||5),20,1,true),new THREE.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}));const[dx,dz]=p.dir||[0,1];
      beam.rotation.x=-Math.PI/2;beam.position.set(0,.9,(p.len||5)/2);const bg=new THREE.Group();bg.add(beam);bg.rotation.y=Math.atan2(dx,dz);g.add(bg);p.beam=bg}
    else{const b=new THREE.Mesh(new THREE.BoxGeometry(.4,.5,.25),M2(0x3b3f45));b.position.y=.25;g.add(b);const s=new THREE.Mesh(new THREE.BoxGeometry(.2,.14,.02),new THREE.MeshBasicMaterial({color:0x38e0ff}));s.position.set(0,.36,.13);g.add(s)}
    put(g,p,p)}
  for(const t of S.traps){const g=new THREE.Group();
    if(t.type==='crane'){const a=t.area||[[t.x,t.z]];let cx=0,cz=0;for(const[x,z]of a){cx+=x;cz+=z}cx/=a.length;cz/=a.length;const c=W(cx,cz),base=W(t.x,t.z),y0=topY(G[t.z][t.x]);
      const cm=M2(0xd08a22);const mast=new THREE.Mesh(new THREE.BoxGeometry(.4,4.6,.4),cm);mast.position.set(0,2.3,0);g.add(mast);const L=Math.hypot(c.x-base.x,c.z-base.z);const jib=new THREE.Mesh(new THREE.BoxGeometry(L+.6,.3,.3),cm);jib.position.set(L/2,4.6,0);g.add(jib);
      const cargo=new THREE.Group();const cb=new THREE.Mesh(new THREE.BoxGeometry(1.6,.7,1.6),M2(0x7a6a52,{map:worldTex().planks}));cargo.add(cb);for(const x of[-.5,.5]){const st=new THREE.Mesh(new THREE.BoxGeometry(.08,.72,1.62),M2(0xcc3333));st.position.x=x;cargo.add(st)}
      cargo.position.set(L,3.2,0);g.add(cargo);const cable=new THREE.Mesh(new THREE.BoxGeometry(.03,1.1,.03),M2(0x222222));cable.position.set(L,4.0,0);g.add(cable);t.cargo=cargo;t.cable=cable;t.tgt=target(cargo,.5);g.rotation.y=-Math.atan2(c.z-base.z,c.x-base.x);
      g.position.set(base.x,y0,base.z);g.traverse(o=>{if(o.isMesh){o.castShadow=HI();o.userData.tile=G[t.z][t.x]}});scene.add(g);t.mesh=g;
      // the hook is also tappable from the area centre
      for(const[x,z]of a)G[z][x].trapZone=t;continue}
    if(t.type==='barrels'){for(const[dx,dz]of[[-.18,-.1],[.18,-.1],[0,.18]]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.5,12),M2(0xb32c1f));b.position.set(dx,.25,dz);g.add(b);const s=new THREE.Mesh(new THREE.CylinderGeometry(.165,.165,.08,12),M2(0xf3b33d));s.position.set(dx,.36,dz);g.add(s)}t.tgt=target(g,.75)}
    else if(t.type==='steam'){const v=new THREE.Mesh(new THREE.TorusGeometry(.16,.04,6,14),M2(0xb8322a));v.position.y=.55;g.add(v);const pp=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.6,10),M2(0x5f6b70));pp.position.y=.3;g.add(pp);t.tgt=target(g,.85)}
    else if(t.type==='fuel'){const d=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.6,12),M2(0x3b5b3b));d.position.y=.3;g.add(d);const sp=new THREE.Mesh(new THREE.CircleGeometry(.5,16),M2(0x1a1a1a,{transparent:true,opacity:.6}));sp.rotation.x=-Math.PI/2;sp.position.set(.3,.02,.2);g.add(sp);t.tgt=target(g,.85)}
    else if(t.type==='gantry'){const s=new THREE.Mesh(new THREE.BoxGeometry(.25,1.2,.25),M2(0x6f7a80));s.position.y=.6;g.add(s);const c=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.1),M2(0xcc3333));c.position.set(0,.6,.14);g.add(c)}
    else{const b=new THREE.Mesh(new THREE.BoxGeometry(.4,.5,.25),M2(0x3b3f45));b.position.y=.25;g.add(b);const s=new THREE.Mesh(new THREE.BoxGeometry(.2,.14,.02),new THREE.MeshBasicMaterial({color:0xff7a3a}));s.position.set(0,.36,.13);g.add(s)}
    put(g,t,t)}
  ANIM.push(()=>{for(const t of S.traps)if(t.tgt&&t.tgt.visible)t.tgt.quaternion.copy(cam.quaternion)})}

// ---------- helpers ----------
const trapLive=t=>t&&!t.used;
function trapShot(u,t){if(!u||u.acted||u.down||!TRAP_SHOOT.has(t.type)||!trapLive(t))return 0;const a=G[u.z][u.x],b=G[t.z][t.x],d=Math.hypot(u.x-t.x,u.z-t.z),w=u.weapon;
  if(d>w.range+.01)return 0;if(t.type!=='crane'&&!los(a,b))return 0;return Math.max(10,Math.min(95,Math.round(w.acc-Math.max(0,d-w.opt)*8+(u.team==='p'&&!S.alerted?10:0))))}
const adj=(u,o)=>Math.max(Math.abs(u.x-o.x),Math.abs(u.z-o.z))<=1;
// Actions available to u from points and action traps (for the HUD).
function mechActions(u){const out=[];if(!S.points||u.acted||u.down)return out;
  for(const p of S.points){if(!adj(u,p))continue;
    if(p.type==='supply'&&!p.used){out.push({k:'pt',i:p.i,a:'heal',label:'Heal 30',icon:'cross'});out.push({k:'pt',i:p.i,a:'cool',label:'Refresh',icon:'resupply'})}
    else if(p.type==='searchlight'&&p.on){out.push({k:'pt',i:p.i,a:'work',label:`Hack light +${PT_FAST.searchlight===u.cls?2:1}`,icon:'key'})}
    else if(PT_NEED[p.type]&&!p.used&&p.type!=='searchlight')out.push({k:'pt',i:p.i,a:'work',label:`${p.type==='hatch'?'Repair':'Build'} +${PT_FAST[p.type]===u.cls?2:1}`,icon:'wrench'})}
  for(const t of S.traps){if(!trapLive(t)||TRAP_SHOOT.has(t.type)||!adj(u,t))continue;out.push({k:'trap',i:t.i,label:t.type==='gantry'?'Plant charge':t.type==='flood'?'Open floodgate':t.type==='drawbridge'?'Raise bridge':'Shut shutters',icon:t.type==='gantry'?'grenade':'key'})}
  return out}

// ---------- doing things ----------
async function mechDo(u,act){clearUndo();S.busy=true;
  if(act.k==='pt'){const p=S.points[act.i];await face(u,p.x,p.z);u.acted=true;
    if(p.type==='supply'){if(act.a==='heal'){const h=Math.min(30,u.maxHp-u.hp);u.hp+=h;popup(u,'+'+h,'good');log(`${u.name} patches up at the supply station.`)}else{u.cd={};popup(u,'Ready','good');log(`${u.name} restocks: abilities ready.`)}p.used=true;if(p.lamp)p.lamp.material.color.set(0x444444);updBar(u)}
    else{const k='pt:'+p.i,add=PT_FAST[p.type]===u.cls?2:1;S.prog[k]=(S.prog[k]||0)+add;popup(u,`${Math.min(S.prog[k],PT_NEED[p.type])}/${PT_NEED[p.type]}`,'good');
      if(S.prog[k]>=PT_NEED[p.type]){p.used=true;
        if(p.type==='searchlight'){p.on=false;if(p.beam)p.beam.visible=false;log('The searchlight goes dark.')}
        if(p.type==='hatch'){const[x,z]=p.ladder;G[z][x].ladder=true;mechBuildLadder(G[z][x]);log('The ladder drops down. Anyone can climb it now.')}
        if(p.type==='bridge'){for(const[x,z]of p.tiles){const t=G[z][x];t.type='floor';t.obj=null;tileMesh(t)}log('The bridge is across. Heavies can cross it.')}
        if(p.type==='zipanchor'){const[x1,z1,x2,z2]=p.zip;S.zips.push({x1,z1,x2,z2});mechBuildZip(S.zips[S.zips.length-1]);log('The zipline is rigged.')}
        sfx('good')}}
    S.credit[u.op.id]=(S.credit[u.op.id]||0)+1;S.busy=false;afterOrder();return}
  if(act.k==='trap'){const t=S.traps[act.i];await face(u,t.x,t.z);u.acted=true;await trapFire(t,u);S.busy=false;afterOrder()}}

async function trapFire(t,by){if(!trapLive(t))return;t.used=true;if(t.tgt)t.tgt.visible=false;const who=by?(by.team==='p'?by.name:'The enemy'):'Something';
  const hitArea=(area,n,knock)=>{for(const[x,z]of area){for(const v of units){if(v.gone||v.down||v.x!==x||v.z!==z)continue;damage(v,n,by);if(knock&&!v.down&&v.cls!=='turret'){v.stun=Math.max(v.stun||0,1);popup(v,'Knocked down','hurt')}}}};
  if(t.type==='crane'){banner('Cargo drop!',by&&by.team==='e'?'enemy':'');log(`${who} shoots the hook. The cargo drops!`);const c=t.cargo,y0=c.position.y,yb=.35;await tween(420,k=>{c.position.y=y0-(y0-yb)*k*k});if(t.cable)t.cable.visible=false;shake(.35);
    const ctr=t.area.reduce((a,[x,z])=>[a[0]+x/4,a[1]+z/4],[0,0]);puff(W(ctr[0],ctr[1]),10,0x9a8f80,1.4);hitArea(t.area,45,true);const[cx,cz]=t.crate||t.area[0];const ct=G[cz][cx];
    for(const[x,z]of t.area)G[z][x].trapZone=null;if(!units.some(v=>!v.gone&&v.x===cx&&v.z===cz&&!v.down)){ct.obj='crate';ct.cargoCrate=true}sfx('boom',W(ctr[0],ctr[1]))}
  else if(t.type==='barrels'){log(`${who} sets off the barrels!`);await explode(G[t.z][t.x],false);if(t.mesh)t.mesh.visible=false;G[t.z][t.x].obj=null;hitArea(trapArea(t),40,false);
    for(const o of S.traps)if(o!==t&&o.type==='barrels'&&trapLive(o)&&Math.max(Math.abs(o.x-t.x),Math.abs(o.z-t.z))<=1){await sleep(150);await trapFire(o,by)}}
  else if(t.type==='steam'||t.type==='fuel'){const area=trapArea(t),kind=t.type;log(kind==='steam'?`${who} bursts the steam valve!`:`${who} lights the fuel spill!`);sfx(kind==='steam'?'hit':'boom',W(t.x,t.z));
    const meshes=area.map(([x,z])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.95,kind==='steam'?1.6:.25,.95),new THREE.MeshBasicMaterial({color:kind==='steam'?0xeef4f6:0xff7a2a,transparent:true,opacity:kind==='steam'?.55:.5,depthWrite:false}));const p=W(x,z);m.position.set(p.x,topY(G[z][x])+(kind==='steam'?.8:.12),p.z);scene.add(m);if(kind==='steam')G[z][x].smoke=true;return m});
    S.hazards.push({kind,area,turns:2,dmg:kind==='steam'?15:18,meshes})}
  else if(t.type==='gantry'){log(`${who} blows the gantry support!`);await explode(G[t.z][t.x],false);for(const[x,z]of t.tiles){const tl=G[z][x],drop=Math.max(0,tl.h-1);for(const v of units)if(!v.gone&&v.x===x&&v.z===z){damage(v,25,by);if(!v.down){v.stun=Math.max(v.stun||0,1);popup(v,'Fell','hurt')}}
      tl.h=drop;if(tl.mesh)tileGroup.remove(tl.mesh);tileMesh(tl);for(const v of units)if(!v.gone&&v.x===x&&v.z===z)place(v)}}
  else if(t.type==='flood'){log(`${who} opens the floodgate! The channel floods.`);const meshes=t.tiles.map(([x,z])=>{G[z][x].flood=true;const m=new THREE.Mesh(new THREE.BoxGeometry(.98,.3,.98),new THREE.MeshLambertMaterial({color:0x2f8fae,transparent:true,opacity:.7}));const p=W(x,z);m.position.set(p.x,topY(G[z][x])+.15,p.z);scene.add(m);return m});
    for(const v of units){if(v.gone||v.down||!G[v.z][v.x].flood)continue;damage(v,10,by);const f=mechFreeNear(v);if(f){v.x=f.x;v.z=f.z;place(v);popup(v,'Washed out','hurt')}}
    S.hazards.push({kind:'flood',area:t.tiles,turns:3,dmg:0,meshes})}
  else if(t.type==='drawbridge'){log(`${who} raises the drawbridge. No more boats can land there.`);sfx('build',W(t.x,t.z));S.noReinf=true;for(const[x,z]of t.tiles){const tl=G[z][x];for(const v of units)if(!v.gone&&!v.down&&v.x===x&&v.z===z){const f=mechFreeNear(v);if(f){v.x=f.x;v.z=f.z;place(v)}}tl.type='gap';if(tl.mesh)tileGroup.remove(tl.mesh)}}
  else if(t.type==='shutter'){log(`${who} slams the shutters shut.`);sfx('build',W(t.x,t.z));for(const[x,z]of t.tiles){const tl=G[z][x];if(units.some(v=>!v.gone&&v.x===x&&v.z===z))continue;tl.obj='crate';tl.shutter=true;const m=new THREE.Mesh(new THREE.BoxGeometry(.98,1.3,.2),new THREE.MeshLambertMaterial({color:0x5a6066}));const p=W(x,z);m.position.set(p.x,topY(tl)+.65,p.z);scene.add(m)}}
  computeVis();applyFog();refresh()}
function mechFreeNear(v){let best=null;for(let r=1;r<4&&!best;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){const t=tileAt(v.x+dx,v.z+dz);if(t&&t.type!=='water'&&t.type!=='gap'&&!t.obj&&!t.flood&&!unitAt(t.x,t.z)&&(!best||Math.hypot(dx,dz)<best.d))best={x:t.x,z:t.z,d:Math.hypot(dx,dz)}}return best}
function mechBuildLadder(t){mechLadder(t)}
function mechBuildZip(zp){const a=W(zp.x1,zp.z1),b=W(zp.x2,zp.z2);a.y=topY(G[zp.z1][zp.x1])+1.5;b.y=topY(G[zp.z2][zp.x2])+1.1;const mid=a.clone().lerp(b,.5);mid.y-=.35;scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a,mid,b),24,.018,5,false),new THREE.MeshLambertMaterial({color:0x2a2a2a})))}

// End of each side's turn: hazards tick, the searchlight spots and calls.
function mechTurnTick(team){if(!S.hazards)return;
  for(const h of S.hazards){if(h.dmg)for(const[x,z]of h.area)for(const v of units)if(!v.gone&&!v.down&&v.team===team&&v.x===x&&v.z===z){damage(v,h.dmg,null);popup(v,h.kind==='steam'?'Scalded':'Burned','hurt')}}
  if(team==='e')for(const h of S.hazards){h.turns--;if(h.turns<=0){for(const m of h.meshes)scene.remove(m);for(const[x,z]of h.area){G[z][x].smoke=false;G[z][x].flood=false}}}
  S.hazards=S.hazards.filter(h=>h.turns>0)}
// Defending (Lockdown), the searchlights are yours: their beams light up attackers.
function mechBeamVis(vis){if(!M||!M.defend||!S.points)return;for(const p of S.points)if(p.type==='searchlight'&&p.on)for(const[x,z]of beamTiles(p))vis.add(key(x,z))}
function mechSpotCheck(){if(!S.points||M.defend)return;for(const p of S.points){if(p.type!=='searchlight'||!p.on)continue;const beam=beamTiles(p);
  for(const v of squad()){if(v.down||v.disg>0)continue;if(beam.some(([x,z])=>x===v.x&&z===v.z)){if(!S.alerted)alarm(`${v.name} was caught in the searchlight`);else log(`${v.name} is in the searchlight beam.`);
    if(!S.slCalled){S.slCalled=true;const sp=mechFreeNear({x:p.x,z:p.z});if(sp){const e=spawnEnemy('trooper',sp.x,sp.z,S.R);e.fresh=true;log('The searchlight calls in reinforcements.')}}return}}}}
// Enemy AI: set off a trap if it would catch your squad and none of theirs.
async function mechEnemyTraps(){if(!S.traps)return;for(const t of S.traps){if(!trapLive(t))continue;const area=trapArea(t);
  const mine=squad().filter(v=>!v.down&&area.some(([x,z])=>x===v.x&&z===v.z)).length,theirs=living('e').filter(v=>area.some(([x,z])=>x===v.x&&z===v.z)).length;if(!mine||theirs)continue;
  if(TRAP_SHOOT.has(t.type)){const sh=living('e').filter(e=>e.cls!=='turret'&&!e.acted&&e.seen!==undefined).map(e=>({e,c:trapShot(e,t)})).filter(o=>o.c>0).sort((a,b)=>b.c-a.c)[0];
    if(sh&&Math.random()<.65){sh.e.acted=true;await face(sh.e,t.x,t.z);const hit=Math.random()*100<sh.c;if(sh.e.group){sh.e.group.visible=true}if(hit)await trapFire(t,sh.e);else log('The enemy shoots at a trap and misses.')}}
  else{const e=living('e').find(e=>e.cls!=='turret'&&!e.acted&&adj(e,t));if(e){e.acted=true;await trapFire(t,e)}}}}
// Player shot at a trap.
async function fireAtTrap(u,t){const c=trapShot(u,t);if(!c)return;clearUndo();S.busy=true;refresh();await face(u,t.x,t.z);const hit=Math.random()*100<c;
  sfx(u.wkey==='shotgun'?'shotgun':'shot',u.group.position);u.acted=true;u.disg=0;alarm(`${u.name} opened fire`);if(hit)await trapFire(t,u);else{log(`${u.name} missed the ${TRAP_INFO[t.type][0].toLowerCase()}.`)}S.busy=false;afterOrder()}
// Red danger area for a trap, shown while aiming or on long-press.
function mechShowArea(t){if(!hl)return;for(const[x,z]of trapArea(t)){const tl=tileAt(x,z);if(tl&&tl.type!=='water')hlTile(tl,0xff3b2a,.4)}}

/* ===================== Civilians =====================
   Unarmed people on the soldier rig in muted clothes and no weapon:
   refugees in shanty areas, workers and technicians in Security areas.
   They wander until the first shot or the alarm, then run for the map edge
   or hide behind cover. Missed shots whose line passes one may hit them,
   and blasts and traps do. Hit civilians go down and stay down, with no
   penalty to the player. They block movement. Counts: about 6 to 10 in
   shanty areas, 2 to 4 in Security areas, in between on the industrial
   decks, halved on Low graphics. A mission can set civ:n. */
function civCount(){const th=THEME_OF[M.id]||'container',R=S.R||Math.random;let n=M.civ!=null?M.civ:th==='container'?6+Math.floor(R()*5):th==='founders'?2+Math.floor(R()*3):4+Math.floor(R()*3);return HI()?n:Math.ceil(n/2)}
function spawnCivilians(info){const n=civCount();if(!n)return;const th=THEME_OF[M.id]||'container',R=rng((M.id||'c').charCodeAt(1)*53+NX),sec=th==='founders';
  const spawns=info.spawns||[],cand=[];for(const row of G)for(const t of row){if(t.type!=='floor'||t.obj||t.flood||t.cp||t.trap||t.point||t.zone||t.exit)continue;if(spawns.some(s=>Math.max(Math.abs(s.x-t.x),Math.abs(s.z-t.z))<4))continue;if(unitAt(t.x,t.z))continue;cand.push(t)}
  for(let i=0;i<n&&cand.length;i++){const t=cand.splice(Math.floor(R()*cand.length),1)[0];const fac=sec?'security':'resistance';
    const look=LOOK({faction:fac,body:R()<.2?'light':'medium',cls:'soldier',weapon:'rifle',skin:Math.floor(R()*6),hairCol:Math.floor(R()*7),face:['long','square','angular','broad'][Math.floor(R()*4)],facial:['none','stubble','beard','none'][Math.floor(R()*4)],hair:['buzz','crop','shaved','slick','dreads','topknot'][Math.floor(R()*6)],
      headgear:sec?['none','cap','headset'][Math.floor(R()*3)]:['none','beanie','bandana','none'][Math.floor(R()*4)],facegear:sec?'none':['none','mask','none'][Math.floor(R()*3)],armour:'none',top:['tee','long','hoodie','jacket'][Math.floor(R()*4)],primary:sec?[2,5,1][Math.floor(R()*3)]:[1,3,5][Math.floor(R()*3)],secondary:sec?[5,1][Math.floor(R()*2)]:[3,5,1][Math.floor(R()*3)],gloves:'none'});
    const c=newUnit({team:'c',cls:'civ',type:'civ',name:sec?['Technician','Worker','Clerk'][i%3]:['Refugee','Dock worker','Trader'][i%3],short:'Civilian',body:look.body,hp:30,maxHp:30,move:3,vis:0,weapon:{name:'none',dmg:0,range:0,acc:0,opt:0},x:t.x,z:t.z,look,wkey:'rifle'});
    units.push(c);makeUnitMesh(c);if(c.rig&&c.rig.gun)c.rig.gun.visible=false;if(c.el)c.el.classList.add('civ');if(c.ringMesh)c.ringMesh.visible=false;c.group.rotation.y=R()*6.28}}
// Their turn: wander while it's quiet, flee or hide once the shooting starts.
async function civTurn(){const cs=units.filter(u=>u.cls==='civ'&&!u.down&&!u.gone);if(!cs.length)return;const fighters=units.filter(u=>!u.gone&&!u.down&&(u.team==='p'||u.team==='e')&&u.cls!=='bot');
  for(const c of cs){const r=reach(c,S.alerted?4:2);let best=null,bs=-1e9;
    for(const k of r.d.keys()){const[x,z]=k.split(',').map(Number);const t=G[z][x];if(t.flood||t.trapZone)continue;
      if(!S.alerted){const s=Math.random();if(s>bs){bs=s;best=[x,z]}continue}
      let near=99;for(const f of fighters)near=Math.min(near,Math.hypot(f.x-x,f.z-z));const edge=Math.min(x,z,NX-1-x,NZ-1-z);let cover=0;for(const f of fighters)cover+=coverOf(t,G[f.z][f.x]);
      const s=near*1.2+cover*.6-edge*.8;if(s>bs){bs=s;best=[x,z]}}
    if(!best||(best[0]===c.x&&best[1]===c.z))continue;const path=pathTo(r,best[0],best[1]);if(!path.length)continue;
    if(c.group.visible&&S.vis.has(key(best[0],best[1])))await moveAlong(c,path);else{c.x=best[0];c.z=best[1];place(c)}
    if(S.alerted&&Math.min(c.x,c.z,NX-1-c.x,NZ-1-c.z)===0){c.gone=true;c.group.visible=false;if(c.el)c.el.remove()}}
  applyFog()}
// A missed shot may hit a civilian standing on the line of fire.
function civStray(a,b){const cs=units.filter(u=>u.cls==='civ'&&!u.down&&!u.gone);if(!cs.length)return;const dx=b.x-a.x,dz=b.z-a.z,steps=Math.ceil(Math.hypot(dx,dz)*3);
  for(let i=1;i<steps;i++){const t=i/steps,x=Math.round(a.x+dx*t),z=Math.round(a.z+dz*t);const c=cs.find(u=>u.x===x&&u.z===z);if(c&&Math.random()<.5){damage(c,Math.round(a.weapon.dmg*.8),null);log('A stray shot hits a civilian.');return}}}

/* ---------- the prisoner (Breakout) ----------
   Mara Quill, a Resistance organiser held in the island prison. She joins
   the squad when the getaway starts, with a scavenged SMG and a light
   body. She can't redeploy: if she stays down for 3 turns, the breakout
   fails. She isn't in your roster, so she earns no experience. */
function spawnPrisoner(){const sp=S.info.spawns.find(t=>!unitAt(t.x,t.z))||mechFreeNear(S.info.spawns[0]);if(!sp)return;
  const look=LOOK({name:'Mara Quill',callsign:'Undertow',faction:'resistance',body:'light',cls:'operative',weapon:'smg',skin:3,face:'long',expr:'grim',facial:'none',mark:'scar',hair:'topknot',hairCol:5,headgear:'none',facegear:'none',top:'long',armour:'none',legs:'cargo',gloves:'fingerless',primary:5,secondary:3});
  const w=WPN.smg,op={id:'prisoner',guest:true,look,name:'Mara Quill',xp:0,perks:[]};
  const u=newUnit({op,team:'p',name:'Mara Quill',short:'Mara',cls:'operative',body:'light',lvl:2,hp:80,maxHp:80,move:7,vis:7,weapon:{...w},x:sp.x,z:sp.z,look,wkey:'smg',perks:new Set()});
  units.push(u);makeUnitMesh(u);S.prisoner=u;banner('Mara Quill joins you');log('Mara Quill is out and armed. Get her to the boats. She can’t redeploy, so keep her alive.')}
