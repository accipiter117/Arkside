/* ===================== MECHANICS: climbing and parkour (overhaul stage D) =====================
   Movement by body type, from references/4-map-drafts.html:

   Feature                          Light      Medium                 Heavy
   Ladder, one level                1 move     1 move                 2 moves
   Climb step (marked ledge)        1 move     1 move                 2 moves (mantle)
   Climb one level, anywhere        1 move     2 moves (Climber 1)    2 moves (mantle)
   Wall climb, two levels           2 moves    3 moves (Climber 2)    No
   Vault rail                       Free       1 move                 Walk round
   Gap jump, one tile (or a one-    1 move     2 moves, marked 1      No
     tile water channel, on maps
     with channels: true)
     (ledge grab: may land one level up or down)
   Zipline, one way                 1 move     1 move                 No
   Drop down                        Three      Three (drop roll)      Two levels
   Shoulder charge (barricade,      No         No                     2 moves (Breacher 1):
     sheet wall)                                                      smashes it flat
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

// Who can use the parkour moves at all (not civilians, bots or turrets).
const freeRunner=u=>u.cls!=='civ'&&u.cls!=='bot'&&u.body!=='turret';
// Flimsy cover a heavy can shoulder-charge through: barricades and sheet walls.
const smashable=t=>t.obj==='wall'||t.obj==='sheet';
// Cost of one orthogonal step from a to b for unit u, or 0 if not allowed.
function moveCost(u,a,b){if(b.type==='water'||b.type==='gap'||b.flood)return 0;const up=b.h-a.h,P=u.perks,fr=freeRunner(u);
  if(b.obj){// heavies charge straight through flimsy cover on the same level
    if(fr&&u.body==='heavy'&&smashable(b)&&Math.abs(up)<=.5)return P&&P.has('breacher')?1:2;return 0}
  if(b.pass==='light'&&u.body!=='light')return 0;if(b.pass==='nonheavy'&&u.body==='heavy')return 0;
  if(Math.abs(up)<=.5)return 1;
  if(up>0){// ladder: any body, per level
    if(b.ladder){const lv=Math.ceil(up-.01);return u.body==='heavy'?2*lv:lv}
    if(!fr)return 0;
    if(u.body==='heavy')return up<=1?2:0;// mantle one level
    if(up<=1){if(b.step)return 1;return(u.body==='light'||(P&&P.has('climber')))?1:2}
    if(up<=2){if(u.body==='light')return P&&P.has('parkour')?1:2;return P&&P.has('climber')?2:3}// wall-hop or wall climb
    return 0}
  const dn=-up;if(dn<=1)return 1;if(dn<=2&&(fr||u.body!=='heavy'))return 1;if(dn<=3&&fr&&u.body!=='heavy')return 1;// drop roll
  if(a.ladder||b.ladder)return u.body==='heavy'?2*Math.ceil(dn-.01):Math.ceil(dn-.01);return 0}

// Extra links from (x,z): vaults, gap jumps and ziplines. [nx,nz,cost,kind]
function moveLinks(u,x,z){const out=[],a=G[z][x];if(!freeRunner(u))return out;
  for(const[dx,dz]of D4){const m=tileAt(x+dx,z+dz),b=tileAt(x+2*dx,z+2*dz);if(!m||!b)continue;
    if(b.type==='water'||b.type==='gap'||b.obj)continue;if(b.pass==='light'&&u.body!=='light')continue;if(b.pass==='nonheavy'&&u.body==='heavy')continue;const dh=b.h-a.h;
    if(m.obj==='rail'&&Math.abs(m.h-a.h)<=.5&&Math.abs(dh)<=.5){if(u.body==='light')out.push([b.x,b.z,2,'vault']);else if(u.body==='medium')out.push([b.x,b.z,3,'vault'])}
    // gap jump (or across a one-tile water channel); a ledge grab lands up to one level higher or lower
    if((m.type==='gap'||(m.type==='water'&&M.channels&&!m.flood&&Math.abs(m.h-a.h)<=.5))&&Math.abs(dh)<=1){if(u.body==='light')out.push([b.x,b.z,2,'jump']);else if(u.body==='medium')out.push([b.x,b.z,(m.markedGap?2:3)+(dh>.5?1:0),'jump'])}}
  // drain tunnels: any build, either way, out of sight
  for(const tn of S.tunnels||[]){let ex=null;if(tn.x1===x&&tn.z1===z)ex=[tn.x2,tn.z2];else if(tn.x2===x&&tn.z2===z)ex=[tn.x1,tn.z1];if(ex){const b=G[ex[1]][ex[0]];if(b&&!b.obj)out.push([ex[0],ex[1],2+Math.ceil((Math.abs(ex[0]-x)+Math.abs(ex[1]-z))/8),'tunnel'])}}
  if(u.body!=='heavy')for(const zp of S.zips||[])if(zp.x1===x&&zp.z1===z){const b=G[zp.z2][zp.x2];if(b&&!b.obj)out.push([zp.x2,zp.z2,1,'zip'])}
  return out}
// Vault and gap costs above include the tile walked into (2 = one step plus
// the free vault for lights; 3 = one step plus 1 for mediums; a medium's
// ledge grab onto a higher landing costs 1 more).

// Shoulder charge: a heavy stepping into a barricade or sheet wall smashes it
// flat (the tile becomes open floor, so the cover is gone for both sides).
function mechSmash(u,t,show){if(!smashable(t))return;const kind=t.obj==='sheet'?'sheet wall':'barricade';
  if(t.objMesh){tileGroup.remove(t.objMesh);t.objMesh=null}t.obj=null;t.fort=false;t.built=null;
  if(show){const p=W(t.x,t.z);p.y=topY(t)+.4;burst(p,14,t.sheetCol||0x8a7a66,2.4,.7,-7,1.3,.8);sfx('debris',p);sfx('boom',p);shake(.18);
    if(u.rig)u.rig.once('Punch',1.4/SPD);log(`${u.team==='p'?u.name:'An enemy heavy'} charges through the ${kind}.`)}
  else log(`You hear something heavy smash through a ${kind}.`)}


// ---------- markers on the map ----------
let MECH_TX=null;
function mechTex(){if(MECH_TX)return MECH_TX;MECH_TX={};
  const chev=col=>cvTex((g,s)=>{g.clearRect(0,0,s,s);g.fillStyle=col;for(let i=0;i<2;i++){const o=i*s*.34;g.beginPath();g.moveTo(s*.16,s*.26+o);g.lineTo(s*.5,s*.1+o);g.lineTo(s*.84,s*.26+o);g.lineTo(s*.84,s*.42+o);g.lineTo(s*.5,s*.26+o);g.lineTo(s*.16,s*.42+o);g.closePath();g.fill()}});
  MECH_TX.smash=cvTex((g,s)=>{g.clearRect(0,0,s,s);g.translate(s/2,s/2);g.fillStyle='#ff7a3a';g.strokeStyle='#2a1208';g.lineWidth=5;g.beginPath();for(let i=0;i<16;i++){const r=i%2?s*.18:s*.44,a=i/16*Math.PI*2;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.stroke();g.fill();g.fillStyle='#fff3d0';g.beginPath();g.arc(0,0,s*.1,0,7);g.fill()});
  MECH_TX.chev=chev('#f3b33d');MECH_TX.chevW=chev('#f4f6f8');MECH_TX.chevC=chev('#5fe8ff');
  return MECH_TX}
// Permanent chevrons on climbable edges, rails, gaps, vents and ziplines. Off since update 18 (too busy to look at);
// the move preview still shows jump arcs and climb markers for the selected unit.
let MECH_MARKS=false;
function mechDecal(x,z,y,rot,sz=.7,tex='chev'){if(!MECH_MARKS)return null;const d=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshLambertMaterial({map:mechTex()[tex],transparent:true,depthWrite:false}));d.rotation.x=-Math.PI/2;d.rotation.z=rot;const p=W(x,z);d.position.set(p.x,y+.02,p.z);scene.add(d);return d}
// Move preview mark on a barricade or sheet wall a heavy can charge through.
function smashMark(t){const p=W(t.x,t.z),m=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshBasicMaterial({map:mechTex().smash,transparent:true,depthTest:false}));m.rotation.x=-Math.PI/2;m.position.set(p.x,topY(t)+(t.obj==='sheet'?1.45:.62),p.z);m.renderOrder=5;m.userData.tile=t;hl.add(m)}
// Ladders, rails, step chevrons, gap edges and zipline cables.
function mechBuild(){if(!scene)return;const lad=new THREE.MeshLambertMaterial({color:0xd4a52a}),railM=new THREE.MeshLambertMaterial({color:0xe2b21f});
  for(const row of G)for(const t of row){const p=W(t.x,t.z);
    if(t.ladder)mechLadder(t);
    if(t.step){let lo=null;for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.h<t.h&&!n.obj&&(!lo||n.h<lo.n.h))lo={n,dx,dz}}mechDecal(t.x,t.z,topY(t),lo?Math.atan2(-lo.dx,lo.dz):0)}
    if(t.obj==='rail'){const g=new THREE.Group(),y=topY(t);const bar=new THREE.Mesh(new THREE.BoxGeometry(.9,.07,.07),railM);bar.position.y=.5;g.add(bar);for(const x of[-.42,.42]){const q=new THREE.Mesh(new THREE.BoxGeometry(.07,.5,.07),railM);q.position.set(x,.25,0);g.add(q)}
      let ax=0;for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.obj==='rail'){ax=dx?0:Math.PI/2;break}}const n1=tileAt(t.x+1,t.z),n2=tileAt(t.x-1,t.z);if(!(n1&&n1.obj==='rail')&&!(n2&&n2.obj==='rail')){const nz=tileAt(t.x,t.z+1);if(nz&&nz.type!=='water'&&!nz.obj)ax=0}
      g.rotation.y=ax;g.position.set(p.x,y,p.z);g.traverse(o=>{if(o.isMesh){o.castShadow=HI();o.userData.tile=t}});scene.add(g);mechDecal(t.x,t.z,y,ax+Math.PI/2,.55)}
    if(t.type==='gap'){for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.type!=='gap'&&n.type!=='water'&&!n.obj)mechDecal(n.x,n.z,topY(n),Math.atan2(dx,-dz),t.markedGap?.5:.42,t.markedGap?'chev':'chevW')}}
    if(t.pass==='light'){for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.type==='floor'&&!n.obj&&!n.pass&&Math.abs(n.h-t.h)<=.5)mechDecal(n.x,n.z,topY(n),Math.atan2(-dx,dz),.5,'chevC')}}}
  for(const zp of S.zips||[])mechBuildZip(zp)}

// The lower neighbour a ladder or climb step is used from (the lowest open one), shared with tileMesh so railings open there.
function mechLowSide(t){let lo=null;for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.type!=='water'&&n.type!=='gap'&&!n.obj&&n.h<t.h&&(!lo||n.h<lo.n.h))lo={n,dx,dz}}return lo}
let MECH_LAD=null;
function mechLadder(t){const p=W(t.x,t.z),lad=MECH_LAD||(MECH_LAD={stile:new THREE.MeshLambertMaterial({color:0x2f3338}),rung:new THREE.MeshLambertMaterial({color:0xf2c230}),cap:new THREE.MeshLambertMaterial({color:0xf2c230})});const lo=mechLowSide(t);
      if(lo){const h=topY(t)-topY(lo.n),g=new THREE.Group();
        // steel stiles with yellow rungs, flush against the face, and a hoop over the top edge you can read from any angle
        for(const sx of[-.21,.21]){const r=new THREE.Mesh(new THREE.BoxGeometry(.07,h+.5,.07),lad.stile);r.position.set(sx,(h+.5)/2-.02,0);g.add(r);const hoop=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.5),lad.stile);hoop.position.set(sx,h+.46,-.25);g.add(hoop)}
        for(let y=.2;y<h+.2;y+=.24){const r=new THREE.Mesh(new THREE.BoxGeometry(.42,.06,.08),lad.rung);r.position.set(0,y,.01);g.add(r)}
        const bar=new THREE.Mesh(new THREE.BoxGeometry(.49,.06,.06),lad.cap);bar.position.set(0,h+.46,-.5);g.add(bar);
        mechDecal(lo.n.x,lo.n.z,topY(lo.n),Math.atan2(-lo.dx,lo.dz),.5);
        g.position.set(p.x+lo.dx*.5,topY(lo.n),p.z+lo.dz*.5);g.rotation.y=Math.atan2(lo.dx,lo.dz);g.traverse(o=>{if(o.isMesh){o.castShadow=HI();o.userData.tile=t}});scene.add(g)}}
// Move preview: a dotted arc from where a jump, vault or zipline starts to
// where it lands, drawn with the blue move tiles before you commit.
function mechArcs(r){for(const[k,kind]of r.kind){const pk=r.prev.get(k);if(!pk)continue;const[ax,az]=pk.split(',').map(Number),[bx,bz]=k.split(',').map(Number);
  const a=W(ax,az),b=W(bx,bz);a.y=topY(G[az][ax])+.12;b.y=topY(G[bz][bx])+.12;const pts=[],H=kind==='zip'?-.2:.55;
  for(let i=0;i<=16;i++){const t=i/16,v=a.clone().lerp(b,t);v.y+=Math.sin(t*Math.PI)*H+(kind==='zip'?(1.4*(1-t)+1*t):0);pts.push(v)}
  if(kind==='tunnel'){for(const v of pts){v.y=Math.min(a.y,b.y)+.06}}const g=new THREE.BufferGeometry().setFromPoints(pts),l=new THREE.Line(g,new THREE.LineDashedMaterial({color:kind==='zip'?0x7fe8ff:kind==='tunnel'?0xb08aff:0xf3b33d,dashSize:.08,gapSize:.06}));l.computeLineDistances();hl.add(l)}}

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
  else if(t.type==='barrels'){log(`${who} sets off the barrels!`);await explode(G[t.z][t.x],false);if(t.mesh)t.mesh.visible=false;G[t.z][t.x].obj=null;S.dmgKind='blast';hitArea(trapArea(t),40,false);S.dmgKind=null;
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
function mechBuildZip(zp){const ta=G[zp.z1][zp.x1],tb=G[zp.z2][zp.x2],ca=W(zp.x1,zp.z1),cb=W(zp.x2,zp.z2);const dir=cb.clone().sub(ca).setY(0).normalize();
  // the start post stands at the back of the start tile (behind the rider), the landing post just beyond the landing tile; the cable runs post top to post top
  const a=ca.clone().addScaledVector(dir,-.38);a.y=topY(ta)+1.75;const b=cb.clone().addScaledVector(dir,.38);b.y=topY(tb)+1.25;const mid=a.clone().lerp(b,.5);mid.y-=.3;
  const cable=new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a,mid,b),28,.035,7,false),new THREE.MeshLambertMaterial({color:0xb8c0c6}));cable.castShadow=HI();scene.add(cable);
  const postM=new THREE.MeshLambertMaterial({color:0xe2b21f}),capM=new THREE.MeshLambertMaterial({color:0x2f3338});
  for(const[v,t]of[[a,ta],[b,tb]]){const hgt=v.y-topY(t);const post=new THREE.Mesh(new THREE.BoxGeometry(.11,hgt,.11),postM);post.position.set(v.x,topY(t)+hgt/2,v.z);post.castShadow=HI();scene.add(post);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(.2,.1,.2),capM);cap.position.set(v.x,v.y,v.z);scene.add(cap);const foot=new THREE.Mesh(new THREE.BoxGeometry(.28,.06,.28),capM);foot.position.set(v.x,topY(t)+.03,v.z);scene.add(foot)}
  const pul=new THREE.Group();const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.06,10),capM);wheel.rotation.x=Math.PI/2;wheel.rotation.z=Math.atan2(dir.x,dir.z)+Math.PI/2;pul.add(wheel);const hdl=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.05),new THREE.MeshLambertMaterial({color:0xf2c230}));hdl.position.y=-.2;hdl.rotation.y=Math.atan2(dir.x,dir.z)+Math.PI/2;pul.add(hdl);
  const pp=a.clone().lerp(b,.08);pp.y-=.02;pul.position.copy(pp);scene.add(pul);
  mechDecal(zp.x1,zp.z1,topY(ta),Math.atan2(zp.x2-zp.x1,-(zp.z2-zp.z1)),.55,'chevC')}
// Briefing line listing the routes a map offers (counted from its layers, so it stays honest).
function routesLine(m){const feat=m.feat||[],map=m.map||[],h=m.h||[];let lad=0,st=0,rail=0,gap=0,tow=0,vent=0;
  for(let z=0;z<map.length;z++)for(let x=0;x<map[z].length;x++){const c=(feat[z]||'')[x]||'.';if(c==='L'){lad++;if(+((h[z]||'')[x]||0)>=4)tow++}if(c==='s')st++;if(c==='r')rail++;if(c==='_'||c==='=')gap++;if(map[z][x]==='n')vent++}
  const zips=(m.zips||[]).length,anch=(m.points||[]).filter(p=>p.type==='zipanchor').length,parts=[];
  if(zips)parts.push(`${zips} zipline${zips>1?'s':''}${anch?` (+${anch} to rig)`:''}`);if(vent)parts.push(`crawl vents (${vent} tiles)`);if(tow)parts.push(`${tow} perch${tow>1?'es':''}`);if(lad)parts.push(`${lad} ladders`);if(st)parts.push('climb steps');if(rail)parts.push('vault rails');if(gap)parts.push(`${gap} gap jump${gap>1?'s':''}`);
  return parts.length?`<div class="brief rv-brief routes">Routes: ${parts.join(' · ')}</div>`:''}

// End of each side's turn: hazards tick, the searchlight spots and calls.
function mechTurnTick(team){if(!S.hazards)return;
  for(const h of S.hazards){if(h.dmg)for(const[x,z]of h.area)for(const v of units)if(!v.gone&&!v.down&&v.team===team&&v.x===x&&v.z===z){S.dmgKind='blast';damage(v,h.dmg,null);S.dmgKind=null;popup(v,h.kind==='steam'?'Scalded':'Burned','hurt')}}
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
   They stream across the map from the far side towards their own faction's
   edge (refugees to the Resistance end, citizens to the Security end), new
   ones arriving at the start while the count is under the cap, and leave
   when they reach the far end. Once shooting starts they keep clear of
   fighters. Missed shots whose line passes one may hit them,
   and blasts and traps do. Hit civilians go down and stay down, with no
   penalty unless they are your own faction's people (small XP cut). Units
   walk through them but can't stop on them. Cap: about 6 to 10 in
   shanty areas, 2 to 4 in Security areas, in between on the industrial
   decks, halved on Low graphics. A mission can set civ:n. */
