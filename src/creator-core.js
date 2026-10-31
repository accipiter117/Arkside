
const FACTIONS={
  security:{label:'Security',accent:'#2a7fbd',blurb:'Keep the Ark’s last resources under control, whatever it takes.',
    pal:['#2b3d55','#4a5e73','#d4d9dc','#22272c','#6c8ca6','#8b9196'],names:['Navy','Slate','Ice','Black','Steel','Concrete']},
  resistance:{label:'Resistance',accent:'#c9581c',blurb:'An equal share of the water, and a way to reach the outside world.',
    pal:['#7a3c22','#8b7b55','#525c3b','#5a4636','#a5462f','#2e2b28'],names:['Rust','Khaki','Olive','Mud','Brick','Soot']}
};
const SKIN=['#f2d3b8','#e3b691','#c99067','#a7704b','#7c4f33','#55351f'];
const HAIRC=['#1a1613','#3a2618','#6a4226','#a5722f','#d9b76c','#9b9a96','#ece6da','#a62d2d','#2e6e8e'];
const BODY={
  light:{label:'Light',hp:80,move:7,agil:3,fire:1,trav:'wall-hops, vents and rooftops',
    sh:29,wa:19,hip:21,leg:11,arm:8,neck:7,shY:104,waistY:166,hipY:178,kneeY:228,footY:284,headY:73},
  medium:{label:'Medium',hp:110,move:5,agil:2,fire:2,trav:'climbs ledges to head height',
    sh:37,wa:26,hip:26,leg:13.5,arm:10.5,neck:9,shY:106,waistY:168,hipY:180,kneeY:229,footY:284,headY:74},
  heavy:{label:'Heavy',hp:150,move:4,agil:1,fire:3,trav:'vaults waist-high cover only',
    sh:50,wa:40,hip:34,leg:17,arm:14,neck:13,shY:110,waistY:172,hipY:184,kneeY:232,footY:284,headY:79}
};
const CLASSES={
  soldier:{label:'Soldier',abil:'Breach charges, ammo resupply, grenades',desc:'Blows open sealed objectives and keeps the squad stocked with ammo.'},
  medic:{label:'Medic',abil:'Revive, patch up, adrenaline boost',desc:'Gets downed allies back on their feet and is the only class that can self-revive.'},
  engineer:{label:'Engineer',abil:'Build cover and turrets, repair, disarm',desc:'Fortifies positions, repairs objectives and upgrades the squad’s armour.'},
  operative:{label:'Operative',abil:'Hack, disguise, recon',desc:'Hacks terminals, wears the enemy’s uniform and spots hidden mines.'}
};
const WEAPONS={
  mpistol:{label:'Machine pistol',bodies:['light'],fore:.45},
  smg:{label:'SMG',bodies:['light','medium'],fore:.85},
  rifle:{label:'Assault rifle',bodies:['medium','heavy'],fore:1},
  shotgun:{label:'Shotgun',bodies:['medium','heavy'],fore:1},
  lmg:{label:'LMG',bodies:['heavy'],fore:1},
  minigun:{label:'Minigun',bodies:['heavy'],fore:.75}
};
const OPTS={
  face:[['long','Long'],['square','Square'],['angular','Angular'],['broad','Broad']],
  expr:[['neutral','Neutral'],['grim','Grim'],['smirk','Smirk'],['snarl','Snarl']],
  facial:[['none','Clean shaven'],['stubble','Stubble'],['moustache','Moustache'],['goatee','Goatee'],['chops','Mutton chops'],['beard','Full beard']],
  mark:[['none','None'],['scar','Scar'],['tattoo','Face tattoo'],['paint','War paint'],['patch','Eye patch']],
  hair:[['shaved','Shaved'],['buzz','Buzz cut'],['crop','Crop'],['mohawk','Mohawk'],['spiky','Spiky'],['slick','Slicked'],['topknot','Top knot'],['dreads','Dreads']],
  headgear:[['none','None'],['beanie','Beanie'],['cap','Cap'],['bandana','Bandana'],['helmet','Combat helmet'],['riothelm','Riot helmet','security'],['headset','Headset'],['goggles','Goggles']],
  facegear:[['none','None'],['mask','Bandana mask'],['respirator','Respirator'],['shades','Shades'],['hud','HUD visor']],
  top:[['tee','T-shirt'],['tank','Tank top'],['long','Long sleeve'],['hoodie','Hoodie'],['jacket','Jacket']],
  armour:[['none','None','No bonus'],['rig','Chest rig','+5 health'],['carrier','Plate carrier','+10 health'],['riot','Riot armour','+25 health, −1 move','security'],['scrap','Scrap armour','+15 health','resistance']],
  legs:[['cargo','Cargo'],['armoured','Armoured'],['jeans','Jeans']],
  gloves:[['none','None'],['fingerless','Fingerless'],['tactical','Tactical']]
};
const ARMOUR_MOD={none:{hp:0,move:0},rig:{hp:5,move:0},carrier:{hp:10,move:0},riot:{hp:25,move:-1},scrap:{hp:15,move:0}};
const FACES={long:{rx:15,ry:23,j:.6},square:{rx:17,ry:21,j:.86},angular:{rx:16,ry:22,j:.42},broad:{rx:19,ry:20,j:.92}};
const COVER=new Set(['beanie','cap','bandana','helmet','riothelm']);
const NAMES=['Kestrel','Rook','Mako','Juno','Brask','Vex','Tamsin','Okoro','Dace','Halloran','Ines','Petra','Silas','Wren','Yusuf','Moss','Ada','Corin','Bex','Tavi'];
const CALLSIGNS=['Undertow','Bilge Rat','Breakwater','Gull','Saltwater','Rivet','Static','Ghost Tide','Ballast','Riptide','Barnacle','Lighthouse','Floodgate','Drydock','Squall'];
const DEFAULT={name:'Kestrel',callsign:'Undertow',faction:'resistance',body:'medium',cls:'soldier',weapon:'rifle',skin:2,face:'square',expr:'grim',facial:'stubble',mark:'none',hair:'buzz',hairCol:1,headgear:'none',facegear:'none',top:'tee',armour:'rig',legs:'cargo',gloves:'fingerless',primary:0,secondary:1};

