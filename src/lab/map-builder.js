/* ===================== MAP BUILDER (review page) =====================
   lab/map-builder.html is the real game page with this layer on top, so a
   map shows exactly as the game draws it. Claude edits the maps (sources in
   tools/maps); Matthew reviews here and leaves comments. Two views:
   - 3D: the map in the game, fog lifted, squad and stage-one enemies placed.
   - Plan: a flat top-down grid with coordinates (columns A.., rows 1..), so
     feedback can name a tile ("cover at F12").
   Overlays: heights, climb and jump routes, stages and spawns, objectives,
   and how far each build can get from the drop point in one, two or three
   turns. BUILDER_MAPS is embedded by tools/build.py. */
(function(){
if(typeof BUILDER_MAPS==='undefined')return;
const css=`#objPill,#menuBtn,#mapBtn,#rotR,#roster,#toasts,#undoBtn,#banner,#detail,#sheet,#objMark,#hud .tg{display:none!important}
#mb .row{display:flex;gap:6px;align-items:center;overflow-x:auto;scrollbar-width:none}#mb .row::-webkit-scrollbar{display:none}
#mb .panel{pointer-events:auto;background:#141c21ee;border:1px solid #2b383f;border-radius:10px;padding:6px 8px;margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}#mb .panel[hidden]{display:none}
#mb{position:fixed;left:0;right:0;top:0;z-index:50;font:14px/1.35 Barlow,system-ui,sans-serif;color:#eef2f3;pointer-events:none;padding:env(safe-area-inset-top,0) 8px 0}
#mb .bar{pointer-events:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:#141c21ee;border:1px solid #2b383f;border-radius:10px;padding:6px 8px;margin-top:6px}
#mb b.t{font:600 20px Teko,sans-serif;letter-spacing:.3px;margin-right:4px}#mb .v{background:#c9581c;color:#fff;border-radius:6px;padding:1px 7px;font-weight:700;font-size:12px}
#mb button,#mb select{font:inherit;font-size:13px;color:#eef2f3;background:#22303a;border:1px solid #3a4b55;border-radius:7px;padding:5px 9px;min-height:34px}
#mb button[aria-pressed=true]{background:#eef2f3;color:#141c21}
#mb .chg{pointer-events:auto;background:#141c21ee;border:1px solid #2b383f;border-radius:10px;padding:6px 10px;margin-top:6px;max-height:42vh;overflow:auto;font-size:13px}
#mb .chg ul{margin:4px 0 0 18px;padding:0}#mb .chg[hidden]{display:none}
#mbplan{position:fixed;inset:0;z-index:40;background:#10171b;touch-action:none}#mbplan[hidden]{display:none}#mbplan canvas{position:absolute;inset:0;width:100%;height:100%}
#mbtip{position:fixed;left:8px;right:8px;bottom:calc(10px + env(safe-area-inset-bottom,0));z-index:55;background:#141c21f0;border:1px solid #3a4b55;border-radius:10px;padding:8px 10px;color:#eef2f3;font:14px Barlow,sans-serif}#mbtip[hidden]{display:none}
#mbkey{pointer-events:auto;display:flex;gap:10px;flex-wrap:wrap;font-size:12px;background:#141c21ee;border:1px solid #2b383f;border-radius:10px;padding:5px 9px;margin-top:6px}#mbkey i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:4px;vertical-align:-1px}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const ui=document.createElement('div');ui.id='mb';document.body.appendChild(ui);
const plan=document.createElement('div');plan.id='mbplan';plan.hidden=true;plan.innerHTML='<canvas></canvas>';document.body.appendChild(plan);
const tip=document.createElement('div');tip.id='mbtip';tip.hidden=true;document.body.appendChild(tip);
const COLS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';const cName=(x,z)=>(x<26?COLS[x]:'A'+COLS[x-26])+(z+1);
let mi=0,view='plan',ov={heights:true,routes:true,stages:true,objectives:true,reach:'off'},stageSel=0,showChg=false;
const MP=()=>BUILDER_MAPS[mi];
let showLay=false;
function bar(){const m=MP();ui.innerHTML=`<div class="bar row"><b class="t">${m.title}</b><span class="v">v${m.version}</span>
  ${BUILDER_MAPS.length>1?`<select id="mbmap">${BUILDER_MAPS.map((x,i)=>`<option value="${i}"${i===mi?' selected':''}>${x.title} v${x.version}</option>`).join('')}</select>`:''}
  <button data-v="plan" aria-pressed="${view==='plan'}">Plan</button><button data-v="3d" aria-pressed="${view==='3d'}">3D</button>
  <button id="mbroof" aria-pressed="${!!window.ROOFS_LIFTED}">Lift roofs</button><button id="mblay" aria-pressed="${showLay}">Layers</button><button id="mbchg" aria-pressed="${showChg}">What changed</button></div>
  <div class="panel"${showLay?'':' hidden'}><button data-o="heights" aria-pressed="${ov.heights}">Heights</button><button data-o="routes" aria-pressed="${ov.routes}">Routes</button><button data-o="stages" aria-pressed="${ov.stages}">Stages</button><button data-o="objectives" aria-pressed="${ov.objectives}">Objectives</button>
  <select id="mbreach"><option value="off">Reach: off</option>${['light','medium','heavy'].map(b=>`<option value="${b}"${ov.reach===b?' selected':''}>Reach: ${b}</option>`).join('')}</select>
  <select id="mbstage">${(m.data.stages||[{name:'Map'}]).map((s,i)=>`<option value="${i}"${i===stageSel?' selected':''}>Stage ${i+1}: ${s.name}</option>`).join('')}</select>
  <div id="mbkey" style="margin:0;border:0;padding:2px 0;background:none">${view==='plan'?'<span><i style="background:#c8b07a"></i>ground</span><span><i style="background:#e8d9b0"></i>raised</span><span><i style="background:#2f6e8a"></i>water</span><span><i style="background:#000"></i>gap</span><span><i style="background:#6b4a2e"></i>cover</span><span><i style="background:#4a4f55"></i>building</span><span><i style="background:#b08aff"></i>tunnel</span><span><i style="background:#5fe8c0"></i>vent (lights)</span><span><i style="background:#ffd23a"></i>winch lift</span><span><i style="background:#3fbf6a"></i>drop point</span><span><i style="background:#e0483a"></i>enemy</span><span><i style="background:#ffd23a"></i>objective</span><span>Reach: green 1 turn, amber 2, orange 3</span>':'<span>Drag to pan, pinch to zoom, two fingers to turn. Fog lifted.</span>'}</div></div>
  <div class="chg"${showChg?'':' hidden'}><b>Version ${m.version}</b> · ${m.data.map[0].length} × ${m.data.map.length} tiles. Tap a tile in Plan for its name.<ul>${m.changes.map(c=>`<li>${c}</li>`).join('')}</ul></div>`;
  ui.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=b.dataset.v;apply()});
  ui.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{ov[b.dataset.o]=!ov[b.dataset.o];apply()});
  ui.querySelector('#mbroof').onclick=()=>{window.ROOFS_LIFTED=!window.ROOFS_LIFTED;bar()};ui.querySelector('#mbchg').onclick=()=>{showChg=!showChg;showLay=false;bar();pv.fit=true;draw()};ui.querySelector('#mblay').onclick=()=>{showLay=!showLay;showChg=false;bar();pv.fit=true;draw()};
  ui.querySelector('#mbreach').onchange=e=>{ov.reach=e.target.value;apply()};ui.querySelector('#mbstage').onchange=e=>{stageSel=+e.target.value;apply()};
  const sm=ui.querySelector('#mbmap');if(sm)sm.onchange=e=>{mi=+e.target.value;stageSel=0;load()}}
function apply(){bar();plan.hidden=view!=='plan';draw();marks3d()}

// ---------- game side ----------
function load(){const m=JSON.parse(JSON.stringify(MP().data));m.id=MP().id;THEME_OF[m.id]=MP().theme||'container';TIME_OF[m.id]=MP().time||'day';
  MECH_MARKS=true;CUR.faction='resistance';CUR.op=m.id;CUR.mi=-1;
  const ops=(SAVE.roster.resistance||[]).slice(0,4);show('game');startMission(m,ops);
  S.reveals.push({x:NX/2,z:NZ/2,r:999});S.alerted=true;computeVis();applyFog&&applyFog();for(const u of units)if(u.team==='e'){u.seen=true}
  try{refresh()}catch(e){}camState.zoom=.55;camState.target.set(0,0,0);apply()}
let mk=null;
function marks3d(){if(!scene)return;if(mk)scene.remove(mk);mk=new THREE.Group();scene.add(mk);
  const R=reachSet();if(R)for(const[k,d]of R){const[x,z]=k.split(',').map(Number),t=G[z][x],p=W(x,z),c=d.turn===1?0x3fbf6a:d.turn===2?0xe0b03a:0xe07a3a;const m=new THREE.Mesh(new THREE.PlaneGeometry(.86,.86),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.45,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(p.x,topY(t)+.05,p.z);mk.add(m)}}
function spawnsFor(si){const m=MP().data,st=(m.stages||[])[si];if(m.defend&&st&&st.pspawns)return st.pspawns;if(si>0&&st&&st.spawns)return st.spawns;const out=[];m.map.forEach((r,z)=>[...r].forEach((c,x)=>{if(c==='P'||c==='Q')out.push([x,z])}));return out}
function reachSet(){if(ov.reach==='off'||!G)return null;const B={light:7,medium:5,heavy:4}[ov.reach],out=new Map();
  for(const[sx,sz]of spawnsFor(stageSel)){const u={x:sx,z:sz,body:ov.reach,move:B*3,perks:new Set(),team:'p',cls:'soldier'};const r=reach(u,B*3);for(const[k,d]of r.d){const turn=d<=B?1:d<=B*2?2:3;const o=out.get(k);if(!o||o.turn>turn)out.set(k,{turn})}}return out}

// ---------- plan view ----------
const cv=plan.querySelector('canvas'),g2=cv.getContext('2d');let pv={s:20,ox:0,oy:0,fit:true};
function fitPlan(){const W2=cv.clientWidth,H2=cv.clientHeight,top=(ui.querySelector('.bar')?ui.querySelector('.bar').getBoundingClientRect().bottom:60)+14;pv.s=Math.max(8,Math.min((W2-36)/NX,(H2-top-20)/NZ));pv.ox=(W2-pv.s*NX)/2+8;pv.oy=top+12}
function draw(){if(view!=='plan'||!G)return;const dpr=Math.min(2,devicePixelRatio||1);cv.width=cv.clientWidth*dpr;cv.height=cv.clientHeight*dpr;g2.setTransform(dpr,0,0,dpr,0,0);if(pv.fit)fitPlan();
  const s=pv.s,X=x=>pv.ox+x*s,Y=z=>pv.oy+z*s,m=MP().data;g2.fillStyle='#10171b';g2.fillRect(0,0,cv.width,cv.height);
  const maxH=Math.max(1,...G.flat().map(t=>t.h));
  for(const row of G)for(const t of row){let c;if(t.type==='water')c='#2f6e8a';else if(t.type==='gap')c='#050708';else{const k=ov.heights?t.h/maxH:0;const a=[200,176,122],b=[244,234,206];c=`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*k)).join(',')})`;if(t.type==='ramp')c='#cfc6a8'}
    g2.fillStyle=c;g2.fillRect(X(t.x)+.5,Y(t.z)+.5,s-1,s-1);
    if(ov.heights&&t.h>0&&t.type!=='gap'&&s>=14){g2.fillStyle='#5a4a2a';g2.font=`${Math.round(s*.36)}px Barlow`;g2.fillText(t.type==='ramp'?'↗':String(t.h),X(t.x)+2,Y(t.z)+s*.36)}
    const ob=t.obj;if(ob==='bldg'){g2.fillStyle='#4a4f55';g2.fillRect(X(t.x)+.5,Y(t.z)+.5,s-1,s-1)}else if(ob&&ob!=='rail'&&ob!=='pt'){g2.fillStyle={crate:'#6b4a2e',wall:'#9a7a4a',sheet:'#b0603a',pillar:'#3a3d40',term:'#ffd23a',gate:'#333',door:'#3a5a7a',scaffold:'#a08040'}[ob]||'#555';const pad=ob==='wall'?s*.28:ob==='sheet'?s*.22:s*.14;g2.fillRect(X(t.x)+pad,Y(t.z)+pad,s-2*pad,s-2*pad)}
    if(t.pass){g2.strokeStyle=t.pass==='light'?'#5fe8ff':'#e8c85f';g2.lineWidth=2;g2.strokeRect(X(t.x)+3,Y(t.z)+3,s-6,s-6)}
    if(ov.routes){g2.fillStyle='#ffd23a';g2.font=`bold ${Math.round(s*.5)}px Barlow`;if(t.ladder)g2.fillText('L',X(t.x)+s*.3,Y(t.z)+s*.72);if(t.step)g2.fillText('s',X(t.x)+s*.32,Y(t.z)+s*.72);if(t.obj==='rail'){g2.fillStyle='#e2b21f';g2.fillRect(X(t.x)+s*.15,Y(t.z)+s*.45,s*.7,s*.1)}if(t.type==='gap'&&t.markedGap){g2.strokeStyle='#ffd23a';g2.lineWidth=1.5;g2.strokeRect(X(t.x)+2,Y(t.z)+2,s-4,s-4)}}
    if(t.exit){g2.fillStyle='#5fae7a';g2.fillRect(X(t.x)+s*.2,Y(t.z)+s*.2,s*.6,s*.6)}if(t.item){g2.fillStyle='#7dffd0';g2.beginPath();g2.arc(X(t.x)+s/2,Y(t.z)+s/2,s*.25,0,7);g2.fill()}}
  if(ov.routes)for(const zp of S.zips||[]){g2.strokeStyle='#7fe8ff';g2.lineWidth=2;g2.setLineDash([4,3]);g2.beginPath();g2.moveTo(X(zp.x1)+s/2,Y(zp.z1)+s/2);g2.lineTo(X(zp.x2)+s/2,Y(zp.z2)+s/2);g2.stroke();g2.setLineDash([])}
  // buildings: outline and name; tunnels: purple dashed links between manholes
  const BN={yard:'',home:'Container homes',cantina:'Cantina',office:'Port office',tower:'Watchtower',bridge:'Rope bridge',shack:'Shack',pump:'Pump house',tank:'Water tower',hall:'Market hall',warehouse:'Warehouse'};
  for(const b of (typeof BLD!=='undefined'?BLD:[])){g2.strokeStyle=b.t==='bridge'?'#c9a46a':b.t==='yard'?'#8a6a3a':'#1b2226';g2.lineWidth=b.t==='bridge'?2:2.5;g2.strokeRect(X(b.x)+1,Y(b.z)+1,b.w*s-2,b.d*s-2);
    if(b.t==='hall'||b.t==='warehouse'){g2.fillStyle='rgba(40,50,60,.12)';g2.fillRect(X(b.x),Y(b.z),b.w*s,b.d*s)}
    if(s*b.w>=40){g2.fillStyle='#1b2226';g2.font=`bold ${Math.max(9,Math.round(s*.38))}px Barlow`;g2.fillText(({market:'Market',fishery:'Fishery',clinic:'Clinic',works:'Foundry works',bar:'Bar terrace'})[b.use]||BN[b.t]||b.t,X(b.x)+3,Y(b.z+b.d)-4)}}
  for(const zn of m.zones||[]){const r=zn.r||1;g2.strokeStyle='#ffd23a';g2.lineWidth=3;g2.setLineDash([6,3]);g2.strokeRect(X(zn.x-r)+1,Y(zn.z-r)+1,(2*r+1)*s-2,(2*r+1)*s-2);g2.setLineDash([]);g2.fillStyle='rgba(255,210,58,.12)';g2.fillRect(X(zn.x-r),Y(zn.z-r),(2*r+1)*s,(2*r+1)*s);
    g2.fillStyle='#ffd23a';g2.font=`bold ${Math.max(10,Math.round(s*.42))}px Barlow`;g2.fillText(zn.name,X(zn.x-r)+3,Y(zn.z-r)-3)}
  for(const tn of S.tunnels||[]){g2.strokeStyle='#b08aff';g2.lineWidth=2.5;g2.setLineDash([3,4]);g2.beginPath();g2.moveTo(X(tn.x1)+s/2,Y(tn.z1)+s/2);g2.lineTo(X(tn.x2)+s/2,Y(tn.z2)+s/2);g2.stroke();g2.setLineDash([]);
    for(const[x,z]of[[tn.x1,tn.z1],[tn.x2,tn.z2]]){g2.fillStyle='#3a2a5a';g2.beginPath();g2.arc(X(x)+s/2,Y(z)+s/2,s*.3,0,7);g2.fill();g2.strokeStyle='#b08aff';g2.lineWidth=2;g2.stroke()}}
  for(const v of S.vents||[]){g2.strokeStyle='#5fe8c0';g2.lineWidth=2;g2.setLineDash([2,3]);g2.beginPath();g2.moveTo(X(v.x1)+s/2,Y(v.z1)+s/2);g2.lineTo(X(v.x2)+s/2,Y(v.z2)+s/2);g2.stroke();g2.setLineDash([]);for(const[x,z]of[[v.x1,v.z1],[v.x2,v.z2]]){g2.fillStyle='#1d4a40';g2.fillRect(X(x)+s*.22,Y(z)+s*.22,s*.56,s*.56);g2.strokeStyle='#5fe8c0';g2.strokeRect(X(x)+s*.22,Y(z)+s*.22,s*.56,s*.56)}}
  for(const w of S.winches||[]){g2.strokeStyle='#ffd23a';g2.lineWidth=3;g2.beginPath();g2.moveTo(X(w.x1)+s/2,Y(w.z1)+s/2);g2.lineTo(X(w.x2)+s/2,Y(w.z2)+s/2);g2.stroke();g2.fillStyle='#ffd23a';g2.beginPath();g2.arc(X(w.x1)+s/2,Y(w.z1)+s/2,s*.22,0,7);g2.fill();g2.font=`bold ${Math.round(s*.55)}px Barlow`;g2.fillText('▲',X(w.x2)+s*.22,Y(w.z2)+s*.7)}
  const R=reachSet();if(R)for(const[k,d]of R){const[x,z]=k.split(',').map(Number);g2.fillStyle=d.turn===1?'rgba(63,191,106,.42)':d.turn===2?'rgba(224,176,58,.38)':'rgba(224,122,58,.3)';g2.fillRect(X(x)+1,Y(z)+1,s-2,s-2)}
  const st=(m.stages||[])[stageSel];
  if(ov.stages&&st){for(const[x,z]of spawnsFor(stageSel)){g2.fillStyle='#3fbf6a';g2.beginPath();g2.arc(X(x)+s/2,Y(z)+s/2,s*.32,0,7);g2.fill()}
    const en=m.defend?(st.espawns||[]).map(([x,z])=>['attacker',x,z]):[...(st.enemies||[]),...(st.reinf||[]).flatMap(w=>w[1])];for(const[ty,x,z]of en){g2.fillStyle='#e0483a';g2.beginPath();g2.arc(X(x)+s/2,Y(z)+s/2,s*.28,0,7);g2.fill();if(s>=16){g2.fillStyle='#fff';g2.font=`bold ${Math.round(s*.36)}px Barlow`;g2.fillText((ty[0]||'').toUpperCase(),X(x)+s*.36,Y(z)+s*.64)}}
    if(st.front!=null){g2.strokeStyle='#c9581c';g2.lineWidth=2;g2.setLineDash([6,4]);g2.beginPath();g2.moveTo(X(0),Y(st.front+1));g2.lineTo(X(NX),Y(st.front+1));g2.stroke();g2.setLineDash([])}}
  if(ov.objectives&&st)for(const o of st.objectives||[]){const pts=o.targets||(o.path?[o.path[0],o.path[o.path.length-1]]:[]);for(const[x,z]of pts){g2.strokeStyle='#ffd23a';g2.lineWidth=3;g2.strokeRect(X(x)+1,Y(z)+1,s-2,s-2)}
    if(o.path){g2.strokeStyle='rgba(255,210,58,.7)';g2.lineWidth=2;g2.beginPath();o.path.forEach(([x,z],i)=>i?g2.lineTo(X(x)+s/2,Y(z)+s/2):g2.moveTo(X(x)+s/2,Y(z)+s/2));g2.stroke()}}
  // grid labels
  g2.fillStyle='#9fb0b8';g2.font=`${Math.max(9,Math.round(s*.42))}px Barlow`;for(let x=0;x<NX;x++)g2.fillText(cName(x,0).replace(/\d+/,''),X(x)+s*.32,Y(0)-4);for(let z=0;z<NZ;z++)g2.fillText(String(z+1),pv.ox-s*.95,Y(z)+s*.68)}
let pdrag=null,pinch=null;const pts=new Map();
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===1)pdrag={x:e.clientX,y:e.clientY,ox:pv.ox,oy:pv.oy,moved:false};else if(pts.size===2){const[a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:pv.s,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,ox:pv.ox,oy:pv.oy};pdrag=null}});
cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&pts.size===2){const[a,b]=[...pts.values()],k=Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,ns=Math.max(6,Math.min(80,pinch.s*k));pv.fit=false;pv.ox=pinch.cx-(pinch.cx-pinch.ox)*ns/pinch.s;pv.oy=pinch.cy-(pinch.cy-pinch.oy)*ns/pinch.s;pv.s=ns;draw()}
  else if(pdrag){const dx=e.clientX-pdrag.x,dy=e.clientY-pdrag.y;if(Math.hypot(dx,dy)>6)pdrag.moved=true;if(pdrag.moved){pv.fit=false;pv.ox=pdrag.ox+dx;pv.oy=pdrag.oy+dy;draw()}}});
cv.addEventListener('pointerup',e=>{pts.delete(e.pointerId);if(pdrag&&!pdrag.moved){const x=Math.floor((e.clientX-pv.ox)/pv.s),z=Math.floor((e.clientY-pv.oy)/pv.s);if(x>=0&&z>=0&&x<NX&&z<NZ){const t=G[z][x];const bits=[`<b>${cName(x,z)}</b>`,t.type==='water'?'water':t.type==='gap'?'gap':t.type==='ramp'?'stairs':`level ${t.h}`];if(t.obj)bits.push({bldg:'building (full cover, blocks sight)',crate:'crate (full cover)',wall:'barricade (half cover)',sheet:'sheet wall (full cover, heavies charge through)',pillar:'pillar (full cover)',term:'objective',gate:'gate',door:'door',scaffold:'scaffold',rail:'vault rail',pt:'trap or point'}[t.obj]||t.obj);if(t.ladder)bits.push('ladder');if(t.step)bits.push('climb step');if(t.pass)bits.push(t.pass==='light'?'crawl vent':'narrow gap');if(t.bld)bits.push({home:'container homes',cantina:'cantina',office:'port office',tower:'watchtower',bridge:'rope bridge',shack:'shack',pump:'pump house',tank:'water tower',hall:'market hall (roofed)',warehouse:'warehouse (roofed)'}[t.bld.t]);if(t.tunnel)bits.push('drain tunnel entrance');if(t.vent)bits.push('vent crawlspace (lights)');if(t.winch)bits.push('winch lift foot (lights, mediums)');if(t.winchTop)bits.push('winch lift top');tip.innerHTML=bits.join(' · ');tip.hidden=false}else tip.hidden=true}if(pts.size<2)pinch=null;pdrag=null});
cv.addEventListener('wheel',e=>{e.preventDefault();const k=e.deltaY>0?.9:1.1,ns=Math.max(6,Math.min(80,pv.s*k));pv.fit=false;pv.ox=e.clientX-(e.clientX-pv.ox)*ns/pv.s;pv.oy=e.clientY-(e.clientY-pv.oy)*ns/pv.s;pv.s=ns;draw()},{passive:false});
addEventListener('resize',()=>{pv.fit=true;draw()});
window.BUILDER={roofs:v=>{window.ROOFS_LIFTED=v;bar()},load:i=>{mi=i;load()},view:v=>{view=v;apply()},set:(k,v)=>{ov[k]=v;apply()},stage:i=>{stageSel=i;apply()}};
const go=()=>{if(typeof RIG!=='undefined'&&RIG.ready)RIG.ready.then(()=>{load();window.BUILDER_READY=true});else{load();window.BUILDER_READY=true}};
if(document.readyState==='complete')setTimeout(go,300);else addEventListener('load',()=>setTimeout(go,300));
})();