function civCount(){const th=THEME_OF[M.id]||'container',R=S.R||Math.random;let n=M.civ!=null?M.civ:th==='container'?6+Math.floor(R()*5):th==='founders'?2+Math.floor(R()*3):4+Math.floor(R()*3);return HI()?n:Math.ceil(n/2)}
function civFaction(){return (THEME_OF[M.id]||'container')==='founders'?'security':'resistance'}
function civLook(i,R){const sec=civFaction()==='security';const look=LOOK({faction:civFaction(),sex:R()<.5?'female':'male',body:R()<.2?'light':'medium',cls:'soldier',weapon:'rifle',skin:Math.floor(R()*6),hairCol:Math.floor(R()*7),face:['long','square','angular','broad'][Math.floor(R()*4)],facial:['none','stubble','beard','none'][Math.floor(R()*4)],hair:['buzz','crop','shaved','slick','dreads','topknot'][Math.floor(R()*6)],
    headgear:sec?['none','cap','headset'][Math.floor(R()*3)]:['none','beanie','bandana','none'][Math.floor(R()*4)],facegear:sec?'none':['none','mask','none'][Math.floor(R()*3)],armour:'none',top:['tee','long','hoodie','jacket'][Math.floor(R()*4)],primary:sec?[2,5,1][Math.floor(R()*3)]:[1,3,5][Math.floor(R()*3)],secondary:sec?[5,1][Math.floor(R()*2)]:[3,5,1][Math.floor(R()*3)],gloves:'none'});
  return{look,name:sec?['Technician','Worker','Clerk'][i%3]:['Refugee','Dock worker','Trader'][i%3]}}
