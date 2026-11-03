/* ===================== CONTROL (Harbour Row) =====================
   King-of-the-hill mode on a square district map. One zone is live at a
   time (M.zones in order, M.zoneTurns each). At the end of every full
   round the team that is alone inside the live zone scores CTL_ROUND;
   both inside means nobody scores. First to M.win, or the higher score at
   the turn cap. The next zone is announced two turns before it goes
   live. Enemy waves arrive every other turn while under the stage size;
   rivals and militia work as in operations. Hooks in engine.js are
   marked "control". */
const CTL_ROUND=10;
function ctlZoneTiles(zn){const out=[];for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const t=tileAt(zn.x+dx,zn.z+dz);if(t&&t.type!=='water'&&t.type!=='gap'&&!t.obj)out.push(t)}return out}
function ctlZone(){return M.zones[S.ctl.zi%M.zones.length]}
function ctlNext(){return M.zones[(S.ctl.zi+1)%M.zones.length]}
function ctlStart(m){if(!m.control)return;S.ctl={zi:0,left:m.zoneTurns||6,score:{p:0,e:0},warned:false,returns:[]};S.alerted=true;ctlDraw();log(`Control: hold ${ctlZone().name.toLowerCase()} alone at the end of a round for ${CTL_ROUND} points. First to ${M.win} wins.`)}
function ctlInside(team){return units.filter(u=>u.team===team&&!u.down&&!u.gone&&u.cls!=='turret'&&u.cls!=='bot'&&u.cls!=='civ'&&ctlZoneTiles(ctlZone()).some(t=>t.x===u.x&&t.z===u.z))}
// End of a full round: score, count the zone down, move it, check the win. Returns true when the mission ended.
function ctlTick(){if(!M.control||S.over)return false;const C=S.ctl,zn=ctlZone(),p=ctlInside('p').length,e=ctlInside('e').length;
  if(p&&!e){C.score.p+=CTL_ROUND;log(`You hold ${zn.name.toLowerCase()}: +${CTL_ROUND} (${C.score.p} to ${C.score.e}).`);sfx('good')}
  else if(e&&!p){C.score.e+=CTL_ROUND;log(`The enemy hold ${zn.name.toLowerCase()}: +${CTL_ROUND} for them (${C.score.p} to ${C.score.e}).`)}
  else if(p&&e)log(`${zn.name} is contested. Nobody scores.`);
  if(C.score.p>=M.win){endMission(true);return true}if(C.score.e>=M.win){endMission(false,`They reached ${M.win} points first.`);return true}
  C.left--;if(C.left<=0){C.zi++;C.left=M.zoneTurns||6;C.warned=false;banner(`Zone moved: ${ctlZone().name}`);sfx('alarm');log(`The fight moves to ${ctlZone().name.toLowerCase()}.`);ctlDraw()}
  else if(C.left<=2&&!C.warned){C.warned=true;log(`Next zone in ${C.left} turns: ${ctlNext().name}.`);ctlDraw()}
  ctlOwnerTint();return false}