/* ---------- Helpers ---------- */
const $=q=>document.querySelector(q);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function shade(hex,p){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const t=p<0?0:255,f=Math.abs(p)/100;r=Math.round(r+(t-r)*f);g=Math.round(g+(t-g)*f);b=Math.round(b+(t-b)*f);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
const OL='#17140f';
const RC='fill="none" stroke-linecap="round" stroke-linejoin="round"';
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function load(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
function clean(o){const s={...DEFAULT};if(o&&typeof o==='object'){for(const k in DEFAULT){if(k in o&&typeof o[k]===typeof DEFAULT[k])s[k]=o[k]}}
  if(!FACTIONS[s.faction])s.faction=DEFAULT.faction;if(!BODY[s.body])s.body=DEFAULT.body;if(!CLASSES[s.cls])s.cls=DEFAULT.cls;if(!FACES[s.face])s.face=DEFAULT.face;
  for(const k of ['expr','facial','mark','hair','headgear','facegear','top','armour','legs','gloves']){if(!OPTS[k].some(x=>x[0]===s[k]))s[k]=DEFAULT[k]}
  s.skin=Math.min(SKIN.length-1,Math.max(0,s.skin|0));s.hairCol=Math.min(HAIRC.length-1,Math.max(0,s.hairCol|0));s.primary=Math.min(5,Math.max(0,s.primary|0));s.secondary=Math.min(5,Math.max(0,s.secondary|0));
  s.name=String(s.name).slice(0,18);s.callsign=String(s.callsign).slice(0,22);return normalize(s)}
function normalize(s){
  const ok=Object.keys(WEAPONS).filter(w=>WEAPONS[w].bodies.includes(s.body));
  if(!ok.includes(s.weapon))s.weapon=s.body==='heavy'?'minigun':s.body==='light'?'smg':'rifle';
  for(const key of ['headgear','armour']){const o=OPTS[key].find(x=>x[0]===s[key]);const fac=key==='armour'?o&&o[3]:o&&o[2];if(fac&&fac!==s.faction)s[key]=key==='armour'?'carrier':'helmet'}
  return s;
}

/* ---------- Drawing ---------- */
function backdrop(s,p){
  const c=s.faction==='security'?{t:'#0f2133',m:'#35617f',g:'#cfe7f3',sea:'#0d2333',tw:'#0a1622',lt:'#9fd3ef'}:{t:'#1f120d',m:'#8a4220',g:'#ffcf88',sea:'#1c1f24',tw:'#160d09',lt:'#ffb35c'};
  const acc=FACTIONS[s.faction].accent;
  let h=`<defs><linearGradient id="${p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.t}"/><stop offset=".7" stop-color="${c.m}"/><stop offset="1" stop-color="${c.g}"/></linearGradient><radialGradient id="${p}gl"><stop offset="0" stop-color="${c.g}" stop-opacity=".85"/><stop offset="1" stop-color="${c.g}" stop-opacity="0"/></radialGradient></defs>`;
  h+=`<rect x="-400" y="-200" width="1000" height="445" fill="url(#${p}sky)"/><circle cx="150" cy="236" r="80" fill="url(#${p}gl)"/>`;
  h+=`<ellipse cx="-30" cy="245" rx="80" ry="46" fill="${c.tw}" opacity=".6"/>`;
  const T=[[-150,160,26],[-110,128,18],[-60,150,22],[-28,118,16],[8,168,14],[28,96,20],[56,140,12],[138,112,18],[162,150,14],[184,86,24],[214,158,16],[238,124,20],[266,142,18],[300,110,22],[330,150,18]];
  for(const [x,y,w] of T){
    h+=`<rect x="${x}" y="${y}" width="${w}" height="${245-y}" fill="${c.tw}" opacity=".72"/><path d="M${x+w/2} ${y} V${y-14}" stroke="${c.tw}" stroke-width="1.3" opacity=".72"/>`;
    for(let yy=y+6;yy<238;yy+=9)for(let xx=x+3;xx<x+w-3;xx+=5){if(((xx*7+yy*13)%5+5)%5===0)h+=`<rect x="${xx}" y="${yy}" width="1.7" height="2.4" fill="${c.lt}" opacity=".6"/>`}
  }
  h+=`<rect x="-400" y="243" width="1000" height="200" fill="${c.sea}"/><rect x="-400" y="243" width="1000" height="1.2" fill="${c.g}" opacity=".5"/>`;
  for(const [x,y] of [[-40,252],[20,258],[70,250],[130,262],[180,254],[240,260],[-90,262]])h+=`<path d="M${x} ${y} q5 -2 10 0 t10 0" stroke="${c.g}" stroke-width="1" opacity=".25" fill="none"/>`;
  h+=`<rect x="-400" y="277" width="1000" height="200" fill="#232528"/><rect x="-400" y="275" width="1000" height="3" fill="#47494d"/>`;
  for(let x=-200;x<420;x+=14)h+=`<path d="M${x} 279 h7 l-4 6 h-7 Z" fill="${acc}" opacity=".75"/>`;
  return h;
}

function weaponSvg(t,d,fur,acc){
  const M1='#2b2e32',M2='#464b51';
  const r=(x,y,w,h,f,rr=1.5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rr}" fill="${f}"/>`;
  const grip=`<path d="M1 4 L8 4 L6.5 15 L-.5 14 Z" fill="${M1}"/>`;
  switch(t){
    case 'rifle':return `<path d="M-30 -2 L-4 -5 L-4 6 L-30 11 Z" fill="${fur}"/><path d="M${d*.25} 5 L${d*.25+9} 5 L${d*.25+13} 21 L${d*.25+4} 22 Z" fill="${M1}"/>`+grip+r(-4,-6,d*.55+8,11,M2)+r(d*.5,-5,d*.5+16,9,fur)+r(d+16,-2,20,4,M1,.5)+r(d+34,-3,6,6,M1,1)+r(d*.12,-11,15,5,M1,1);
    case 'smg':return `<path d="M-6 -2 H-22 V5 H-6" fill="none" stroke-width="1.8"/>`+r(d*.28,4,7,22,M1,1)+grip+r(-6,-6,d*.8+10,11,M2)+r(d*.8+3,-4,14,7,M1,1)+r(d*.8+15,-3.5,20,6,M1,2.5)+r(d*.3,-9,8,3,acc,.5);
    case 'mpistol':return r(-1,4,6,22,M1,1)+r(d-2,4,4,8,M1,1)+r(-3,1,d+9,4,M1,1)+r(-4,-5,d+14,7,M2,1.5)+r(d+10,-3.5,4,4,M1,.5);
    case 'shotgun':return `<path d="M-32 -1 L-4 -5 L-4 6 L-32 12 Z" fill="${fur}"/>`+grip+r(-4,-6,d*.45+6,11,M2)+r(d*.45,-5,d*.55+40,4,M1,.5)+r(d*.45,-1,d*.55+34,4,M2,1)+r(d-10,-2,20,8,fur,2)+`<path d="M${d-5} -1 v6 M${d} -1 v6 M${d+5} -1 v6" stroke-width=".9"/>`;
    case 'lmg':{let holes='';for(let x=d*.65;x<d+18;x+=5)holes+=`<circle cx="${x}" cy="-1" r="1.2" fill="#0d0d0d" stroke="none"/>`;
      return `<path d="M-30 -3 L-4 -7 L-4 7 L-30 9 Z" fill="${fur}"/>`+r(d*.15,5,20,16,'#3d4a2d',2)+grip+r(-4,-8,d*.62+8,15,M2,2)+`<path d="M${d*.1} -8 L${d*.15} -14 L${d*.45} -14 L${d*.5} -8" fill="none" stroke-width="2.4"/>`+r(d*.6,-5,d*.4+22,9,M1,1)+holes+r(d+22,-2,18,4,M1,.5)+`<path d="M${d+20} 4 L${d+4} 9 M${d+20} 4 L${d+2} 6" fill="none" stroke-width="1.6"/>`;}
    case 'minigun':{let b='';for(const y of [-7,-1.8,3.4])b+=r(d*.55,y,d*.45+52,3.6,M1,1);
      return `<path d="M${d*.1} 10 Q-6 34 -34 30" fill="none" stroke="#b8933f" stroke-width="6"/><path d="M${d*.1} 10 Q-6 34 -34 30" fill="none" stroke="#6e5420" stroke-width="6" stroke-dasharray="1.5 2.5"/>`+
        `<path d="M-16 -10 H-25 V8 H-16" fill="none" stroke-width="3"/>`+r(-16,-11,d*.55+16,22,M2,4)+r(-10,-7,10,14,M1,2)+b+r(d*.85,-9,5,18,M2,1)+r(d+40,-9,4,18,M2,1)+r(-2,-3,8,6,acc,1)+`<path d="M${d*.1} -11 L${d*.2} -18 L${d*.5} -18 L${d*.55} -11" fill="none" stroke-width="3"/>`;}
  }
  return '';
}

function render(s,p,bg){
  const B=BODY[s.body],Fc=FACTIONS[s.faction],cx=100;
  const {sh,wa,hip,leg,arm,neck,shY,waistY,hipY,kneeY,footY}=B;
  const skin=SKIN[s.skin],sk2=shade(skin,-16),sk3=shade(skin,-32),hc=HAIRC[s.hairCol];
  const c1=Fc.pal[s.primary],c2=Fc.pal[s.secondary],acc=Fc.accent,sec=s.faction==='security';
  const fur=sec?'#3a4048':'#7a5331',boot=sec?'#1f2328':'#2e2620';
  const fc=FACES[s.face],k=s.body==='heavy'?1.04:1,rx=fc.rx*k,ry=fc.ry*k,jx=rx*fc.j,hy=B.headY;
  const eyeY=hy+1,ex=rx*.4,my=hy+ry*.7;
  const o=[];const a=x=>o.push(x);
  const headD=`M${cx-rx} ${hy} C${cx-rx} ${hy-ry*1.3} ${cx+rx} ${hy-ry*1.3} ${cx+rx} ${hy} C${cx+rx} ${hy+ry*.45} ${cx+jx} ${hy+ry*.68} ${cx+jx} ${hy+ry*.82} Q${cx+jx*.65} ${hy+ry*1.06} ${cx} ${hy+ry*1.06} Q${cx-jx*.65} ${hy+ry*1.06} ${cx-jx} ${hy+ry*.82} C${cx-jx} ${hy+ry*.68} ${cx-rx} ${hy+ry*.45} ${cx-rx} ${hy} Z`;
  const torsoD=`M${cx-sh*.35} ${shY-8} Q${cx-sh} ${shY-8} ${cx-sh} ${shY+14} L${cx-wa} ${waistY} L${cx-hip} ${hipY} L${cx+hip} ${hipY} L${cx+wa} ${waistY} L${cx+sh} ${shY+14} Q${cx+sh} ${shY-8} ${cx+sh*.35} ${shY-8} Z`;
  a(`<defs><clipPath id="${p}h"><path d="${headD}"/></clipPath><clipPath id="${p}t"><path d="${torsoD}"/></clipPath></defs>`);
  if(bg)a(backdrop(s,p));
  a(`<ellipse cx="${cx}" cy="${footY+2}" rx="${sh+16}" ry="5" fill="#000" opacity=".32"/>`);

  /* legs */
  for(const sd of [-1,1]){
    const t={x:cx+sd*hip*.5,y:hipY-6},kn={x:cx+sd*(hip*.55+1),y:kneeY},an={x:cx+sd*(hip*.6+2),y:footY-12};
    const d=`M${t.x} ${t.y} L${kn.x} ${kn.y} L${an.x} ${an.y}`;
    a(`<path d="${d}" stroke="${OL}" stroke-width="${leg*2+3}" ${RC}/><path d="${d}" stroke="${c2}" stroke-width="${leg*2}" ${RC}/>`);
    a(`<path d="M${t.x+sd*leg*.55} ${t.y+6} L${kn.x+sd*leg*.55} ${kn.y} L${an.x+sd*leg*.5} ${an.y}" stroke="#000" stroke-opacity=".16" stroke-width="${leg*.8}" ${RC}/>`);
    if(s.legs==='cargo'){const px=(t.x+kn.x)/2+sd*leg*.3,py=hipY+20;a(`<rect x="${px-leg*.5}" y="${py}" width="${leg}" height="17" rx="2" fill="${shade(c2,-14)}" stroke="${OL}" stroke-width="1"/><rect x="${px-leg*.5}" y="${py}" width="${leg}" height="5" rx="1.5" fill="${shade(c2,-26)}" stroke="${OL}" stroke-width="1"/>`)}
    if(s.legs==='armoured'){a(`<rect x="${(t.x+kn.x)/2-leg*.6}" y="${hipY+16}" width="${leg*1.2}" height="20" rx="3" fill="${shade(c2,-30)}" stroke="${OL}" stroke-width="1"/><rect x="${kn.x-leg*.85}" y="${kn.y-9}" width="${leg*1.7}" height="18" rx="6" fill="#2b2d30" stroke="${OL}" stroke-width="1.2"/><path d="M${kn.x-leg*.5} ${kn.y-2} H${kn.x+leg*.5}" stroke="#5a5f64" stroke-width="1.4"/>`)}
    if(s.legs==='jeans'){a(`<path d="M${t.x-sd*leg*.4} ${t.y+4} L${kn.x-sd*leg*.4} ${kn.y} L${an.x-sd*leg*.4} ${an.y-2}" stroke="${shade(c2,35)}" stroke-width=".9" stroke-dasharray="2 2" ${RC}/><ellipse cx="${kn.x}" cy="${kn.y-4}" rx="${leg*.55}" ry="7" fill="#fff" opacity=".13"/>`)}
    a(`<rect x="${an.x-leg*1.2}" y="${footY-14}" width="${leg*2.4}" height="15" rx="5" fill="${boot}" stroke="${OL}" stroke-width="1.4"/><rect x="${an.x-leg*1.28}" y="${footY-1}" width="${leg*2.56}" height="4" rx="2" fill="#0f0e0c"/><path d="M${an.x-leg*.5} ${footY-10} h${leg} M${an.x-leg*.5} ${footY-6.5} h${leg}" stroke="#55504a" stroke-width="1"/>`);
  }

  /* neck and torso */
  const nTop=hy+ry*.45;
  a(`<rect x="${cx-neck}" y="${nTop}" width="${neck*2}" height="${shY-nTop+2}" fill="${sk2}" stroke="${OL}" stroke-width="1.2"/>`);
  if(s.top==='tank'){
    a(`<path d="${torsoD}" fill="${skin}" stroke="${OL}" stroke-width="1.5"/>`);
    a(`<path d="M${cx-sh*.42} ${shY-6} L${cx-sh*.5} ${shY+16} Q${cx-sh*.9} ${shY+24} ${cx-wa} ${waistY} L${cx-hip} ${hipY} L${cx+hip} ${hipY} L${cx+wa} ${waistY} Q${cx+sh*.9} ${shY+24} ${cx+sh*.5} ${shY+16} L${cx+sh*.42} ${shY-6} L${cx+sh*.22} ${shY-6} Q${cx} ${shY+14} ${cx-sh*.22} ${shY-6} Z" fill="${c1}" stroke="${OL}" stroke-width="1.5"/>`);
  } else a(`<path d="${torsoD}" fill="${c1}" stroke="${OL}" stroke-width="1.5"/>`);
  a(`<g clip-path="url(#${p}t)"><rect x="${cx+sh*.22}" y="${shY-12}" width="${sh}" height="${hipY-shY+16}" fill="#000" opacity=".15"/><path d="M${cx-sh*.5} ${shY+24} Q${cx-sh*.2} ${shY+30} ${cx-2} ${shY+22} M${cx+2} ${shY+22} Q${cx+sh*.2} ${shY+30} ${cx+sh*.5} ${shY+24}" stroke="#000" stroke-opacity=".18" stroke-width="1.3" fill="none"/></g>`);
  if(s.top==='tee'||s.top==='long'||s.top==='hoodie'){
    a(`<path d="M${cx-neck-2} ${shY-8} Q${cx} ${shY+5} ${cx+neck+2} ${shY-8} Z" fill="${sk2}"/><path d="M${cx-neck-2} ${shY-8} Q${cx} ${shY+5} ${cx+neck+2} ${shY-8}" stroke="${shade(c1,-30)}" stroke-width="2.2" ${RC}/>`);
  }
  if(s.top==='hoodie'){
    a(`<path d="M${cx-wa*.7} ${waistY-12} L${cx+wa*.7} ${waistY-12} L${cx+wa*.85} ${hipY-4} L${cx-wa*.85} ${hipY-4} Z" fill="${shade(c1,-10)}" stroke="${OL}" stroke-width="1"/><path d="M${cx-4} ${shY} L${cx-5} ${shY+22} M${cx+4} ${shY} L${cx+5} ${shY+22}" stroke="#e7e2d6" stroke-width="1.4" ${RC}/>`);
  }
  if(s.top==='jacket'){
    a(`<path d="M${cx-sh*.3} ${shY-8} L${cx+sh*.3} ${shY-8} L${cx+4} ${hipY} L${cx-4} ${hipY} Z" fill="${shade(c2,22)}" stroke="${OL}" stroke-width="1"/><path d="M${cx-neck-1} ${shY-8} Q${cx} ${shY+2} ${cx+neck+1} ${shY-8} Z" fill="${sk2}"/>`);
    a(`<path d="M${cx-sh*.33} ${shY-9} L${cx-neck-5} ${shY+13} L${cx-sh*.58} ${shY+2} Z M${cx+sh*.33} ${shY-9} L${cx+neck+5} ${shY+13} L${cx+sh*.58} ${shY+2} Z" fill="${shade(c1,-15)}" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"/>`);
  }

  /* armour */
  if(s.armour==='carrier'){
    const vc=shade(c2,-38),pw=wa*.58;
    a(`<path d="M${cx-sh*.62} ${shY+2} L${cx-sh*.3} ${shY+1} Q${cx} ${shY+12} ${cx+sh*.3} ${shY+1} L${cx+sh*.62} ${shY+2} L${cx+wa} ${waistY+4} L${cx-wa} ${waistY+4} Z" fill="${vc}" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>`);
    for(const sd of [-1,1])a(`<path d="M${cx+sd*sh*.62} ${shY+2} L${cx+sd*sh*.46} ${shY-7} L${cx+sd*sh*.31} ${shY-7} L${cx+sd*sh*.3} ${shY+1} Z" fill="${vc}" stroke="${OL}" stroke-width="1.2"/>`);
    for(const i of [-1,0,1])a(`<rect x="${cx+i*pw*1.12-pw/2}" y="${waistY-15}" width="${pw}" height="17" rx="2" fill="${shade(vc,14)}" stroke="${OL}" stroke-width="1"/><path d="M${cx+i*pw*1.12-pw/2} ${waistY-10} h${pw}" stroke="${OL}" stroke-width=".8"/>`);
    a(`<rect x="${cx-sh*.26}" y="${shY+13}" width="${sh*.52}" height="6" rx="1" fill="#e6e1d4" opacity=".9"/><rect x="${cx-sh*.26}" y="${shY+13}" width="4" height="6" fill="${acc}"/>`);
  }
  if(s.armour==='rig'){
    const rcol=shade(c2,-28),bw=wa*1.9,mw=(bw-6)/4;
    for(const sd of [-1,1])a(`<path d="M${cx+sd*sh*.42} ${shY-6} L${cx+sd*wa*.55} ${waistY-16}" stroke="${OL}" stroke-width="7" ${RC}/><path d="M${cx+sd*sh*.42} ${shY-6} L${cx+sd*wa*.55} ${waistY-16}" stroke="${rcol}" stroke-width="5" ${RC}/>`);
    for(let i=0;i<4;i++)a(`<rect x="${cx-bw/2+3+i*mw+1}" y="${waistY-25}" width="${mw-2}" height="10" rx="1" fill="#2f3134" stroke="${OL}" stroke-width=".9"/>`);
    a(`<rect x="${cx-bw/2}" y="${waistY-20}" width="${bw}" height="16" rx="3" fill="${rcol}" stroke="${OL}" stroke-width="1.3"/>`);
    for(let i=1;i<4;i++)a(`<path d="M${cx-bw/2+3+i*mw} ${waistY-20} v16" stroke="${OL}" stroke-width=".8"/>`);
  }
  if(s.armour==='riot'){
    const rp='#cfd6db',rd='#a7b1b8';
    for(let i=0;i<3;i++)a(`<rect x="${cx-wa*.78+i}" y="${waistY-10+i*7}" width="${(wa*.78-i)*2}" height="7" rx="2" fill="${rd}" stroke="${OL}" stroke-width="1"/>`);
    a(`<path d="M${cx-sh*.66} ${shY+1} L${cx-sh*.28} ${shY-2} Q${cx} ${shY+8} ${cx+sh*.28} ${shY-2} L${cx+sh*.66} ${shY+1} L${cx+wa*.95} ${waistY-10} Q${cx} ${waistY-2} ${cx-wa*.95} ${waistY-10} Z" fill="${rp}" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`);
    a(`<path d="M${cx-3} ${shY+6} H${cx+3} V${waistY-6} H${cx-3} Z" fill="${acc}"/><path d="M${cx-sh*.5} ${shY+6} Q${cx-sh*.3} ${shY+22} ${cx-wa*.7} ${waistY-14}" stroke="#fff" stroke-opacity=".55" stroke-width="1.5" fill="none"/>`);
    a(`<path d="M${cx-neck-5} ${shY-5} Q${cx} ${shY+3} ${cx+neck+5} ${shY-5} L${cx+neck+4} ${shY-11} Q${cx} ${shY-4} ${cx-neck-4} ${shY-11} Z" fill="${rd}" stroke="${OL}" stroke-width="1.2"/>`);
  }
  if(s.armour==='scrap'){
    const ph=(waistY-shY);
    a(`<g transform="rotate(-7 ${cx-sh*.27} ${shY+20})"><rect x="${cx-sh*.58}" y="${shY+4}" width="${sh*.56}" height="${ph*.55}" rx="2" fill="#8b4a2a" stroke="${OL}" stroke-width="1.3"/><circle cx="${cx-sh*.52}" cy="${shY+8}" r="1.2" fill="#e0d4bb"/><circle cx="${cx-sh*.08}" cy="${shY+8}" r="1.2" fill="#e0d4bb"/><circle cx="${cx-sh*.52}" cy="${shY+ph*.5}" r="1.2" fill="#e0d4bb"/></g>`);
    a(`<g transform="rotate(6 ${cx+sh*.27} ${shY+20})"><rect x="${cx+1}" y="${shY+8}" width="${sh*.5}" height="${ph*.48}" rx="2" fill="#7f858b" stroke="${OL}" stroke-width="1.3"/><path d="M${cx+4} ${shY+14} h${sh*.4} M${cx+4} ${shY+20} h${sh*.3}" stroke="#5c6166" stroke-width="1"/></g>`);
    a(`<rect x="${cx-wa*.6}" y="${waistY-18}" width="${wa*1.1}" height="13" rx="2" fill="#6d6a5e" stroke="${OL}" stroke-width="1.2" transform="rotate(-3 ${cx} ${waistY-12})"/>`);
    a(`<path d="M${cx-sh*.5} ${shY-4} L${cx+wa*.8} ${waistY}" stroke="${OL}" stroke-width="6" ${RC}/><path d="M${cx-sh*.5} ${shY-4} L${cx+wa*.8} ${waistY}" stroke="#4a3423" stroke-width="4" ${RC}/>`);
  }

  /* belt */
  a(`<rect x="${cx-hip-1}" y="${hipY-9}" width="${hip*2+2}" height="7" rx="1.5" fill="#2a2622" stroke="${OL}" stroke-width="1"/><rect x="${cx-4}" y="${hipY-9.5}" width="8" height="8" rx="1" fill="#9c9c94" stroke="${OL}" stroke-width="1"/>`);

  /* class torso gear */
  if(s.cls==='soldier'){
    const A={x:cx-sh*.55,y:shY-3},Bp={x:cx+wa*.85,y:hipY-10},ang=Math.atan2(Bp.y-A.y,Bp.x-A.x)*180/Math.PI;
    a(`<path d="M${A.x} ${A.y} L${Bp.x} ${Bp.y}" stroke="${OL}" stroke-width="8" ${RC}/><path d="M${A.x} ${A.y} L${Bp.x} ${Bp.y}" stroke="#5a4128" stroke-width="6" ${RC}/>`);
    for(let i=1;i<8;i++){const q=lerp(A,Bp,.08+i*.105);a(`<rect x="${q.x-1.5}" y="${q.y-3}" width="3" height="6" rx=".8" fill="#c9a046" stroke="${OL}" stroke-width=".6" transform="rotate(${ang} ${q.x} ${q.y})"/>`)}
    for(const gx of [cx-hip*.62,cx-hip*.62+8])a(`<circle cx="${gx}" cy="${hipY}" r="3.8" fill="#556036" stroke="${OL}" stroke-width="1"/><rect x="${gx-1}" y="${hipY-6}" width="2" height="2.5" fill="#9a9a9a"/>`);
  }
  if(s.cls==='medic'){
    a(`<rect x="${cx+hip*.3}" y="${hipY-12}" width="15" height="13" rx="2" fill="#e6e1d4" stroke="${OL}" stroke-width="1.2"/><path d="M${cx+hip*.3+7.5} ${hipY-9.5} v8 M${cx+hip*.3+3.5} ${hipY-5.5} h8" stroke="#2c9d68" stroke-width="2.4"/>`);
    a(`<rect x="${cx-sh*.46}" y="${shY+8}" width="3.2" height="13" rx="1" fill="#e8f4f7" stroke="${OL}" stroke-width=".7"/><rect x="${cx-sh*.46+.6}" y="${shY+13}" width="2" height="7" fill="#43c6d9"/><path d="M${cx-sh*.46+1.6} ${shY+8} v-4" stroke="#bbb" stroke-width=".8"/>`);
  }
  if(s.cls==='engineer'){
    const ex0=cx-hip*.3-15;
    a(`<path d="M${ex0+6} ${hipY-11} L${ex0+3} ${hipY-27}" stroke="#9aa0a5" stroke-width="3" ${RC}/><circle cx="${ex0+2.5}" cy="${hipY-29}" r="3.4" fill="none" stroke="#9aa0a5" stroke-width="2.4"/><path d="M${ex0+11} ${hipY-11} L${ex0+12} ${hipY-22}" stroke="#e2b23a" stroke-width="2.6" ${RC}/>`);
    a(`<rect x="${ex0}" y="${hipY-12}" width="15" height="14" rx="2" fill="#6b5233" stroke="${OL}" stroke-width="1.2"/><path d="M${ex0} ${hipY-7} h15" stroke="${OL}" stroke-width=".8"/>`);
  }
  if(s.cls==='operative'){
    a(`<rect x="${cx+hip*.35}" y="${hipY-12}" width="10" height="8" rx="1.5" fill="#2a2d30" stroke="${OL}" stroke-width="1"/><circle cx="${cx+hip*.35+7}" cy="${hipY-8}" r="1.3" fill="#38e0ff"/>`);
  }

  /* hood bunch */
  if(s.top==='hoodie')a(`<path d="M${cx-sh*.46} ${shY-3} Q${cx-sh*.5} ${shY-16} ${cx-neck-4} ${shY-18} L${cx+neck+4} ${shY-18} Q${cx+sh*.5} ${shY-16} ${cx+sh*.46} ${shY-3} Q${cx} ${shY+5} ${cx-sh*.46} ${shY-3} Z" fill="${shade(c1,-12)}" stroke="${OL}" stroke-width="1.3"/><path d="M${cx-neck-2} ${shY-6} Q${cx} ${shY+1} ${cx+neck+2} ${shY-6}" stroke="${shade(c1,-35)}" stroke-width="1.5" fill="none"/>`);

  /* arms */
  const G={x:cx+sh*.45,y:hipY-10},F0={x:cx-sh*.55,y:waistY-28},W=WEAPONS[s.weapon];
  const Fh=lerp(G,F0,W.fore);
  const arms=[{sd:1,S:{x:cx+sh-arm*.6,y:shY+7},E:{x:cx+sh+arm*.3+4,y:waistY-6},H:G},{sd:-1,S:{x:cx-sh+arm*.6,y:shY+7},E:{x:cx-sh-arm*.3-6,y:waistY-4},H:Fh}];
  for(const A of arms){
    const full=`M${A.S.x} ${A.S.y} L${A.E.x} ${A.E.y} L${A.H.x} ${A.H.y}`;
    a(`<path d="${full}" stroke="${OL}" stroke-width="${arm*2+3}" ${RC}/><path d="${full}" stroke="${skin}" stroke-width="${arm*2}" ${RC}/>`);
    a(`<path d="M${A.E.x+A.sd*arm*.45} ${A.E.y} L${A.H.x+A.sd*1} ${A.H.y+arm*.4}" stroke="#000" stroke-opacity=".12" stroke-width="${arm*.7}" ${RC}/>`);
    let sl=null;
    if(s.top==='tee'){const m=lerp(A.S,A.E,.55);sl=`M${A.S.x} ${A.S.y} L${m.x} ${m.y}`}
    else if(s.top!=='tank'){const m=lerp(A.E,A.H,.74);sl=`M${A.S.x} ${A.S.y} L${A.E.x} ${A.E.y} L${m.x} ${m.y}`}
    if(sl){a(`<path d="${sl}" stroke="${OL}" stroke-width="${arm*2+5}" ${RC}/><path d="${sl}" stroke="${c1}" stroke-width="${arm*2+2}" ${RC}/>`);
      if(s.top!=='tee'){const c0=lerp(A.E,A.H,.62),c9=lerp(A.E,A.H,.74);a(`<path d="M${c0.x} ${c0.y} L${c9.x} ${c9.y}" stroke="${shade(c1,-22)}" stroke-width="${arm*2+2}" stroke-linecap="butt" fill="none"/>`)}
      else{const m=lerp(A.S,A.E,.5),m2=lerp(A.S,A.E,.55);a(`<path d="M${m.x} ${m.y} L${m2.x} ${m2.y}" stroke="${shade(c1,-22)}" stroke-width="${arm*2+2}" stroke-linecap="butt" fill="none"/>`)}
    }
    const ua=Math.atan2(A.E.y-A.S.y,A.E.x-A.S.x)*180/Math.PI;
    if(A.sd===1&&s.top!=='tank'){const q=lerp(A.S,A.E,.36);
      a(sec?`<path d="M${q.x} ${q.y-6} l5 3 v6 l-5 3 l-5 -3 v-6 Z" fill="${acc}" stroke="${OL}" stroke-width="1"/><path d="M${q.x-2.5} ${q.y-1} l2.5 2 l2.5 -2" stroke="#fff" stroke-width="1.2" fill="none"/>`
           :`<circle cx="${q.x}" cy="${q.y}" r="5.5" fill="#1d1a17" stroke="${acc}" stroke-width="1.6"/><path d="M${q.x-3} ${q.y+3} L${q.x+3} ${q.y-3}" stroke="${acc}" stroke-width="1.6"/>`)}
    if(A.sd===-1&&s.cls==='medic'){const q=lerp(A.S,A.E,.5);
      a(`<g transform="translate(${q.x} ${q.y}) rotate(${ua})"><rect x="-3.5" y="${-(arm+2)}" width="7" height="${arm*2+4}" rx="1" fill="#eef0f1" stroke="${OL}" stroke-width="1"/><path d="M0 -2.5 v5 M-2.5 0 h5" stroke="#2c9d68" stroke-width="1.6"/></g>`)}
    if(A.sd===-1&&s.cls==='operative'){const q=lerp(A.E,A.H,.5),fa=Math.atan2(A.H.y-A.E.y,A.H.x-A.E.x)*180/Math.PI;
      a(`<g transform="translate(${q.x} ${q.y}) rotate(${fa})"><rect x="-6" y="${-(arm+1.5)}" width="12" height="${arm*2+3}" rx="2" fill="#25292d" stroke="${OL}" stroke-width="1"/><rect x="-4" y="${-arm*.7}" width="8" height="${arm*1.4}" rx="1" fill="#38e0ff" opacity=".9"/></g>`)}
    if(s.armour==='riot')a(`<ellipse cx="${A.S.x+A.sd*1}" cy="${A.S.y-1}" rx="${arm+6}" ry="${arm*.8+4}" fill="#cfd6db" stroke="${OL}" stroke-width="1.4"/><path d="M${A.S.x-arm*.6} ${A.S.y+2} Q${A.S.x} ${A.S.y+5} ${A.S.x+arm*.6} ${A.S.y+2}" stroke="${acc}" stroke-width="2" fill="none"/>`);
    if(s.armour==='scrap'&&A.sd===-1)a(`<ellipse cx="${A.S.x-1}" cy="${A.S.y-1}" rx="${arm+6}" ry="${arm*.8+4}" fill="#262626" stroke="${OL}" stroke-width="1.4"/><path d="M${A.S.x-arm*.8} ${A.S.y-3} l3 3 M${A.S.x-arm*.2} ${A.S.y-5} l3 3 M${A.S.x+arm*.4} ${A.S.y-4} l3 3" stroke="#555" stroke-width="1.2"/>`);
  }
  if(s.cls==='engineer'){const L=arms[0].S;a(`<rect x="${L.x-3}" y="${L.y-12}" width="8" height="7" rx="1.5" fill="#33363a" stroke="${OL}" stroke-width="1"/><circle cx="${L.x+1}" cy="${L.y-8.5}" r="8" fill="#ffe08a" opacity=".22"/><circle cx="${L.x+1}" cy="${L.y-8.5}" r="2.4" fill="#ffe08a"/>`)}

  /* weapon */
  const ang=Math.atan2(F0.y-G.y,F0.x-G.x)*180/Math.PI,d=Math.hypot(Fh.x-G.x,Fh.y-G.y);
  a(`<g transform="translate(${G.x} ${G.y}) rotate(${ang}) scale(1,-1)" stroke="${OL}" stroke-width="1.2" stroke-linejoin="round">${weaponSvg(s.weapon,d,fur,acc)}</g>`);

  /* hands */
  for(const A of arms){const hr=arm*.82+1,H=A.H;
    if(s.gloves==='none')a(`<circle cx="${H.x}" cy="${H.y}" r="${hr}" fill="${skin}" stroke="${OL}" stroke-width="1.4"/><path d="M${H.x-hr*.5} ${H.y+hr*.2} q${hr*.5} ${hr*.3} ${hr} 0" stroke="${sk3}" stroke-width="1" fill="none"/>`);
    else if(s.gloves==='fingerless')a(`<circle cx="${H.x}" cy="${H.y}" r="${hr}" fill="${skin}" stroke="${OL}" stroke-width="1.4"/><circle cx="${H.x}" cy="${H.y+hr*.22}" r="${hr*.8}" fill="#2a2622"/>`);
    else a(`<circle cx="${H.x}" cy="${H.y}" r="${hr}" fill="#2b2e31" stroke="${OL}" stroke-width="1.4"/><rect x="${H.x-hr*.55}" y="${H.y-hr*.55}" width="${hr*1.1}" height="${hr*.5}" rx="1.5" fill="#4b5056"/>`);
  }

  /* hair behind head */
  const covered=COVER.has(s.headgear);
  if(s.hair==='dreads'){for(const sd of [-1,1])for(let i=0;i<3;i++){const dd=`M${cx+sd*rx*.6} ${hy-ry*.7} Q${cx+sd*(rx+4+i*3)} ${hy-ry*.2+i*2} ${cx+sd*(rx+2+i*3.5)} ${hy+ry*(1.2+i*.25)}`;a(`<path d="${dd}" stroke="${OL}" stroke-width="5.6" ${RC}/><path d="${dd}" stroke="${hc}" stroke-width="4" ${RC}/>`)}}
  if(!covered){
    if(s.hair==='spiky'){let pts=[];const N=9,span=Math.PI-.5;for(let i=0;i<=N;i++){const t=Math.PI+.25+span*i/N;pts.push([cx+(rx+1.5)*Math.cos(t),hy-ry*.2+(ry*.85)*Math.sin(t)]);if(i<N){const tm=t+span/N/2;pts.push([cx+(rx+8)*Math.cos(tm),hy-ry*.2+(ry*.85+8)*Math.sin(tm)])}}
      a(`<path d="M${pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' L')} Z" fill="${hc}" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/>`)}
    if(s.hair==='mohawk')a(`<path d="M${cx-5} ${hy-ry*.6} L${cx-6} ${hy-ry*1.05} Q${cx-5} ${hy-ry*1.55} ${cx} ${hy-ry*1.75} Q${cx+5} ${hy-ry*1.55} ${cx+6} ${hy-ry*1.05} L${cx+5} ${hy-ry*.6} Z" fill="${hc}" stroke="${OL}" stroke-width="1.3"/>`);
    if(s.hair==='topknot')a(`<circle cx="${cx}" cy="${hy-ry*1.02-4}" r="6.5" fill="${hc}" stroke="${OL}" stroke-width="1.3"/><path d="M${cx-4} ${hy-ry*1.02+1} h8" stroke="${acc}" stroke-width="2"/>`);
  }

  /* head */
  for(const sd of [-1,1])a(`<ellipse cx="${cx+sd*(rx-.5)}" cy="${hy+2}" rx="3.6" ry="6" fill="${sk2}" stroke="${OL}" stroke-width="1.2"/>`);
  a(`<path d="${headD}" fill="${skin}" stroke="${OL}" stroke-width="1.6"/>`);
  let face=`<rect x="${cx+rx*.3}" y="${hy-ry*1.3}" width="${rx}" height="${ry*2.5}" fill="#000" opacity=".1"/>`;
  for(const sd of [-1,1])face+=`<path d="M${cx+sd*(rx-2)} ${hy+3} Q${cx+sd*(rx-6)} ${hy+ry*.45} ${cx+sd*(jx+1)} ${hy+ry*.75}" stroke="${sk3}" stroke-width="1.8" opacity=".55" fill="none"/>`;
  if(s.mark==='paint')face+=`<rect x="${cx-rx-2}" y="${eyeY-4}" width="${rx*2+4}" height="8" fill="${sec?'#123a5a':'#151311'}" opacity=".78"/>`;
  if(s.mark==='tattoo')face+=`<path d="M${cx+ex+3} ${eyeY-10} L${cx+ex+7} ${eyeY-4} L${cx+ex+3} ${eyeY+4} M${cx+ex+6} ${eyeY+6} L${cx+rx-3} ${hy+ry*.5} M${cx+ex+8} ${eyeY-8} L${cx+rx-2} ${eyeY-2}" stroke="#1f2a35" stroke-width="1.4" opacity=".85" ${RC}/>`;
  a(`<g clip-path="url(#${p}h)">${face}</g>`);
  for(const sd of [-1,1]){const x=cx+sd*ex;if(s.blink){a(`<path d="M${x-3.6} ${eyeY} Q${x} ${eyeY+1.4} ${x+3.6} ${eyeY}" stroke="${OL}" stroke-width="1.4" fill="none"/>`);continue}a(`<ellipse cx="${x}" cy="${eyeY}" rx="3.3" ry="1.9" fill="#f3efe6"/><circle cx="${x+.3}" cy="${eyeY}" r="1.6" fill="#2b1f17"/><path d="M${x-3.6} ${eyeY-.6} Q${x} ${eyeY-2.9} ${x+3.6} ${eyeY-.6}" stroke="${OL}" stroke-width="1.2" fill="none"/>`)}
  const bro={neutral:[0,0,0,0],grim:[-1,2.2,-1,2.2],smirk:[0,0,-3,-1.5],snarl:[-1.5,3.6,-1.5,3.6]}[s.expr],by=eyeY-5,bc=shade(hc,-12);
  a(`<path d="M${cx-ex-5} ${by+bro[0]} Q${cx-ex} ${by-1.6+(bro[0]+bro[1])/2} ${cx-ex+4.5} ${by+bro[1]}" stroke="${bc}" stroke-width="2.7" ${RC}/><path d="M${cx+ex+5} ${by+bro[2]} Q${cx+ex} ${by-1.6+(bro[2]+bro[3])/2} ${cx+ex-4.5} ${by+bro[3]}" stroke="${bc}" stroke-width="2.7" ${RC}/>`);
  a(`<path d="M${cx-.5} ${eyeY+2} L${cx-2.6} ${hy+ry*.42} Q${cx+.5} ${hy+ry*.5} ${cx+3} ${hy+ry*.42}" stroke="${sk3}" stroke-width="1.3" ${RC}/><path d="M${cx-2} ${hy+ry*.95} Q${cx} ${hy+ry*.98} ${cx+2} ${hy+ry*.95}" stroke="${sk3}" stroke-width="1" fill="none"/>`);
  const fhD=`M${cx-rx-2} ${hy+ry*.12} Q${cx-rx*.55} ${hy+ry*.36} ${cx-rx*.42} ${hy+ry*.56} Q${cx} ${hy+ry*.44} ${cx+rx*.42} ${hy+ry*.56} Q${cx+rx*.55} ${hy+ry*.36} ${cx+rx+2} ${hy+ry*.12} L${cx+rx+2} ${hy+ry*1.4} L${cx-rx-2} ${hy+ry*1.4} Z`;
  if(s.facial==='stubble')a(`<g clip-path="url(#${p}h)"><path d="${fhD}" fill="${hc}" opacity=".3"/></g>`);
  if(s.facial==='beard')a(`<path d="M${cx-jx} ${hy+ry*.78} Q${cx-jx*.85} ${hy+ry*1.38} ${cx} ${hy+ry*1.42} Q${cx+jx*.85} ${hy+ry*1.38} ${cx+jx} ${hy+ry*.78} Z" fill="${hc}" stroke="${OL}" stroke-width="1.2"/><g clip-path="url(#${p}h)"><path d="${fhD}" fill="${hc}"/></g>`);
  if(s.facial==='goatee')a(`<path d="M${cx-6} ${my-2.5} Q${cx} ${my-5} ${cx+6} ${my-2.5} L${cx+5} ${hy+ry*1.1} Q${cx} ${hy+ry*1.22} ${cx-5} ${hy+ry*1.1} Z" fill="${hc}"/>`);
  if(s.facial==='moustache')a(`<path d="M${cx-7.5} ${my+1.5} Q${cx-6} ${my-4} ${cx} ${my-3.5} Q${cx+6} ${my-4} ${cx+7.5} ${my+1.5} Q${cx+4} ${my-1.2} ${cx} ${my-1.2} Q${cx-4} ${my-1.2} ${cx-7.5} ${my+1.5} Z" fill="${hc}"/>`);
  if(s.facial==='chops')a(`<g clip-path="url(#${p}h)"><path d="M${cx-rx-2} ${hy-2} L${cx-rx-2} ${hy+ry*.9} Q${cx-rx+4} ${hy+ry*.85} ${cx-rx+8} ${hy+ry*.7} L${cx-rx+5} ${hy+ry*.15} Z M${cx+rx+2} ${hy-2} L${cx+rx+2} ${hy+ry*.9} Q${cx+rx-4} ${hy+ry*.85} ${cx+rx-8} ${hy+ry*.7} L${cx+rx-5} ${hy+ry*.15} Z" fill="${hc}"/></g>`);
  const mouth={neutral:`<path d="M${cx-5} ${my} L${cx+5} ${my}" stroke="#3b2219" stroke-width="1.6" ${RC}/>`,
    grim:`<path d="M${cx-5.5} ${my+1} Q${cx} ${my-1} ${cx+5.5} ${my+1}" stroke="#3b2219" stroke-width="1.6" ${RC}/>`,
    smirk:`<path d="M${cx-5} ${my} Q${cx+1} ${my+1} ${cx+6} ${my-2}" stroke="#3b2219" stroke-width="1.6" ${RC}/>`,
    snarl:`<path d="M${cx-6} ${my-1} Q${cx} ${my-3} ${cx+6} ${my-1} Q${cx} ${my+4} ${cx-6} ${my-1} Z" fill="#3a1d18" stroke="#3b2219" stroke-width="1.2"/><rect x="${cx-4}" y="${my-2.2}" width="8" height="1.8" fill="#efe9dc"/>`}[s.expr];
  a(mouth);
  if(s.mark==='scar')a(`<path d="M${cx-ex-3} ${eyeY-9} L${cx-ex+2} ${eyeY+8}" stroke="#e7ad9d" stroke-width="1.7" stroke-linecap="round"/><path d="M${cx-ex-2.5} ${eyeY-5} l3 -1 M${cx-ex-.8} ${eyeY+1} l3 -1 M${cx-ex+.6} ${eyeY+5} l3 -1" stroke="#e7ad9d" stroke-width="1"/>`);
  if(s.mark==='patch')a(`<path d="M${cx-rx} ${hy-7} L${cx+rx} ${hy-13}" stroke="#1a1714" stroke-width="1.5"/><ellipse cx="${cx-ex}" cy="${eyeY}" rx="4.8" ry="3.8" fill="#1a1714"/>`);

  /* hair front */
  const cap=g=>`M${cx-rx-g} ${hy-1} C${cx-rx-g} ${hy-ry*1.34-g} ${cx+rx+g} ${hy-ry*1.34-g} ${cx+rx+g} ${hy-1} L${cx+rx-1} ${hy-2} Q${cx+rx-3} ${hy-ry*.42} ${cx} ${hy-ry*.5} Q${cx-rx+3} ${hy-ry*.42} ${cx-rx+1} ${hy-2} Z`;
  if(s.hair!=='shaved'){
    if(covered||s.hair==='buzz')a(`<path d="${cap(.5)}" fill="${hc}" opacity="${s.hair==='buzz'?.55:.9}"/>`);
    else if(s.hair==='mohawk')a(`<path d="${cap(.3)}" fill="${hc}" opacity=".22"/><path d="M${cx-4.5} ${hy-ry*.5} L${cx-5} ${hy-ry*.98} L${cx+5} ${hy-ry*.98} L${cx+4.5} ${hy-ry*.5} Z" fill="${hc}"/>`);
    else{a(`<path d="${cap(1.6)}" fill="${hc}" stroke="${OL}" stroke-width="1.2"/>`);
      if(s.hair==='crop')a(`<path d="M${cx-8} ${hy-ry*.7} l2 -3 M${cx-2} ${hy-ry*.75} l2 -3 M${cx+5} ${hy-ry*.7} l2 -3" stroke="${shade(hc,-30)}" stroke-width="1" fill="none"/>`);
      if(s.hair==='slick')a(`<path d="M${cx-rx-2} ${hy-ry*.55} Q${cx-rx*.2} ${hy-ry*1.5} ${cx+rx+3} ${hy-ry*.85} Q${cx+rx*.4} ${hy-ry*.9} ${cx-rx*.4} ${hy-ry*.45} Z" fill="${shade(hc,8)}" stroke="${OL}" stroke-width="1.1"/><path d="M${cx-rx*.5} ${hy-ry*.95} Q${cx} ${hy-ry*1.2} ${cx+rx*.6} ${hy-ry*.98}" stroke="#fff" stroke-opacity=".3" stroke-width="1.4" fill="none"/>`);
      if(s.hair==='dreads')for(let i=0;i<6;i++)a(`<circle cx="${cx-rx*.7+i*rx*.28}" cy="${hy-ry*(.62+(i%2)*.18)}" r="1.4" fill="${shade(hc,-35)}"/>`);
    }
  }

  /* headgear */
  const hg=s.headgear;
  if(hg==='beanie'){a(`<path d="M${cx-rx-2} ${hy-ry*.25} C${cx-rx-2} ${hy-ry*1.45} ${cx+rx+2} ${hy-ry*1.45} ${cx+rx+2} ${hy-ry*.25} Z" fill="${c2}" stroke="${OL}" stroke-width="1.4"/><path d="M${cx-rx-2.5} ${hy-ry*.2} L${cx+rx+2.5} ${hy-ry*.2} L${cx+rx+2} ${hy-ry*.58} L${cx-rx-2} ${hy-ry*.58} Z" fill="${shade(c2,-18)}" stroke="${OL}" stroke-width="1.3"/>`);for(let i=-3;i<=3;i++)a(`<path d="M${cx+i*rx*.27} ${hy-ry*.55} v${ry*.32}" stroke="${OL}" stroke-opacity=".35" stroke-width=".8"/>`)}
  if(hg==='cap')a(`<path d="M${cx-rx-1} ${hy-ry*.35} C${cx-rx-1} ${hy-ry*1.4} ${cx+rx+1} ${hy-ry*1.4} ${cx+rx+1} ${hy-ry*.35} Z" fill="${c1}" stroke="${OL}" stroke-width="1.4"/><path d="M${cx-rx-2} ${hy-ry*.35} Q${cx} ${hy-ry*.55} ${cx+rx+2} ${hy-ry*.35} Q${cx+rx*.6} ${hy-ry*.08} ${cx} ${hy-ry*.1} Q${cx-rx*.6} ${hy-ry*.08} ${cx-rx-2} ${hy-ry*.35} Z" fill="${shade(c1,-25)}" stroke="${OL}" stroke-width="1.3"/><circle cx="${cx}" cy="${hy-ry*.78}" r="3" fill="${acc}" stroke="${OL}" stroke-width=".8"/>`);
  if(hg==='bandana'){const bc2=shade(acc,-15);a(`<path d="M${cx+rx-1} ${hy-ry*.4} L${cx+rx+10} ${hy-ry*.05} L${cx+rx+4} ${hy-ry*.15} L${cx+rx+7} ${hy+ry*.2} Z" fill="${shade(bc2,-15)}" stroke="${OL}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${cx-rx-1} ${hy-ry*.3} C${cx-rx-1} ${hy-ry*1.38} ${cx+rx+1} ${hy-ry*1.38} ${cx+rx+1} ${hy-ry*.3} Q${cx} ${hy-ry*.5} ${cx-rx-1} ${hy-ry*.3} Z" fill="${bc2}" stroke="${OL}" stroke-width="1.3"/>`);for(const [dx,dy] of [[-8,.7],[-1,.9],[6,.7],[-4,.55],[3,.58]])a(`<circle cx="${cx+dx}" cy="${hy-ry*dy}" r="1.1" fill="#fff" opacity=".45"/>`)}
  if(hg==='helmet'){const hcol=sec?'#3b4652':'#4d5233';a(`<path d="M${cx-rx} ${hy+1} L${cx-jx*.8} ${hy+ry*.95} M${cx+rx} ${hy+1} L${cx+jx*.8} ${hy+ry*.95}" stroke="#222" stroke-width="1.2"/><path d="M${cx-rx-4} ${hy+1} C${cx-rx-4} ${hy-ry*1.5} ${cx+rx+4} ${hy-ry*1.5} ${cx+rx+4} ${hy+1} L${cx+rx+1} ${hy+2} Q${cx+rx} ${hy-ry*.35} ${cx} ${hy-ry*.42} Q${cx-rx} ${hy-ry*.35} ${cx-rx-1} ${hy+2} Z" fill="${hcol}" stroke="${OL}" stroke-width="1.5"/><rect x="${cx-3.5}" y="${hy-ry*.98}" width="7" height="5" rx="1" fill="#26292c" stroke="${OL}" stroke-width=".8"/><path d="M${cx-rx*.7} ${hy-ry*.95} Q${cx-rx*.3} ${hy-ry*1.12} ${cx} ${hy-ry*1.12}" stroke="#fff" stroke-opacity=".25" stroke-width="1.5" fill="none"/>`)}
  if(hg==='riothelm')a(`<path d="M${cx-rx-5} ${hy+ry*.6} C${cx-rx-6} ${hy-ry*1.55} ${cx+rx+6} ${hy-ry*1.55} ${cx+rx+5} ${hy+ry*.6} L${cx+rx+1} ${hy+ry*.6} L${cx+rx} ${hy-ry*.45} Q${cx} ${hy-ry*.6} ${cx-rx} ${hy-ry*.45} L${cx-rx-1} ${hy+ry*.6} Z" fill="#d6dce0" stroke="${OL}" stroke-width="1.5"/><path d="M${cx} ${hy-ry*.6} V${hy-ry*1.12}" stroke="${acc}" stroke-width="3"/><path d="M${cx-rx} ${hy-ry*.45} Q${cx} ${hy-ry*.6} ${cx+rx} ${hy-ry*.45} L${cx+rx+1} ${hy+ry*.35} Q${cx} ${hy+ry*.55} ${cx-rx-1} ${hy+ry*.35} Z" fill="#1d3b52" opacity=".55" stroke="${OL}" stroke-width="1.2"/><path d="M${cx-rx*.7} ${hy-ry*.3} Q${cx-rx*.2} ${hy-ry*.42} ${cx+rx*.2} ${hy-ry*.38}" stroke="#fff" stroke-opacity=".55" stroke-width="1.5" fill="none"/>`);
  if(hg==='headset')a(`<path d="M${cx-rx-1} ${hy-2} C${cx-rx-1} ${hy-ry*1.35} ${cx+rx+1} ${hy-ry*1.35} ${cx+rx+1} ${hy-2}" stroke="#24272a" stroke-width="3" fill="none"/><path d="M${cx-rx-1} ${hy+5} Q${cx-rx+2} ${hy+ry*.75} ${cx-6} ${hy+ry*.72}" stroke="#24272a" stroke-width="1.6" fill="none"/><circle cx="${cx-6}" cy="${hy+ry*.72}" r="1.8" fill="#24272a"/><rect x="${cx-rx-5}" y="${hy-5}" width="8" height="13" rx="3" fill="#2f3337" stroke="${OL}" stroke-width="1"/><rect x="${cx+rx-3}" y="${hy-5}" width="8" height="13" rx="3" fill="#2f3337" stroke="${OL}" stroke-width="1"/><rect x="${cx+rx-1}" y="${hy-2}" width="2" height="6" fill="${acc}"/>`);
  if(hg==='goggles')a(`<path d="M${cx-rx} ${hy-ry*.5} Q${cx} ${hy-ry*.7} ${cx+rx} ${hy-ry*.5}" stroke="#25221f" stroke-width="4" fill="none"/><circle cx="${cx-6}" cy="${hy-ry*.62}" r="5" fill="#3f6f7d" stroke="#2a2a2a" stroke-width="2"/><circle cx="${cx+6}" cy="${hy-ry*.62}" r="5" fill="#3f6f7d" stroke="#2a2a2a" stroke-width="2"/><path d="M${cx-8} ${hy-ry*.7} l2.5 -1.5 M${cx+4} ${hy-ry*.7} l2.5 -1.5" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>`);

  /* face gear */
  const fg=s.facegear;
  if(fg==='mask'){const mc=sec?shade(c2,-20):shade(acc,-20);a(`<path d="M${cx-rx-1} ${hy+ry*.2} Q${cx} ${hy+ry*.35} ${cx+rx+1} ${hy+ry*.2} L${cx+jx+1} ${hy+ry*.85} Q${cx} ${hy+ry*1.45} ${cx-jx-1} ${hy+ry*.85} Z" fill="${mc}" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/><path d="M${cx-6} ${hy+ry*.55} Q${cx} ${hy+ry*.75} ${cx+5} ${hy+ry*.5} M${cx-3} ${hy+ry*.9} Q${cx+1} ${hy+ry*1.05} ${cx+4} ${hy+ry*.88}" stroke="${OL}" stroke-opacity=".4" stroke-width="1" fill="none"/>`)}
  if(fg==='respirator')a(`<path d="M${cx-rx} ${hy+ry*.35} L${cx-8} ${hy+ry*.55} M${cx+rx} ${hy+ry*.35} L${cx+8} ${hy+ry*.55}" stroke="#1d1d1d" stroke-width="1.5"/><path d="M${cx-8} ${hy+ry*.35} Q${cx} ${hy+ry*.25} ${cx+8} ${hy+ry*.35} L${cx+7} ${hy+ry*.95} Q${cx} ${hy+ry*1.12} ${cx-7} ${hy+ry*.95} Z" fill="#2c2e30" stroke="${OL}" stroke-width="1.3"/><path d="M${cx-3} ${hy+ry*.62} h6 M${cx-3} ${hy+ry*.74} h6 M${cx-3} ${hy+ry*.86} h6" stroke="#5a5e62" stroke-width="1"/><circle cx="${cx-10}" cy="${hy+ry*.85}" r="5.5" fill="#4a4d50" stroke="${OL}" stroke-width="1.2"/><circle cx="${cx+10}" cy="${hy+ry*.85}" r="5.5" fill="#4a4d50" stroke="${OL}" stroke-width="1.2"/><circle cx="${cx-10}" cy="${hy+ry*.85}" r="2.6" fill="none" stroke="${acc}" stroke-width="1.2"/><circle cx="${cx+10}" cy="${hy+ry*.85}" r="2.6" fill="none" stroke="${acc}" stroke-width="1.2"/>`);
  if(fg==='shades')a(`<path d="M${cx-rx} ${eyeY-1.5} H${cx+rx}" stroke="#121416" stroke-width="1.2"/><rect x="${cx-ex-4.8}" y="${eyeY-3}" width="9.6" height="5.6" rx="2" fill="#121416"/><rect x="${cx+ex-4.8}" y="${eyeY-3}" width="9.6" height="5.6" rx="2" fill="#121416"/><path d="M${cx-ex-3} ${eyeY-1.5} l2.5 0 M${cx+ex-3} ${eyeY-1.5} l2.5 0" stroke="#fff" stroke-opacity=".55" stroke-width="1"/>`);
  if(fg==='hud')a(`<path d="M${cx-rx-1} ${eyeY-3.5} H${cx+rx+1} V${eyeY+2.5} H${cx-rx-1} Z" fill="#38e0ff" opacity=".42" stroke="#38e0ff" stroke-width=".8"/><rect x="${cx+rx-1}" y="${eyeY-4.5}" width="4" height="8" rx="1" fill="#25292d"/><path d="M${cx-rx+2} ${eyeY-1} h5 M${cx+3} ${eyeY+1} h4" stroke="#e8fbff" stroke-width=".8" opacity=".8"/>`);
  if(s.cls==='operative'&&hg!=='headset'&&hg!=='riothelm')a(`<path d="M${cx+rx+2} ${hy-1} L${cx+rx+6} ${hy-ry*.95}" stroke="#25292d" stroke-width="1.2"/><circle cx="${cx+rx+6}" cy="${hy-ry*.95}" r="1.4" fill="#38e0ff"/><rect x="${cx+rx-1}" y="${hy-2}" width="4.5" height="7" rx="1.5" fill="#25292d" stroke="${OL}" stroke-width=".8"/>`);
  return o.join('');
}