function civSpawnAt(t,R){const i=S.civN=(S.civN||0)+1,{look,name}=civLook(i,R);
  const c=newUnit({team:'c',cls:'civ',type:'civ',name,short:'Civilian',body:look.body,hp:30,maxHp:30,move:4,vis:0,weapon:{name:'none',dmg:0,range:0,acc:0,opt:0},x:t.x,z:t.z,look,wkey:'rifle'});
  units.push(c);makeUnitMesh(c);if(c.rig&&c.rig.gun)c.rig.gun.visible=false;if(c.el)c.el.classList.add('civ');if(c.ringMesh)c.ringMesh.visible=false;c.group.rotation.y=R()*6.28;c.stuck=0;return c}
// The stream runs from the enemy of the civilians' faction towards their own side. Projection along that axis, 0 at the start.
function civAxis(info){const mean=a=>a.length?[a.reduce((s,t)=>s+t[0],0)/a.length,a.reduce((s,t)=>s+t[1],0)/a.length]:[NX/2,NZ/2];
  const pl=mean((info.spawns||[]).map(t=>[t.x,t.z]));let en;if(S.espawns)en=mean(S.espawns);else if(M.stages&&M.stages[M.stages.length-1].spawns)en=mean(M.stages[M.stages.length-1].spawns);else en=mean((M.enemies||[]).map(e=>[e[1],e[2]]));
  const own=civFaction()===CUR.faction,from=own?en:pl,to=own?pl:en;let dx=to[0]-from[0],dz=to[1]-from[1];const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
  let lo=1e9,hi=-1e9;for(const row of G)for(const t of row){if(t.type!=='floor')continue;const p=(t.x-from[0])*dx+(t.z-from[1])*dz;lo=Math.min(lo,p);hi=Math.max(hi,p)}
  S.civAxis={from,dx,dz,lo,hi,p:t=>(t.x-from[0])*dx+(t.z-from[1])*dz}}
