/* ===================== IN-GAME OPERATIVE CREATOR =====================
   Recruit new operatives and edit the look of existing ones, from the
   roster, with a live 3D preview of the operative's soldier. Uses the shared
   look data in creator-core.js and the engine's tooltips (data-tip).
   Hooks in engine.js: 'creator' in VIEWS, the roster buttons (viewRoster),
   and ROSTER_CAP. Everything else lives here, prefixed CRT. */
const ROSTER_CAP=12;
const CRT={look:null,op:null,faction:'resistance',tab:'role',zoom:false,vb:null,vbAnim:0,dirty:false};
const CRT_TABS=[['role','Role'],['face','Face'],['hair','Hair'],['gear','Gear']];
const CRT_HAIRC=['Black','Dark brown','Brown','Copper','Blonde','Grey','White','Red dye','Blue dye'];

// Weapons a body can carry follow the game's own list (sniper rifle for mediums).
const crtWeapons=body=>(typeof BODY_WPN!=='undefined'&&BODY_WPN[body])||Object.keys(WEAPONS).filter(w=>WEAPONS[w].bodies.includes(body));
const crtWName=w=>(typeof WPN!=='undefined'&&WPN[w]&&WPN[w].name)||(WEAPONS[w]&&WEAPONS[w].label)||w;
function crtFix(l){if(!crtWeapons(l.body).includes(l.weapon))l.weapon=crtWeapons(l.body)[0];
  for(const key of['headgear','armour']){const o=OPTS[key].find(x=>x[0]===l[key]);const fac=key==='armour'?o&&o[3]:o&&o[2];if(fac&&fac!==l.faction)l[key]=key==='armour'?'carrier':'helmet'}
  return l}

function crtRandom(f,body){const b=body||pick(Object.keys(BODY));
  const ids=k=>OPTS[k].filter(o=>{const fac=k==='armour'?o[3]:o[2];return !fac||fac===f}).map(o=>o[0]);
  return crtFix(clean({faction:f,body:b,cls:pick(Object.keys(CLASSES)),weapon:pick(crtWeapons(b)),
    skin:Math.floor(Math.random()*SKIN.length),face:pick(ids('face')),expr:pick(ids('expr')),facial:pick(ids('facial')),mark:Math.random()<.55?'none':pick(ids('mark')),
    hair:pick(ids('hair')),hairCol:Math.random()<.85?Math.floor(Math.random()*7):7+Math.floor(Math.random()*2),headgear:Math.random()<.35?'none':pick(ids('headgear')),
    facegear:Math.random()<.6?'none':pick(ids('facegear')),top:pick(ids('top')),armour:pick(ids('armour')),legs:pick(ids('legs')),gloves:pick(ids('gloves')),
    primary:Math.floor(Math.random()*6),secondary:Math.floor(Math.random()*6),name:pick(NAMES),callsign:pick(CALLSIGNS)}))}

// Open the creator. op: an operative to edit, or null to recruit.
function viewCreator(op){
  const f=CUR.faction;CRT.faction=f;CRT.op=op||null;CRT.tab='role';CRT.zoom=false;CRT.dirty=false;CRT3.key='';CRT3.wpn=null;
  if(op){CRT.look=crtFix(clean({...op.look,name:op.name,callsign:op.callsign||op.look.callsign,cls:op.cls,weapon:op.weapon,body:op.body,faction:f}))}
  else{if(SAVE.roster[f].length>=ROSTER_CAP){toast(`The roster’s full (${ROSTER_CAP}). Dismiss someone first.`);return}CRT.look=crtRandom(f)}
  $('#v-creator').innerHTML=`<div class="crt">
    <div class="bar"><button type="button" class="btn ghost" data-crt="cancel">Cancel</button><button type="button" class="btn" data-crt="rand">Randomise</button></div>
    <h2 class="vh"><small>${FACTIONS[f].label}</small>${op?'Edit operative':'Recruit operative'}</h2>
    <div class="crt-stage" id="crtStage" role="img" aria-label="Operative preview. Swipe to turn.">
      <button type="button" class="crt-zoom" data-crt="zoom"></button><div class="crt-tag" id="crtTag"></div></div>
    <div class="crt-stats" id="crtStats"></div>
    <nav class="crt-tabs" id="crtTabs" role="tablist"></nav>
    <div class="crt-panel" id="crtPanel"></div>
    <div class="sticky"><button type="button" class="go" data-crt="save">${op?'Save changes':'Recruit to roster'}</button></div></div>`;
  const root=$('#v-creator');
  root.onclick=crtClick;
  root.oninput=e=>{if(e.target.id==='crtName'){CRT.look.name=e.target.value.slice(0,18);CRT.dirty=true;crtUpdate()}if(e.target.id==='crtCall'){CRT.look.callsign=e.target.value.slice(0,22);CRT.dirty=true;crtUpdate()}};
  show('creator');crt3Init();crtTabs();crtPanel();crtUpdate();
}

