/* ===================== RIVAL SQUADS AND AI ALLIES =====================
   Each faction campaign faces a named squad of six from the other side,
   kept in the save (SAVE.rivals[faction]) for the whole campaign. Four
   deploy each operation (the highest levels who aren't injured), grunts
   fill out their force, and two militia allies join yours. Rivals earn
   experience and level up like your operatives, bench rivals earn half,
   stragglers catch up, and anyone downed sits out the next operation.
   Each rival has one hidden trait, revealed by downing them, Spotting them
   or picking up intel. Hooks in engine.js are marked "rivals". */
const RIVAL_TRAITS={fireproof:{name:'Fireproof',desc:'Grenades, barrels, fire and steam do half damage.'},fortify:{name:'Fortifier',desc:'Their turrets have +30 health.'},
  ghost:{name:'Ghost',desc:'Drops out of sight after attacking unless you are next to them.'},surgeon:{name:'Field surgeon',desc:'Heals allies back to full.'},
  eagle:{name:'Eagle eye',desc:'+10 accuracy past their weapon’s best range.'},steady:{name:'Steady aim',desc:'+8 accuracy.'},tough:{name:'Thick skin',desc:'+15 health.'},
  quick:{name:'Quick feet',desc:'+1 move.'},heights:{name:'Hates heights',desc:'−10 accuracy shooting upwards.'},vengeful:{name:'Vengeful',desc:'Goes for whoever last downed them.'}};
const RIVAL_NAMES={security:['Drayke','Okafor','Reyes','Linden','Marlowe','Hale','Voss','Adeyemi','Castellan','Brennan'],resistance:['Vasko','Imani','Teague','Solis','Brannock','Quade','Ferro','Nakamura','Osei','Dillane']};
const RIVAL_SQUADS={security:['Blue Wolves','Iron Tide','Harbour Watch','Sixth Column'],resistance:['Rust Dogs','Gull Crew','Low Deck Irregulars','Saltwater Cell']};
// Six rivals cover all four classes with two extras, and a mix of bodies.
const RIVAL_SLOTS=[['soldier','heavy'],['engineer','heavy'],['operative','light'],['medic','light'],['soldier','medium'],['engineer','medium']];

function rivalsFor(f){SAVE.rivals=SAVE.rivals||{resistance:null,security:null};if(!SAVE.rivals[f]){SAVE.rivals[f]=genRivals(f);persist()}return SAVE.rivals[f]}
function genRivals(f){const ef=ENEMY_OF[f],names=[...RIVAL_NAMES[ef]].sort(()=>Math.random()-.5),traits=Object.keys(RIVAL_TRAITS).sort(()=>Math.random()-.5),R=Math.random;
  const members=RIVAL_SLOTS.map(([cls,body],i)=>{const wpns=BODY_WPN[body].filter(w=>cls==='operative'?['smg','mpistol','dmr'].includes(w):cls==='medic'?['smg','rifle','dmr'].includes(w):true);const weapon=pick(wpns);
    const look=LOOK({name:names[i],callsign:'',faction:ef,body,cls,weapon,skin:Math.floor(R()*6),hairCol:Math.floor(R()*7),face:pick(['long','square','angular','broad']),expr:pick(['grim','neutral','snarl','smirk']),facial:pick(['none','stubble','beard','goatee','none']),mark:pick(['none','none','scar','paint']),
      hair:pick(['buzz','crop','shaved','slick','mohawk','topknot']),headgear:ef==='security'?pick(['helmet','cap','none','headset']):pick(['bandana','beanie','none','goggles']),facegear:pick(['none','none','shades','mask']),top:pick(['tee','long','jacket','hoodie']),armour:ef==='security'?(body==='heavy'?'riot':pick(['carrier','rig'])):(body==='heavy'?'scrap':pick(['rig','carrier'])),legs:pick(['cargo','armoured','jeans']),gloves:pick(['none','fingerless','tactical']),primary:Math.floor(R()*6),secondary:Math.floor(R()*6)});
    return{id:'rv'+i+'_'+Math.random().toString(36).slice(2,6),name:names[i],cls,body,weapon,look,xp:0,lvl:1,trait:traits[i],revealed:false,injured:false,nemesis:null}});
  return{name:pick(RIVAL_SQUADS[ef]),members}}