function civCap(){const n=civCount();return n}
function civEntryTiles(){const A=S.civAxis,spawns=(S.info.spawns||[]).concat((S.espawns||[]).map(([x,z])=>G[z][x])),out=[];
  for(const row of G)for(const t of row){if(t.type!=='floor'||t.obj||t.flood||t.cp||t.trap||t.point||t.zone||t.exit)continue;if(A.p(t)>A.lo+(A.hi-A.lo)*.15)continue;if(spawns.some(s=>Math.max(Math.abs(s.x-t.x),Math.abs(s.z-t.z))<3))continue;if(unitAt(t.x,t.z))continue;out.push(t)}return out}
function spawnCivilians(info){const n=civCount();if(!n)return;const R=rng((M.id||'c').charCodeAt(1)*53+NX);civAxis(info);S.civN=0;
  const spawns=info.spawns||[],cand=[];for(const row of G)for(const t of row){if(t.type!=='floor'||t.obj||t.flood||t.cp||t.trap||t.point||t.zone||t.exit)continue;if(spawns.some(s=>Math.max(Math.abs(s.x-t.x),Math.abs(s.z-t.z))<4))continue;if(unitAt(t.x,t.z))continue;if(S.civAxis.p(t)>S.civAxis.hi-(S.civAxis.hi-S.civAxis.lo)*.2)continue;cand.push(t)}
  for(let i=0;i<Math.ceil(n/2)&&cand.length;i++){const t=cand.splice(Math.floor(R()*cand.length),1)[0];civSpawnAt(t,R)}}