function crtClick(e){const L=CRT.look;
  const t=e.target.closest('[data-tab]');if(t){CRT.tab=t.dataset.tab;CRT.zoom=CRT.tab==='face'||CRT.tab==='hair';crtTabs();crtPanel();crtUpdate();return}
  const b=e.target.closest('[data-k]');if(b){if(b.disabled)return;const k=b.dataset.k;L[k]=b.dataset.n?parseInt(b.dataset.v,10):b.dataset.v;crtFix(L);CRT.dirty=true;sfx('ui');crtPanel();crtUpdate();return}
  const a=e.target.closest('[data-crt]');if(!a)return;const act=a.dataset.crt;
  if(act==='zoom'){CRT.zoom=!CRT.zoom;crtUpdate()}
  if(act==='rand'){const keep=CRT.op?{name:L.name,callsign:L.callsign,cls:L.cls,weapon:L.weapon}:{};CRT.look=crtFix({...crtRandom(CRT.faction,CRT.op?L.body:null),...keep});CRT.dirty=true;sfx('ui');crtPanel();crtUpdate()}
  if(act==='cancel'){if(CRT.dirty&&!a.dataset.armed){a.dataset.armed='1';a.textContent='Discard changes?';setTimeout(()=>{if(a.isConnected){delete a.dataset.armed;a.textContent='Cancel'}},2600);return}viewRoster()}
  if(act==='save')crtSave()}

function crtSave(){const f=CRT.faction,L=crtFix(clean({...CRT.look,faction:f}));
  L.name=(L.name||'').trim()||pick(NAMES);L.callsign=(L.callsign||'').trim();
  if(CRT.op){const op=SAVE.roster[f].find(o=>o.id===CRT.op.id);if(!op){viewRoster();return}
    // Body is fixed once recruited: it carries the operative's stats and history.
    L.body=op.body;op.look=L;op.name=L.name;op.callsign=L.callsign;op.cls=L.cls;op.weapon=L.weapon;persist();toast(`${L.name} updated`)}
  else{if(SAVE.roster[f].length>=ROSTER_CAP){toast(`The roster’s full (${ROSTER_CAP}). Dismiss someone first.`);return}
    SAVE.roster[f].push(mkOp(L));persist();toast(`${L.name} joins the roster`)}
  sfx('good');viewRoster()}

function crtTabs(){$('#crtTabs').innerHTML=CRT_TABS.map(([id,l])=>`<button type="button" role="tab" data-tab="${id}" aria-selected="${CRT.tab===id}">${l}</button>`).join('')}

