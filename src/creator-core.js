
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
  minigun:{label:'Minigun',bodies:['heavy'],fore:.75},
  sniper:{label:'Sniper rifle',bodies:['medium'],fore:1}
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
function shade(hex,p){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const t=p<0?0:255,f=Math.abs(p)/100;r=Math.round(r+(t-r)*f);g=Math.round(g+(t-g)*f);b=Math.round(b+(t-b)*f);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
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