// Their turn: hurry along the stream towards their own side, keeping clear of fighters once the shooting starts,
// leave the map at the far end, and new ones arrive at the start while the count is under the cap.
async function civTurn(){const cap=civCount();if(!cap||!S.civAxis)return;const A=S.civAxis,R=S.R||Math.random;
  const cs=units.filter(u=>u.cls==='civ'&&!u.down&&!u.gone),fighters=units.filter(u=>!u.gone&&!u.down&&(u.team==='p'||u.team==='e')&&u.cls!=='bot');
  // Plan every civilian's move first (claiming tiles so two never end on the same one), then play them all at once.
  const claimed=new Set(),moves=[];
  for(const c of cs){const r=reach(c,S.alerted?5:4),p0=A.p(c);let best=null,bs=-1e9;
    for(const k of r.d.keys()){const[x,z]=k.split(',').map(Number);const t=G[z][x];if(t.flood||t.trapZone||claimed.has(k))continue;
      let s=(A.p(t)-p0)*1.2+R()*.8;if(S.alerted){for(const f of fighters){const d=Math.hypot(f.x-x,f.z-z);if(d<2.5)s-=(2.5-d)*1.5}}
      if(s>bs){bs=s;best=[x,z]}}
    if(best&&!(best[0]===c.x&&best[1]===c.z)){claimed.add(key(best[0],best[1]));const path=pathTo(r,best[0],best[1]);if(path.length)moves.push({c,path,best,p0});else moves.push({c,p0})}else{claimed.add(key(c.x,c.z));moves.push({c,p0})}}
  await Promise.all(moves.map(async({c,path,best})=>{if(!path)return;if(c.group.visible&&S.vis.has(key(best[0],best[1])))await moveAlong(c,path);else{c.x=best[0];c.z=best[1];place(c)}}));
  for(const{c,p0}of moves){if(A.p(c)<=p0+.5)c.stuck=(c.stuck||0)+1;else c.stuck=0;
    if(A.p(c)>=A.hi-(A.hi-A.lo)*.1||c.stuck>=3){c.gone=true;c.group.visible=false;if(c.el)c.el.remove()}}
  const alive=units.filter(u=>u.cls==='civ'&&!u.down&&!u.gone).length,want=Math.min(cap-alive,alive<cap/2?2:1);
  if(want>0){const ent=civEntryTiles();for(let i=0;i<want&&ent.length;i++){const t=ent.splice(Math.floor(R()*ent.length),1)[0];civSpawnAt(t,R)}}
  applyFog()}
// A missed shot may hit a civilian standing on the line of fire.
function civStray(a,b){const cs=units.filter(u=>u.cls==='civ'&&!u.down&&!u.gone);if(!cs.length)return;const dx=b.x-a.x,dz=b.z-a.z,steps=Math.ceil(Math.hypot(dx,dz)*3);
  for(let i=1;i<steps;i++){const t=i/steps,x=Math.round(a.x+dx*t),z=Math.round(a.z+dz*t);const c=cs.find(u=>u.x===x&&u.z===z);if(c&&Math.random()<.5){damage(c,Math.round(a.weapon.dmg*.8),a);log('A stray shot hits a civilian.');return}}}

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