function crtPanel(){const L=CRT.look,F=FACTIONS[CRT.faction],editing=!!CRT.op;let h='';
  const on=(k,v)=>String(L[k])===String(v);
  const chips=(key,title,list,hint='',tip)=>`<div class="crt-group"><h3>${title}${hint?`<small>${hint}</small>`:''}</h3><div class="crt-chips">${list.map(([id,l])=>`<button type="button" class="crt-chip" data-k="${key}" data-v="${id}" aria-pressed="${on(key,id)}"${tip?` data-tip="${tip}:${id}"`:''}>${l}</button>`).join('')}</div></div>`;
  const cards=(key,title,list,hint='',extra='',lock=false,tip)=>`<div class="crt-group"><h3>${title}${hint?`<small>${hint}</small>`:''}</h3><div class="crt-cards">${list.map(([id,l,sub])=>`<button type="button" class="crt-card" data-k="${key}" data-v="${id}" aria-pressed="${on(key,id)}"${lock&&!on(key,id)?' disabled':''}${tip?` data-tip="${tip}:${id}"`:''}><b>${l}</b><span>${sub}</span></button>`).join('')}</div>${extra}</div>`;
  const swatches=(key,title,cols,names=[])=>`<div class="crt-group"><h3>${title}${names.length?`<small>${names[L[key]]}</small>`:''}</h3><div class="crt-sw">${cols.map((c,i)=>`<button type="button" style="background:${c}" data-k="${key}" data-v="${i}" data-n="1" aria-pressed="${L[key]===i}" aria-label="${names[i]||'Colour '+(i+1)}"></button>`).join('')}</div></div>`;
  const facOk=o=>!o||o===CRT.faction;
  if(CRT.tab==='role'){
    h+=`<div class="crt-group crt-fields"><label><span>Name</span><input id="crtName" maxlength="18" autocomplete="off" value="${esc(L.name)}"></label><label><span>Callsign</span><input id="crtCall" maxlength="22" autocomplete="off" value="${esc(L.callsign)}"></label></div>`;
    h+=cards('body','Body type',Object.entries(BODY).map(([id,b])=>[id,b.label,`${EB[id]?EB[id].hp:b.hp} health, move ${EB[id]?EB[id].move:b.move}`]),editing?'Fixed once recruited':'Can’t be changed later',
      `<p class="crt-note" data-tip="move:${L.body}">${MOVE_TIP[L.body]||''}</p>`,editing,'move');
    h+=cards('cls','Class',Object.entries(CLASSES).map(([id,c])=>[id,c.label,CLASS_AB[id].map(a=>AB[a].name).join(', ')]),'Swappable at command posts',
      `<p class="crt-note">${CLASS_DESC[L.cls]||CLASSES[L.cls].desc}</p><p class="ab">${CLASS_AB[L.cls].map((a,i)=>`<span data-tip="ab:${a}">${AB[a].name} (Lv ${AB_LVL[i]})</span>`).join('')}</p>`,false,'cls');
    h+=chips('weapon','Primary weapon',crtWeapons(L.body).map(w=>[w,crtWName(w)]),`What a ${BODY[L.body].label.toLowerCase()} build can carry`,'wpn');
  }
  if(CRT.tab==='face'){h+=swatches('skin','Skin tone',SKIN);h+=chips('face','Face shape',OPTS.face);h+=chips('expr','Expression',OPTS.expr);h+=chips('facial','Facial hair',OPTS.facial);h+=chips('mark','Markings',OPTS.mark)}
  if(CRT.tab==='hair'){h+=chips('hair','Hairstyle',OPTS.hair,COVER.has(L.headgear)?'Mostly hidden by headgear':'');h+=swatches('hairCol','Hair colour',HAIRC,CRT_HAIRC);
    h+=chips('headgear','Headgear',OPTS.headgear.filter(o=>facOk(o[2])).map(o=>[o[0],o[1]]),CRT.faction==='security'?'Riot helmet is Security issue':'');h+=chips('facegear','Face gear',OPTS.facegear)}
  if(CRT.tab==='gear'){h+=chips('top','Top',OPTS.top);h+=cards('armour','Armour',OPTS.armour.filter(o=>facOk(o[3])).map(o=>[o[0],o[1],'Looks only']),`${F.label} exclusive included`);
    h+=chips('legs','Trousers',OPTS.legs);h+=chips('gloves','Gloves',OPTS.gloves);h+=swatches('primary','Main colour',F.pal,F.names);h+=swatches('secondary','Second colour',F.pal,F.names)}
  $('#crtPanel').innerHTML=h}

function crtUpdate(){const L=CRT.look;if(!$('#crtStage'))return;
  crt3Model();
  $('#v-creator .crt-zoom').textContent=CRT.zoom?'Full body':'Face';
  const B=EB[L.body]||BODY[L.body];
  $('#crtTag').innerHTML=`<b>${esc(L.name||'Unnamed')}</b>${L.callsign?`<span>“${esc(L.callsign)}”</span>`:''}<small>${BODY[L.body].label} ${CLASSES[L.cls].label.toLowerCase()}, ${crtWName(L.weapon).toLowerCase()}</small>`;
  const w=(typeof WPN!=='undefined'&&WPN[L.weapon])||{dmg:0,range:0};
  const st=[['Health',B.hp,B.hp/150,`move:${L.body}`],['Move',B.move,B.move/7,`move:${L.body}`],['Vision',B.vis||6,(B.vis||6)/7,`move:${L.body}`],['Damage',w.dmg,w.dmg/40,`wpn:${L.weapon}`]];
  $('#crtStats').innerHTML=st.map(([l,v,f,tip])=>`<div class="crt-stat" data-tip="${tip}"><div><span>${l}</span><b>${v}</b></div><i><s style="width:${Math.round(Math.min(1,f)*100)}%"></s></i></div>`).join('')}

/* ---------- live 3D preview ----------
   The operative's own animated soldier, rebuilt on every look change.
   Swipe sideways to turn them; Idle by default, a short aim when the
   weapon changes. The renderer is created when the creator opens and
   freed when you leave it, so it doesn't hold a WebGL context in menus. */