const rivalLvl=r=>lvlOf(r.xp);
// The four who deploy next: highest level, then experience, among the fit.
function rivalsDeploy(f){const R=rivalsFor(f);return R.members.filter(r=>!r.injured).sort((a,b)=>rivalLvl(b)-rivalLvl(a)||b.xp-a.xp).slice(0,4)}
const RIVAL_BASE={soldier:'trooper',medic:'medic',engineer:'engineer',operative:'infiltrator'};
function rivalStats(r){const T=ETYPES[RIVAL_BASE[r.cls]],D=DF(),lvl=rivalLvl(r),B=EB[r.body],w=WPN[r.weapon],sc=10;
  return{hp:Math.round((B.hp*.85+sc+8*(lvl-1)+(r.trait==='tough'?15:0))*D.hp),move:B.move+(lvl>=3?1:0)+(r.trait==='quick'?1:0),vis:B.vis,
    weapon:{...w,acc:w.acc+T.acc+D.acc+3*(lvl-1)+(r.trait==='steady'?8:0),dmg:Math.round(w.dmg*T.dmg*D.dmg)},lvl}}
// Turn a freshly spawned grunt into this rival.
function makeRival(e,r){const st=rivalStats(r);Object.assign(e,{rival:r,name:r.name,short:r.name,cls:r.cls,body:r.body,look:r.look,wkey:r.weapon,weapon:st.weapon,hp:st.hp,maxHp:st.hp,move:st.move,vis:st.vis,lvl:st.lvl,trait:r.trait,nemesis:r.nemesis||null,kills:0});
  rebuildModel(e);if(e.el){e.el.classList.add('rival');updBar(e)}S.rivalUnits.push(e);return e}
const freshGrunts=()=>living('e').filter(e=>!e.rival&&e.cls!=='turret'&&e.cls!=='bot'&&!e.leader);
// Mission start: pick the four, convert grunts into them, add an extra grunt, spawn allies and intel.
function rivalsStart(m,info){S.rivalsOn=false;if(!(CUR.mi<0)||!m.long)return;const f=CUR.faction,dep=rivalsDeploy(f);S.rivalsOn=true;S.rivalIds=dep.map(r=>r.id);S.rivalUnits=[];S.rivalEvents=[];S.rivalDowned=new Set();S.rivalPending=[];
  const g=freshGrunts();dep.forEach((r,i)=>{if(g[i])makeRival(g[i],r);else S.rivalPending.push(r)});
  if(!m.defend){const list=m.stages?m.stages[0].enemies:m.enemies,last=list.filter(e=>e[0]!=='turret').slice(-1)[0];if(last){const sp=mechFreeNear({x:last[1],z:last[2]});if(sp){const e=spawnEnemy('trooper',sp.x,sp.z,S.R);e.fresh=false}}}
  alliesSpawn(info);placeIntel();applyFog()}
// A new stage: surviving rivals fall back to the new line (re-appear among its fresh grunts).
function rivalsStage(){if(!S.rivalsOn)return;const alive=S.rivalUnits.filter(e=>!e.down&&!e.gone);for(const e of alive){e.gone=true;e.group.visible=false;if(e.el)e.el.remove()}
  S.rivalUnits=S.rivalUnits.filter(e=>!alive.includes(e));S.rivalPending=alive.map(e=>e.rival).concat(S.rivalPending);rivalsFill()}
function rivalsFill(){if(!S.rivalsOn||!S.rivalPending.length)return;const g=freshGrunts();while(S.rivalPending.length&&g.length)makeRival(g.shift(),S.rivalPending.shift())}
// Traits in play.
function rivalAfterShot(a){if(a.team==='e'&&a.trait==='ghost'&&!a.down&&!squad().some(p=>!p.down&&cheb(p,a)<=1)){a.ghostT=1;applyFog();log(`${a.name} slips out of sight.`)}}
function rivalDowned(u,by){if(!u.rival)return;S.rivalDowned.add(u.rival.id);if(by&&by.op)u.rival.nemesis=by.op.id;rivalReveal(u.rival,'downed');if(typeof ctlRivalDowned==='function')ctlRivalDowned(u.rival)}
function rivalReveal(r,how){if(r.revealed)return;r.revealed=true;const T=RIVAL_TRAITS[r.trait];log(`${r.name}: ${T.name}. ${T.desc}`);S.rivalEvents.push({id:r.id,kind:'reveal',how});persist()}
function rivalSpot(t){for(const e of living('e'))if(e.rival&&!e.rival.revealed&&dist(e,t)<=3)rivalReveal(e.rival,'spot')}
// Intel pickups: two per operation on quiet floor tiles away from the drop point.
function placeIntel(){S.intel=[];const spawns=S.info.spawns||[],route=botRoute(),cand=[];for(const row of G)for(const t of row){if(t.type!=='floor'||t.obj||t.cp||t.zone||t.exit||t.item||t.trap||t.point||t.pass||route.has(key(t.x,t.z)))continue;if(spawns.some(s=>Math.hypot(s.x-t.x,s.z-t.z)<5))continue;if(unitAt(t.x,t.z))continue;cand.push(t)}
  for(let i=0;i<2&&cand.length;i++){const t=cand.splice(Math.floor(S.R()*cand.length),1)[0];t.intel=true;const m=new THREE.Mesh(new THREE.OctahedronGeometry(.14),new THREE.MeshBasicMaterial({color:0x7fe8ff}));const p=W(t.x,t.z);m.position.set(p.x,topY(t)+.3,p.z);scene.add(m);t.intelMesh=m;S.intel.push(t);ANIM.push((dt,tt)=>{m.rotation.y=tt*2;m.position.y=topY(t)+.3+Math.sin(tt*3)*.05})}}