// Downed rivals come back with the next wave three turns later (they are still injured for the next operation).
function ctlRivalDowned(r){if(!M.control||!S.ctl)return;S.ctl.returns.push({r,turn:S.turn+3})}
function ctlRivalReturns(){if(!S.ctl)return;const due=S.ctl.returns.filter(x=>x.turn<=S.turn);if(!due.length)return;S.ctl.returns=S.ctl.returns.filter(x=>x.turn>S.turn);for(const x of due){const old=S.rivalUnits.find(u=>u.rival===x.r&&u.down&&!u.gone);if(old){old.gone=true;old.group.visible=false;if(old.el)old.el.remove()}S.rivalPending.push(x.r);log(`${x.r.name} is back in the fight.`)}}
function ctlLabel(st){const C=st&&S.ctl,m=st?M:curMission();if(!C)return `hold the zones. First to ${m.win} points`;return `${ctlZone().name} · ${C.left} turn${C.left>1?'s':''} · ${C.score.p}:${C.score.e}`}
// AI: pushers go and stand in the zone, in cover where they can; once inside they shoot.
async function ctlPushAct(e){const tiles=ctlZoneTiles(ctlZone());if(!tiles.length)return aiShootOrMove(e);
  if(tiles.some(t=>t.x===e.x&&t.z===e.z)){const sh=bestShot(e);if(sh&&sh.c>=25)await shoot(e,sh.t);return}
  const r=reach(e);let pick=null,bs=1e9;for(const k of r.d.keys()){const[x,z]=k.split(',').map(Number);if(!tiles.some(t=>t.x===x&&t.z===z))continue;const sc=r.d.get(k)-coverHere(x,z)*2+Math.random();if(sc<bs){bs=sc;pick=[x,z]}}
  if(pick){await moveAlong(e,pathTo(r,pick[0],pick[1]));if(!e.down){const sh=bestShot(e);if(sh&&sh.c>=30)await shoot(e,sh.t)}return}
  const c=ctlZone();return approach(e,G[c.z][c.x])}
// ---------- drawing ----------
let CTL_G=null;
function ctlDraw(){if(!scene||!M.control)return;if(CTL_G){scene.remove(CTL_G);CTL_G=null}const g=new THREE.Group(),zn=ctlZone(),tiles=ctlZoneTiles(zn);
  const mat=new THREE.MeshBasicMaterial({color:0xf2d47a,transparent:true,opacity:.42,depthWrite:false});g.userData.mat=mat;
  for(const t of tiles){const p=W(t.x,t.z),q=new THREE.Mesh(new THREE.PlaneGeometry(.92,.92),mat);q.rotation.x=-Math.PI/2;q.position.set(p.x,topY(t)+.025,p.z);g.add(q)}
  const c=G[zn.z][zn.x],pc=W(zn.x,zn.z),pole=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.6,6),new THREE.MeshLambertMaterial({color:0xe8e8e8}));pole.position.set(pc.x+.35,topY(c)+.8,pc.z+.35);g.add(pole);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(.5,.3),new THREE.MeshBasicMaterial({color:0xf2d47a,side:THREE.DoubleSide}));flag.position.set(pc.x+.35+.25,topY(c)+1.45,pc.z+.35);g.userData.flag=flag;g.add(flag);
  if(S.ctl.warned){const nx=ctlNext(),m2=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.16,depthWrite:false});for(const t of ctlZoneTiles(nx)){const p=W(t.x,t.z),q=new THREE.Mesh(new THREE.PlaneGeometry(.92,.92),m2);q.rotation.x=-Math.PI/2;q.position.set(p.x,topY(t)+.02,p.z);g.add(q)}}
  ANIM.push((dt,tt)=>{flag.rotation.y=Math.sin(tt*3)*.25;mat.opacity=.36+Math.sin(tt*2)*.08});scene.add(g);CTL_G=g;ctlOwnerTint()}
function ctlOwnerTint(){if(!CTL_G)return;const p=ctlInside('p').length,e=ctlInside('e').length,col=p&&!e?FACTIONS[CUR.faction].accent:e&&!p?FACTIONS[ENEMY_OF[CUR.faction]].accent:'#f2d47a';CTL_G.userData.mat.color.set(col);CTL_G.userData.flag.material.color.set(col)}
// ---------- screens ----------
function ctlBriefHTML(m){return `<div class="kick sec-h">Zones, in order</div><ol class="steps">${m.zones.map(z=>`<li>${z.name}<small>${m.zoneTurns||6} turns</small></li>`).join('')}</ol><p class="small">Be the only team inside the live zone at the end of a round for ${CTL_ROUND} points. If both teams are in it, nobody scores. The next zone is called two turns ahead. First to ${m.win} wins; at the turn cap the higher score takes it. Enemy waves keep coming; your downed operatives redeploy at the drop point.</p>`}
function ctlDebriefLine(sm){return sm.ctl?`<p class="small">Final score: you ${sm.ctl.p}, them ${sm.ctl.e}.</p>`:''}