const CRT3={r:null,scene:null,cam:null,model:null,rig:null,yaw:-.45,drag:null,key:'',wpn:null,zoom:0,raf:0,last:0};
function crt3Init(){crt3Free();const st=$('#crtStage');if(!st||typeof THREE==='undefined')return;
  let r;try{r=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){return}
  r.setPixelRatio(HI()?Math.min(2,devicePixelRatio||1):1);r.shadowMap.enabled=HI();st.prepend(r.domElement);CRT3.r=r;
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xdcefff,0x6a5a4a,.8));const sun=new THREE.DirectionalLight(0xfff1dc,.85);sun.position.set(-2,4,4);sun.castShadow=HI();sun.shadow.mapSize.set(512,512);Object.assign(sun.shadow.camera,{left:-1.2,right:1.2,top:1.6,bottom:-.4});sc.add(sun);
  const rim=new THREE.DirectionalLight(0xbfe4ff,.55);rim.position.set(3,2,-3);sc.add(rim);
  const fl=new THREE.Mesh(new THREE.CylinderGeometry(.75,.8,.06,40),new THREE.MeshLambertMaterial({color:CRT.faction==='security'?0xdfe5e9:0x7d6250}));fl.position.y=-.03;fl.receiveShadow=true;sc.add(fl);
  CRT3.scene=sc;CRT3.cam=new THREE.PerspectiveCamera(26,1,.05,30);CRT3.zoom=CRT.zoom?1:0;
  const cv=r.domElement;cv.style.touchAction='pan-y';
  cv.addEventListener('pointerdown',e=>{CRT3.drag={x:e.clientX,yaw:CRT3.yaw};cv.setPointerCapture(e.pointerId)});
  cv.addEventListener('pointermove',e=>{if(CRT3.drag)CRT3.yaw=CRT3.drag.yaw+(e.clientX-CRT3.drag.x)*.014});
  const end=()=>CRT3.drag=null;cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  CRT3.last=performance.now();CRT3.raf=requestAnimationFrame(crt3Loop)}
function crt3Model(){if(!CRT3.scene)return;const L=CRT.look,k=portraitKey(L);if(k===CRT3.key)return;CRT3.key=k;
  if(CRT3.model){CRT3.scene.remove(CRT3.model);disposeUnitModel(CRT3.model)}
  const m=buildRigged(L,L.weapon,L.cls,{outline:HI()})||capsuleSoldier(L,HI());m.traverse(o=>{if(o.isMesh&&!o.userData.isOutline)o.castShadow=true});
  CRT3.scene.add(m);CRT3.model=m;CRT3.rig=m.userData.rig||null;
  if(CRT3.rig){CRT3.rig.play('Idle');if(CRT3.wpn&&CRT3.wpn!==L.weapon)CRT3.rig.play('Idle_Shoot',{once:true,speed:.55})}CRT3.wpn=L.weapon}
function crt3Loop(now){if(document.body.dataset.view!=='creator'||!CRT3.r){crt3Free();return}CRT3.raf=requestAnimationFrame(crt3Loop);
  const dt=Math.min(.05,(now-CRT3.last)/1000);CRT3.last=now;const r=CRT3.r,st=r.domElement.parentNode,w=st.clientWidth,h=st.clientHeight;
  if(!w||!h)return;const c=r.getSize(new THREE.Vector2());if(c.x!==w||c.y!==h){r.setSize(w,h,false);CRT3.cam.aspect=w/h;CRT3.cam.updateProjectionMatrix()}
  if(CRT3.rig)CRT3.rig.update(dt);if(CRT3.model)CRT3.model.rotation.y=CRT3.yaw;
  CRT3.zoom+=((CRT.zoom?1:0)-CRT3.zoom)*(reduce?1:Math.min(1,dt*8));const z=CRT3.zoom,cam=CRT3.cam;
  const head=new THREE.Vector3(0,.82,0);if(CRT3.rig&&CRT3.rig.bones.Neck){CRT3.rig.bones.Neck.getWorldPosition(head);head.y+=.1}
  const ty=.48+(head.y-.48)*z,d=2.7-(2.7-.95)*z;cam.position.set(0,ty+.08-.04*z,d);cam.lookAt(0,ty,0);r.render(CRT3.scene,cam)}
function crt3Free(){cancelAnimationFrame(CRT3.raf);if(CRT3.model)disposeUnitModel(CRT3.model);CRT3.model=null;CRT3.rig=null;
  if(CRT3.r){CRT3.r.dispose();CRT3.r.forceContextLoss&&CRT3.r.forceContextLoss();CRT3.r.domElement.remove();CRT3.r=null}CRT3.scene=null}

// Roster: dismiss with a confirm step (second tap within a few seconds).
function crtDismiss(btn,op){const f=CUR.faction;
  if(SAVE.roster[f].length<=4){toast('Keep at least four operatives so you can field a full squad.');return}
  if(!btn.dataset.armed){btn.dataset.armed='1';btn.textContent='Tap again to dismiss';btn.classList.add('warn');setTimeout(()=>{if(btn.isConnected){delete btn.dataset.armed;btn.textContent='Dismiss';btn.classList.remove('warn')}},3000);return}
  SAVE.roster[f]=SAVE.roster[f].filter(o=>o.id!==op.id);if(typeof PICK!=='undefined')PICK=PICK.filter(id=>id!==op.id);persist();toast(`${op.name} has left the ${FACTIONS[f].label}`);viewRoster()}