function rivalIntel(u,t){if(!u.op||!t.intel)return;t.intel=false;if(t.intelMesh){scene.remove(t.intelMesh);t.intelMesh=null}sfx('good');popup(u,'Intel','good');
  const R=rivalsFor(CUR.faction),dep=R.members.filter(r=>S.rivalIds.includes(r.id)&&!r.revealed),any=R.members.filter(r=>!r.revealed),r=dep[0]||any[0];if(r)rivalReveal(r,'intel');else log('Intel: nothing new on the rivals.')}
// ---------- allies ----------
function alliesSpawn(info){const f=CUR.faction,sp=info.spawns;if(!sp||!sp.length)return;S.allies=[];
  for(let i=0;i<2;i++){const base=sp[Math.min(sp.length-1,3)],at=mechFreeNear(base)||mechFreeNear(sp[0]);if(!at)return;
    const look=LOOK({name:'Militia '+(i+1),callsign:'',faction:f,body:'medium',cls:'soldier',weapon:'rifle',skin:Math.floor(S.R()*6),hairCol:Math.floor(S.R()*7),hair:pick(['buzz','crop','shaved']),headgear:f==='security'?'cap':'beanie',top:'long',armour:'none',legs:'cargo',gloves:'none',primary:f==='security'?5:1,secondary:f==='security'?3:3});
    const a=newUnit({team:'p',ally:true,name:'Militia '+(i+1),short:'Militia',cls:'soldier',body:'medium',lvl:1,hp:70,maxHp:70,move:5,vis:6,weapon:{...WPN.rifle,acc:WPN.rifle.acc-10},x:at.x,z:at.z,look,wkey:'rifle',perks:new Set(),cd:{}});
    units.push(a);makeUnitMesh(a);if(a.el)a.el.classList.add('ally');a.group.rotation.y=Math.PI;S.allies.push(a)}}
const allyShotFrom=(a,x,z,foes)=>{let best=null;for(const e of foes){const c=hitChance({...a,x,z},e);if(c&&(!best||c>best.c))best={e,c}}return best};
// One ally's turn: take a good shot, otherwise move towards the objective into cover, then shoot.
async function allyAct(a){if(a.down||a.gone||a.stun>0)return;const foesSeen=living('e').filter(e=>e.seen&&e.cls!=='bot');let best=allyShotFrom(a,a.x,a.z,foesSeen);
  if(!best||best.c<45){const r=reach(a),op=objPoint(),gx=op?op.v.x+(NX-1)/2:null,gz=op?op.v.z+(NZ-1)/2:null;let pick=null,ps=-1e9;
    for(const k of r.d.keys()){const[x,z]=k.split(',').map(Number),t=G[z][x];if(t.trapZone||t.flood||t.intel)continue;let s=0;const sh=allyShotFrom(a,x,z,foesSeen);if(sh)s+=sh.c/10;for(const e of foesSeen)s+=coverOf(t,G[e.z][e.x])*1.5;if(gx!=null)s-=Math.hypot(gx-x,gz-z)*.8;
      const near=foesSeen.reduce((m,e)=>Math.min(m,Math.hypot(e.x-x,e.z-z)),99);if(near<2)s-=3;if(s>ps){ps=s;pick=[x,z]}}
    if(pick&&!(pick[0]===a.x&&pick[1]===a.z)){await moveAlong(a,pathTo(r,pick[0],pick[1]));if(a.down)return;best=allyShotFrom(a,a.x,a.z,foesSeen)}}
  if(best&&(S.alerted||best.c>=70))await shoot(a,best.e);a.moved=a.acted=true}
async function alliesAct(){for(const a of units.filter(u=>u.ally&&!u.down&&!u.gone)){if(S.over)return;await allyAct(a);updBar(a)}}
function allyDowned(u){if(!u.ally)return;log(`${u.name} is down. A medic can get them back up.`)}
// ---------- after the operation ----------
// Deployed rivals level at the same pace as your operatives: each gets the squad's average XP gain for the mission,
// plus 15 a kill; a downed rival gets three quarters. The bench gets half the deployed average.
function rivalsEnd(won,avgXp=0){if(!S.rivalsOn)return[];const R=rivalsFor(CUR.faction),dep=new Set(S.rivalIds),lines=[],gained={};
  let depXp=0,depN=0;for(const r of R.members){if(!dep.has(r.id))continue;const e=S.rivalUnits.find(u=>u.rival===r);const xp=Math.round((avgXp+(e?e.kills||0:0)*15)*(S.rivalDowned.has(r.id)?.75:1));gained[r.id]=xp;depXp+=xp;depN++}
  const benchXp=depN?Math.round(depXp/depN/2):0;for(const r of R.members)if(!dep.has(r.id))gained[r.id]=benchXp;
  for(const r of R.members){const before=rivalLvl(r);r.xp+=gained[r.id]||0;r.before=before}
  const avg=R.members.reduce((a,r)=>a+rivalLvl(r),0)/R.members.length;for(const r of R.members){const target=Math.floor(avg)-2;if(rivalLvl(r)<target)r.xp=Math.max(r.xp,LEVELS[target-1]||0)}
  for(const r of R.members){r.lvl=rivalLvl(r);const T=RIVAL_TRAITS[r.trait],downed=S.rivalDowned.has(r.id),rev=S.rivalEvents.find(ev=>ev.id===r.id);
    if(downed)lines.push(`${r.name} downed${rev&&rev.how==='downed'?': trait revealed':''}, injured.`);
    else if(rev)lines.push(`${rev.how==='spot'?'Spot':'Intel'} revealed ${r.name}’s trait: ${T.name}.`);
    if(r.lvl>r.before)lines.push(`${r.name} is now level ${r.lvl}.`);
    r.injured=downed;delete r.before}
  S.rivalsOn=false;persist();return lines}
// ---------- screens ----------
function rivalCard(r,sm){const T=RIVAL_TRAITS[r.trait];return `<div class="rc${r.injured?' inj':''}${sm?' sm':''}"><span class="st">Injured</span><span class="lv">Lv ${rivalLvl(r)}</span><div class="pic">${portraitHTML(r.look)}</div><div class="in"><b>${esc(r.name)}</b><span class="cl">${BODY[r.body].label} ${r.cls}</span>${r.revealed?`<span class="tr known" data-tip="rv:${r.trait}">${T.name}</span>`:'<span class="tr">Trait ?</span>'}</div></div>`}
function rivalsBoard(f){const R=rivalsFor(f),ef=ENEMY_OF[f],dep=rivalsDeploy(f),bench=R.members.filter(r=>!dep.includes(r));
  return `<div class="kick sec-h">Rivals</div><div class="rboard"><div class="bh"><b>${esc(R.name)}</b><small>${FACTIONS[ef].label} rival squad</small></div><div class="rv">${dep.map(r=>rivalCard(r)).join('')}</div>${bench.length?`<div class="bh sub"><b>Bench</b><small>Injured or in reserve</small></div><div class="rv bench">${bench.map(r=>rivalCard(r,true)).join('')}</div>`:''}</div>`}
function rivalsBriefLines(m){if(!(CUR.mi<0)||!m.long)return'';const f=CUR.faction,R=rivalsFor(f),dep=rivalsDeploy(f),inj=R.members.filter(r=>r.injured);
  const list=m.stages?m.stages[0].enemies:m.enemies,grunts=m.defend?(m.stages[0].size||6)+1-dep.length:Math.max(0,list.filter(e=>e[0]!=='turret').length+1-dep.length);
  return `<div class="brief rv-brief"><div>Rivals: ${dep.map(r=>esc(r.name)+' '+rivalLvl(r)).join(' · ')}</div><div>${inj.length?inj.map(r=>esc(r.name)).join(', ')+' injured · ':''}Grunts: ${grunts}</div></div>`}
function rivalsDebrief(sm){if(!sm.rivals)return'';return `<div class="kick sec-h">Rivals</div><div class="brief rv-brief">${sm.rivals.length?sm.rivals.map(l=>`<div>${l}</div>`).join(''):'<div>No change to the rival squad.</div>'}</div>`}
function rivalTip(u){const r=u.rival,T=RIVAL_TRAITS[r.trait];return `<b>${esc(r.name)}</b>Rival. Level ${rivalLvl(r)} ${r.body} ${r.cls}.<small>Trait: ${r.revealed?`${T.name}. ${T.desc}`:'?'}</small><small>${u.hp}/${u.maxHp} health. ${u.weapon.name}: ${u.weapon.dmg} dmg, range ${u.weapon.range}.</small>`}
