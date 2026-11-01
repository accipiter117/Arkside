/* ===================== ARK TACTICS: CAMPAIGN ===================== */
let SPD=1;
const sleep=ms=>new Promise(r=>setTimeout(r,ms*SPD));
const tween=(ms,fn)=>new Promise(res=>{const t0=performance.now(),dur=Math.max(1,ms*SPD);const st=now=>{const k=Math.min(1,(now-t0)/dur);fn(k);if(k<1)requestAnimationFrame(st);else res()};requestAnimationFrame(st)});
const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
const D4=[[1,0],[-1,0],[0,1],[0,-1]];
const key=(x,z)=>x+','+z;
const ENEMY_OF={resistance:'security',security:'resistance'};

/* ---------- rules data ---------- */
const EB={light:{hp:80,move:7,vis:7},medium:{hp:110,move:5,vis:6},heavy:{hp:150,move:4,vis:5},turret:{hp:70,move:0,vis:6}};
const WPN={rifle:{name:'Assault rifle',dmg:30,range:7,acc:78,opt:5},smg:{name:'SMG',dmg:24,range:5,acc:82,opt:3,burst:2},mpistol:{name:'Machine pistol',dmg:20,range:4,acc:84,opt:2,burst:2},
  shotgun:{name:'Shotgun',dmg:46,range:3,acc:84,opt:2},lmg:{name:'LMG',dmg:34,range:7,acc:70,opt:5,burst:2},minigun:{name:'Minigun',dmg:42,range:5,acc:68,opt:3,burst:3},
  sniper:{name:'Sniper rifle',dmg:46,range:10,acc:80,opt:8},turret:{name:'Auto-gun',dmg:18,range:6,acc:72,opt:6}};
const LEVELS=[0,100,250,450,700];
const lvlOf=xp=>{let l=1;for(let i=1;i<LEVELS.length;i++)if(xp>=LEVELS[i])l=i+1;return l};
const AB={
  grenade:{name:'Grenade',cd:2,tgt:'tile',range:4,desc:'Blast everything within 1 tile of the target, allies included. Smashes barricades.'},
  resupply:{name:'Resupply',cd:2,tgt:'ally',range:1,desc:'An adjacent ally’s abilities are ready again.'},
  suppress:{name:'Suppress',cd:3,tgt:'enemy',range:7,desc:'Pin a visible enemy: 10 damage and they lose their next turn.'},
  patch:{name:'Patch up',cd:1,tgt:'ally',range:1,desc:'Heal an adjacent ally or yourself for 40, or revive someone who is down.'},
  adrenaline:{name:'Adrenaline',cd:3,tgt:'ally',range:4,desc:'An ally within 4 tiles can move again this turn.'},
  surgery:{name:'Field surgery',cd:4,tgt:'self',desc:'Heal every ally within 2 tiles for 25.'},
  barricade:{name:'Barricade',cd:2,tgt:'build',desc:'Put half cover on an empty adjacent tile.'},
  turret:{name:'Turret',cd:5,tgt:'build',desc:'Deploy an auto-turret next to you. It fires at the end of every turn.'},
  armourup:{name:'Armour up',cd:3,tgt:'ally',range:1,desc:'You or an adjacent ally gain a 25-point shield.'},
  spot:{name:'Spot',cd:2,tgt:'tile',range:9,desc:'Reveal a 3-tile radius for two turns. Spotted enemies are easier to hit.'},
  disguise:{name:'Disguise',cd:4,tgt:'self',desc:'The enemy ignores you for 2 turns, unless you attack or end next to them.'},
  emp:{name:'EMP',cd:4,tgt:'tile',range:5,desc:'Stun every enemy within 1 tile of the target for a turn, turrets included.'}};
const PERKS={
  tough:{name:'Thick skin',desc:'+15 maximum health.'},
  steady:{name:'Steady aim',desc:'+8 accuracy with every weapon.'},
  quick:{name:'Quick feet',desc:'+1 move each turn.'},
  eagle:{name:'Eagle eye',desc:'+1 vision. Spotted enemies are an extra 10 easier to hit.'},
  sharp:{name:'Sharpshooter',desc:'Overwatch shots get +10 accuracy instead of −10.'},
  dug:{name:'Dug in',desc:'Enemies get −10 accuracy against you while you’re in cover.'},
  parkour:{name:'Free runner',desc:'Wall-hops cost 1 move instead of 2.',body:'light'},
  climber:{name:'Climber',desc:'Climbing one level costs 1 move instead of 2.',body:'medium'},
  jugg:{name:'Juggernaut',desc:'Take 15% less damage.',body:'heavy'},
  demo:{name:'Demolitions',desc:'Grenades deal +15 damage. Planting charges makes +1 extra progress.',cls:'soldier'},
  surgeon:{name:'Field surgeon',desc:'Revived allies come back with 70 health and can still act.',cls:'medic'},
  fortify:{name:'Fortifier',desc:'Your barricades give full cover. Your turrets have +30 health.',cls:'engineer'},
  ghost:{name:'Ghost',desc:'Disguise lasts 3 turns. Attacking from disguise gets +20 accuracy.',cls:'operative'},
  marksman:{name:'Marksman',desc:'With a sniper rifle: +2 range, and +10 damage when shooting down from higher ground.',wpn:'sniper'}};
const perkPicks=op=>Math.max(0,lvlOf(op.xp)-1-((op.perks||[]).length));
function perkOptions(op){const own=new Set(op.perks||[]);const ok=Object.entries(PERKS).filter(([id,p])=>!own.has(id)&&(!p.body||p.body===op.body)&&(!p.cls||p.cls===op.cls)&&(!p.wpn||p.wpn===op.weapon)).map(([id])=>id);
  const R=rng([...op.id].reduce((a,c)=>a*31+c.charCodeAt(0),7)+(op.perks||[]).length*101);const out=[];while(out.length<3&&ok.length)out.push(ok.splice(Math.floor(R()*ok.length),1)[0]);return out}
const BODY_WPN={light:['mpistol','smg'],medium:['smg','rifle','shotgun','sniper'],heavy:['rifle','shotgun','lmg','minigun']};
const CLASS_DESC={soldier:'Frontline fighter. Grenades clear cover, Resupply refreshes an ally, Suppress pins an enemy. Plants charges twice as fast.',medic:'Keeps the squad alive. Heals, revives the downed, and can give an ally a second move. The only way to revive mid-fight.',engineer:'Builds and fortifies. Barricades, auto-turrets and shields. Repairs objectives twice as fast.',operative:'Information and infiltration. Spots areas, disguises as the enemy and EMPs groups. Hacks twice as fast.'};
const CLASS_AB={soldier:['grenade','resupply','suppress'],medic:['patch','adrenaline','surgery'],engineer:['barricade','turret','armourup'],operative:['spot','disguise','emp']};
const AB_LVL=[1,2,4];
const OBJ_FAST={hack:'operative',plant:'soldier',repair:'engineer'};
const OBJ_VERB={hack:'Hack',plant:'Plant charge',repair:'Repair'};
const ETYPES={
  trooper:{label:'Trooper',body:'medium',cls:'soldier',hp:90,w:'rifle',acc:-10,dmg:.72,desc:'Standard rifleman. Takes cover and trades fire at medium range.'},
  heavy:{label:'Heavy',body:'heavy',cls:'soldier',hp:140,w:'minigun',acc:-12,dmg:.68,desc:'Slow and tough with a minigun. Deadly up close, but stairs only.'},
  marksman:{label:'Marksman',body:'medium',cls:'soldier',hp:80,w:'sniper',acc:-6,dmg:.72,move:4,desc:'Long-range sniper. Prefers high ground and keeps its distance. Flank it.'},
  medic:{label:'Medic',body:'medium',cls:'medic',hp:85,w:'smg',acc:-12,dmg:.72,desc:'Heals wounded allies, so take it out first.'},
  engineer:{label:'Engineer',body:'heavy',cls:'engineer',hp:120,w:'shotgun',acc:-10,dmg:.72,desc:'Drops an auto-turret once it sees you.'},
  infiltrator:{label:'Infiltrator',body:'light',cls:'operative',hp:70,w:'smg',acc:-8,dmg:.72,desc:'Fast light flanker. Hunts exposed targets and climbs anything.'},
  turret:{label:'Turret',body:'turret',cls:'turret',hp:70,w:'turret',acc:-4,dmg:.85,desc:'Static auto-gun. Fires at the end of every enemy turn. Can’t move. EMP stuns it.'},
  leader:{label:'Cell leader',body:'medium',cls:'soldier',hp:160,w:'rifle',acc:-6,dmg:.8,move:4,desc:'The target. Runs for the exit once the alarm goes up.'}};

/* ---------- roster ---------- */
const LOOK=o=>clean({...DEFAULT,...o});
const BASE_ROSTER={
  resistance:[LOOK({}),
    LOOK({name:'Mako',callsign:'Ballast',body:'heavy',cls:'engineer',weapon:'minigun',skin:4,face:'broad',expr:'neutral',facial:'beard',hair:'shaved',hairCol:0,headgear:'helmet',top:'long',armour:'scrap',primary:3,secondary:2,gloves:'tactical'}),
    LOOK({name:'Juno',callsign:'Static',body:'light',cls:'operative',weapon:'smg',skin:1,face:'angular',expr:'smirk',facial:'none',hair:'mohawk',hairCol:7,facegear:'hud',top:'tank',armour:'none',primary:4,secondary:5,legs:'jeans'}),
    LOOK({name:'Okoro',callsign:'Lighthouse',body:'medium',cls:'medic',weapon:'shotgun',skin:5,face:'long',expr:'neutral',facial:'goatee',hair:'dreads',hairCol:0,headgear:'bandana',top:'hoodie',armour:'carrier',primary:2,secondary:0})],
  security:[LOOK({name:'Vance',callsign:'Bulwark',faction:'security',body:'medium',cls:'soldier',weapon:'rifle',skin:0,face:'square',expr:'grim',facial:'none',hair:'crop',hairCol:3,headgear:'helmet',top:'long',armour:'carrier',primary:0,secondary:1,gloves:'tactical'}),
    LOOK({name:'Brask',callsign:'Rampart',faction:'security',body:'heavy',cls:'engineer',weapon:'lmg',skin:4,face:'broad',expr:'neutral',facial:'beard',hair:'shaved',hairCol:0,headgear:'riothelm',top:'jacket',armour:'riot',primary:2,secondary:0,gloves:'tactical'}),
    LOOK({name:'Ines',callsign:'Dial Tone',faction:'security',body:'light',cls:'operative',weapon:'smg',skin:2,face:'angular',expr:'smirk',facial:'none',hair:'slick',hairCol:0,headgear:'headset',facegear:'hud',top:'long',armour:'rig',primary:3,secondary:3,legs:'armoured'}),
    LOOK({name:'Tamsin',callsign:'Saline',faction:'security',body:'medium',cls:'medic',weapon:'smg',skin:1,face:'long',expr:'neutral',facial:'none',hair:'topknot',hairCol:4,top:'tee',armour:'carrier',primary:4,secondary:1})]};
const RECRUITS={
  wren:LOOK({name:'Wren',callsign:'Gull',body:'light',cls:'soldier',weapon:'smg',skin:3,face:'angular',expr:'smirk',facial:'none',hair:'spiky',hairCol:2,top:'hoodie',armour:'rig',primary:1,secondary:5}),
  dace:LOOK({name:'Dace',callsign:'Drydock',body:'heavy',cls:'medic',weapon:'shotgun',skin:2,face:'broad',expr:'neutral',facial:'chops',hair:'buzz',hairCol:5,headgear:'beanie',top:'jacket',armour:'carrier',primary:3,secondary:1}),
  tavi:LOOK({name:'Tavi',callsign:'Riptide',body:'medium',cls:'operative',weapon:'rifle',skin:0,face:'long',expr:'grim',facial:'none',hair:'crop',hairCol:8,facegear:'mask',top:'long',armour:'rig',primary:5,secondary:2,mark:'tattoo'}),
  halloran:LOOK({name:'Halloran',callsign:'Floodgate',faction:'security',body:'heavy',cls:'soldier',weapon:'minigun',skin:3,face:'square',expr:'grim',facial:'moustache',hair:'buzz',hairCol:1,headgear:'helmet',top:'long',armour:'riot',primary:0,secondary:5}),
  petra:LOOK({name:'Petra',callsign:'Sterile',faction:'security',body:'light',cls:'medic',weapon:'mpistol',skin:0,face:'angular',expr:'neutral',facial:'none',hair:'slick',hairCol:6,headgear:'cap',top:'tee',armour:'rig',primary:2,secondary:4}),
  corin:LOOK({name:'Corin',callsign:'Wrench',faction:'security',body:'medium',cls:'engineer',weapon:'shotgun',skin:5,face:'square',expr:'smirk',facial:'stubble',hair:'crop',hairCol:0,headgear:'goggles',top:'jacket',armour:'carrier',primary:1,secondary:3})};

/* ---------- missions ---------- */
const MISSIONS={resistance:[
 {id:'r1',title:'Dry Docks',tag:'Seize the command posts',
  brief:['The old dry docks are where the Ark keeps its spare desalination parts, and where Security keep a light patrol because nobody important ever goes there.','We need those docks before we can do anything else. Take both command posts, then clear out whoever is left.','Command posts heal or resupply whoever holds them, and they let you swap an operative’s class mid-mission.'],
  debrief:'The docks are ours. Better still, a young dockhand called Wren watched the whole thing from a crane and has asked to join.',
  h:["000000000000","022220000440","022221223440","022220000440","000000000000","000000000000","000000000000","000000022200","000000022200","000000000000","000000000000","000000000000"],
  map:["~~~~....~~~~","~..w.....XS~","~...C......~","~.........w~","~..C...C....","~...........","~.CCnCCCgCC.","~......w....","~..H........","~......~~...",".PP....~~...",".PP.......~~"],
  enemies:[['trooper', 10, 2], ['trooper', 2, 2], ['trooper', 6, 4], ['trooper', 8, 8]],reinf:[[3, [['trooper', 9, 3]]]],
  objectives:[{type:'capture'},{type:'eliminate'}],xp:80,recruit:'wren'},
 {id:'r2',title:'The Reservoir',tag:'Steal the purification codes',
  brief:['Security have locked the purification codes in a terminal above the main reservoir. With the codes, every Resistance district gets clean water without queuing for Security rations.','The platform is well guarded and they have a marksman up top. Move quietly: you start unseen, and shots against an unaware enemy are far more accurate.','Juno can crack the terminal in one go. Anyone else needs two attempts.'],
  debrief:'The codes are out. Taps in the lower districts are already running clean, and Dace, a dock medic who has patched up half the Resistance, has thrown in with you.',
  h:["002444444200","002444444200","002444444200","002223000200","001000000100","000000000000","000000000000","000000000000","000000000000","000000000000","000000000000","000000000000"],
  map:["~~.X....X.~~","~~....T...~~","~~.C....C.~~","~~..........","............","..C...w...C.","....C...C...","CCCnCCCCgCC.","...H........",".w.....C..w.","PPP.........","PPP......~~~"],
  enemies:[['trooper', 4, 1], ['marksman', 8, 1], ['heavy', 2, 1], ['trooper', 7, 2], ['trooper', 9, 5], ['trooper', 4, 5], ['turret', 6, 3]],reinf:[[3, [['trooper', 9, 0]]], [5, [['heavy', 9, 1]]]],
  objectives:[{type:'hack',targets:[[8,1]],need:2}],xp:100,recruit:'dace'},
 {id:'r3',title:'Container City',tag:'Grab the filter cartridge and get out',
  brief:['Somewhere in this maze of shipping containers is a crate of filter cartridges, enough to keep a whole district’s pumps alive for a year.','Find the cartridge, pick it up, and carry it to the exit in the top-left corner. Whoever carries it becomes everyone’s favourite target.','Security will flood in from the far side once they realise what is happening.'],
  debrief:'The cartridges are installed. Tavi, a smuggler who knows every container in the city, liked your work enough to sign up.',
  h:["000000000000","000220000440","000220000440","000000123440","000000000000","002220000000","002220000000","000000022200","000000022200","000002000000","000002000000","000000000000"],
  map:["EE.....X....","E........X..","...C......I.",".X..C.......","CCCCCnCCgC..","..........C.",".....w......","...C......w.",".X..........","...C.......X","PPP.....C...","PPP........."],
  enemies:[['trooper', 10, 1], ['infiltrator', 11, 6], ['trooper', 6, 2], ['heavy', 1, 2], ['medic', 8, 7], ['marksman', 3, 5]],reinf:[[3, [['trooper', 11, 11], ['trooper', 10, 11]]], [5, [['infiltrator', 0, 6]]]],
  objectives:[{type:'extract'}],xp:110,recruit:'tavi'},
 {id:'r4',title:'Founders’ Rise',tag:'Blow the relays and hold the square',
  brief:['This is it. The two signal relays on Founders’ Rise are how Security lock down every gate on the Ark. Blow both and the gates open for good.','Soldiers plant charges twice as fast. Once both relays are down, hold the square in the middle until the gates finish cycling.','Expect everything Security have left.'],
  debrief:'The gates are open. For the first time in years, anyone on the Ark can walk wherever they like. Now comes the hard part: deciding what to do with it.',
  h:["444444444444","444444444444","444443344444","222222222222","222222222222","222222222222","222222222222","001000000100","000000000000","000000000000","000000000000","000000000000"],
  map:["..X......X..",".T........T.","..C......C..",".w..w..w..w.","..C......C..",".....ZZ...H.","...w.ZZ.w...",".X........X.","...C.nn.C...",".w...S....w.","..PPPPPP....","............"],
  enemies:[['trooper', 3, 1], ['trooper', 8, 1], ['heavy', 6, 0], ['marksman', 0, 0], ['marksman', 11, 0], ['turret', 3, 3], ['medic', 8, 2], ['infiltrator', 11, 5], ['trooper', 2, 5]],reinf:[[4, [['trooper', 0, 11], ['trooper', 11, 11]]], [7, [['heavy', 11, 11]]]],
  objectives:[{type:'plant',targets:[[1,1],[10,1]],need:2},{type:'hold',turns:3}],xp:140}],
 security:[
 {id:'s1',title:'Ration Line',tag:'Hold the depot',alerted:true,
  brief:['A Resistance mob is marching on the ration depot. If they take it, the stores get looted and the whole lower Ark goes hungry next week instead of this one.','Hold the depot square for five turns. They will come from every side.','Every Security operative counts. Keep someone inside the square at all times.'],
  debrief:'The depot held and the rations went out on schedule. Halloran, a riot heavy who has held more lines than anyone, has been assigned to your team.',
  h:["440000000044","440000000044","000000000000","000222222000","000222222000","001222222100","001222222100","000222222000","000222222000","000000000000","440000000044","440000000044"],
  map:["....X..X....",".C........C.","...w....w...","...CZZZZC...","....ZZZZ....","....ZQQZ....","....ZQQZ....","....ZZZZ....","...CZZZZC...","...w....w...",".C..H...S.C.","....X..X...."],
  enemies:[['trooper', 0, 0], ['infiltrator', 11, 11], ['trooper', 11, 0]],reinf:[[2, [['trooper', 11, 6], ['trooper', 0, 6]]], [3, [['heavy', 6, 11]]], [4, [['infiltrator', 0, 11], ['trooper', 6, 0]]], [5, [['marksman', 11, 0]]]],
  objectives:[{type:'hold',turns:5}],xp:80,recruit:'halloran'},
 {id:'s2',title:'Pumping Station',tag:'Repair the pump under fire',
  brief:['Saboteurs have wrecked the main pump that feeds the upper districts. No pump, no water, for anyone.','Get to the pump and repair it. Engineers work twice as fast, and the job needs four units of progress.','The Resistance have taken the high walkways. Watch the marksmen.'],
  debrief:'The pump is running. Petra, a field medic from the upper districts, has requested a transfer to your unit.',
  h:["444444444444","444222222444","442222222244","422000000224","420000000024","420000000024","420000000024","422100001224","442222222244","000122221000","000000000000","000000000000"],
  map:["..X......X..","..........C.",".C........w.","..w......w..","...C....C...","......T.....","....w...w...","............","..C......C..","............",".w.PPPPPP.w.","............"],
  enemies:[['marksman', 1, 1], ['marksman', 10, 0], ['trooper', 3, 2], ['trooper', 8, 2], ['heavy', 5, 1], ['infiltrator', 6, 4]],reinf:[[3, [['trooper', 0, 4], ['trooper', 11, 4]]], [5, [['heavy', 6, 1]]]],
  objectives:[{type:'repair',targets:[[5,4]],need:4}],xp:100,recruit:'petra'},
 {id:'s3',title:'Smuggler’s Run',tag:'Stop the cell leader escaping',
  brief:['Intelligence has located the Resistance cell leader behind the reservoir job. He is meeting contacts in the old market.','Down him before he reaches the boats at the top of the map. He doesn’t know you are coming, so the longer you stay hidden, the better.','Once the alarm goes up, he will run.'],
  debrief:'The cell leader is in custody. Corin, a Security engineer who rigged half the market’s cameras, wants in on whatever you do next.',
  h:["000000000000","000000000000","022200002220","022200002220","022231132220","000000000000","000000000000","004440044400","004430034400","000000000000","000000000000","000000000000"],
  map:["~~~~EEEE~~~~","~...........",".......C....","..C......w..","............","CCCnCCCCgCC.","............","...X.....w..","............",".C..H....C..","...PPPPPP...","~~~~~~~~~~~~"],
  enemies:[['leader', 6, 6], ['trooper', 4, 6], ['heavy', 7, 4], ['marksman', 3, 2], ['medic', 10, 3], ['infiltrator', 1, 1]],reinf:[[4, [['trooper', 1, 1], ['trooper', 10, 1]]]],
  objectives:[{type:'kill',who:'leader'}],xp:110,recruit:'corin'},
 {id:'s4',title:'Lockdown',tag:'Seal the floodgates, then clear the area',
  brief:['The Resistance are trying to open the floodgates and drain the upper reservoir into their districts. It would flood the lower decks within a day.','Lock both floodgate terminals (operatives do it in one go), then clear every remaining Resistance fighter from the area.','This is the last big push. End it here.'],
  debrief:'The floodgates are sealed and the Resistance assault has collapsed. The Ark is quiet, for now. Quiet has never lasted long here.',
  h:["444420024444","444420024444","444420024444","333320023333","222220022222","100000000001","000000000000","000000000000","022200002220","022200002220","000000000000","000000000000"],
  map:["..X......X..",".T........T.","..C......C..","............","..w......w..","............","CCnCC..CCgCC","....S..H....","..w......w..",".C........C.","...PPPPPP...","............"],
  enemies:[['trooper', 3, 0], ['trooper', 8, 0], ['heavy', 5, 5], ['marksman', 0, 1], ['marksman', 11, 1], ['medic', 6, 4], ['infiltrator', 2, 5], ['turret', 4, 2]],reinf:[[3, [['trooper', 5, 0], ['trooper', 6, 0]]], [5, [['heavy', 5, 0]]]],
  objectives:[{type:'hack',targets:[[1,1],[10,1]],need:2},{type:'eliminate'}],xp:140}]};

/* ---------- operations: long multi-stage missions ---------- */
const OPERATIONS=[{id:'x1',title:'Container City Push',tag:'Gate, escort, crane, extract',long:true,turns:10,xp:160,
  brief:{resistance:['Security have dug into the old container yards at the edge of our district and taken the dock crane. While they hold it, nothing gets in or out by sea.','This is a long push. Blow the gate, then escort our maintenance bot down the main street to the crane. Get the crane running, grab the filter cache from the lab container and get it out on the boats.','Each objective you complete buys more time. The front moves with you: your drop point advances, and Security fall back to new lines.'],
         security:['The Resistance have fortified the container yards around the dock crane. Command wants the crane back and the cargo they are hiding in the lab container.','This is a long push. Breach the gate, escort the maintenance bot down the main street to the crane, repair it, then extract the cargo by boat.','Each objective you complete buys more time. Your drop point moves up behind you as the line advances, and the enemy will fall back to defend.']},
  debrief:{resistance:'The crane is ours and the cache is on its way to the district clinics. Security will think twice before setting foot in Container City again.',security:'The crane is back under Security control and the cargo is secured. The yards are quiet, for now.'},
  h:["000000000000","000000004440","000000004440","000001234440","000000000000","000000000000","000000000000","022000000000","022000000220","000000000220","000000000000","000000000000","000000000000","000000000000","222100000222","222000000222","222000000222","222000000222","222000000222","222000000222","222000000222","000000000100","000000000000","000000000000","404400004404","000000000000","000000000000","000000000220","022000000220","022000000000","000000000000","000000000000","000000000000","000000000000"],
  map:["~~~~~~~~~~~~","~..C.....X.~","~.I......w.~","~...C.......","~.....C.....","~..w.....C..","~.....T.....","~......C....","~.......w..~","EE.C.......~","E...........","....C...w...","............","...C......C.","..........S.",".w.......w..","...C....C...",".H..........","...C....C...",".X........X.","..w.......w.",".........Y..","...C..M.C...","...C......C.",".K..DTDD..n.","...C....C...",".w.......w..","....C..C....","......w.....","...C....C...","............",".C........C.","...PPPPP....","~~~......~~~"],
  stages:[{'name': 'Breach the gate', 'objectives': [{'type': 'plant', 'label': 'Blow the gate', 'targets': [[5, 24]], 'need': 2, 'clears': [[4, 24], [6, 24], [7, 24]]}], 'spawns': null, 'addTurns': 0, 'enemies': [['trooper', 3, 21], ['trooper', 8, 21], ['heavy', 5, 20], ['marksman', 2, 24], ['infiltrator', 9, 22], ['turret', 7, 22]], 'reinf': [[3, [['trooper', 2, 18]]]]}, {'front': 23, 'name': 'Escort the bot', 'objectives': [{'type': 'escort', 'path': [[5, 23], [5, 22], [5, 21], [5, 20], [5, 19], [5, 18], [5, 17], [5, 16], [5, 15], [5, 14], [5, 13]], 'hp': 320}], 'spawns': [[4, 25], [5, 25], [6, 25], [7, 25]], 'addTurns': 8, 'enemies': [['trooper', 1, 16], ['marksman', 10, 16], ['trooper', 2, 13], ['medic', 9, 13], ['heavy', 7, 12]], 'reinf': [[3, [['trooper', 11, 12]]], [5, [['infiltrator', 10, 11]]]]}, {'front': 12, 'name': 'Take the crane', 'objectives': [{'type': 'repair', 'label': 'Repair the crane', 'targets': [[6, 6]], 'need': 3}, {'type': 'extract'}], 'spawns': [[4, 14], [5, 14], [6, 14], [7, 14]], 'addTurns': 6, 'enemies': [['heavy', 2, 4], ['trooper', 2, 5], ['trooper', 8, 5], ['marksman', 10, 2], ['medic', 4, 7], ['infiltrator', 11, 4], ['engineer', 7, 8]], 'reinf': [[2, [['trooper', 5, 1]]], [4, [['heavy', 6, 1]]]]}],
  secondaries:[{'id': 'door', 'type': 'hack', 'stage': 0, 'targets': [[1, 24]], 'need': 2, 'label': 'Hack the side door'}, {'id': 'stairs', 'type': 'build', 'stage': 1, 'targets': [[9, 21]], 'need': 2, 'label': 'Build the side stairs'}, {'id': 'mg', 'type': 'mg', 'stage': 1, 'targets': [[6, 22]], 'need': 2, 'label': 'Build an MG nest'}]}];
{const a=OPERATIONS[0];OPERATIONS.push({id:'x1d',title:'Container City Hold',tag:'Defend the gate, the street and the crane',long:true,defend:true,turns:10,xp:160,h:a.h,map:a.map,
  brief:{resistance:['Security are coming for the dock crane, and for the filter cache in the lab container. This is our district. They do not get through.','Hold them as long as you can. They will try to blow the gate, push a maintenance bot down the main street to the crane, repair it and take the cache out by boat.','Every turn you hold counts. If the gate falls, fall back to the next line. Defuse their charges, shoot the bot, and stop anyone carrying the cache.'],
         security:['The Resistance are pushing on the dock crane to seize the cargo we hold in the yards. Hold them off until relief arrives.','They will try to blow the gate, push a stolen maintenance bot to the crane, repair it and take the cargo out by boat.','Every turn you hold counts. If a line falls, fall back to the next. Defuse charges, disable the bot, and stop the carrier.']},
  debrief:{resistance:'They broke against our lines and pulled back. Container City stands, and the cache stays with the people who need it.',security:'The attack has failed and the crane is secure. Relief is on its way.'},
  stages:[{name:'The gate',pspawns:[[4,21],[5,21],[6,21],[7,21]],espawns:[[3,32],[4,32],[5,32],[6,32],[7,32],[2,31]],size:6,pool:['trooper','engineer','trooper','medic','infiltrator','heavy'],objectives:[{type:'plant',dlabel:'Stop them blowing the gate',label:'Blow the gate',targets:[[5,24]],need:4,clears:[[4,24],[6,24],[7,24]]}],addTurns:0},
    {name:'The street',pspawns:[[4,12],[5,12],[6,12],[7,12]],espawns:[[4,25],[5,25],[6,25],[7,25],[2,26],[8,26]],size:7,pool:['trooper','engineer','heavy','trooper','medic','infiltrator','marksman'],objectives:[{type:'escort',dlabel:'Stop the bot',path:a.stages[1].objectives[0].path,hp:220}],addTurns:6},
    {name:'The crane',pspawns:[[3,4],[4,4],[5,4],[7,4]],espawns:[[4,14],[5,14],[6,14],[7,14],[3,15],[8,15]],size:7,pool:['engineer','trooper','heavy','engineer','medic','infiltrator','trooper'],objectives:[{type:'repair',dlabel:'Stop the crane repair',label:'Repair the crane',targets:[[6,6]],need:5},{type:'extract',dlabel:'Stop them taking the cache'}],addTurns:6}],
  secondaries:[{id:'mg',type:'mg',stage:0,targets:[[6,22]],need:2,label:'Build an MG nest'}]})}
const OP_BY_ID=Object.fromEntries(OPERATIONS.map(o=>[o.id,o]));
const EPILOGUE={resistance:'The gates are open and the water flows. The Ark isn’t saved, but for the first time in a long time it belongs to the people living on it.',
  security:'Order holds. The pumps run, the rations go out and the floodgates stay shut. Whether that is the same thing as peace is a question for another day.'};

/* ---------- save ---------- */
const SAVE_KEY='arkside.campaign.v1';
const uid=()=>'op'+Math.random().toString(36).slice(2,9);
function mkOp(look){return{id:uid(),look,name:look.name,callsign:look.callsign,faction:look.faction,body:look.body,cls:look.cls,weapon:look.weapon,xp:0,injured:0}}
function newSave(){return{v:1,roster:{resistance:BASE_ROSTER.resistance.map(mkOp),security:BASE_ROSTER.security.map(mkOp)},prog:{resistance:0,security:0},stars:{},settings:{fast:false,sound:true,gfx:'high',music:true,diff:'normal',units:'animated'}}}
function fillSave(v){v.stars=v.stars||{};v.settings=Object.assign({fast:false,sound:true,gfx:'high',music:true,diff:'normal',units:'animated'},v.settings||{});return v}
function validSave(s){return s&&s.v===1&&s.roster&&Array.isArray(s.roster.resistance)&&Array.isArray(s.roster.security)&&s.prog}
function readSave(){try{const v=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(validSave(v)){for(const f of ['resistance','security'])v.roster[f]=v.roster[f].map(o=>({...o,look:clean(o.look)}));return fillSave(v)}}catch(e){}return null}
let SAVE=readSave()||newSave();SPD=SAVE.settings.fast?.55:1;
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE))}catch(e){}}
// Head-and-shoulders snapshot of the operative's own 3D model (portraitHTML in units.js).
const opPortrait=op=>portraitHTML({...op.look,cls:op.cls,weapon:op.weapon,body:op.body});

/* ---------- sound ---------- */
let AC=null,NOISE=null;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')AC.resume();return AC}
const SFXB={};let SFX_LOADING=false;
const SFX_MAP={shot:['rifle',.5],heavy:['auto',.45],shotgun:['shotgun',.6],boom:['boom',.9],debris:['debris',.35],hit:['flesh',.55],miss:['rico',.35],step:['step',.2],jump:['jump',.35],land:['land',.45],build:['build',.6],reload:['reload',.5],ready:['ready',.4],throw:['throw',.5],shell:['shell',.22]};
function loadSfx(a){if(SFX_LOADING||typeof SFX_DATA!=='object'||!SFX_DATA)return;SFX_LOADING=true;for(const[k,arr]of Object.entries(SFX_DATA)){SFXB[k]=[];for(const b64 of arr){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);try{a.decodeAudioData(u.buffer,buf=>SFXB[k].push(buf),()=>{})}catch(e){}}}}
document.addEventListener('pointerdown',()=>{const a=ac();if(a)loadSfx(a)},{once:true,capture:true});
function sample(name,vol,pos){const a=ac();if(!a)return false;loadSfx(a);const list=SFXB[name];if(!list||!list.length)return false;const src=a.createBufferSource();src.buffer=list[Math.floor(Math.random()*list.length)];src.playbackRate.value=.94+Math.random()*.12;
  const g=a.createGain();g.gain.value=vol;src.connect(g);let out=g;
  if(pos&&typeof cam!=='undefined'&&cam&&a.createStereoPanner){const v=pos.clone().project(cam);const pn=a.createStereoPanner();pn.pan.value=Math.max(-1,Math.min(1,v.x*.75));g.connect(pn);out=pn;if(Math.abs(v.x)>1.15||Math.abs(v.y)>1.15)g.gain.value=vol*.45}
  out.connect(a.destination);src.start();return true}
function sfx(kind,pos){if(!SAVE.settings.sound)return;const a=ac();if(!a)return;const sm2=SFX_MAP[kind];if(sm2&&sample(sm2[0],sm2[1],pos))return;if(['step','jump','land','build','reload','ready','throw','shell','debris'].includes(kind))return;const t=a.currentTime;
  if(!NOISE){NOISE=a.createBuffer(1,a.sampleRate,a.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const noise=(dur,freq,q,vol,type='lowpass')=>{const s=a.createBufferSource();s.buffer=NOISE;const f=a.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=a.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(a.destination);s.start(t);s.stop(t+dur)};
  const tone=(f0,f1,dur,vol,type='square',dl=0)=>{const o=a.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t+dl);o.frequency.exponentialRampToValueAtTime(f1,t+dl+dur);const g=a.createGain();g.gain.setValueAtTime(vol,t+dl);g.gain.exponentialRampToValueAtTime(.001,t+dl+dur);o.connect(g);g.connect(a.destination);o.start(t+dl);o.stop(t+dl+dur)};
  if(kind==='shot'){noise(.12,2400,.7,.3,'bandpass');tone(180,60,.08,.12,'triangle')}
  if(kind==='heavy'){noise(.16,1300,.6,.4,'bandpass');tone(120,40,.12,.18,'triangle')}
  if(kind==='boom'){noise(.9,480,.5,.75);tone(90,30,.6,.35,'sine')}
  if(kind==='hit')tone(320,140,.07,.1,'square');
  if(kind==='miss')noise(.08,5000,1,.07,'highpass');
  if(kind==='ui')tone(880,660,.05,.04,'sine');
  if(kind==='alarm'){tone(660,660,.14,.09,'square');tone(880,880,.14,.09,'square',.17)}
  if(kind==='good'){tone(523,523,.1,.07,'sine');tone(784,784,.15,.07,'sine',.1)}
  if(kind==='win')[523,659,784,1046].forEach((f,i)=>tone(f,f,.25,.07,'triangle',i*.12));
  if(kind==='lose')[392,330,262].forEach((f,i)=>tone(f,f*.98,.35,.07,'triangle',i*.18))}
const PAR={x1:20,r1:6,r2:7,r3:8,r4:11,s1:6,s2:8,s3:6,s4:10};
const starStr=n=>'★'.repeat(n)+'☆'.repeat(3-n);

/* ---------- music ---------- */
const MUSIC_SRC={resistance:typeof MUSIC_RES==='string'?MUSIC_RES:null,security:typeof MUSIC_SEC==='string'?MUSIC_SEC:null};
const MUS={el:{},cur:null,timers:{}};
function musicEl(f){if(!MUSIC_SRC[f])return null;if(!MUS.el[f]){const a=new Audio(MUSIC_SRC[f]);a.loop=true;a.preload='auto';a.volume=0;MUS.el[f]=a}return MUS.el[f]}
function musicVol(){return document.body.dataset.view==='game'?.28:.5}
function fadeAudio(a,to,ms,done){clearInterval(MUS.timers[a.src.length]);const from=a.volume,t0=performance.now();MUS.timers[a.src.length]=setInterval(()=>{const k=Math.min(1,(performance.now()-t0)/ms);a.volume=Math.max(0,Math.min(1,from+(to-from)*k));if(k>=1){clearInterval(MUS.timers[a.src.length]);if(done)done()}},40)}
function playMusic(f){const want=SAVE.settings.music&&SAVE.settings.sound&&!document.hidden?f:null;
  for(const k in MUS.el){const a=MUS.el[k];if(k!==want&&!a.paused)fadeAudio(a,0,700,()=>a.pause())}
  MUS.cur=want;if(!want)return;const a=musicEl(want);if(!a)return;if(a.paused){a.volume=0;const p=a.play();if(p&&p.catch)p.catch(()=>{})}fadeAudio(a,musicVol(),900)}
document.addEventListener('visibilitychange',()=>playMusic(document.body.dataset.view==='title'?null:CUR.faction));

/* ---------- press-and-hold info ---------- */
const MOVE_TIP={light:'Light: wall-hops two levels (2 moves), climbs one level for 1 move, drops two levels, fits through crawl vents and narrow gaps.',medium:'Medium: climbs one level for 2 moves, drops two levels, fits through narrow gaps but not vents.',heavy:'Heavy: stairs only, drops one level, can’t fit through vents or gaps.'};
function tipHTML(k){const[a,b]=k.split(':');
  if(a==='ab'){const A=AB[b],i=Object.values(CLASS_AB).findIndex(l=>l.includes(b)),lv=i>=0?AB_LVL[CLASS_AB[Object.keys(CLASS_AB)[i]].indexOf(b)]:1;return `<b>${A.name}</b>${A.desc}<small>Cooldown ${A.cd} turn${A.cd>1?'s':''}. Unlocks at level ${lv}.</small>`}
  if(a==='cls')return `<b>${b[0].toUpperCase()+b.slice(1)}</b>${CLASS_DESC[b]}<small>Abilities: ${CLASS_AB[b].map((x,i)=>AB[x].name+' (Lv '+AB_LVL[i]+')').join(', ')}</small>`;
  if(a==='wpn'){const w=WPN[b];return `<b>${w.name}</b>${w.dmg} damage${w.burst?` over a ${w.burst}-round burst`:''}, range ${w.range}, accuracy ${w.acc}. Best within ${w.opt} tiles; accuracy drops beyond that.`}
  if(a==='move')return `<b>Move</b>How many tiles this operative can cover in a turn. ${MOVE_TIP[b]||''}`;
  if(k==='action')return '<b>Action</b>One per turn: shoot, use an ability, work on an objective, go on overwatch or swap class.';
  if(k==='ow')return '<b>Overwatch</b>Ends this operative’s turn. They fire at the first enemy that moves within range and sight, at −10 accuracy.';
  if(k==='swap')return '<b>Swap class</b>Only on a command post you hold. Change class (abilities change, weapon stays). Uses the action.';
  if(k==='wait')return '<b>Done</b>Skip any remaining orders for this operative.';
  if(a==='sec'){const sc=S.sec.find(x=>x.id===b);if(!sc)return '';return `<b>${sc.label}</b>${{hack:'Opens the side door, giving a new route through.',build:'Builds stairs so heavies can reach the walkway.',mg:'Builds an MG nest that fires at enemies at the end of every turn.'}[sc.type]}<small>Optional. ${SEC_FAST[sc.type][0].toUpperCase()+SEC_FAST[sc.type].slice(1)}s work twice as fast. Needs ${sc.need} progress.</small>`}
  if(k==='obj'&&M&&M.defend){const o=curObj();return `<b>${DEF_VERB[o.type]}</b>Undo the enemy’s progress from an adjacent tile. ${DEF_FAST[o.type][0].toUpperCase()+DEF_FAST[o.type].slice(1)}s undo twice as much.`}
  if(k==='obj'){const o=curObj();if(o.type==='escort')return '<b>Repair the bot</b>The bot is disabled. Two units of progress get it moving again. Engineers do it in one.';return `<b>${OBJ_VERB[o.type]}</b>Work on the objective from an adjacent tile. ${OBJ_FAST[o.type][0].toUpperCase()+OBJ_FAST[o.type].slice(1)}s make double progress.`}
  if(k==='perks')return '<b>Levels and perks</b>Each level adds +8 health and +3 accuracy, and lets you choose a perk. Level 3 adds +1 move. New abilities unlock at levels 2 and 4.';
  if(a==='perk')return `<b>${PERKS[b].name}</b>${PERKS[b].desc}`;
  if(k==='redeploy')return '<b>Redeploy</b>Come back at the drop point at the start of your next turn with half health (move only). Or stay down and wait: a medic can revive you where you fell. After 3 turns you redeploy automatically.';
  if(k==='mini')return '<b>Minimap</b>Tap to move the camera there. Gold box: current objective. Your squad in faction colour, enemies you can see in red.';
  if(k==='undo')return '<b>Undo move</b>Puts the operative back. Not possible if the move triggered overwatch, got you spotted, revealed an enemy or picked up the cartridge.';
  if(k==='unit:me'&&S.sel)return unitTip(S.sel);
  return ''}
function unitTip(u){if(u.cls==='bot')return `<b>Maintenance bot</b>${u.down?'Disabled. Stand next to it and repair it.':'Moves up to 2 tiles along its route at the end of its side’s turn, as long as its side has someone next to it and the other side doesn’t outnumber them there.'}<small>${u.hp}/${u.maxHp} health.</small>`;if(u.op){return `<b>${esc(u.name)}</b>Lv ${u.lvl} ${u.body} ${u.cls}. ${u.hp}/${u.maxHp} health${u.shield?`, +${u.shield} shield`:''}.<small>${u.weapon.name}: ${u.weapon.dmg} dmg, range ${u.weapon.range}. ${MOVE_TIP[u.body]}</small>${u.down?`<small>Down. Back on their feet in ${Math.max(1,3-(u.downTurns||0))} turn(s) at the drop point, or sooner if a medic revives them.</small>`:''}`}
  if(u.cls==='turret'&&u.team==='p')return `<b>Your turret</b>${u.hp}/${u.maxHp} health. Fires at the end of your turn.`;
  const T=ETYPES[u.type]||{};return `<b>${esc(u.name)}</b>${T.desc||''}<small>${u.hp}/${u.maxHp} health. ${u.weapon.name}: ${u.weapon.dmg} dmg, range ${u.weapon.range}.${u.ow?' On overwatch.':''}${u.stun>0?' Stunned.':''}</small>`}
function tileTip(t){const lv=t.h>=2?'High level':t.h>=1?'Mid level':t.type==='ramp'?'Stairs':'Ground';const bits=[];
  if(t.pass==='light')bits.push('Crawl vent: light bodies only. Half cover.');if(t.pass==='nonheavy')bits.push('Narrow gap: no heavies.');
  if(t.type==='ramp')bits.push('Stairs: the only way up for heavies.');if(t.cp)bits.push(`${t.cp==='health'?'Health':'Supply'} command post (${t.owner==='p'?'yours':t.owner==='e'?'enemy':'unclaimed'}). ${t.cp==='health'?'Heals the holder’s team 10 a turn.':'Speeds up the holder’s cooldowns.'} Stand here to swap class.`);
  if(t.obj==='crate'||t.obj==='pillar')bits.push('Full cover. Blocks sight.');if(t.obj==='wall')bits.push('Barricade: half cover. Grenades destroy it.');if(t.obj==='term')bits.push('Objective.');
  if(t.zone)bits.push('Hold zone.');if(t.exit)bits.push('Exit.');if(t.type==='water')bits.push('Water: impassable.');
  return `<b>${lv}</b>${bits.join(' ')||'Open ground.'}`}
let tipT=null,tipShownAt=0,suppressClick=false;
function showTip(html,x,y){if(!html)return;const e=$('#tip');e.innerHTML=html;e.hidden=false;const w=Math.min(300,innerWidth-24);e.style.width=w+'px';const r=e.getBoundingClientRect();let left=Math.max(12,Math.min(innerWidth-w-12,x-w/2)),top=y-r.height-16;if(top<12)top=y+20;e.style.left=left+'px';e.style.top=Math.min(innerHeight-r.height-12,top)+'px';tipShownAt=performance.now();if(navigator.vibrate)try{navigator.vibrate(8)}catch(_){}}
function hideTip(){const e=$('#tip');if(e)e.hidden=true}
document.addEventListener('pointerdown',e=>{suppressClick=false;const el=e.target.closest('[data-tip]');clearTimeout(tipT);if(performance.now()-tipShownAt>150)hideTip();if(!el)return;const sx=e.clientX,sy=e.clientY;
  tipT=setTimeout(()=>{suppressClick=true;const r=el.getBoundingClientRect();showTip(tipHTML(el.dataset.tip),r.left+r.width/2,r.top)},e.pointerType==='mouse'?600:420);
  const cancel=ev=>{if(ev.type!=='pointermove'||Math.hypot(ev.clientX-sx,ev.clientY-sy)>10){clearTimeout(tipT);document.removeEventListener('pointermove',cancel);document.removeEventListener('pointerup',cancel)}};
  document.addEventListener('pointermove',cancel);document.addEventListener('pointerup',cancel)},true);
document.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopPropagation()}},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest('[data-tip],#stage'))e.preventDefault()});

/* ---------- views ---------- */
const VIEWS=['title','camp','brief','roster','game','debrief','creator'];
let CUR={faction:'resistance',mi:0};
function show(v){for(const n of VIEWS)$('#v-'+n).hidden=n!==v;document.body.dataset.view=v;window.scrollTo(0,0);if(v==='game')requestAnimationFrame(fit);playMusic(v==='title'?null:CUR.faction)}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2600)}
function setFaction(f){CUR.faction=f;document.body.dataset.faction=f}

function viewTitle(){
  const p=SAVE.prog;
  $('#v-title').innerHTML=`<div class="hero-art">${skylineSVG('resistance',170)}</div><div class="title-hero"><h1>Arkside</h1><p>Two sides of a drowning city. Pick one.</p></div>
  <div class="facs">${['resistance','security'].map(f=>`<button type="button" class="fac ${f}" data-f="${f}"><b>${FACTIONS[f].label}</b><span>${f==='resistance'?'Fight for water, freedom and a way off the Ark.':'Keep the Ark running, whatever it costs.'}</span><em>${p[f]>=4?'Campaign complete':`Mission ${Math.min(4,p[f]+1)} of 4`}</em></button>`).join('')}</div>
  <details class="tools"><summary>Share operatives</summary><p class="small">Design operatives in the Roster (Recruit operative, or Edit look). To share them, tap “Show export code” and copy it. To bring operatives in, paste a code here (old codes from the standalone Operative Creator work too) and each joins their faction’s roster.</p><textarea id="impCreator" spellcheck="false" placeholder="Paste an operative code"></textarea><div class="row"><button type="button" class="btn" id="doExp">Show export code</button><button type="button" class="btn" id="doImp">Import operatives</button></div></details>
  <details class="tools"><summary>Settings</summary><div class="row"><button type="button" class="btn" id="setDiff"></button><button type="button" class="btn" id="setGfx"></button><button type="button" class="btn" id="setSnd"></button><button type="button" class="btn" id="setMus"></button><button type="button" class="btn" id="setSpd"></button></div><p class="small">Low graphics turns off shadows, waves and some scenery. Try it if the game feels sluggish. Each faction’s theme plays once you pick a side.</p></details>
  <details class="tools"><summary>Save data</summary><p class="small">Progress saves automatically in this browser. Copy your save code to move it to another device.</p><textarea id="saveCode" spellcheck="false"></textarea><div class="row"><button type="button" class="btn" id="expSave">Show save code</button><button type="button" class="btn" id="impSave">Load save code</button><button type="button" class="btn warn" id="resetSave">Reset everything</button></div></details>`;
  const st=()=>{$('#setDiff').textContent='Difficulty: '+DF().label;$('#setGfx').textContent='Graphics: '+(HI()?'High':'Low');$('#setSnd').textContent='Sound: '+(SAVE.settings.sound?'On':'Off');$('#setMus').textContent='Music: '+(SAVE.settings.music?'On':'Off');$('#setSpd').textContent='Speed: '+(SAVE.settings.fast?'Fast':'Normal')};st();
  $('#setDiff').onclick=()=>{const o=['easy','normal','hard'];SAVE.settings.diff=o[(o.indexOf(SAVE.settings.diff||'normal')+1)%3];persist();st()};$('#setGfx').onclick=()=>{SAVE.settings.gfx=HI()?'low':'high';persist();st()};$('#setSnd').onclick=()=>{SAVE.settings.sound=!SAVE.settings.sound;persist();st();sfx('ui')};$('#setMus').onclick=()=>{SAVE.settings.music=!SAVE.settings.music;persist();st();playMusic(null)};$('#setSpd').onclick=()=>{SAVE.settings.fast=!SAVE.settings.fast;SPD=SAVE.settings.fast?.55:1;persist();st()};
  $('#v-title').querySelectorAll('.fac').forEach(b=>b.onclick=()=>{setFaction(b.dataset.f);viewCamp()});
  $('#doExp').onclick=()=>{const t=$('#impCreator'),all=['resistance','security'].flatMap(f=>SAVE.roster[f].map(o=>({...o.look,name:o.name,callsign:o.callsign||o.look.callsign,cls:o.cls,weapon:o.weapon,body:o.body,faction:f})));t.value=JSON.stringify(all);t.select();toast(`Export code for ${all.length} operatives ready to copy`)};
  $('#doImp').onclick=()=>{try{let arr=JSON.parse($('#impCreator').value);if(!Array.isArray(arr))arr=[arr];let n=0;let full=0;for(const o of arr){if(!o||typeof o!=='object')continue;const look=clean(o);if(SAVE.roster[look.faction].length>=ROSTER_CAP){full++;continue}SAVE.roster[look.faction].push(mkOp(look));n++}persist();toast((n?`${n} operative${n>1?'s':''} imported`:'No operatives imported')+(full?`. ${full} skipped: rosters hold ${ROSTER_CAP}.`:''));$('#impCreator').value=''}catch(e){toast('That doesn’t look like a creator export code')}};
  $('#expSave').onclick=()=>{$('#saveCode').value=JSON.stringify(SAVE);$('#saveCode').select()};
  $('#impSave').onclick=()=>{try{const v=JSON.parse($('#saveCode').value);if(!validSave(v))throw 0;for(const f of ['resistance','security'])v.roster[f]=v.roster[f].map(o=>({...o,look:clean(o.look)}));SAVE=fillSave(v);persist();viewTitle();toast('Save loaded')}catch(e){toast('That save code isn’t valid')}};
  let armed=false;$('#resetSave').onclick=e=>{if(!armed){armed=true;e.target.textContent='Tap again to confirm';return}SAVE=newSave();persist();viewTitle();toast('Fresh start')};
  show('title');
}
function viewCamp(){
  const f=CUR.faction,prog=SAVE.prog[f];
  $('#v-camp').innerHTML=`<div class="camp-art">${skylineSVG(f,120)}</div><div class="bar"><button type="button" class="btn ghost bk">‹ Factions</button><button type="button" class="btn" id="toRoster">Roster (${SAVE.roster[f].length})</button></div>
  <h2 class="vh">${FACTIONS[f].label} campaign</h2>
  ${prog>=4?`<div class="epi"><b>Campaign complete</b><p>${EPILOGUE[f]}</p><p class="small">Replay any mission to keep levelling your operatives.</p></div>`:''}
  <div class="missions">${MISSIONS[f].map((m,i)=>`<button type="button" class="mis${i>prog?' locked':''}${i<prog?' done':''}" data-i="${i}" ${i>prog?'disabled':''}><em>${i+1}</em><b>${m.title}</b><span>${i>prog?'Locked':m.tag}</span>${i>prog?'':`<small>${THEME_LABEL[THEME_OF[m.id]]}, ${TIMES[TIME_OF[m.id]].label.toLowerCase()}</small>`}${SAVE.stars[m.id]?`<i>${starStr(SAVE.stars[m.id])}</i>`:i<prog?'<i>Complete</i>':''}</button>`).join('')}</div>`;
  $('#v-camp').insertAdjacentHTML('beforeend',`<h3>Operations <small class="small">preview</small></h3><p class="small">Long, multi-stage pushes across a bigger map, with a moving front line. More are on the way.</p><div class="missions">${OPERATIONS.map(o=>`<button type="button" class="mis op" data-op="${o.id}"><em>${o.defend?'D':'A'}</em><b>${o.title}</b><span>${o.tag}</span><small>${THEME_LABEL[THEME_OF[o.id]]}, ${TIMES[TIME_OF[o.id]].label.toLowerCase()}, ${o.stages.length} stages</small>${SAVE.stars[o.id]?`<i>${starStr(SAVE.stars[o.id])}</i>`:''}</button>`).join('')}</div>`);
  $('#v-camp .bk').onclick=viewTitle;$('#toRoster').onclick=viewRoster;
  $('#v-camp').querySelectorAll('.mis.op').forEach(b=>b.onclick=()=>{CUR.mi=-1;CUR.op=b.dataset.op;viewBrief()});
  $('#v-camp').querySelectorAll('.mis:not(.op)').forEach(b=>b.onclick=()=>{CUR.mi=+b.dataset.i;viewBrief()});
  show('camp');
}
function opStats(op){const l=lvlOf(op.xp),B=EB[op.body],P=new Set(op.perks||[]);return{l,hp:B.hp+8*(l-1)+(P.has('tough')?15:0),move:B.move+(l>=3?1:0)+(P.has('quick')?1:0),acc:WPN[op.weapon].acc+3*(l-1)+(P.has('steady')?8:0)}}
function abilList(cls,l){return CLASS_AB[cls].map((a,i)=>({id:a,ok:l>=AB_LVL[i],at:AB_LVL[i]}))}
function opCard(op,extra=''){const s=opStats(op),nx=LEVELS[s.l]||null,pr=nx?Math.round((op.xp-LEVELS[s.l-1])/(nx-LEVELS[s.l-1])*100):100;
  return `<div class="pf">${opPortrait(op)}</div><div class="oc"><b>${esc(op.name)} <i>Lv ${s.l}</i></b><span>${BODY[op.body].label} ${op.cls}, ${WPN[op.weapon].name.toLowerCase()}</span><div class="xp"><s style="width:${pr}%"></s></div>${extra}</div>`}
function perkPicker(op){const opts=perkOptions(op);const o=$('#modal');o.innerHTML=`<div class="mcard"><h3>${esc(op.name)}: choose a perk</h3><p class="small">One perk per level after the first. Choices are permanent.</p>${opts.map(id=>`<button type="button" class="perkopt" data-id="${id}"><b>${PERKS[id].name}</b><span>${PERKS[id].desc}</span></button>`).join('')||'<p>No perks left to choose.</p>'}<button type="button" class="btn ghost" id="mclose">Not now</button></div>`;o.hidden=false;
  o.querySelectorAll('.perkopt').forEach(b=>b.onclick=()=>{op.perks=[...(op.perks||[]),b.dataset.id];persist();o.hidden=true;toast(`${op.name} gained ${PERKS[b.dataset.id].name}`);viewRoster()});$('#mclose').onclick=()=>o.hidden=true}
function viewRoster(){
  const f=CUR.faction;
  $('#v-roster').innerHTML=`<div class="bar"><button type="button" class="btn ghost bk">‹ Campaign</button></div><h2 class="vh">Roster <small>${SAVE.roster[f].length} of ${ROSTER_CAP} operatives</small></h2><p class="small">Change an operative’s starting class and weapon here. In the field, they can also swap class at a command post you hold.</p>
  <button type="button" class="go crt-recruit" ${SAVE.roster[f].length>=ROSTER_CAP?'disabled':''}>${SAVE.roster[f].length>=ROSTER_CAP?'Roster full: dismiss someone to recruit':'Recruit operative'}</button>
  <div class="rlist">${SAVE.roster[f].map(op=>{const s=opStats(op);return `<div class="rcard">${opCard(op,`<p class="st" data-tip="perks">${s.hp} health, move ${s.move}, accuracy ${s.acc}${op.injured?' <em>Recovering</em>':''}${perkPicks(op)?` <button type="button" class="chip perkbtn" data-perkop="${op.id}">Choose perk (${perkPicks(op)})</button>`:''}${(op.perks||[]).length?`<span class="perks">${op.perks.map(pk=>`<span data-tip="perk:${pk}">${PERKS[pk].name}</span>`).join('')}</span>`:''}</p>
   <div class="chips">${Object.keys(CLASS_AB).map(c=>`<button type="button" class="chip${op.cls===c?' on':''}" data-op="${op.id}" data-c="${c}" data-tip="cls:${c}">${c}</button>`).join('')}</div>
   <div class="chips wpn">${(BODY_WPN[op.body]||[]).map(w=>`<button type="button" class="chip${op.weapon===w?' on':''}" data-op="${op.id}" data-w="${w}" data-tip="wpn:${w}">${WPN[w].name}</button>`).join('')}</div>
   <p class="ab">${abilList(op.cls,s.l).map(a=>`<span data-tip="ab:${a.id}" class="${a.ok?'':'lk'}">${AB[a.id].name}${a.ok?'':` (Lv ${a.at})`}</span>`).join('')}</p>
   <div class="btns crt-rbtns"><button type="button" class="btn" data-edit="${op.id}">Edit look</button><button type="button" class="btn ghost" data-dismiss="${op.id}">Dismiss</button></div>`)}</div>`}).join('')}</div>`;
  $('#v-roster .bk').onclick=viewCamp;$('#v-roster .crt-recruit').onclick=()=>viewCreator(null);
  $('#v-roster').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>viewCreator(SAVE.roster[f].find(o=>o.id===b.dataset.edit)));
  $('#v-roster').querySelectorAll('[data-dismiss]').forEach(b=>b.onclick=()=>crtDismiss(b,SAVE.roster[f].find(o=>o.id===b.dataset.dismiss)));
  $('#v-roster').querySelectorAll('.perkbtn').forEach(b=>b.onclick=e=>{e.stopPropagation();perkPicker(SAVE.roster[f].find(o=>o.id===b.dataset.perkop))});
  $('#v-roster').querySelectorAll('.chip:not(.perkbtn)').forEach(b=>b.onclick=()=>{const op=SAVE.roster[f].find(o=>o.id===b.dataset.op);if(b.dataset.w){op.weapon=b.dataset.w}else{op.cls=b.dataset.c;op.look={...op.look,cls:op.cls}}persist();viewRoster()});
  show('roster');
}
let PICK=[];
function curMission(){return CUR.mi<0?OP_BY_ID[CUR.op]:MISSIONS[CUR.faction][CUR.mi]}
function viewBrief(){
  const f=CUR.faction,m=curMission(),avail=SAVE.roster[f].filter(o=>!o.injured);
  PICK=PICK.filter(id=>avail.some(o=>o.id===id));if(!PICK.length)PICK=avail.slice(0,4).map(o=>o.id);
  const objText=m.defend?'hold out until the attack runs out of time':(m.stages?m.stages.flatMap(st=>st.objectives):m.objectives).map(o=>objLabel(o,null)).join(', then ');
  $('#v-brief').innerHTML=`<div class="bar"><button type="button" class="btn ghost bk">‹ Campaign</button></div>
  <h2 class="vh"><small>${CUR.mi<0?'Operation':'Mission '+(CUR.mi+1)}, ${THEME_LABEL[THEME_OF[m.id]]}, ${TIMES[TIME_OF[m.id]].label.toLowerCase()}</small>${m.title}</h2><div class="story">${(Array.isArray(m.brief)?m.brief:m.brief[f]).map(p=>`<p>${p}</p>`).join('')}</div>${m.stages?`<div class="moves"><b>${m.defend?'Lines of defence':'Stages'}</b>${m.stages.map((st,i)=>`<span><i>${i+1}.</i> ${st.name}${st.addTurns?` (+${st.addTurns} turns)`:''}</span>`).join('')}<small>${m.defend?`Hold for ${m.turns} turns. Each line that falls adds more turns to survive. Defuse charges, shoot the bot and stop the carrier. Optional: ${m.secondaries.map(x=>x.label[0].toLowerCase()+x.label.slice(1)).join(', ')}.`:`You start with ${m.turns} turns. Optional objectives open new routes: ${m.secondaries.map(x=>x.label[0].toLowerCase()+x.label.slice(1)).join(', ')}.`}</small></div>`:''}
  <p class="objline"><b>Objective:</b> ${objText}.</p>
  <div class="moves"><b>Moving around the Ark</b><span><i>Light</i> wall-hops two levels, climbs cheaply and fits through crawl vents.</span><span><i>Medium</i> climbs one level (costs an extra move) and squeezes through narrow gaps.</span><span><i>Heavy</i> takes stairs only and can’t fit through vents or gaps.</span><small>Difficulty: ${DF().label}. Change it in Settings on the title screen.</small></div>
  <h3>Choose up to four <span id="pc"></span></h3>
  <div class="plist">${SAVE.roster[f].map(op=>`<button type="button" class="pk${PICK.includes(op.id)?' on':''}" data-id="${op.id}" ${op.injured?'disabled':''}>${opCard(op,op.injured?'<p class="st"><em>Recovering, back next mission</em></p>':'')}</button>`).join('')}</div>
  <div class="sticky"><button type="button" class="go" id="deploy">Deploy squad</button></div>`;
  const upd=()=>{$('#pc').textContent=`(${PICK.length}/4)`;$('#deploy').disabled=!PICK.length};upd();
  $('#v-brief .bk').onclick=viewCamp;
  $('#v-brief').querySelectorAll('.pk').forEach(b=>b.onclick=()=>{const id=b.dataset.id,i=PICK.indexOf(id);if(i>=0)PICK.splice(i,1);else if(PICK.length<4)PICK.push(id);else{toast('Four operatives maximum');return}b.classList.toggle('on',PICK.includes(id));upd()});
  $('#deploy').onclick=async()=>{const ops=PICK.map(id=>SAVE.roster[f].find(o=>o.id===id));await RIG.wait(4000);show('game');startMission(m,ops)};
  show('brief');
}

/* ===================== TACTICAL ENGINE ===================== */
let G=[],N=12,NX=12,NZ=12,units=[],S={},M=null,TERMS=[];
const tileAt=(x,z)=>x>=0&&z>=0&&x<NX&&z<NZ?G[z][x]:null;
const topY=t=>t.type==='water'?-.3:t.h*.5;
const W=(x,z)=>new THREE.Vector3(x-(NX-1)/2,0,z-(NZ-1)/2);
const cheb=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.z-b.z));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const squad=()=>units.filter(u=>u.team==='p'&&u.op);
const living=team=>units.filter(u=>u.team===team&&!u.down&&!u.gone);
const foes=()=>living('e').filter(u=>u.cls!=='turret');
const unitAt=(x,z,ign)=>units.find(u=>u!==ign&&!u.gone&&u.x===x&&u.z===z&&!(u.down&&u.team==='e'));

function parseMap(m){const rows=m.map,hs=m.h;NZ=rows.length;NX=rows[0].length;N=Math.max(NX,NZ);G=[];TERMS=[];const spawns=[],zone=[],exits=[];let item=null;const cps=[];
  for(let z=0;z<NZ;z++){G.push([]);for(let x=0;x<NX;x++){const ch=rows[z][x],hd=hs?+hs[z][x]:0,t={x,z,h:hd/2,type:'floor',obj:null};
    if(hd%2===1)t.type='ramp';if(ch==='~'){t.type='water';t.h=0}
    if(ch==='C')t.obj='crate';if(ch==='w')t.obj='wall';if(ch==='X')t.obj='pillar';if(ch==='T'){t.obj='term';TERMS.push(t)}
    if(ch==='D')t.obj='gate';if(ch==='K')t.obj='door';if(ch==='Y')t.obj='scaffold';if(ch==='M')t.mg=true;if(ch==='n')t.pass='light';if(ch==='g')t.pass='nonheavy';
    if(ch==='H'||ch==='S'){t.cp=ch==='H'?'health':'supply';t.owner=null;cps.push(t)}
    if(ch==='P'||ch==='Q')spawns.push(t);if(ch==='Z'||ch==='Q'){t.zone=true;zone.push(t)}if(ch==='E'){t.exit=true;exits.push(t)}if(ch==='I'){t.item=true;item=t}
    G[z].push(t)}}
  return{spawns,zone,exits,item,cps}}
function stepCost(u,a,b){if(b.type==='water'||b.obj)return 0;if(b.pass==='light'&&u.body!=='light')return 0;if(b.pass==='nonheavy'&&u.body==='heavy')return 0;
  const up=b.h-a.h;if(Math.abs(up)<=.5)return 1;
  if(up>0){if(u.body==='heavy')return 0;if(up<=1)return(u.body==='light'||(u.perks&&u.perks.has('climber')))?1:2;if(up<=2&&u.body==='light')return u.perks&&u.perks.has('parkour')?1:2;return 0}
  const dn=-up;if(dn<=1)return 1;if(dn<=2&&u.body!=='heavy')return 1;return 0}
function reach(u,limit){const lim=limit??u.move,d=new Map([[key(u.x,u.z),0]]),prev=new Map(),climb=new Set(),open=[[u.x,u.z]];
  while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(d.get(key(open[i][0],open[i][1]))<d.get(key(open[bi][0],open[bi][1])))bi=i;
    const[x,z]=open.splice(bi,1)[0],dd=d.get(key(x,z)),a=G[z][x];
    for(const[dx,dz]of D4){const nx=x+dx,nz=z+dz,b=tileAt(nx,nz);if(!b)continue;const k=key(nx,nz);if(unitAt(nx,nz,u))continue;const c=stepCost(u,a,b);if(!c)continue;const nd=dd+c;if(nd>lim)continue;
      if(d.has(k)&&d.get(k)<=nd)continue;d.set(k,nd);prev.set(k,key(x,z));if(b.h-a.h>.5)climb.add(k);else climb.delete(k);if(!open.some(o=>o[0]===nx&&o[1]===nz))open.push([nx,nz])}}
  return{d,prev,climb}}
function pathTo(r,x,z){const out=[];let k=key(x,z);while(r.prev.has(k)){out.unshift(k.split(',').map(Number));k=r.prev.get(k)}return out}
function los(a,b){const dx=b.x-a.x,dz=b.z-a.z,steps=Math.ceil(Math.hypot(dx,dz)*4),hm=Math.max(a.h,b.h);
  for(let i=1;i<steps;i++){const t=i/steps,x=Math.round(a.x+dx*t),z=Math.round(a.z+dz*t);if((x===a.x&&z===a.z)||(x===b.x&&z===b.z))continue;const tl=G[z][x];
    if(tl.obj==='crate'||tl.obj==='term'||tl.obj==='pillar'||tl.obj==='gate'||tl.obj==='door')return false;if(tl.h>hm+.4)return false}return true}
function coverOf(t,from){let best=0;for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(!n)continue;if(dx*(from.x-t.x)+dz*(from.z-t.z)<=0)continue;
    let c=0;if(n.obj==='crate'||n.obj==='term'||n.obj==='pillar'||n.obj==='gate'||n.obj==='door'||(n.obj==='wall'&&n.fort)||n.h-t.h>=1)c=2;else if(n.obj==='wall'||n.obj==='scaffold'||n.pass==='light'||n.h-t.h>=.5)c=1;best=Math.max(best,c)}return best}
function marked(e){return S.reveals.some(r=>Math.hypot(e.x-r.x,e.z-r.z)<=r.r)}
function hitChance(att,tgt,mod=0){const a=G[att.z][att.x],t=G[tgt.z][tgt.x],d=dist(att,tgt),w=att.weapon;if(d>w.range+.01||!los(a,t))return 0;
  let c=w.acc+mod-Math.max(0,d-w.opt)*8;const cv=tgt.cls==='turret'?0:coverOf(t,a);c-=cv===2?40:cv===1?20:0;if(cv>0&&tgt.perks&&tgt.perks.has('dug'))c-=10;if(att.perks&&att.perks.has('eagle')&&att.team==='p'&&marked(tgt))c+=10;if(att.perks&&att.perks.has('ghost')&&att.disg>0)c+=20;{const dh=a.h-t.h;if(dh>=.5)c+=dh>=2?22:dh>=1?15:8;else if(dh<=-.5)c-=10}
  if(att.team==='p'&&!S.alerted)c+=20;if(att.team==='p'&&marked(tgt))c+=10;return Math.max(5,Math.min(95,Math.round(c)))}
function canSee(team,u){return team==='e'||S.vis.has(key(u.x,u.z))}

/* ---------- scene ---------- */
const stage=$('#stage');let renderer=null,scene,cam,tileGroup,hl,selRing,tex;
const camState={angle:Math.PI/4,target:new THREE.Vector3(),zoom:1};
const lam=c=>new THREE.MeshLambertMaterial({color:c});
let toon;
function initRenderer(){if(renderer)return true;if(typeof THREE==='undefined')return false;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){return false}
  renderer.setPixelRatio(HI()?Math.min(2,devicePixelRatio||1):1);renderer.shadowMap.enabled=HI();renderer.shadowMap.type=THREE.PCFSoftShadowMap;stage.prepend(renderer.domElement);cam=new THREE.OrthographicCamera(-6,6,6,-6,.1,200);tex=toonTex();toon=c=>new THREE.MeshToonMaterial({color:c,gradientMap:tex});
  new ResizeObserver(fit).observe(stage);bindInput();requestAnimationFrame(frame);return true}
function fit(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const ww=Math.max(6.6*w/h,5.4),hh=ww*h/w;cam.left=-ww;cam.right=ww;cam.top=hh;cam.bottom=-hh;cam.updateProjectionMatrix()}
/* ---------- Ark environment: themes, textures, props ---------- */
const THEME_OF={x1:'container',x1d:'container',r1:'container',r2:'industrial',r3:'container',r4:'founders',s1:'container',s2:'industrial',s3:'container',s4:'founders'};
const CONT_COLS=['#a4462c','#2f6e8a','#c98a2a','#4f6b3a','#8a2f2a','#c4572a','#3d5f7a','#b8b2a2'];
const THEMES={
  container:{floor:{tex:'deck',cols:['#8f7462','#806452','#977a63','#7a6252']},side:'#5a4d44',raisedTex:'corr',raisedCols:CONT_COLS,raisedTop:'deck',raisedTopCols:['#9a7d66','#8a7060'],rail:'#d07a2a',edge:'#e0a020'},
  founders:{floor:{tex:'white',cols:['#eceff1','#e2e7ea','#f2f4f5']},side:'#c9d2d8',raisedTex:'white',raisedCols:['#f4f6f7','#e9eef1'],raisedTop:'white',raisedTopCols:['#f7f9fa','#eef2f4'],rail:'#ffffff',edge:'#38b6e8',glass:true},
  industrial:{floor:{tex:'conc',cols:['#a3a6a7','#979b9d','#aeb0b0']},side:'#6e7376',raisedTex:'conc',raisedCols:['#b9bcbd','#adb1b3'],raisedTop:'grate',raisedTopCols:['#9aa0a4'],rail:'#e2b21f',edge:'#e2b21f'}};
let TH=THEMES.container,TX=null,ANIM=[],SEA=null;
function cvTex(draw,s=128){const c=document.createElement('canvas');c.width=c.height=s;const g=c.getContext('2d');draw(g,s);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
function speckle(g,s,n,a,R){for(let i=0;i<n;i++){const v=R()<.5?0:255;g.fillStyle=`rgba(${v},${v},${v},${a*R()})`;g.fillRect(R()*s,R()*s,1+R()*2,1+R()*2)}}
function makeTextures(){if(TX)return;const R=rng(77);TX={};
  TX.deck=cvTex((g,s)=>{g.fillStyle='#b8b8b8';g.fillRect(0,0,s,s);speckle(g,s,900,.18,R);
    g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1.5;for(let y=6;y<s;y+=10)for(let x=(y/10)%2?4:9;x<s;x+=10){g.beginPath();g.moveTo(x,y);g.lineTo(x+4,y-3);g.stroke()}
    g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,0,s,2);g.fillRect(0,0,2,s);g.fillRect(s/2-1,0,2,s);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(2,2,s,1);g.fillRect(s/2+1,0,1,s);
    g.fillStyle='rgba(0,0,0,.35)';for(const[x,y]of[[8,8],[s/2-8,8],[s/2+8,8],[s-8,8],[8,s-8],[s/2-8,s-8],[s/2+8,s-8],[s-8,s-8]]){g.beginPath();g.arc(x,y,2,0,7);g.fill()}
    g.fillStyle='rgba(90,50,20,.18)';for(let i=0;i<5;i++){g.beginPath();g.arc(R()*s,R()*s,6+R()*14,0,7);g.fill()}});
  TX.corr=cvTex((g,s)=>{g.fillStyle='#d2d2d2';g.fillRect(0,0,s,s);for(let x=0;x<s;x+=12){const gr=g.createLinearGradient(x,0,x+12,0);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(.45,'rgba(255,255,255,0)');gr.addColorStop(.6,'rgba(0,0,0,.28)');gr.addColorStop(1,'rgba(0,0,0,.05)');g.fillStyle=gr;g.fillRect(x,0,12,s)}
    g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,s,7);g.fillRect(0,s-7,s,7);speckle(g,s,500,.15,R);
    for(let i=0;i<6;i++){const x=R()*s,gr=g.createLinearGradient(0,7,0,7+30+R()*60);gr.addColorStop(0,'rgba(120,55,20,.45)');gr.addColorStop(1,'rgba(120,55,20,0)');g.fillStyle=gr;g.fillRect(x,7,2+R()*4,100)}});
  TX.conc=cvTex((g,s)=>{g.fillStyle='#cacac6';g.fillRect(0,0,s,s);speckle(g,s,1600,.14,R);g.fillStyle='rgba(0,0,0,.05)';for(let i=0;i<8;i++){g.beginPath();g.arc(R()*s,R()*s,8+R()*18,0,7);g.fill()}
    g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,0,s,2);g.fillRect(0,0,2,s);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,s/2,s,1)});
  TX.white=cvTex((g,s)=>{g.fillStyle='#f6f7f8';g.fillRect(0,0,s,s);speckle(g,s,300,.05,R);g.fillStyle='rgba(30,60,80,.14)';g.fillRect(0,0,s,2);g.fillRect(0,0,2,s);g.fillStyle='rgba(30,60,80,.07)';g.fillRect(0,s/2,s,1);g.fillRect(s/2,0,1,s)});
  TX.grate=cvTex((g,s)=>{g.fillStyle='#3a3d40';g.fillRect(0,0,s,s);g.fillStyle='#a4a8ab';for(let y=0;y<s;y+=8)g.fillRect(0,y,s,3);for(let x=0;x<s;x+=16)g.fillRect(x,0,3,s);speckle(g,s,300,.15,R)});
  TX.side=cvTex((g,s)=>{g.fillStyle='#9a9a9a';g.fillRect(0,0,s,s);speckle(g,s,700,.14,R);g.fillStyle='rgba(0,0,0,.22)';for(let y=0;y<s;y+=22)g.fillRect(0,y,s,2);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,0,s,4)});
  TX.wood=cvTex((g,s)=>{g.fillStyle='#b98e5c';g.fillRect(0,0,s,s);for(let y=0;y<s;y+=16){g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,y,s,2);g.fillStyle='rgba(70,40,15,.12)';for(let i=0;i<6;i++)g.fillRect(R()*s,y+3+R()*10,10+R()*30,1)}g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,6,s);g.fillRect(s-6,0,6,s);g.save();g.translate(0,0);g.strokeStyle='rgba(60,35,15,.6)';g.lineWidth=6;g.beginPath();g.moveTo(6,6);g.lineTo(s-6,s-6);g.stroke();g.restore()});
  TX.hazard=cvTex((g,s)=>{g.fillStyle='#e2b21f';g.fillRect(0,0,s,s);g.fillStyle='#1d1d1d';for(let i=-s;i<s*2;i+=24){g.beginPath();g.moveTo(i,0);g.lineTo(i+12,0);g.lineTo(i+12-s,s);g.lineTo(i-s,s);g.fill()}});
  TX.graf=cvTex((g,s)=>{g.clearRect(0,0,s,s);const cols=['#ff5fa2','#ffe14a','#5fe0ff','#ffffff','#7dff7a'];g.lineCap='round';
    for(let i=0;i<4;i++){g.strokeStyle=cols[Math.floor(R()*cols.length)];g.lineWidth=5+R()*7;g.globalAlpha=.85;g.beginPath();g.moveTo(10+R()*30,30+R()*70);g.bezierCurveTo(R()*s,R()*s,R()*s,R()*s,s-10-R()*30,30+R()*70);g.stroke()}
    g.globalAlpha=.9;g.fillStyle='#ffffff';g.beginPath();g.moveTo(s/2,24);g.bezierCurveTo(s/2+26,62,s/2+22,96,s/2,96);g.bezierCurveTo(s/2-22,96,s/2-26,62,s/2,24);g.fill();g.fillStyle='#1a7fd0';g.beginPath();g.arc(s/2,74,12,0,7);g.fill()});
}
const MC={};function sm(c,tex,extra){const k=c+'|'+(tex||'')+'|'+(extra?JSON.stringify(extra):'');return MC[k]||(MC[k]=new THREE.MeshLambertMaterial(Object.assign({color:c},tex?{map:TX[tex]}:{},extra||{})))}
const lamT=(c,tex,extra)=>new THREE.MeshLambertMaterial(Object.assign({color:c},tex?{map:TX[tex]}:{},extra||{}));
const hsh=(x,z,k=0)=>((x*73856093)^(z*19349663)^(k*83492791))>>>0;
const pickC=(arr,t,k)=>arr[hsh(t.x,t.z,k)%arr.length];
function setBase(o){o.traverse(m=>{if(!m.material)return;for(const mt of [].concat(m.material))if(mt.color&&!mt.userData.base)mt.userData.base=mt.color.clone()})}
function tint(o,f){o.traverse(m=>{if(!m.material)return;for(const mt of [].concat(m.material))if(mt.userData&&mt.userData.base)mt.color.copy(mt.userData.base).multiplyScalar(f)})}
function shadowy(o,cast=true){o.traverse(m=>{if(m.isMesh){m.castShadow=cast&&!(m.material&&m.material.side===THREE.BackSide);m.receiveShadow=true}})}

function tileMesh(t){const p=W(t.x,t.z),hgt=topY(t)+.45;let topTex,topCol,sideTex='side',sideCol=TH.side;
  if(t.type==='ramp'){topTex='grate';topCol='#a8adb0'}
  else if(t.h>=1){topTex=TH.raisedTop;topCol=pickC(TH.raisedTopCols,t,1);sideTex=TH.raisedTex;sideCol=pickC(TH.raisedCols,t,2)}
  else{topTex=TH.floor.tex;topCol=pickC(TH.floor.cols,t,3)}
  if(t.zone)topCol='#d8b54e';if(t.exit)topCol='#5fae7a';
  const top=lamT(topCol,topTex),side=lamT(sideCol,sideTex);
  const m=new THREE.Mesh(new THREE.BoxGeometry(.98,hgt,.98),[side,side,top,side,side,side]);m.position.set(p.x,topY(t)-hgt/2,p.z);m.userData.tile=t;
  const add=(geo,mat,x,y,z)=>{const c=new THREE.Mesh(geo,mat);c.position.set(x,y,z);c.userData.tile=t;m.add(c);return c};const ty=hgt/2;
  for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(!(t.h>=1&&t.type!=='ramp'&&n&&n.h<t.h-.5&&n.type!=='ramp'))continue;
    add(new THREE.BoxGeometry(dx?.06:.98,.03,dz?.06:.98),lamT(TH.edge),dx*.46,ty+.015,dz*.46);
    if(TH.glass){add(new THREE.BoxGeometry(dx?.03:.94,.3,dz?.03:.94),lamT('#bfe6ff',null,{transparent:true,opacity:.38}),dx*.47,ty+.17,dz*.47);add(new THREE.BoxGeometry(dx?.05:.96,.03,dz?.05:.96),lamT('#ffffff'),dx*.47,ty+.33,dz*.47)}
    else{for(const s of[-.42,.42])add(new THREE.BoxGeometry(.04,.32,.04),lamT(TH.rail),dx*.46+(dz?s:0),ty+.16,dz*.46+(dx?s:0));add(new THREE.BoxGeometry(dx?.04:.92,.04,dz?.04:.92),lamT(TH.rail),dx*.46,ty+.31,dz*.46)}}
  if(t.h>=1&&TH===THEMES.container&&hsh(t.x,t.z,9)%5===0){for(const[dx,dz]of D4){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.h<t.h){const d=add(new THREE.PlaneGeometry(.8,.5),lamT('#ffffff','graf',{transparent:true,depthWrite:false}),dx*.495,ty-.35,dz*.495);d.rotation.y=Math.atan2(dx,dz);break}}}
  if(t.exit){const c=add(new THREE.BoxGeometry(.5,.02,.12),new THREE.MeshBasicMaterial({color:0xeafff0}),0,ty+.01,0)}
  if(t.zone){const c=add(new THREE.BoxGeometry(.9,.012,.9),lamT('#f2d47a',null,{transparent:true,opacity:.35}),0,ty+.006,0)}
  shadowy(m,false);setBase(m);tileGroup.add(m);t.mesh=m}

function objMesh(t){const p=W(t.x,t.z),y=topY(t),g=new THREE.Group();g.position.set(p.x,y,p.z);const theme=TH===THEMES.founders?'f':TH===THEMES.industrial?'i':'c';
  const box=(w,h,d,mat,yy,x=0,z=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,yy,z);g.add(m);return m};
  if(t.obj==='crate'){
    if(theme==='c'){const b=box(.92,.82,.92,lamT(pickC(CONT_COLS,t,4),'corr'),.41);b.rotation.y=hsh(t.x,t.z,5)%2?Math.PI/2:0;box(.94,.05,.94,lamT('#3a3a3a'),.84)}
    else if(theme==='i'){box(.7,.55,.7,lamT('#c79a62','wood'),.28,-.05,-.04);box(.5,.4,.5,lamT('#b98e5c','wood'),.75,.08,.06).rotation.y=.4}
    else{box(.86,.5,.86,lamT('#f4f6f7','white'),.25);box(.76,.04,.76,lamT('#5a3e2a'),.51);const tr=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.4,6),lamT('#6a4a30'));tr.position.y=.7;g.add(tr);
      for(const[x,yy,z,r]of[[0,1.05,0,.32],[.12,.92,.1,.24],[-.12,.95,-.08,.22]]){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(r,0),lamT('#4f9a52'));c.position.set(x,yy,z);g.add(c)}}}
  if(t.obj==='wall'){
    if(theme==='c'){const mat=lamT('#bda77e');for(let r=0;r<2;r++)for(let i=-1;i<=1;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),mat);s.scale.set(.3,.12,.42);s.position.set(i*.29+(r?.14:0)*(i<1?1:-1)*0,.11+r*.2,0);g.add(s)}}
    else if(theme==='f'){box(.86,.16,.5,lamT('#f2f4f5','white'),.08);box(.6,.24,.3,lamT('#f2f4f5','white'),.28);box(.62,.05,.31,lamT('#38b6e8'),.33)}
    else{box(.86,.36,.42,lamT('#9da1a3','conc'),.18);box(.87,.1,.43,lamT('#ffffff','hazard'),.31)}}
  if(t.obj==='gate'){box(.98,1.6,.5,lamT('#3a3f45','side'),.8);box(1,.12,.52,lamT('#ffffff','hazard'),1.45);box(1,.12,.52,lamT('#ffffff','hazard'),.15);for(const x of[-.3,0,.3])box(.06,1.3,.52,lamT('#5a6066'),.8,x,0)}
  if(t.obj==='door'){box(.98,1.5,.5,lamT(pickC(CONT_COLS,t,11),'corr'),.75);box(.5,1.1,.04,lamT('#2a2d31'),.6,0,.27);const lt=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.04),new THREE.MeshBasicMaterial({color:0x38e0ff}));lt.position.set(.18,.85,.29);g.add(lt)}
  if(t.obj==='scaffold'){for(const x of[-.4,.4])for(const z of[-.4,.4]){const pp=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.9,6),lamT('#c9a046'));pp.position.set(x,.45,z);g.add(pp)}box(.9,.05,.9,lamT('#b98e5c','wood'),.5);box(.9,.05,.2,lamT('#e0a020'),.02,0,.4)}
  if(t.obj==='pillar'){
    if(theme==='c'){box(.92,.72,.92,lamT(pickC(CONT_COLS,t,6),'corr'),.36);box(.92,.72,.92,lamT(pickC(CONT_COLS,t,7),'corr'),1.1).rotation.y=Math.PI/2;
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.9,6),lamT('#d8d8d8'));pole.position.set(.3,1.9,.3);g.add(pole);const tb=new THREE.Group();tb.position.set(.3,2.35,.38);for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.05,.42,.02),lamT('#f0f0f0'));b.position.y=.2;const a=new THREE.Group();a.rotation.z=i*Math.PI*2/3;a.add(b);tb.add(a)}g.add(tb);ANIM.push(dt=>tb.rotation.z+=dt*3)}
    else if(theme==='f'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.36,.42,1.3,20),lamT('#f4f6f7','white'));c.position.y=.65;g.add(c);const top=new THREE.Mesh(new THREE.SphereGeometry(.4,20,10,0,Math.PI*2,0,Math.PI/2),lamT('#bfe6ff'));top.position.y=1.3;g.add(top);const band=new THREE.Mesh(new THREE.CylinderGeometry(.385,.385,.06,20),lamT('#38b6e8'));band.position.y=1.05;g.add(band)}
    else{const tk=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,1.3,18),lamT('#4fd18a',null,{transparent:true,opacity:.82,emissive:'#1a5a35'}));tk.position.y=.7;g.add(tk);for(const yy of[.08,.7,1.32]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.08,18),lamT('#5f6569'));r.position.y=yy;g.add(r)}
      for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.04,6,4),new THREE.MeshBasicMaterial({color:0xc8ffd8}));b.position.set((Math.random()-.5)*.4,.2,(Math.random()-.5)*.4);g.add(b);const sp=.3+Math.random()*.4,ph=Math.random();ANIM.push((dt,tt)=>b.position.y=.2+((tt*sp+ph)%1)*1)}}}
  if(t.obj==='term'){const kind=t.kind;
    if(kind==='repair'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,.75,14),lamT('#7d858a','conc'));c.position.y=.37;g.add(c);box(.9,.14,.22,lamT('#e2b21f'),.5);const w=new THREE.Mesh(new THREE.TorusGeometry(.22,.04,6,14),lamT('#c8321f'));w.position.set(0,.6,.36);g.add(w);
      t.lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshBasicMaterial({color:0xff5a2a}));t.lamp.position.y=.85;g.add(t.lamp)}
    else if(kind==='plant'){box(.62,1.15,.62,lamT('#2c3a46','conc'),.57);box(.66,.08,.66,lamT('#38b6e8'),.95);const a=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.7,6),lamT('#9aa4ad'));a.position.y=1.5;g.add(a);const d=new THREE.Mesh(new THREE.SphereGeometry(.2,12,6,0,Math.PI*2,0,Math.PI/2),lamT('#e9eef1'));d.rotation.x=-Math.PI/2.4;d.position.set(0,1.35,.15);g.add(d);
      t.lamp=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:0x5fc8ff}));t.lamp.position.y=1.88;g.add(t.lamp)}
    else{box(.66,.62,.48,lamT(theme==='f'?'#f2f4f5':'#3a4046',theme==='f'?'white':'conc'),.31);box(.68,.04,.5,lamT('#38b6e8'),.6);t.lamp=new THREE.Mesh(new THREE.BoxGeometry(.52,.04,.36),new THREE.MeshBasicMaterial({color:0x38e0ff}));t.lamp.position.set(0,.68,.04);t.lamp.rotation.x=-.5;g.add(t.lamp)}}
  g.traverse(o=>o.userData.tile=t);shadowy(g);setBase(g);tileGroup.add(g);t.objMesh=g}
function passMesh(t){const p=W(t.x,t.z),g=new THREE.Group();g.position.set(p.x,topY(t),p.z);const bl=(dx,dz)=>{const n=tileAt(t.x+dx,t.z+dz);return !n||!!n.obj||n.type==='water'};
  const alongZ=bl(1,0)||bl(-1,0);g.rotation.y=alongZ?0:Math.PI/2;const box=(w,h,d,c,x,y,z,tx)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lamT(c,tx));m.position.set(x,y,z);g.add(m);return m};
  if(t.pass==='light'){box(.98,.42,.7,TH===THEMES.container?pickC(CONT_COLS,t,8):'#6e7376',TH===THEMES.container?'corr':'conc',0,.72,0);for(const sx of[-.45,.45])box(.08,.5,.7,'#3a3d40',null,sx,.25,0);
    for(let i=0;i<3;i++){const pp=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.98,8),lamT('#8a9096'));pp.rotation.z=Math.PI/2;pp.position.set(0,.47+i*.0,-.25+i*.25);g.add(pp)}
    box(.6,.012,.12,'#38e0ff',null,0,.012,.3);box(.6,.012,.12,'#38e0ff',null,0,.012,-.3)}
  else{for(const sx of[-.42,.42])box(.14,1.5,.98,pickC(CONT_COLS,t,sx>0?9:10),'corr',sx,.75,0);box(.5,.012,.12,'#e0a020',null,0,.012,.3);box(.5,.012,.12,'#e0a020',null,0,.012,-.3)}
  g.traverse(o=>o.userData.tile=t);shadowy(g);setBase(g);tileGroup.add(g);t.passMesh=g}
function mgSpot(t){const p=W(t.x,t.z),r=new THREE.Mesh(new THREE.RingGeometry(.28,.4,24),new THREE.MeshBasicMaterial({color:0xe0a020,transparent:true,opacity:.7,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.set(p.x,topY(t)+.02,p.z);r.userData.tile=t;tileGroup.add(r);t.mgMesh=r}
function botModel(){const g=new THREE.Group(),Y='#e2b21f',D='#2b2e32';const add=(geo,c,x,y,z)=>{const m=new THREE.Mesh(geo,toon(c));m.position.set(x,y,z);g.add(m);return m};
  for(const sx of[-.28,.28])add(new THREE.BoxGeometry(.16,.2,.7),D,sx,.1,0);add(new THREE.BoxGeometry(.5,.32,.6),Y,0,.34,0);add(new THREE.BoxGeometry(.52,.06,.62),'#1d1d1d',0,.52,0);
  const head=add(new THREE.BoxGeometry(.28,.18,.24),'#4a4f55',0,.66,.12);add(new THREE.BoxGeometry(.2,.06,.02),'#38e0ff',0,.68,.25);add(new THREE.CylinderGeometry(.012,.012,.4,5),D,.18,.75,-.15);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0xff5a2a}));tip.position.set(.18,.96,-.15);g.add(tip);g.userData.tip=tip;addOutlines(g,.015);return g}
function cpMesh(t){const p=W(t.x,t.z),g=new THREE.Group();g.position.set(p.x,topY(t),p.z);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.42,.46,.07,24),lamT(t.cp==='health'?'#2c9d68':'#d9a520'));base.position.y=.035;g.add(base);
  const icon=new THREE.Mesh(t.cp==='health'?new THREE.BoxGeometry(.3,.02,.09):new THREE.BoxGeometry(.2,.02,.2),new THREE.MeshBasicMaterial({color:0xffffff}));icon.position.y=.08;g.add(icon);if(t.cp==='health'){const i2=icon.clone();i2.rotation.y=Math.PI/2;g.add(i2)}
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.2,6),lamT('#d8d8d8'));pole.position.set(.32,.6,-.32);g.add(pole);
  t.flag=new THREE.Mesh(new THREE.BoxGeometry(.36,.22,.02),new THREE.MeshBasicMaterial({color:0x999999}));t.flag.position.set(.5,1.06,-.32);g.add(t.flag);const fl=t.flag,ph=t.x+t.z;ANIM.push((dt,tt)=>fl.rotation.y=Math.sin(tt*3+ph)*.25);
  g.traverse(o=>o.userData.tile=t);shadowy(g);setBase(g);tileGroup.add(g);t.cpMesh=g}
function setOwner(t,team){t.owner=team;t.flag.material.color.set(team==='p'?FACTIONS[CUR.faction].accent:team==='e'?FACTIONS[ENEMY_OF[CUR.faction]].accent:'#999999')}

/* ---------- world dressing ---------- */
function addAt(o,x,y,z,ry=0){o.position.set(x,y,z);o.rotation.y=ry;scene.add(o);return o}
function containerProp(cols,R,n=1+Math.floor(R()*3)){const g=new THREE.Group();for(let i=0;i<n;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(2,.9,.9),sm(cols[Math.floor(R()*cols.length)],'corr'));b.position.set((R()-.5)*.3,.45+i*.9,(R()-.5)*.3);b.rotation.y=(R()<.3?Math.PI/2:0)+(R()-.5)*.1;g.add(b)}return g}
function boatProp(R){const g=new THREE.Group(),hc=['#e9eef1','#a4462c','#2f6e8a','#d8d2c0'][Math.floor(R()*4)];const h=new THREE.Mesh(new THREE.CylinderGeometry(.55,.4,2.6,4,1),sm(hc));h.rotation.set(Math.PI/2,Math.PI/4,0);h.scale.set(1,1,.45);h.position.y=.05;g.add(h);
  const c=new THREE.Mesh(new THREE.BoxGeometry(.7,.5,.6),sm('#f4f4f4'));c.position.set(-.3,.45,0);g.add(c);if(R()<.6){const k=containerProp(CONT_COLS,R,1);k.scale.setScalar(.45);k.position.set(.5,.2,0);g.add(k)}
  if(R()<.5){const tp=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.9),sm(['#2f6eb8','#c8321f','#e0a020'][Math.floor(R()*3)],null,{side:THREE.DoubleSide}));tp.rotation.x=-Math.PI/2+.3;tp.position.set(.3,.95,0);g.add(tp)}
  const ph=R()*6;ANIM.push((dt,tt)=>{g.position.y=-.28+Math.sin(tt*1.2+ph)*.05;g.rotation.z=Math.sin(tt*.9+ph)*.04});return g}
function turbineProp(R,white){const g=new THREE.Group(),col=white?'#f4f6f7':'#c9c3b8';const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.12,4,8),sm(col));p.position.y=2;g.add(p);
  const hub=new THREE.Group();hub.position.set(0,4.05,.15);for(let i=0;i<3;i++){const a=new THREE.Group();a.rotation.z=i*Math.PI*2/3;const b=new THREE.Mesh(new THREE.BoxGeometry(.14,1.5,.03),sm(white?'#ffffff':['#e9e2d0','#c8321f','#2f6e8a'][i%3]));b.position.y=.75;a.add(b);hub.add(a)}g.add(hub);
  const sp=1+R()*1.5;ANIM.push(dt=>hub.rotation.z+=dt*sp);return g}
function towerProp(R,h,r){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(r*.72,r,h,28),sm('#f2f5f7'));body.position.y=h/2;g.add(body);
  for(let y=h*.15;y<h;y+=h*.14){const gl=new THREE.Mesh(new THREE.CylinderGeometry(r*(1-.28*y/h)+.05,r*(1-.28*y/h)+.05,h*.035,28),sm('#8fcbea'));gl.position.y=y;g.add(gl)}
  for(const y of[h*.42,h*.7]){const gd=new THREE.Mesh(new THREE.TorusGeometry(r*(1-.28*y/h)+.15,.18,6,28),sm('#5aa35a'));gd.rotation.x=Math.PI/2;gd.position.y=y;g.add(gd)}
  const top=new THREE.Mesh(new THREE.SphereGeometry(r*.72,28,12,0,Math.PI*2,0,Math.PI/2),sm('#bfe6ff'));top.position.y=h;g.add(top);return g}
function craneProp(){const g=new THREE.Group(),y='#e2b21f';const c=new THREE.Mesh(new THREE.BoxGeometry(.4,7,.4),sm(y));c.position.y=3.5;g.add(c);const b=new THREE.Mesh(new THREE.BoxGeometry(6,.3,.3),sm(y));b.position.set(1.6,7,0);g.add(b);const cab=new THREE.Mesh(new THREE.BoxGeometry(.8,.6,.6),sm('#3a3d40'));cab.position.set(0,6.6,0);g.add(cab);
  const cb=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,3,4),sm('#222'));cb.position.set(4,5.5,0);g.add(cb);const ld=new THREE.Mesh(new THREE.BoxGeometry(1.4,.6,.6),sm('#2f6e8a','corr'));ld.position.set(4,3.8,0);g.add(ld);return g}
function tankProp(R){const g=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,3,18),sm('#4fd18a',null,{transparent:true,opacity:.85,emissive:'#1a5a35'}));t.position.y=1.5;g.add(t);for(const y of[.1,1.5,2.95]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,.15,18),sm('#5f6569'));r.position.y=y;g.add(r)}return g}
function dressWorld(theme){const R=rng(M.id.charCodeAt(1)*131+7),half=N/2;
  const ring=(lo,hi)=>{const pl=lo-half,ph=hi-half;for(let k=0;k<200;k++){const x=(R()*2-1)*(NX/2+ph),z=(R()*2-1)*(NZ/2+ph);if(Math.abs(x)>=NX/2+pl||Math.abs(z)>=NZ/2+pl)return[x,z]}return[NX/2+ph,NZ/2+ph]};
  const lo=!HI(),near=(theme==='founders'?14:20)>>(lo?1:0);
  for(let i=0;i<near;i++){const[x,z]=ring(half+2.5,half+8),r=R();
    if(theme==='container'){if(r<.5)addAt(containerProp(CONT_COLS,R,1+Math.floor(R()*2)),x,-.3,z,R()*Math.PI);else addAt(boatProp(R),x,-.28,z,R()*Math.PI*2)}
    else if(theme==='industrial'){if(r<.35){const tk=addAt(tankProp(R),x,-.3,z);tk.scale.setScalar(.6)}else if(r<.75)addAt(containerProp(CONT_COLS,R,1),x,-.3,z,R()*6);else addAt(boatProp(R),x,-.28,z,R()*6)}
    else{addAt(boatProp(R),x,-.28,z,R()*6)}}
  for(let i=0;i<8;i++){const[x,z]=ring(half+11,half+20),r=R();
    if(theme==='container')addAt(r<.6?turbineProp(R,false):containerProp(CONT_COLS,R,3),x,-.3,z,R()*6);
    else if(theme==='industrial')addAt(r<.4?craneProp():r<.7?tankProp(R):turbineProp(R,false),x,-.3,z,R()*6);
    else addAt(r<.5?towerProp(R,5+R()*7,1.2+R()*.8):turbineProp(R,true),x,-.3,z,R()*6)}
  // pontoons under near props
  // far Ark skyline: Founders' district on one side, container sprawl on the other
  const ft=towerProp(R,26,3.4);addAt(ft,-38,-.3,-30);const ft2=towerProp(R,17,2.6);addAt(ft2,-26,-.3,-44);const ft3=towerProp(R,13,2.2);addAt(ft3,-48,-.3,-16);
  for(let i=0;i<10;i++){const a=-2.6+R()*1.6,r=40+R()*20;addAt(towerProp(R,6+R()*12,1.4+R()*1.6),Math.cos(a)*r,-.3,Math.sin(a)*r)}
  const hull=new THREE.Mesh(new THREE.SphereGeometry(30,40,12,0,Math.PI*2,0,Math.PI/2),sm('#e6ecef'));hull.scale.set(1.4,.08,1);addAt(hull,-40,-.6,-36);
  const cc=CONT_COLS,inst={};for(const c of cc){inst[c]=new THREE.InstancedMesh(new THREE.BoxGeometry(2,.9,.9),sm(c,'corr'),70);inst[c].count=0;scene.add(inst[c])}
  const mm=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(1,1,1),ps=new THREE.Vector3();
  for(let i=0;i<(lo?150:420);i++){const a=.2+R()*2.6,r=34+R()*30,x=Math.cos(a)*r,z=Math.sin(a)*r,stack=Math.floor(R()*4*(1-(r-34)/40))+1;for(let s=0;s<stack;s++){const c=cc[Math.floor(R()*cc.length)],im=inst[c];if(im.count>=70)continue;q.setFromAxisAngle(new THREE.Vector3(0,1,0),R()<.5?0:Math.PI/2);ps.set(x+(R()-.5)*.4,.15+s*.9,z+(R()-.5)*.4);mm.compose(ps,q,sc);im.setMatrixAt(im.count++,mm)}}
  for(const c of cc)inst[c].instanceMatrix.needsUpdate=true;
  for(let i=0;i<(lo?6:14);i++){const a=.2+R()*2.6,r=36+R()*26;addAt(turbineProp(R,false),Math.cos(a)*r,-.3,Math.sin(a)*r,R()*6).scale.setScalar(1.4)}
  for(let i=0;i<9;i++){const a=R()*Math.PI*2,r=24+R()*30;addAt(boatProp(R),Math.cos(a)*r,-.28,Math.sin(a)*r,R()*6)}
  for(let i=0;i<(lo?3:8);i++){const cl=new THREE.Group();for(let j=0;j<4;j++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(2+R()*2,1),sm('#ffffff',null,{emissive:'#bcd8e8'}));s.position.set(j*2.4-3,(R()-.5),(R()-.5)*2);s.scale.y=.45;cl.add(s)}const a=R()*Math.PI*2,r=45+R()*25;addAt(cl,Math.cos(a)*r,22+R()*10,Math.sin(a)*r);const sp=.15+R()*.2;ANIM.push(dt=>{cl.position.x+=dt*sp;if(cl.position.x>80)cl.position.x=-80})}}
function buildScene(info){
  makeTextures();ANIM=[];const theme=THEME_OF[M.id]||'container';TH=THEMES[theme];document.body.dataset.theme=theme;
  applyTime();renderer.setPixelRatio(HI()?Math.min(2,devicePixelRatio||1):1);renderer.shadowMap.enabled=HI();
  scene=new THREE.Scene();scene.fog=new THREE.Fog(TM.fog,40,125);
  scene.add(new THREE.HemisphereLight(...TM.hemi));
  const sun=new THREE.DirectionalLight(TM.sun[0],TM.sun[1]);sun.position.set(...TM.sun[2]);sun.castShadow=HI();sun.shadow.mapSize.set(1024,1024);const sc=sun.shadow.camera;sc.left=-N*.8;sc.right=N*.8;sc.top=N*.8;sc.bottom=-N*.8;sc.near=1;sc.far=50;sun.shadow.bias=-.0008;scene.add(sun);scene.add(sun.target);
  const fill=new THREE.DirectionalLight(TM.fill[0],TM.fill[1]);fill.position.set(-8,6,-6);scene.add(fill);
  const seaGeo=new THREE.PlaneGeometry(90,90,64,64);seaGeo.rotateX(-Math.PI/2);const seaMat=new THREE.MeshPhongMaterial({color:TM.sea,specular:TM.lamps?0x1c2a3a:0x6fa8bd,shininess:45,flatShading:true});
  SEA=new THREE.Mesh(seaGeo,seaMat);SEA.position.y=-.34;SEA.receiveShadow=true;scene.add(SEA);SEA.userData.base=Float32Array.from(seaGeo.attributes.position.array);
  const far=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshPhongMaterial({color:TM.far,specular:0x335566,shininess:20}));far.rotation.x=-Math.PI/2;far.position.y=-.42;scene.add(far);
  const deck=new THREE.Mesh(new THREE.BoxGeometry(NX+.6,.5,NZ+.6),lamT('#4a4440','side'));deck.position.y=-.62;deck.receiveShadow=true;scene.add(deck);
  tileGroup=new THREE.Group();scene.add(tileGroup);
  for(const row of G)for(const t of row){if(t.type==='water')continue;tileMesh(t);if(t.obj)objMesh(t);if(t.cp)cpMesh(t);if(t.pass)passMesh(t);if(t.mg)mgSpot(t)}
  dressWorld(theme);addLamps(theme);addBanners(theme);addBirds();PARTS=[];FXL=new THREE.PointLight(0xffb060,0,7,1.5);FXL.position.set(0,-5,0);scene.add(FXL);
  if(info.item){const g=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.36,12),new THREE.MeshBasicMaterial({color:0x7dffd0}));const p=W(info.item.x,info.item.z);g.position.set(p.x,topY(info.item)+.25,p.z);scene.add(g);S.itemMesh=g}
  selRing=new THREE.Mesh(new THREE.RingGeometry(.4,.5,32),new THREE.MeshBasicMaterial({color:0xffe2a0,side:THREE.DoubleSide,transparent:true,opacity:.9}));selRing.rotation.x=-Math.PI/2;selRing.visible=false;scene.add(selRing);
  hl=new THREE.Group();scene.add(hl)}
function animateWorld(dt,t){for(const f of ANIM)f(dt,t);updateParts(dt);if(SEA&&HI()){const a=SEA.geometry.attributes.position,b=SEA.userData.base;for(let i=0;i<a.count;i++){const x=b[i*3],z=b[i*3+2];a.array[i*3+1]=Math.sin(x*.45+t*1.1)*.07+Math.cos(z*.38+t*.8)*.06}a.needsUpdate=true}}

/* ---------- atmosphere: time of day ---------- */
const HI=()=>SAVE.settings.gfx!=='low';
const TIMES={
  day:{label:'Midday',sky:'linear-gradient(#2f86cf,#7fbbe2 45%,#cfe5ef 80%)',fog:0xcfe5ef,hemi:[0xdcefff,0x8a7a66,.72],sun:[0xfff3e0,.85,[7,14,5]],fill:[0x9fd0ff,.25],sea:0x165a75,far:0x1a6582},
  morning:{label:'Morning',sky:'linear-gradient(#4a8fc9,#a9cfe6 50%,#f3dcc0 88%)',fog:0xeedfcb,hemi:[0xffe9d0,0x7a6a5a,.72],sun:[0xffe0b8,.82,[11,9,-3]],fill:[0xa8d0ff,.22],sea:0x1d6280,far:0x2a6a86},
  golden:{label:'Golden hour',sky:'linear-gradient(#3a6aa8,#e3a56a 62%,#ffcf88 88%)',fog:0xf0c08a,hemi:[0xffd8a8,0x6a4a3a,.62],sun:[0xffb870,.98,[-11,6,8]],fill:[0x8fb0ff,.2],sea:0x2a4f6a,far:0x3a5a70},
  overcast:{label:'Overcast',sky:'linear-gradient(#7d8c9a,#aeb9c3 55%,#d2d9de 88%)',fog:0xc5cdd3,hemi:[0xe6ebf0,0x6a6a6a,.86],sun:[0xffffff,.42,[4,14,4]],fill:[0xffffff,.18],sea:0x2e5868,far:0x3a6070},
  dusk:{label:'Dusk',sky:'linear-gradient(#1c2340,#5a3a5e 50%,#e08a5a 88%)',fog:0x8a6a7a,hemi:[0xb0a0d0,0x3a2a2a,.58],sun:[0xff9a6a,.6,[-12,5,6]],fill:[0x8090ff,.22],sea:0x1a2f48,far:0x223650,lamps:true},
  night:{label:'Night',sky:'linear-gradient(#070b1a,#16203a 60%,#2c3c5c 92%)',fog:0x1e2840,hemi:[0x7080c0,0x20202a,.58],sun:[0xb8c8ff,.45,[6,12,-6]],fill:[0x6070ff,.2],sea:0x0f2034,far:0x14263a,lamps:true}};
const TIME_OF={x1:'morning',x1d:'golden',r1:'morning',r2:'day',r3:'overcast',r4:'golden',s1:'overcast',s2:'day',s3:'night',s4:'dusk'};
const THEME_LABEL={container:'Container City',founders:'Founders’ district',industrial:'Industrial decks'};
let TM=TIMES.day,FXL=null;
function applyTime(){TM=TIMES[TIME_OF[M.id]]||TIMES.day;$('#stage').style.background=TM.sky}

/* ---------- lamps, banners, birds ---------- */
function bannerTex(f){return cvTex((g,s)=>{g.fillStyle=f==='resistance'?'#c9581c':'#2a7fbd';g.fillRect(0,0,s,s);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,0,s,10);g.fillRect(0,s-10,s,10);g.fillStyle='#ffffff';
  if(f==='resistance'){g.beginPath();g.moveTo(s/2,22);g.bezierCurveTo(s/2+30,62,s/2+26,102,s/2,102);g.bezierCurveTo(s/2-26,102,s/2-30,62,s/2,22);g.fill();g.fillStyle='#c9581c';g.beginPath();g.arc(s/2,78,11,0,7);g.fill()}
  else{g.beginPath();g.moveTo(s/2-30,26);g.lineTo(s/2+30,26);g.lineTo(s/2+30,62);g.quadraticCurveTo(s/2+30,92,s/2,104);g.quadraticCurveTo(s/2-30,92,s/2-30,62);g.closePath();g.fill();g.fillStyle='#2a7fbd';g.beginPath();g.moveTo(s/2-16,54);g.lineTo(s/2,70);g.lineTo(s/2+16,54);g.lineTo(s/2+16,64);g.lineTo(s/2,80);g.lineTo(s/2-16,64);g.fill()}})}
function addLamps(theme){const lit=!!TM.lamps,hx=NX/2+.15,hz=NZ/2+.15,h=hz,R=rng(5),posts=[];
  for(let i=1;i<NX;i+=3)for(const[x,z]of[[i-(NX-1)/2,-hz],[i-(NX-1)/2,hz]])posts.push([x,z]);for(let i=1;i<NZ;i+=3)for(const[x,z]of[[-hx,i-(NZ-1)/2],[hx,i-(NZ-1)/2]])posts.push([x,z]);
  const pole=sm(theme==='founders'?'#f2f4f5':'#4a4f54'),bulbOn=new THREE.MeshBasicMaterial({color:0xffd690}),bulbOff=sm('#c9c9c0'),halo=new THREE.MeshBasicMaterial({color:0xffc070,transparent:true,opacity:.22,depthWrite:false});
  for(const[x,z]of posts){if(R()<.35)continue;const g=new THREE.Group();const p=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,1.7,6),pole);p.position.y=.85;g.add(p);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.32,.04,.04),pole);arm.position.set(.14,1.68,0);g.add(arm);const b=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),lit?bulbOn:bulbOff);b.position.set(.28,1.6,0);g.add(b);
    if(lit){const hh=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),halo);hh.position.copy(b.position);g.add(hh)}addAt(g,x,-.37,z,Math.atan2(-x,-z)-Math.PI/2)}
  if(theme==='container'){const cols=[0xffd27a,0xff7a7a,0x7ad8ff,0x9aff8a],mats=cols.map(c=>lit?new THREE.MeshBasicMaterial({color:c}):sm('#d8d4c8'));
    for(const side of[-1,1]){for(let k=0;k<NX-1;k+=2){const x0=k-(NX-1)/2,x1=x0+2,y0=1.9;for(let j=0;j<=8;j++){const t=j/8,x=x0+(x1-x0)*t,y=y0-Math.sin(t*Math.PI)*.35;const b=new THREE.Mesh(new THREE.SphereGeometry(.045,6,4),mats[(j+k)%4]);b.position.set(x,y,side*(h+.05));scene.add(b)}}}}
  if(lit){const n=HI()?3:1;for(let i=0;i<n;i++){const l=new THREE.PointLight(0xffc880,.7,9,1.6);l.position.set(0,2.6,(i-(n-1)/2)*NZ/3);scene.add(l)}}}
function addBanners(theme){const fs=theme==='container'?['resistance','resistance']:theme==='founders'?['security','security']:['resistance','security'];const h=N/2+.2,hx=NX/2+.2,hz=NZ/2+.2;
  [[-hx,-hz],[hx,hz]].forEach(([x,z],i)=>{const f=fs[i],g=new THREE.Group();const p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,3,6),sm('#d8d8d8'));p.position.y=1.5;g.add(p);
    const cl=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.3,6,1),new THREE.MeshLambertMaterial({map:bannerTex(f),side:THREE.DoubleSide}));cl.position.set(.47,2.3,0);g.add(cl);
    const base=Float32Array.from(cl.geometry.attributes.position.array);ANIM.push((dt,t)=>{const a=cl.geometry.attributes.position;for(let k=0;k<a.count;k++){const bx=base[k*3];a.array[k*3+2]=Math.sin(t*3+bx*4)*.06*(bx+.45)}a.needsUpdate=true});
    addAt(g,x,-.37,z,i?Math.PI*.75:-Math.PI/4)})}
function addBirds(){const n=HI()?6:2,mat=new THREE.MeshBasicMaterial({color:0xf4f4f4,side:THREE.DoubleSide});
  for(let i=0;i<n;i++){const b=new THREE.Group();const wl=new THREE.Group(),wr=new THREE.Group();const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.08,0,0,.1,.42,0,0],3));
    const l=new THREE.Mesh(geo,mat),r=new THREE.Mesh(geo,mat);r.scale.x=-1;wl.add(l);wr.add(r);b.add(wl,wr);scene.add(b);
    const rad=6+Math.random()*7,hgt=5+Math.random()*4,sp=.25+Math.random()*.2,ph=Math.random()*6,cx=(Math.random()-.5)*6,cz=(Math.random()-.5)*6;
    ANIM.push((dt,t)=>{const a=t*sp+ph;b.position.set(cx+Math.cos(a)*rad,hgt+Math.sin(t*.7+ph)*.4,cz+Math.sin(a)*rad);b.rotation.y=-a;const f=Math.sin(t*9+ph)*.6;wl.rotation.z=f;wr.rotation.z=-f})}}

/* ---------- effects ---------- */
let PARTS=[];const partGeo=new THREE.BoxGeometry(.06,.06,.06),puffGeo=new THREE.IcosahedronGeometry(.16,0);
function burst(pos,n,col,speed,life,grav=-6,size=1,up=.5){if(!scene)return;n=HI()?n:Math.ceil(n/2);for(let i=0;i<n;i++){const m=new THREE.Mesh(partGeo,new THREE.MeshBasicMaterial({color:col,transparent:true}));m.position.copy(pos);m.scale.setScalar(size*(.6+Math.random()*.8));
  const v=new THREE.Vector3(Math.random()-.5,Math.random()*up+.15,Math.random()-.5).normalize().multiplyScalar(speed*(.4+Math.random()*.8));scene.add(m);PARTS.push({m,v,life,max:life,grav,spin:Math.random()*8})}}
function puff(pos,n,col,life=1.2){if(!scene)return;n=HI()?n:Math.ceil(n/2);for(let i=0;i<n;i++){const m=new THREE.Mesh(puffGeo,new THREE.MeshLambertMaterial({color:col,transparent:true,opacity:.7,depthWrite:false}));m.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*.4,Math.random()*.2,(Math.random()-.5)*.4));scene.add(m);
  PARTS.push({m,v:new THREE.Vector3((Math.random()-.5)*.3,.5+Math.random()*.4,(Math.random()-.5)*.3),life,max:life,grav:0,grow:1.6,puff:true})}}
function updateParts(dt){for(let i=PARTS.length-1;i>=0;i--){const p=PARTS[i];p.life-=dt;if(p.life<=0||!p.m.parent){if(p.m.parent)p.m.parent.remove(p.m);PARTS.splice(i,1);continue}
  p.v.y+=p.grav*dt;p.m.position.addScaledVector(p.v,dt);const k=p.life/p.max;p.m.material.opacity=p.puff?.7*k:Math.min(1,k*1.6);if(p.grow)p.m.scale.setScalar(1+(1-k)*p.grow);if(p.spin){p.m.rotation.x+=p.spin*dt;p.m.rotation.y+=p.spin*dt}
  if(!p.puff&&p.m.position.y<-.3){p.v.set(0,0,0);p.grav=0}}}
function flashLight(pos,col,inten,ms){if(!FXL)return;FXL.color.set(col);FXL.position.copy(pos);const t0=performance.now();const st=now=>{const k=Math.min(1,(now-t0)/ms);FXL.intensity=inten*(1-k);if(k<1)requestAnimationFrame(st)};requestAnimationFrame(st)}
function shake(a){camState.shake=Math.max(camState.shake||0,a)}
function flashUnit(u,col){if(u.rig){rigFlash(u.model,col);return}if(!u.mats)return;const c=new THREE.Color(col);for(const m of u.mats)m.emissive.copy(c);const t0=performance.now();const st=now=>{const k=Math.min(1,(now-t0)/260);for(const m of u.mats)m.emissive.copy(c).multiplyScalar(1-k);if(k<1)requestAnimationFrame(st)};requestAnimationFrame(st)}

/* ---------- menu art ---------- */
function skylineSVG(f,h=150){const R=rng(f==='security'?31:17),sec=f==='security';let s='';
  const sky=sec?['#2a6aa8','#9fcde6','#e6f2f6']:['#3a7fc4','#9fcfe8','#f3dcc0'];
  s+=`<defs><linearGradient id="sk${f}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient></defs><rect width="400" height="${h}" fill="url(#sk${f})"/><circle cx="${sec?320:80}" cy="40" r="16" fill="#fff6dc" opacity=".9"/>`;
  for(let i=0;i<3;i++)s+=`<ellipse cx="${60+i*130+R()*30}" cy="${22+R()*20}" rx="${26+R()*16}" ry="7" fill="#fff" opacity=".75"/>`;
  const by=h-34;
  for(const[x,w,hh]of[[230,26,96],[262,20,70],[292,16,54],[208,14,48]]){s+=`<rect x="${x}" y="${by-hh}" width="${w}" height="${hh+4}" rx="${w/2}" fill="#f4f7f9"/><ellipse cx="${x+w/2}" cy="${by-hh+2}" rx="${w/2}" ry="${w/2.4}" fill="#bfe6ff"/>`;for(let y=by-hh+14;y<by;y+=12)s+=`<rect x="${x}" y="${y}" width="${w}" height="3" fill="#8fcbea"/>`;s+=`<rect x="${x-2}" y="${by-hh*.55}" width="${w+4}" height="4" rx="2" fill="#5aa35a"/>`}
  const cols=CONT_COLS;for(let i=0;i<46;i++){const x=R()*190+(R()<.2?310:0),stack=1+Math.floor(R()*3);for(let k=0;k<stack;k++)s+=`<rect x="${x.toFixed(0)}" y="${by-8-k*8}" width="${16+Math.floor(R()*8)}" height="8" fill="${cols[Math.floor(R()*cols.length)]}" stroke="rgba(0,0,0,.18)" stroke-width=".6"/>`}
  for(const x of[40,150,350]){s+=`<rect x="${x}" y="${by-60}" width="2" height="60" fill="#e4ddd0"/><g transform="translate(${x+1} ${by-60})"><path d="M0 0 L-3 -22 L3 -22 Z" fill="#f2efe6"/><path d="M0 0 L-3 -22 L3 -22 Z" fill="#f2efe6" transform="rotate(120)"/><path d="M0 0 L-3 -22 L3 -22 Z" fill="#f2efe6" transform="rotate(240)"/></g>`}
  s+=`<rect y="${by}" width="400" height="${h-by}" fill="${sec?'#1a5f7c':'#1d6280'}"/>`;for(let i=0;i<14;i++)s+=`<path d="M${R()*400} ${by+6+R()*(h-by-8)} q6 -2 12 0" stroke="#bfe3f0" stroke-width="1.2" fill="none" opacity=".55"/>`;
  for(let i=0;i<3;i++){const x=30+R()*340,y=by+8+R()*12;s+=`<path d="M${x} ${y} h26 l-4 6 h-18 Z" fill="${['#e9eef1','#a4462c','#2f6e8a'][i]}"/><rect x="${x+6}" y="${y-6}" width="9" height="6" fill="#f4f4f4"/>`}
  return `<svg class="skyline" viewBox="0 0 400 ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`}

/* ---------- operative models ---------- */
function rebuildModel(u){if(!u.model||u.cls==='turret'||!u.look)return;const old=u.model;u.lie.remove(old);const m=unitModel(u);u.lie.add(m);u.model=m;
  m.traverse(o=>{o.userData.unit=u;if(o.isMesh){o.castShadow=!(o.material.side===THREE.BackSide);o.receiveShadow=true}});u.mats=[];if(!u.rig)m.traverse(o=>{if(o.isMesh&&o.material.emissive&&!u.mats.includes(o.material))u.mats.push(o.material)})}

const ringGeo=new THREE.RingGeometry(.3,.38,28);
function palFor(l){const F=FACTIONS[l.faction],c1=F.pal[l.primary],c2=F.pal[l.secondary],sk=SKIN[l.skin];
  return{[C.tee]:c1,[C.teeD]:shade(c1,-22),[C.khaki]:c2,[C.khakiD]:shade(c2,-20),[C.rig]:shade(c2,-40),[C.rigD]:shade(c2,-52),[C.skin]:sk,[C.skinD]:shade(sk,-18),[C.hair]:HAIRC[l.hairCol],[C.acc]:F.accent,[C.wood]:l.faction==='security'?'#3a4048':'#7a5331'}}
function turretModel(team){const g=new THREE.Group(),col=team==='p'?FACTIONS[CUR.faction].accent:FACTIONS[ENEMY_OF[CUR.faction]].accent;
  for(let i=0;i<3;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.5,6),toon('#3a3d42'));const a=i*Math.PI*2/3;l.position.set(Math.cos(a)*.14,.2,Math.sin(a)*.14);l.rotation.set(Math.sin(a)*.4,0,-Math.cos(a)*.4);g.add(l)}
  const head=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.36),toon('#4a4f54'));head.position.y=.48;g.add(head);const bar=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.42,8),toon('#26282c'));bar.rotation.x=Math.PI/2;bar.position.set(0,.5,.32);g.add(bar);
  const st=new THREE.Mesh(new THREE.BoxGeometry(.31,.05,.37),toon(col));st.position.y=.6;g.add(st);addOutlines(g,.015);return g}
// Animated soldier (src/units.js); a plain capsule soldier if the models couldn't load.
function unitModel(u){u.rig=null;u.anim=null;const m=buildRigged({...u.look,cls:u.cls},u.wkey,u.cls,{outline:HI()});if(m){u.rig=m.userData.rig;return m}return capsuleSoldier({...u.look,cls:u.cls},HI())}
function makeUnitMesh(u){
  let model;if(u.cls==='bot')model=botModel();else if(u.cls==='turret')model=turretModel(u.team);else model=unitModel(u);u.model=model;if(u.cls==='bot')u.rig=null
  const lie=new THREE.Group();lie.add(model);const g=new THREE.Group();g.add(lie);
  const ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:u.team==='p'?0xc9581c:0x2a7fbd,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;g.add(ring);
  if(u.cls==='leader'||u.leader){const crown=new THREE.Mesh(new THREE.OctahedronGeometry(.08),new THREE.MeshBasicMaterial({color:0xffd23a}));crown.position.y=1.3;g.add(crown)}
  g.traverse(o=>o.userData.unit=u);shadowy(g);u.mats=[];if(!u.rig)g.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive&&!u.mats.includes(o.material))u.mats.push(o.material)});u.ph=Math.random()*6;ring.castShadow=false;scene.add(g);u.group=g;u.lie=lie;u.ringMesh=ring;place(u);g.rotation.y=u.team==='p'?Math.PI:0;
  if(u.team==='e'){const gh=document.createElement('div');gh.className='lkp';gh.textContent='?';gh.style.display='none';$('#hud').appendChild(gh);u.gh=gh}
  const el=document.createElement('div');el.className='ub '+u.team;el.innerHTML=`<span></span><i><b></b></i>`;$('#hud').appendChild(el);u.el=el;updBar(u)}
function place(u){const t=G[u.z][u.x],p=W(u.x,u.z);u.group.position.set(p.x,topY(t),p.z)}
function updBar(u){const tags=[];if(u.ow)tags.push('OW');if(u.disg>0)tags.push('Disguised');if(u.stun>0)tags.push('Stunned');if(u.shield>0)tags.push('+'+u.shield);if(u.carry)tags.push('Cartridge');if(u.down&&u.op)tags.push(u.redeploy?'Redeploying':'Back in '+Math.max(1,3-(u.downTurns||0)));
  u.el.querySelector('span').textContent=(u.cls==='bot'&&u.down?'Bot (disabled)':(u.short||u.name))+(tags.length?' · '+tags.join(' '):'');u.el.querySelector('b').style.width=Math.max(0,u.hp/u.maxHp*100)+'%';u.el.classList.toggle('down',u.down)}
function newUnit(o){return Object.assign({perks:new Set(),moved:false,acted:false,down:false,ow:false,stun:0,disg:0,shield:0,carry:false,kills:0,cd:{},vis:6},o)}
const DIFF={easy:{label:'Easy',acc:-14,dmg:.7,hp:.8,wave:1,php:15},normal:{label:'Normal',acc:-6,dmg:.85,hp:.92,wave:2,php:0},hard:{label:'Hard',acc:0,dmg:1,hp:1.05,wave:9,php:0}};
const DF=()=>DIFF[SAVE.settings.diff]||DIFF.normal;
function spawnEnemy(type,x,z,R){const T=ETYPES[type],ef=ENEMY_OF[CUR.faction],B=EB[T.body],sc=(CUR.mi<0?2:CUR.mi)*5,D=DF();
  const look=T.cls==='turret'?null:LOOK({faction:ef,body:T.body,cls:T.cls,weapon:'rifle',skin:Math.floor(R()*6),hairCol:Math.floor(R()*7),face:['long','square','angular','broad'][Math.floor(R()*4)],facial:['none','stubble','beard','goatee'][Math.floor(R()*4)],hair:['buzz','crop','shaved','slick'][Math.floor(R()*4)],
    headgear:ef==='security'?(T.body==='heavy'?'riothelm':['helmet','cap','none'][Math.floor(R()*3)]):['bandana','beanie','none','none'][Math.floor(R()*4)],armour:ef==='security'?(T.body==='heavy'?'riot':'carrier'):(T.body==='heavy'?'scrap':'rig'),primary:type==='leader'?4:Math.floor(R()*3),secondary:1+Math.floor(R()*3),top:['tee','long','jacket','hoodie'][Math.floor(R()*4)]});
  const w=WPN[T.w];const u=newUnit({team:'e',type,name:T.label,short:T.label,cls:T.cls,body:T.body,hp:Math.round((T.hp+sc)*D.hp),maxHp:Math.round((T.hp+sc)*D.hp),move:T.move??B.move,vis:B.vis,weapon:{...w,acc:w.acc+T.acc+D.acc,dmg:Math.round(w.dmg*T.dmg*D.dmg)},x,z,look,wkey:T.w,leader:type==='leader'});
  units.push(u);makeUnitMesh(u);return u}

/* ---------- start ---------- */
function startMission(m,ops){
  if(!initRenderer()){$('#hud').innerHTML='<div class="fail">This game needs WebGL and the 3D engine, which couldn’t load here. Check your connection and reload.</div>';return}
  M=m;units=[];$('#hud').innerHTML='';
  S={undo:null,reacted:false,phase:'player',sel:null,mode:null,turn:1,objIdx:0,prog:{},carrier:null,hold:0,vis:new Set(),explored:new Set(),alerted:!!m.alerted,reveals:[],credit:{},busy:false,reach:null,over:false,item:null,stats:{shots:0,hits:0,downs:0}};
  if(m.stages){m.objectives=m.stages.flatMap((st,i)=>st.objectives.map(o=>({...o,stage:i})));m.enemies=m.stages[0].enemies;m.reinf=m.stages[0].reinf}
  S.stage=0;S.stageTurn=1;S.turnsLeft=m.turns||null;S.poolIdx=0;if(m.defend){m.enemies=[];m.reinf=[];S.alerted=true}S.sec=(m.secondaries||[]).map(sc=>({...sc,done:false}));S.bot=null;
  const info=parseMap(m);S.info=info;S.item=info.item;
  for(const o of m.objectives)if(o.targets)for(const[x,z]of o.targets){G[z][x].kind=o.type}for(const sc of S.sec)for(const[x,z]of sc.targets)G[z][x].sec=sc
  buildScene(info);S.itemHome=info.item;if(m.defend){info.spawns=m.stages[0].pspawns.map(([x,z])=>G[z][x]);S.espawns=m.stages[0].espawns}
  ops.forEach((op,i)=>{const sp=info.spawns[i],l=lvlOf(op.xp),B=EB[op.body],w=WPN[op.weapon];
    const P=new Set(op.perks||[]),st=opStats(op),wp={...w,acc:st.acc};if(P.has('marksman')&&op.weapon==='sniper')wp.range+=2;
    const u=newUnit({op,team:'p',name:op.name,short:op.name,cls:op.cls,body:op.body,lvl:l,hp:st.hp+DF().php,maxHp:st.hp+DF().php,move:st.move,vis:B.vis+(P.has('eagle')?1:0),weapon:wp,x:sp.x,z:sp.z,look:op.look,wkey:op.weapon,perks:P});units.push(u);makeUnitMesh(u)});
  const R=rng(m.id.length*97+Math.max(0,CUR.mi)*13+7);for(const[t,x,z]of m.enemies)spawnEnemy(t,x,z,R);S.R=R;if(m.defend)topUpAttackers(99);
  const sp=info.spawns[0],p=W(sp.x,sp.z);camState.target.set(p.x*.5,0,p.z*.5);camState.zoom=1;camState.angle=Math.PI/4;fit();
  $('#mtitle').textContent=m.title;S.sel=squad()[0];computeVis();refresh();banner('Your turn');
  if(!S.alerted)setTimeout(()=>log('You haven’t been spotted. Shots on unaware enemies get +20 accuracy.'),1500);setTimeout(()=>log('Tip: press and hold anything for details. Swipe the bottom panel to switch operative.'),5200)}

/* ---------- fog ---------- */
function computeVis(){const vis=new Set();
  const see=(u,r)=>{const a=G[u.z][u.x];for(let z=Math.max(0,u.z-r);z<=Math.min(NZ-1,u.z+r);z++)for(let x=Math.max(0,u.x-r);x<=Math.min(NX-1,u.x+r);x++){if(Math.hypot(x-u.x,z-u.z)>r+.01)continue;if(los(a,G[z][x]))vis.add(key(x,z))}};
  for(const u of living('p'))see(u,u.cls==='turret'?4:u.vis);
  for(const r of S.reveals)for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++)if(Math.hypot(x-r.x,z-r.z)<=r.r)vis.add(key(x,z));
  S.vis=vis;for(const k of vis)S.explored.add(k);applyFog()}
function applyFog(){for(const row of G)for(const t of row){if(t.type==='water')continue;const k=key(t.x,t.z),f=S.over||S.vis.has(k)?1:S.explored.has(k)?.66:.4;
    if(t._f===f)continue;t._f=f;tint(t.mesh,f);if(t.objMesh)tint(t.objMesh,f);if(t.cpMesh)tint(t.cpMesh,f);if(t.passMesh)tint(t.passMesh,f)}
  for(const u of units)if(u.team==='e'){const v=S.over||(!u.gone&&S.vis.has(key(u.x,u.z)));u.group.visible=v;u.seen=v;if(v&&!u.down)u.last=[u.x,u.z];else if(u.last&&S.vis.has(key(u.last[0],u.last[1])))u.last=null}
  if(S.itemMesh)S.itemMesh.visible=!S.carrier&&(S.over||S.explored.has(key(S.item.x,S.item.z)))}

/* ---------- objectives ---------- */
function curObj(){return M.objectives[S.objIdx]}
function objLabel(o,st){const p=st?st.prog:{};
  if(o.dlabel&&(st?M:curMission()).defend){if(!st)return o.dlabel.toLowerCase();if(o.type==='escort'&&S.bot)return S.bot.down?'Bot disabled, keep it down':`${o.dlabel} (${S.bot.step}/${o.path.length-1})`;if(o.type==='extract')return S.carrier?'Stop the carrier!':o.dlabel;const pr=o.targets?Math.max(0,...o.targets.map(([x,z])=>p[key(x,z)]||0)):0;return `${o.dlabel} (${pr}/${o.need})`}
  if(o.type==='escort'){if(!st)return 'escort the maintenance bot';const b=S.bot;if(!b)return 'Escort the bot';return b.down?`Bot disabled: repair it (${S.prog.bot||0}/2)`:`Escort the bot (${b.step}/${o.path.length-1})`}
  if(o.type==='extract'&&(st?M:curMission()).stages){return st?(S.carrier?'Carry the cache to the boats':'Grab the cache from the lab'):'extract the cache by boat'}
  if(o.type==='capture')return st?`Take both command posts (${S.info.cps.filter(t=>t.owner==='p').length}/${S.info.cps.length})`:'take both command posts';
  if(o.type==='eliminate')return st?`Clear the area (${foes().length} left)`:'clear the area';
  if(o.type==='extract')return st?(S.carrier?`Carry the cartridge to the exit`:'Find and pick up the cartridge'):'grab the cartridge and reach the exit';
  if(o.type==='hold')return st?`Hold the square (${S.hold}/${o.turns} turns)`:`hold the square for ${o.turns} turns`;
  if(o.type==='kill')return st?'Down the cell leader before he escapes':'down the cell leader before he escapes';
  if(o.label){const pr=Math.min(o.need,Math.max(0,...o.targets.map(([x,z])=>p[key(x,z)]||0)));return st?`${o.label} (${pr}/${o.need})`:o.label.toLowerCase()}
  const done=o.targets.filter(([x,z])=>(p[key(x,z)]||0)>=o.need).length;const verb={hack:'Hack',plant:'Destroy',repair:'Repair'}[o.type],what={hack:o.targets.length>1?'terminals':'the terminal',plant:'the relays',repair:'the pump'}[o.type];
  return st?`${verb} ${what} (${o.targets.length>1?done+'/'+o.targets.length:Math.min(o.need,Math.max(0,...o.targets.map(([x,z])=>p[key(x,z)]||0)))+'/'+o.need})`:`${verb.toLowerCase()} ${what}`}
function objTargetsNear(u){const o=curObj();if(M.defend){if(!o||!o.targets)return[];return o.targets.map(([x,z])=>G[z][x]).filter(t=>(S.prog[key(t.x,t.z)]||0)>0&&(S.prog[key(t.x,t.z)]||0)<o.need&&cheb(u,t)<=1)}if(o&&o.type==='escort'&&S.bot&&S.bot.down&&cheb(u,S.bot)<=1)return[G[S.bot.z][S.bot.x]];if(!o||!o.targets)return[];return o.targets.map(([x,z])=>G[z][x]).filter(t=>(S.prog[key(t.x,t.z)]||0)<o.need&&cheb(u,t)<=1)}
function objDone(){const o=curObj();if(!o)return true;
  if(o.type==='escort')return !!(S.bot&&S.bot.step>=o.path.length-1);
  if(o.type==='capture')return S.info.cps.every(t=>t.owner==='p');
  if(o.type==='eliminate')return foes().length===0&&!pendingReinf();
  if(o.type==='kill')return units.some(u=>u.leader&&u.down);
  if(o.type==='hold')return S.hold>=o.turns;
  if(o.type==='extract')return !!S.extracted;
  return o.targets.every(([x,z])=>(S.prog[key(x,z)]||0)>=o.need)}
function pendingReinf(){return(M.reinf||[]).some(([t])=>t>=S.turn)&&curObj().type!=='eliminate'?false:false}
function advanceObj(){let changed=false;while(S.objIdx<M.objectives.length&&objDone()){const done=M.objectives[S.objIdx];S.objIdx++;changed=true;if(done.clears)clearTiles(done.clears);if(S.objIdx<M.objectives.length){const nx=curObj();if(M.stages&&nx.stage>S.stage)enterStage(nx.stage);else{banner('Objective complete');log('New objective: '+objLabel(nx,S))}}}
  if(S.objIdx>=M.objectives.length){if(M.defend)endMission(false,'They completed their objective.');else endMission(true);return true}return false}

/* ---------- stages, escort, secondaries ---------- */
function clearTiles(list){for(const[x,z]of list){const t=G[z][x];if(t.objMesh){explode(t);tileGroup.remove(t.objMesh);t.objMesh=null}t.obj=null}computeVis()}
function enterStage(k){S.stage=k;S.stageTurn=1;const st=M.stages[k];if(st.spawns)S.info.spawns=st.spawns.map(([x,z])=>G[z][x]);if(st.pspawns){S.info.spawns=st.pspawns.map(([x,z])=>G[z][x]);S.espawns=st.espawns}if(S.turnsLeft!=null)S.turnsLeft+=st.addTurns||0;
  if(!M.defend)for(const e of living('e'))if(e.cls!=='turret')e.fallback=true;
  for(const[t,x,z]of st.enemies||[]){if(unitAt(x,z)||G[z][x].obj)continue;const e=spawnEnemy(t,x,z,S.R);e.fresh=false}
  S.alerted=true;const o=curObj();if(o.type==='escort'&&!S.bot){const[x,z]=o.path[0];const b=newUnit({team:M.defend?'e':'p',name:'Maintenance bot',short:'Bot',cls:'bot',body:'bot',hp:o.hp,maxHp:o.hp,move:0,vis:3,weapon:{...WPN.turret,dmg:0,range:0},x,z,step:0});units.push(b);makeUnitMesh(b);b.group.rotation.y=Math.PI;S.bot=b}
  if(M.defend){banner(`Fall back: ${st.name}`,'enemy');sfx('alarm');log(`The line has fallen. Fall back to ${st.name.toLowerCase()}. Your drop point has moved back.${st.addTurns?` Hold for ${st.addTurns} more turns.`:''}`)}else{banner(`Stage ${k+1}: ${st.name}`);sfx('good');log(`Stage ${k+1} of ${M.stages.length}: ${st.name}.${st.addTurns?` +${st.addTurns} turns.`:''} Your drop point has moved up.`)}
  const tg=o.type==='escort'?o.path[0]:o.targets?o.targets[0]:null;if(tg)camState.follow=W(tg[0],tg[1]);applyFog();refresh()}
async function moveBot(){const b=S.bot,o=curObj();if(!b||!o||o.type!=='escort'||b.down)return;const att=M.defend?living('e').filter(x=>x.cls!=='turret'&&x.cls!=='bot'):squad().filter(p=>!p.down),def=M.defend?squad().filter(p=>!p.down):living('e').filter(x=>x.cls!=='turret');
  const na=att.filter(p=>cheb(p,b)<=1).length,nd=def.filter(e=>cheb(e,b)<=1).length,escorted=na>0,blocked=nd>na;
  if(!escorted){if(!M.defend)log('The bot needs someone next to it to keep moving.');return}if(blocked){log(M.defend?'You outnumber them at the bot, so it’s stuck!':'More enemies than allies at the bot, so it’s stuck.');return}
  let moved=0;for(let i=0;i<2&&b.step<o.path.length-1;i++){const[nx,nz]=o.path[b.step+1];if(unitAt(nx,nz,b)){if(!moved)log('Something is blocking the bot’s route.');break}await moveAlong(b,[[nx,nz]]);b.step++;moved++}
  if(moved){log(`The bot advances (${b.step}/${o.path.length-1}).`);if(b.model&&b.model.userData.tip)b.model.userData.tip.material.color.set(0x7dffb0)}}
function secNear(u){return S.sec.filter(sc=>!sc.done&&sc.stage<=S.stage&&sc.targets.some(([x,z])=>Math.max(Math.abs(u.x-x),Math.abs(u.z-z))<=1))}
const DEF_FAST={plant:'engineer',hack:'operative',repair:'engineer'},DEF_VERB={plant:'Defuse',hack:'Reset',repair:'Sabotage'};
const SEC_FAST={hack:'operative',build:'engineer',mg:'engineer'};
async function doSecondary(u,sc){S.undo=null;S.busy=true;const[x,z]=sc.targets[0],t=G[z][x];await face(u,x,z);const add=SEC_FAST[sc.type]===u.cls?2:1;S.prog['sec:'+sc.id]=Math.min(sc.need,(S.prog['sec:'+sc.id]||0)+add);u.acted=true;S.credit[u.op.id]=(S.credit[u.op.id]||0)+1;
  const pr=S.prog['sec:'+sc.id];if(pr<sc.need){popup(u,`${pr}/${sc.need}`,'good');log(`${sc.label}: ${pr}/${sc.need}`)}
  else{sc.done=true;popup(u,'Done','good');
    if(sc.type==='hack'){sfx('good');if(t.objMesh){tileGroup.remove(t.objMesh);t.objMesh=null}t.obj=null;log('Side door open. A new route is clear.')}
    if(sc.type==='build'){sfx('build',W(x,z));if(t.objMesh){tileGroup.remove(t.objMesh);t.objMesh=null}t.obj=null;t.type='ramp';const pl=new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.9),lamT('#b98e5c','wood'));const pp=W(x,z);pl.position.set(pp.x,topY(t)+.03,pp.z);pl.userData.tile=t;tileGroup.add(pl);log('Stairs built. Heavies can use this route now.')}
    if(sc.type==='mg'){sfx('build',W(x,z));if(t.mgMesh){tileGroup.remove(t.mgMesh)}const tu=newUnit({team:'p',name:'MG nest',short:'MG nest',cls:'turret',body:'turret',hp:90,maxHp:90,move:0,vis:5,weapon:{...WPN.turret,dmg:22,range:7,acc:76},x,z});units.push(tu);makeUnitMesh(tu);tu.group.rotation.y=Math.PI;log('MG nest built. It fires at the end of every turn.')}}
  computeVis();S.busy=false;afterOrder()}

/* ---------- objective marker, minimap, swipe ---------- */
function objPoint(){const o=curObj();if(!o||S.over)return null;let t=null,label='Objective';
  if(o.type==='escort'&&S.bot)return{v:S.bot.group.position.clone().setY(S.bot.group.position.y+1.1),label:M.defend?(S.bot.down?'Bot down':'Stop the bot'):S.bot.down?'Repair the bot':'Bot'};
  if(o.type==='extract'){if(S.carrier){const e=S.info.exits[0];t=e;label='Exit'}else{t=S.item;label='Pick up'}}
  else if(o.type==='hold'){const zt=S.info.zone;t=zt[Math.floor(zt.length/2)];label='Hold'}
  else if(o.type==='capture'){t=S.info.cps.find(c=>c.owner!=='p');label='Capture'}
  else if(o.type==='kill'){const l=units.find(u=>u.leader&&!u.down&&u.seen);if(l)return{v:l.group.position.clone().setY(l.group.position.y+1.3),label:'Target'};return null}
  else if(o.type==='eliminate')return null;
  else if(o.targets){const tg=o.targets.find(([x,z])=>(S.prog[key(x,z)]||0)<o.need);if(tg){t=G[tg[1]][tg[0]];label=M.defend?'Defend':o.label||OBJ_VERB[o.type]||'Objective'}}
  if(!t)return null;const p=W(t.x,t.z);p.y=topY(t)+1;return{v:p,label}}
const _ov=new THREE.Vector3();
function updObjMark(){const el=$('#objMark');if(!el)return;const op=document.body.dataset.view==='game'?objPoint():null;if(!op){el.hidden=true;return}
  _ov.copy(op.v).project(cam);const w=stage.clientWidth,h=stage.clientHeight;let x=(_ov.x+1)/2*w,y=(1-_ov.y)/2*h;const m=34,inside=x>m&&x<w-m&&y>m+40&&y<h-m&&_ov.z<1;
  el.hidden=false;el.classList.toggle('edge',!inside);el.querySelector('span').textContent=op.label;
  if(inside){el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;el.querySelector('i').style.rotate='0deg'}
  else{const cx=w/2,cy=h/2,dx=x-cx,dy=y-cy,k=Math.min((w/2-m)/Math.abs(dx||1e-6),(h/2-m)/Math.abs(dy||1e-6));const ex=cx+dx*k,ey=cy+dy*k;el.style.transform=`translate(${ex}px,${ey}px) translate(-50%,-50%)`;el.querySelector('i').style.rotate=Math.atan2(dy,dx)+'rad'}}
let miniT=0;
function drawMini(){const c=$('#mini');if(!c||!G.length)return;const sc=Math.max(3,Math.floor(Math.min(110/NX,170/NZ)));c.width=NX*sc;c.height=NZ*sc;c.style.width=NX*sc+'px';c.style.height=NZ*sc+'px';const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
  for(const row of G)for(const t of row){const k=key(t.x,t.z);if(!S.explored.has(k)&&!S.over){x.fillStyle='rgba(0,0,0,.55)';x.fillRect(t.x*sc,t.z*sc,sc,sc);continue}
    x.fillStyle=t.type==='water'?'#1d5a78':t.obj?'#24272a':t.pass?'#38a0c8':t.h>=2?'#b9b3a6':t.h>=1?'#8f897e':'#5e5a54';if(t.zone)x.fillStyle='#b8963c';if(t.exit)x.fillStyle='#3f9a5c';x.fillRect(t.x*sc,t.z*sc,sc,sc);
    if(!S.vis.has(k)&&!S.over){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(t.x*sc,t.z*sc,sc,sc)}}
  const dot=(u,col,r)=>{x.fillStyle=col;x.beginPath();x.arc(u.x*sc+sc/2,u.z*sc+sc/2,r,0,7);x.fill()};
  const op=objPoint();if(op){const o=curObj();let tx,tz;if(o.type==='escort'&&S.bot){tx=S.bot.x;tz=S.bot.z}else{const p=op.v;tx=p.x+(NX-1)/2;tz=p.z+(NZ-1)/2}x.strokeStyle='#ffc04a';x.lineWidth=2;x.strokeRect(tx*sc-1,tz*sc-1,sc+2,sc+2)}
  for(const u of units){if(u.gone)continue;if(u.team==='e'){if(u.seen&&!u.down)dot(u,'#ff4a3a',Math.max(1.6,sc*.38))}else if(u.cls==='bot')dot(u,'#ffd23a',sc*.45);else if(u.op)dot(u,u.down?'#777':FACTIONS[CUR.faction].accent,Math.max(1.8,sc*.42))}
  const ct=camState.target;x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=1;const cx=(ct.x+(NX-1)/2)*sc+sc/2,cz=(ct.z+(NZ-1)/2)*sc+sc/2;x.strokeRect(cx-sc*2.5,cz-sc*2.5,sc*5,sc*5)}
document.addEventListener('pointerdown',e=>{const c=e.target.closest&&e.target.closest('#mini');if(!c)return;const r=c.getBoundingClientRect(),sc=c.width/NX,tx=(e.clientX-r.left)/sc,tz=(e.clientY-r.top)/sc;camState.follow=W(tx,tz)});
{let sx=null,sy=null;const pn=$('#panel');pn.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY},{passive:true});
  pn.addEventListener('touchend',e=>{if(sx==null)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;sx=null;if(Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*.6||S.phase!=='player'||S.busy)return;
    const sq=squad().filter(p=>!p.down||true);if(!sq.length)return;let i=sq.indexOf(S.sel);i=(i+(dx<0?1:-1)+sq.length)%sq.length;select(sq[i])},{passive:true})}

/* ---------- UI ---------- */
function log(t){const l=$('#log');l.textContent=t;l.classList.remove('show');void l.offsetWidth;l.classList.add('show')}
function banner(t,cls){const b=$('#banner');b.textContent=t;b.className=cls||'';void b.offsetWidth;b.classList.add('show')}
function popup(u,text,cls){if(cls==='good')sfx('good');const p=document.createElement('div');p.className='pop '+(cls||'');p.textContent=text;$('#hud').appendChild(p);const v=u.group.position.clone();v.y+=1.05;const q=v.project(cam);
  p.style.left=(q.x+1)/2*stage.clientWidth+'px';p.style.top=(1-q.y)/2*stage.clientHeight+'px';setTimeout(()=>p.remove(),1100)}
const isDone=u=>u.down||(u.moved&&u.acted);
function focus(u){if(!u)return;camState.follow=u}
function select(u){if(S.phase!=='player'||S.busy)return;if(u&&u!==S.sel)sfx('ui');S.sel=u;S.mode=null;S.swap=false;if(u)focus(u);refresh()}
function abilsOf(u){if(!u.op)return[];return CLASS_AB[u.cls].filter((a,i)=>u.lvl>=AB_LVL[i])}
const pipGeo=new THREE.BoxGeometry(.12,.06,.12),pipMat=new THREE.MeshBasicMaterial({color:0xffffff});
function pips(t,n){const p=W(t.x,t.z);for(let i=0;i<n;i++){const m=new THREE.Mesh(pipGeo,pipMat);m.position.set(p.x-.3+i*.17,topY(t)+.06,p.z-.3);m.userData.tile=t;hl.add(m)}}
const climbGeo=new THREE.ConeGeometry(.09,.18,4),climbMat=new THREE.MeshBasicMaterial({color:0xffb347});
function climbMark(t){const p=W(t.x,t.z),m=new THREE.Mesh(climbGeo,climbMat);m.position.set(p.x+.3,topY(t)+.14,p.z+.3);m.userData.tile=t;hl.add(m)}
function hlTile(t,col,op){const m=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false}));m.rotation.x=-Math.PI/2;const p=W(t.x,t.z);m.position.set(p.x,topY(t)+.03,p.z);m.userData.tile=t;hl.add(m)}
function refresh(){
  hl.clear();$('#hud').querySelectorAll('.tg').forEach(e=>e.remove());const u=S.sel;S.reach=null;selRing.visible=!!u&&!u.down&&S.phase==='player';
  if(u&&S.phase==='player'&&!u.down){
    if(S.mode){for(const t of abilityTargets(u,S.mode))hlTile(t,0xffc04a,.45)}
    else{if(!u.moved){S.reach=reach(u);const seenE=living('e').filter(e=>e.seen);for(const k of S.reach.d.keys()){const[x,z]=k.split(',').map(Number);if(x===u.x&&z===u.z)continue;const t=G[z][x];let cv=-1;if(seenE.length){cv=2;for(const e of seenE)cv=Math.min(cv,coverOf(t,G[e.z][e.x]))}hlTile(t,cv===2?0x3aa0ff:0x5fc8ff,cv===2?.5:cv===1?.4:.26);if(cv>0)pips(t,cv);if(S.reach.climb.has(k))climbMark(t)}}
      if(!u.acted)for(const e of living('e')){if(!e.seen)continue;const c=hitChance(u,e);if(!c)continue;const r=new THREE.Mesh(new THREE.RingGeometry(.36,.46,28),new THREE.MeshBasicMaterial({color:0xff4a3a,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;const p=W(e.x,e.z);r.position.set(p.x,topY(G[e.z][e.x])+.04,p.z);r.userData.unit=e;r.userData.pulse=true;hl.add(r);
        const fl=e.cls!=='turret'&&coverOf(G[e.z][e.x],G[u.z][u.x])===0,mm=fl?1.2:1,lo=Math.round(u.weapon.dmg*.85*mm),hi=Math.round(u.weapon.dmg*1.15*mm);const lab=document.createElement('div');lab.className='tg';lab.innerHTML=`${c}%<small>${lo}–${hi} dmg${fl?', flanked':!S.alerted?', unaware':''}</small>`;lab._u=e;$('#hud').appendChild(lab)}}}
  $('#roster').innerHTML=squad().map(p=>`<button type="button" class="ro${p===u?' on':''}${isDone(p)?' done':''}${p.down?' dn':''}" data-n="${squad().indexOf(p)}"><b>${esc(p.name)}</b><i><s style="width:${p.hp/p.maxHp*100}%"></s></i></button>`).join('');
  const det=$('#detail');
  if(S.phase!=='player'){det.innerHTML=`<p class="hint">${S.over?'':'The enemy is moving…'}</p>`}
  else if(!u){det.innerHTML='<p class="hint">Tap one of your squad to give orders.</p>'}
  else{let btns='';const t=G[u.z][u.x];
    if(u.down){btns+=`<button type="button" class="act${u.redeploy?' on':''}" data-a="redeploy" data-tip="redeploy">${u.redeploy?'Cancel redeploy':'Redeploy next turn'}</button>`}
    if(!u.down){
      if(S.swap){btns=Object.keys(CLASS_AB).filter(c=>c!==u.cls).map(c=>`<button type="button" class="act" data-a="swapto" data-c="${c}">${c}</button>`).join('')+`<button type="button" class="act ghost" data-a="swapcancel">Cancel</button>`}
      else{for(const a of abilsOf(u)){const cd=u.cd[a]||0,ok=!u.acted&&!cd&&(AB[a].tgt==='self'||abilityTargets(u,a).length>0);btns+=`<button type="button" class="act${S.mode===a?' on':''}" data-a="ab" data-id="${a}" data-tip="ab:${a}" ${ok?'':'disabled'}>${AB[a].name}${cd?` (${cd})`:''}</button>`}
        const near=objTargetsNear(u);if(near.length&&!u.acted){const o=curObj(),vt=o.type==='escort'?'repair':o.type;btns+=M.defend?`<button type="button" class="act obj" data-a="obj" data-tip="obj">${DEF_VERB[o.type]} −${DEF_FAST[o.type]===u.cls?2:1}</button>`:`<button type="button" class="act obj" data-a="obj" data-tip="obj">${o.type==='escort'?'Repair bot':OBJ_VERB[vt]} +${OBJ_FAST[vt]===u.cls?2:1}</button>`}
        if(!u.acted)for(const sc of secNear(u))btns+=`<button type="button" class="act sec" data-a="sec" data-id="${sc.id}" data-tip="sec:${sc.id}">${sc.label} +${SEC_FAST[sc.type]===u.cls?2:1}</button>`;
        if(!u.acted)btns+=`<button type="button" class="act ghost" data-a="ow" data-tip="ow">Overwatch</button>`;
        if(t.cp&&t.owner==='p'&&!u.acted)btns+=`<button type="button" class="act ghost" data-a="swap" data-tip="swap">Swap class</button>`;
        btns+=`<button type="button" class="act ghost" data-a="wait" data-tip="wait" ${isDone(u)?'disabled':''}>Done</button>`}}
    det.innerHTML=`<div class="dtop"><b>${esc(u.name)}</b><span>Lv ${u.lvl} ${u.body} ${u.cls}, ${u.weapon.name.toLowerCase()} (${u.weapon.dmg} dmg, range ${u.weapon.range})</span></div>
      <div class="dstat"><span>${u.down?'Down':`${u.hp}/${u.maxHp}`}${u.shield?` +${u.shield}`:''}</span><span class="${u.moved?'used':''}" data-tip="move:${u.body}">Move ${u.move}</span><span class="${u.acted?'used':''}" data-tip="action">Action</span><span data-tip="unit:me">ⓘ</span>${u.disg>0?'<span>Disguised</span>':''}${u.ow?'<span>Overwatch</span>':''}</div>
      <p class="hint">${u.down?'Down. A medic can revive them here, or redeploy them at the drop point.':S.mode?AB[S.mode].info||AB[S.mode].desc:S.swap?'Pick a new class. Their weapon stays the same.':(!u.moved?'Blue: move. ':'')+(!u.acted?'Red: shoot. Or use an ability.':isDone(u)?'All orders used.':'')}</p><div class="btns">${btns}</div>`}
  $('#undoBtn').hidden=!(S.undo&&S.phase==='player'&&!S.busy);$('#obj').textContent=curObj()?(M.stages?`${S.stage+1}/${M.stages.length}: `:'')+objLabel(curObj(),S):'';$('#turn').textContent=S.turnsLeft!=null?`${S.turnsLeft} left`:`Turn ${S.turn}`;$('#endTurn').disabled=S.phase!=='player'||S.busy}
function abilityTargets(u,id){const A=AB[id],out=[];
  if(A.tgt==='tile')for(const row of G)for(const t of row){if(t.type!=='water'&&dist(u,t)<=A.range&&!(t.x===u.x&&t.z===u.z))out.push(t)}
  if(A.tgt==='ally')for(const p of living('p').concat(squad().filter(q=>q.down))){if(p.cls==='turret')continue;if(id==='adrenaline'&&(p===u||!p.moved||p.down))continue;
    if(id==='patch'&&!(p.down||p.hp<p.maxHp))continue;if(id==='resupply'&&p===u)continue;if((A.range===1?cheb(u,p)<=1:dist(u,p)<=A.range))out.push(G[p.z][p.x])}
  if(A.tgt==='enemy')for(const e of living('e'))if(e.seen&&hitChance(u,e)>0)out.push(G[e.z][e.x]);
  if(A.tgt==='build')for(const[dx,dz]of D4){const t=tileAt(u.x+dx,u.z+dz);if(t&&t.type!=='water'&&!t.obj&&!t.cp&&!unitAt(t.x,t.z))out.push(t)}
  return[...new Set(out)]}
$('#roster').addEventListener('click',e=>{const b=e.target.closest('.ro');if(b)select(squad()[+b.dataset.n])});
$('#detail').addEventListener('click',async e=>{const b=e.target.closest('.act');if(!b||b.disabled||S.busy||S.phase!=='player')return;const u=S.sel,a=b.dataset.a;
  if(a==='redeploy'){u.redeploy=!u.redeploy;log(u.redeploy?`${u.name} will redeploy at the drop point at the start of your next turn.`:`${u.name} will wait for a medic.`);refresh();return}
  if(a==='wait'){S.undo=null;u.moved=u.acted=true;S.mode=null;afterOrder();return}
  if(a==='ow'){sfx('ready',u.group.position);S.undo=null;u.ow=true;u.acted=true;u.moved=true;updBar(u);log(`${u.name} is on overwatch`);afterOrder();return}
  if(a==='swap'){S.swap=true;refresh();return}if(a==='swapcancel'){S.swap=false;refresh();return}
  if(a==='swapto'){S.undo=null;u.cls=b.dataset.c;u.cd={};rebuildModel(u);u.acted=true;S.swap=false;popup(u,b.dataset.c,'good');log(`${u.name} swaps to ${u.cls}`);afterOrder();return}
  if(a==='obj'){await doObjective(u);return}
  if(a==='sec'){const sc=S.sec.find(x=>x.id===b.dataset.id);if(sc)await doSecondary(u,sc);return}
  if(a==='ab'){const id=b.dataset.id;if(AB[id].tgt==='self'){await doAbility(u,id,G[u.z][u.x]);return}S.mode=S.mode===id?null:id;refresh()}});
let endArmed=false;$('#endTurn').onclick=()=>{if(S.phase!=='player'||S.busy)return;if(!endArmed&&squad().some(p=>!isDone(p))){endArmed=true;$('#endTurn').textContent='Confirm';log('Some of your squad still have orders. Tap again to end the turn.');setTimeout(()=>{endArmed=false;$('#endTurn').textContent='End turn'},2600);return}endArmed=false;$('#endTurn').textContent='End turn';sfx('ui');endPlayerTurn()};
let retreatArmed=false;$('#retreat').onclick=()=>{if(S.over)return;if(!retreatArmed){retreatArmed=true;$('#retreat').textContent='Sure?';setTimeout(()=>{retreatArmed=false;$('#retreat').textContent='Retreat'},2500);return}retreatArmed=false;$('#retreat').textContent='Retreat';endMission(false,'You pulled the squad out.')};

async function tap(cx,cy){if(S.phase!=='player'||S.busy)return;const h=pickAt(cx,cy),u=S.sel;
  if(S.mode&&u){const t=h.unit?G[h.unit.z][h.unit.x]:h.tile;if(t&&abilityTargets(u,S.mode).includes(t)){await doAbility(u,S.mode,t);return}S.mode=null;refresh();return}
  if(h.unit){const v=h.unit;if(v.team==='p'){if(v.op)select(v);return}
    if(u&&!u.down&&!u.acted&&!v.down&&v.seen){const c=hitChance(u,v);if(c){S.undo=null;S.busy=true;refresh();await shoot(u,v);u.acted=true;u.disg=0;S.busy=false;afterOrder();return}}if(v.seen&&!v.down)log(`${v.name}: ${v.hp}/${v.maxHp} health, ${v.weapon.name.toLowerCase()}, range ${v.weapon.range}${u&&!u.acted&&!u.down&&!hitChance(u,v)?'. Out of range or no line of sight':''}`);return}
  if(h.tile&&u&&S.reach&&S.reach.d.has(key(h.tile.x,h.tile.z))&&!(h.tile.x===u.x&&h.tile.z===u.z)){S.busy=true;hl.clear();$('#hud').querySelectorAll('.tg').forEach(e=>e.remove());
    const snap={u,x:u.x,z:u.z,rot:u.group.rotation.y,alerted:S.alerted,carrier:S.carrier,owners:S.info.cps.map(t=>t.owner),seen:new Set(living('e').filter(e=>e.seen)),hp:u.hp};S.reacted=false;S.undo=null;
    await moveAlong(u,pathTo(S.reach,h.tile.x,h.tile.z));u.moved=true;
    const contact=living('e').some(e=>e.seen&&!snap.seen.has(e)),blocked=S.reacted||S.alerted!==snap.alerted||S.carrier!==snap.carrier||S.extracted||u.down||u.hp!==snap.hp||contact;
    S.undo=blocked?null:snap;S.busy=false;afterOrder();if(blocked&&(contact||S.reacted||S.alerted!==snap.alerted))setTimeout(()=>log(contact?'New contact spotted, so that move can’t be undone.':'The enemy reacted, so that move can’t be undone.'),250)}}
function doUndo(){const s=S.undo;if(!s||S.busy||S.phase!=='player')return;const u=s.u;u.x=s.x;u.z=s.z;place(u);u.group.rotation.y=s.rot;u.moved=false;S.info.cps.forEach((t,i)=>{if(t.owner!==s.owners[i]){if(s.owners[i])setOwner(t,s.owners[i]);else{t.owner=null;t.flag.material.color.set('#999999')}}});S.undo=null;computeVis();sfx('ui');log(`${u.name}’s move undone`);S.sel=null;select(u)}
$('#undoBtn').onclick=doUndo;
function afterOrder(){computeVis();if(checkEnd())return;if(advanceObj())return;
  if(S.sel&&isDone(S.sel)){const nx=squad().find(p=>!isDone(p));if(nx){S.sel=nx;focus(nx)}}refresh();
  if(squad().every(isDone)){setTimeout(()=>{if(S.phase==='player'&&!S.busy)endPlayerTurn()},700)}}

/* ---------- actions ---------- */
function face(u,x,z){const dx=x-u.x,dz=z-u.z;if(!dx&&!dz)return Promise.resolve();const to=Math.atan2(dx,dz),from=u.group.rotation.y,d=((to-from+Math.PI*3)%(Math.PI*2))-Math.PI;return tween(130,k=>u.group.rotation.y=from+d*k)}
function alarm(why){if(S.alerted)return;S.alerted=true;sfx('alarm');banner('Spotted!','enemy');log(why||'The enemy is alerted');refresh()}
async function moveAlong(u,p){if(u.rig)u.rig.hold_(u.body==='light'?'Run':'Walk',(u.body==='light'?1.25:1.7)/SPD);try{await moveSteps(u,p)}finally{if(u.rig)u.rig.release()}
  const t=G[u.z][u.x];if(t.cp&&t.owner!==u.team&&!u.down&&u.cls!=='turret'){setOwner(t,u.team);log(`${u.team==='p'?u.name+' takes':'The enemy takes'} the ${t.cp} command post`);if(u.team==='p')popup(u,'Post taken','good')}
  if(u.carry&&t.exit&&!u.down){S.extracted=true}}
async function moveSteps(u,p){if(u.team==='p'||u.seen)camState.follow=u;for(const[x,z]of p){if(u.team==='e'&&u.seen&&camState.follow!==u)camState.follow=u;if(u.down)break;if(u.team==='e'&&!u.seen&&!S.vis.has(key(x,z))){u.x=x;u.z=z;place(u);applyFog();enemyPickup(u,G[z][x]);if(await reactions(u))break;continue}await face(u,x,z);const a=u.group.position.clone(),t=G[z][x],b=W(x,z);b.y=topY(t);const dy=Math.abs(b.y-a.y),hop=dy>.3,heard=u.team==='p'||u.seen;if(hop&&u.rig)u.rig.once('Jump',1.2/SPD);if(hop){if(heard)sfx('jump',u.group.position);setTimeout(()=>{burst(b.clone(),5,0x9a8f80,1.1,.4,-4,1.1,.4);if(heard)sfx('land',b)},(230+dy*160)*SPD)}else if(heard)sfx('step',u.group.position);u.crouch=t.pass==='light'?.55:1;
    await tween(hop?250+dy*160:170,k=>{u.group.position.lerpVectors(a,b,k);if(hop)u.group.position.y+=Math.sin(k*Math.PI)*(.3+dy*.55);});u.x=x;u.z=z;
    if(u.team==='p'){computeVis();if(M.defend&&t.item&&!S.carrier&&S.item===t&&t!==S.itemHome){t.item=false;S.item=S.itemHome;S.itemHome.item=true;const hp=W(S.item.x,S.item.z);S.itemMesh.position.set(hp.x,topY(S.item)+.25,hp.z);popup(u,'Recovered','good');log(`${u.name} recovers the cache and returns it to the lab.`)}
      if(!M.defend&&t.item&&!S.carrier&&S.item===t&&(!M.stages||(curObj()&&curObj().type==='extract'))){S.carrier=u;u.carry=true;t.item=false;updBar(u);popup(u,'Cartridge','good');log(`${u.name} has the cartridge. Get to the exit!`);attachCarry(u)}
      if(!S.alerted&&!(u.disg>0)){const sp=foes().find(e=>dist(e,u)<=e.vis&&los(G[e.z][e.x],t));if(sp)alarm(`${u.name} was spotted`)}}
    else{applyFog();enemyPickup(u,t)}
    if(await reactions(u))break}}
function enemyPickup(u,t){if(M.defend&&u.team==='e'&&u.cls!=='bot'&&t.item&&!S.carrier&&S.item===t&&curObj()&&curObj().type==='extract'){S.carrier=u;u.carry=true;t.item=false;updBar(u);log('The enemy has the cache! Stop the carrier.');banner('Cache taken','enemy');attachCarry(u)}}
function attachCarry(u){const c=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.3,10),new THREE.MeshBasicMaterial({color:0x7dffd0}));c.position.y=1.15;u.group.add(c);u.carryMesh=c;if(S.itemMesh)S.itemMesh.visible=false}
function dropCarry(u){if(!u.carry)return;u.carry=false;S.carrier=null;if(u.carryMesh)u.group.remove(u.carryMesh);const t=G[u.z][u.x];S.item=t;t.item=true;const p=W(t.x,t.z);S.itemMesh.position.set(p.x,topY(t)+.25,p.z);S.itemMesh.visible=true;log('The cartridge is on the ground. Pick it back up!')}
async function reactions(m){const _r=0;for(const o of units){if(!o.ow||o.down||o.gone||o.team===m.team||o.stun>0)continue;if(m.down)return true;
    if(o.team==='e'&&m.disg>0&&cheb(o,m)>1)continue;if(o.team==='p'&&!S.vis.has(key(m.x,m.z)))continue;const c=hitChance(o,m,-10);if(!c)continue;
    S.reacted=true;o.ow=false;updBar(o);log(`${o.team==='p'?o.name:'Enemy'} overwatch fire!`);await shoot(o,m,o.perks&&o.perks.has('sharp')?10:-10);if(o.team==='p')alarm()}return m.down}
function muzzle(u){if(u.rig&&u.rig.gun)return rigMuzzleWorld(u.rig,new THREE.Vector3());const v=u.group.position.clone();v.y+=u.cls==='turret'?.5:u.body==='heavy'?.62:.58;v.x+=Math.sin(u.group.rotation.y)*.34;v.z+=Math.cos(u.group.rotation.y)*.34;return v}
async function tracer(a,b,hit,col){if(a.rig){a.rig.once('Idle_Shoot',1/SPD);if(a.rig.barrels){const br=a.rig.barrels;tween(160,k=>br.rotation.z+=.5)}await sleep(90)}sfx(a.wkey==='shotgun'?'shotgun':['smg','mpistol','lmg','minigun'].includes(a.wkey)?'heavy':'shot',a.group.position);const from=muzzle(a),to=b.group.position.clone();to.y+=.45;if(!hit){to.x+=(Math.random()-.5)*1.2;to.z+=(Math.random()-.5)*1.2;to.y+=.3}
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([from,to]),new THREE.LineBasicMaterial({color:col,transparent:true}));scene.add(ln);
  const fl=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:0xfff0a0}));fl.position.copy(from);scene.add(fl);flashLight(from,0xffd27a,1.6,120);
  if(hit)burst(to,6,0xffd27a,2.4,.35,-5,.8,.8);else{const d=to.clone();d.y=Math.max(0,d.y-.5);burst(d,5,0xb8ab96,1.4,.45,-6,1,.6)}
  await tween(150,k=>{ln.material.opacity=1-k;fl.scale.setScalar(1+k)});scene.remove(ln);scene.remove(fl)}
async function shoot(a,b,mod=0){if(a.team==='p'||a.seen||b.team==='p'){const pa=a.group.position,pb=b.group.position;camState.follow=new THREE.Vector3((pa.x+pb.x)/2,0,(pa.z+pb.z)/2)}await face(a,b.x,b.z);const c=hitChance(a,b,mod),n=a.weapon.burst||1,fl=b.cls!=='turret'&&coverOf(G[b.z][b.x],G[a.z][a.x])===0;let dmg=0,hits=0;
  if(a.team==='e'&&!a.seen){a.group.visible=true;a.el.style.display=''}
  for(let i=0;i<n;i++){const hit=Math.random()*100<c;if(hit){hits++;dmg+=a.weapon.dmg/n*(.85+Math.random()*.3)}await tracer(a,b,hit,a.team==='p'?0xffd27a:0x8fd8ff);await sleep(50)}
  if(a.team==='p'&&a.op){S.stats.shots++;if(hits)S.stats.hits++}if(a.team==='p')alarm(`${a.name} opened fire`);
  if(n>1)setTimeout(()=>sfx('shell',a.group.position),300);if(hits){if(fl)dmg*=1.2;damage(b,Math.round(dmg),a,fl)}else{popup(b,'Miss','miss');sfx('miss',b.group.position);log(`${a.team==='p'?a.name:b.team==='p'?'Enemy':''} missed`)}await sleep(320)}
function damage(u,n,by,fl){if(u.cls==='bot')n=Math.round(n*.5);if(u.perks&&u.perks.has('jugg'))n=Math.round(n*.85);if(by&&by.perks&&by.perks.has('marksman')&&by.wkey==='sniper'&&G[by.z][by.x].h>G[u.z][u.x].h)n+=10;let left=n;if(u.shield>0){const s=Math.min(u.shield,left);u.shield-=s;left-=s}sfx('hit',u.group&&u.group.position);if(u.team==='p'&&navigator.vibrate)try{navigator.vibrate(35)}catch(e){}flashUnit(u,0xff2a1a);if(n>=35)shake(.12);u.hp=Math.max(0,u.hp-left);popup(u,'−'+n+(fl?' flanked':''),u.team==='p'?'hurt':'');updBar(u);
  if(u.hp<=0&&!u.down&&u.cls==='bot'){u.down=true;puff(u.group.position.clone(),8,0x3a3430,2);if(M.defend){log('Bot disabled! They will try to repair it.');banner('Bot down')}else{log('The bot is disabled! Repair it to keep going.');banner('Bot disabled','enemy')}updBar(u);return}
  if(u.hp<=0&&!u.down){u.down=true;u.ow=false;puff(u.group.position.clone(),4,0x9a8f80,.9);if(u.op)S.stats.downs++;if(u.rig)u.rig.setBase('Death');else tween(300,k=>{u.lie.rotation.x=-Math.PI/2*k;u.lie.position.y=.08*k});u.ringMesh.visible=false;if(by&&by.team==='p'&&u.team==='e')by.kills++;
    if(u.carry)dropCarry(u);if(u.cls==='turret'){u.gone=true;u.group.visible=false;u.el.remove()}log(u.team==='p'?`${u.name} is down!`:`${u.name} down`)}
  else{if(u.rig)u.rig.once('HitReact',1/SPD);if(by)log(`${by.team==='p'?by.name:'Enemy'} hits for ${n}`)}}
async function doObjective(u){const o=curObj(),t=objTargetsNear(u)[0];if(!t)return;if(M.defend){S.undo=null;S.busy=true;await face(u,t.x,t.z);const k=key(t.x,t.z),sub=DEF_FAST[o.type]===u.cls?2:1;S.prog[k]=Math.max(0,(S.prog[k]||0)-sub);u.acted=true;S.credit[u.op.id]=(S.credit[u.op.id]||0)+1;popup(u,S.prog[k]?`${S.prog[k]}/${o.need}`:'Undone','good');log(S.prog[k]?`${u.name} sets them back (${S.prog[k]}/${o.need}).`:`${u.name} undoes all their progress.`);S.busy=false;afterOrder();return}if(o.type==='escort'){S.undo=null;S.busy=true;await face(u,t.x,t.z);S.prog.bot=(S.prog.bot||0)+(u.cls==='engineer'?2:1);u.acted=true;S.credit[u.op.id]=(S.credit[u.op.id]||0)+1;if(S.prog.bot>=2){const b=S.bot;b.down=false;b.hp=Math.round(b.maxHp*.5);S.prog.bot=0;b.ringMesh.visible=true;updBar(b);popup(b,'Repaired','good');log('The bot is running again.')}else popup(u,'1/2','good');S.busy=false;afterOrder();return}S.undo=null;S.busy=true;await face(u,t.x,t.z);const add=(OBJ_FAST[o.type]===u.cls?2:1)+(o.type==='plant'&&u.perks.has('demo')?1:0),k=key(t.x,t.z);S.prog[k]=Math.min(o.need,(S.prog[k]||0)+add);u.acted=true;
  S.credit[u.op.id]=(S.credit[u.op.id]||0)+1;const done=S.prog[k]>=o.need;
  if(t.lamp)await tween(400,kk=>t.lamp.material.color.setHSL(.15+.2*Math.sin(kk*Math.PI),1,.6));
  if(done){if(o.type==='plant'){await explode(t,false);tileGroup.remove(t.objMesh);t.obj=null;const r=new THREE.Mesh(new THREE.BoxGeometry(.7,.15,.7),lam('#2a2622'));const p=W(t.x,t.z);r.position.set(p.x,topY(t)+.07,p.z);tileGroup.add(r)}
    else if(t.lamp)t.lamp.material.color.set(0x7dffb0)}
  popup(u,done?{hack:'Hacked',plant:'Destroyed',repair:'Repaired'}[o.type]:`${S.prog[k]}/${o.need}`,'good');log(done?`${OBJ_VERB[o.type]} complete`:`${u.name} makes progress (${S.prog[k]}/${o.need})`);
  if(o.type!=='repair')alarm('The enemy noticed the tampering');S.busy=false;afterOrder()}
async function explode(t,dmgIt){const b=W(t.x,t.z);sfx('boom',b);setTimeout(()=>sfx('debris',b),180);b.y=topY(t)+.2;const ex=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true}));ex.position.copy(b);scene.add(ex);
  flashLight(b.clone().setY(b.y+.6),0xff9a40,4,520);shake(.28);burst(b,22,0xff9a3a,4.5,.7,-9,1.3,1.2);burst(b,12,0x3a3430,3.5,1,-9,1.6,1);puff(b,9,0x5a5550,1.6);
  await tween(420,k=>{ex.scale.setScalar(.2+k*1.3);ex.material.opacity=1-k});scene.remove(ex)}
async function doAbility(u,id,t){S.undo=null;S.busy=true;S.mode=null;hl.clear();const A=AB[id];
  if(t&&!(t.x===u.x&&t.z===u.z))await face(u,t.x,t.z);
  if(id==='grenade'||id==='emp'){sfx('throw',u.group.position);const a=muzzle(u),b=W(t.x,t.z);b.y=topY(t)+.1;const g=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),new THREE.MeshBasicMaterial({color:id==='emp'?0x5fd8ff:0x556036}));scene.add(g);
    await tween(480,k=>{g.position.lerpVectors(a,b,k);g.position.y+=Math.sin(k*Math.PI)*1.6});scene.remove(g);
    if(id==='grenade'){explode(t);for(const v of units)if(!v.down&&!v.gone&&cheb(v,t)<=1)damage(v,30+(u.perks.has('demo')?15:0)+Math.round(Math.random()*8),v.team==='e'?u:null);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const n=tileAt(t.x+dx,t.z+dz);if(n&&n.obj==='wall'){tileGroup.remove(n.objMesh);n.obj=null;n.objMesh=null}}}
    else{const ring=new THREE.Mesh(new THREE.RingGeometry(.2,1.5,32),new THREE.MeshBasicMaterial({color:0x5fd8ff,transparent:true,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.copy(b);scene.add(ring);tween(400,k=>{ring.scale.setScalar(.3+k);ring.material.opacity=1-k}).then(()=>scene.remove(ring));
      for(const v of living('e'))if(cheb(v,t)<=1){v.stun=1;v.ow=false;updBar(v);popup(v,'Stunned','good')}}
    alarm();await sleep(420)}
  if(id==='suppress'){const e=unitAt(t.x,t.z);if(e){await tracer(u,e,true,0xffd27a);await tracer(u,e,true,0xffd27a);damage(e,10,u);e.stun=1;e.ow=false;updBar(e);popup(e,'Pinned','good')}alarm()}
  if(id==='resupply'){sfx('reload',u.group.position);const p=unitAt(t.x,t.z);if(p){p.cd={};popup(p,'Resupplied','good');refresh()}}
  if(id==='patch'){const p=squad().find(q=>q.x===t.x&&q.z===t.z);if(p){if(p.down){const sg=u.perks.has('surgeon');p.down=false;p.hp=sg?70:40;p.moved=false;p.acted=!sg;p.downTurns=0;p.redeploy=false;p.ringMesh.visible=true;if(p.rig){p.rig.setBase('Idle');await sleep(450)}else await tween(280,k=>{p.lie.rotation.x=-Math.PI/2*(1-k);p.lie.position.y=.08*(1-k)});log(`${p.name} is back up. They can move but not act this turn.`)}else p.hp=Math.min(p.maxHp,p.hp+40);popup(p,'+40','good');updBar(p)}}
  if(id==='adrenaline'){const p=squad().find(q=>q.x===t.x&&q.z===t.z);if(p){p.moved=false;popup(p,'Adrenaline','good');log(`${p.name} can move again`)}}
  if(id==='surgery'){for(const p of squad())if(!p.down&&dist(p,u)<=2){p.hp=Math.min(p.maxHp,p.hp+25);popup(p,'+25','good');updBar(p)}}
  if(id==='barricade'){sfx('build',W(t.x,t.z));t.obj='wall';t.fort=u.perks.has('fortify');objMesh(t);const m=t.objMesh;m.scale.setScalar(.01);await tween(280,k=>m.scale.setScalar(Math.max(.01,k)));log('Barricade up')}
  if(id==='turret'){sfx('build',W(t.x,t.z));const th=u.perks.has('fortify')?90:60;const tu=newUnit({team:'p',name:'Turret',short:'Turret',cls:'turret',body:'turret',hp:th,maxHp:th,move:0,vis:4,weapon:{...WPN.turret},x:t.x,z:t.z});units.push(tu);makeUnitMesh(tu);tu.group.rotation.y=u.group.rotation.y;log('Turret deployed')}
  if(id==='armourup'){const p=unitAt(t.x,t.z)||u;p.shield=25;updBar(p);popup(p,'+25 shield','good')}
  if(id==='spot'){S.reveals.push({x:t.x,z:t.z,r:3,turns:2});log('Area spotted');const c=new THREE.Mesh(new THREE.RingGeometry(2.8,3,40),new THREE.MeshBasicMaterial({color:0xffd23a,transparent:true,side:THREE.DoubleSide}));c.rotation.x=-Math.PI/2;const p=W(t.x,t.z);c.position.set(p.x,topY(t)+.05,p.z);scene.add(c);tween(900,k=>c.material.opacity=1-k).then(()=>scene.remove(c))}
  if(id==='disguise'){u.disg=u.perks.has('ghost')?3:2;updBar(u);popup(u,'Disguised','good')}
  u.cd[id]=A.cd;u.acted=true;if(id!=='disguise'&&['grenade','suppress','emp'].includes(id))u.disg=0;S.busy=false;afterOrder()}

/* ---------- turns ---------- */
async function turretsFire(team){for(const tu of units.filter(x=>x.cls==='turret'&&x.team===team&&!x.down&&!x.gone)){if(tu.stun>0){tu.stun--;continue}
  let best=null;for(const v of living(team==='p'?'e':'p')){if(v.cls==='turret')continue;if(team==='p'&&!v.seen)continue;if(team==='e'&&v.disg>0&&cheb(v,tu)>1)continue;const c=hitChance(tu,v);if(c&&(!best||c>best.c))best={v,c}}
  if(best&&(team==='p'||S.alerted)){if(team==='e')focus(tu);await shoot(tu,best.v);if(checkEnd())return}}}
function startTurnEffects(team){for(const t of S.info.cps){if(t.owner!==team)continue;for(const v of living(team)){if(v.cls==='turret')continue;
    if(t.cp==='health'&&v.hp<v.maxHp){v.hp=Math.min(v.maxHp,v.hp+10);updBar(v)}if(t.cp==='supply')for(const k in v.cd)v.cd[k]=Math.max(0,v.cd[k]-1)}}
  for(const v of units.filter(x=>x.team===team&&!x.gone)){for(const k in v.cd)v.cd[k]=Math.max(0,v.cd[k]-1);v.ow=false;if(v.disg>0)v.disg--;v.moved=v.acted=false;if(v.stun>0&&v.cls!=='turret'){v.moved=v.acted=true;v.stun--}updBar(v)}}
async function endPlayerTurn(){S.undo=null;S.phase='enemy';S.sel=null;S.mode=null;refresh();if(!M.defend)await moveBot();if(advanceObj())return;await turretsFire('p');if(checkEnd()||advanceObj())return;await enemyTurn()}
async function enemyTurn(){banner('Enemy turn','enemy');await sleep(800);startTurnEffects('e');if(M.defend){topUpAttackers();assignRoles()}
  for(const[t,list]of(M.stages?(M.stages[S.stage].reinf||[]):(M.reinf||[])))if(t===(M.stages?S.stageTurn:S.turn)){let any=false,cnt=0;for(const[type,x,z]of list){if(cnt>=DF().wave)break;if(unitAt(x,z)||G[z][x].obj)continue;cnt++;const e=spawnEnemy(type,x,z,S.R);e.fresh=true;any=true}if(any){log('Enemy reinforcements have arrived');S.alerted=true;applyFog();await sleep(500)}}
  for(const e of [...living('e')]){if(S.over)return;if(e.fresh){e.fresh=false;continue}if(e.cls==='turret'||e.cls==='bot')continue;if(e.moved&&e.acted)continue;await aiAct(e);updBar(e);if(checkEnd())return;if(S.over)return}
  await turretsFire('e');if(checkEnd())return;if(M.defend){await moveBot();if(advanceObj())return}
  const o=curObj();if(o&&o.type==='hold'&&squad().some(p=>!p.down&&G[p.z][p.x].zone)){S.hold++;log(`Square held (${S.hold}/${o.turns})`)}
  if(advanceObj())return;
  S.turn++;S.stageTurn++;if(S.turnsLeft!=null){S.turnsLeft--;if(S.turnsLeft<=0){if(M.defend)endMission(true);else endMission(false,'Out of time. The enemy held the line.');return}if(S.turnsLeft<=2)log(M.defend?`Hold on! ${S.turnsLeft} turn${S.turnsLeft>1?'s':''} to go.`:`${S.turnsLeft} turn${S.turnsLeft>1?'s':''} left to complete the objective!`)}S.reveals=S.reveals.filter(r=>--r.turns>0);startTurnEffects('p');redeployDowned();S.phase='player';computeVis();banner('Your turn');
  S.sel=squad().find(p=>!isDone(p))||squad().find(p=>!p.down)||null;focus(S.sel);refresh()}
function redeployDowned(){for(const u of squad()){if(!u.down)continue;u.downTurns=(u.downTurns||0)+1;if(u.downTurns<3&&!u.redeploy){updBar(u);continue}u.redeploy=false;
    const free=S.info.spawns.filter(t=>!unitAt(t.x,t.z,u));let t=free[0];if(!t){let best=null;for(const row of G)for(const c of row){if(c.type==='water'||c.obj||c.pass||unitAt(c.x,c.z,u))continue;const d=Math.min(...S.info.spawns.map(s2=>dist(s2,c)));if(!best||d<best.d)best={c,d}}t=best&&best.c}if(!t)continue;
    u.down=false;u.downTurns=0;u.hp=Math.round(u.maxHp*.5);u.shield=0;u.x=t.x;u.z=t.z;place(u);if(u.rig)u.rig.setBase('Idle');else{u.lie.rotation.x=0;u.lie.position.y=0}u.ringMesh.visible=true;u.moved=false;u.acted=true;updBar(u);popup(u,'Redeployed','good');log(`${u.name} redeploys at the drop point with half health. Move only this turn.`)}}
function topUpAttackers(max){const st=M.stages[S.stage];const alive=living('e').filter(x=>x.cls!=='turret'&&x.cls!=='bot').length;let n=Math.min((st.size||6)-alive,max??Math.max(1,DF().wave));let any=false;
  for(const[x,z]of S.espawns){if(n<=0)break;if(unitAt(x,z)||G[z][x].obj)continue;const type=st.pool[S.poolIdx++%st.pool.length];const e=spawnEnemy(type,x,z,S.R);e.fresh=max!==99;n--;any=true}if(any&&max!==99){log('Enemy reinforcements are pushing in.');applyFog()}}
function objSpots(){const o=curObj();if(!o)return[];if(o.type==='escort')return S.bot?[S.bot]:[];if(o.type==='extract')return S.carrier?S.info.exits:(S.item?[S.item]:[]);if(o.targets)return o.targets.filter(([x,z])=>(S.prog[key(x,z)]||0)<o.need).map(([x,z])=>G[z][x]);return[]}
function assignRoles(){const o=curObj(),sp=objSpots();const att=living('e').filter(x=>x.cls!=='turret'&&x.cls!=='bot');for(const e of att)e.role=e.body==='light'?'flank':'escort';if(!sp.length)return;
  const fast={plant:'soldier',repair:'engineer',hack:'operative'}[o.type];const d=e=>Math.min(...sp.map(t=>dist(e,t)))-(e.cls===fast?3:0)-(o.type==='escort'&&S.bot&&S.bot.down&&e.cls==='engineer'?4:0);
  if(S.carrier&&S.carrier.team==='e')S.carrier.role='push';att.filter(e=>e.role!=='push').sort((a,b)=>d(a)-d(b)).slice(0,o.type==='extract'&&S.carrier?1:2).forEach(e=>e.role='push')}
async function aiWork(e,o,t){await face(e,t.x,t.z);const k=key(t.x,t.z),fast={plant:'soldier',repair:'engineer',hack:'operative'}[o.type];S.prog[k]=Math.min(o.need,(S.prog[k]||0)+(e.cls===fast?2:1));e.acted=true;
  if(S.vis.has(k)){popup(e,`${S.prog[k]}/${o.need}`,'hurt')}log(`The enemy is working on the objective (${S.prog[k]}/${o.need}).`);if(t.lamp)t.lamp.material.color.set(0xff5a2a);
  if(S.prog[k]>=o.need){if(o.type==='plant'){await explode(t,false);if(t.objMesh)tileGroup.remove(t.objMesh);t.obj=null}else if(t.lamp)t.lamp.material.color.set(0x7dffb0);banner('Objective lost','enemy');advanceObj()}}
async function pushAct(e){const o=curObj();if(!o)return;
  if(o.type==='extract'){if(e.carry){const far=reach(e,60);let best=null;for(const t of S.info.exits){const k=key(t.x,t.z);if(far.d.has(k)&&(!best||far.d.get(k)<far.d.get(key(best.x,best.z))))best=t}if(best){await moveAlong(e,pathTo(far,best.x,best.z).slice(0,e.move));if(S.extracted&&!e.down){advanceObj()}}return}
    if(S.item&&!S.carrier){const far=reach(e,60),k=key(S.item.x,S.item.z);if(far.d.has(k)){await moveAlong(e,pathTo(far,S.item.x,S.item.z).slice(0,e.move));return}}return aiShootOrMove(e)}
  if(o.type==='escort'&&S.bot){const b=S.bot;if(cheb(e,b)<=1){if(b.down){await face(e,b.x,b.z);S.prog.ebot=(S.prog.ebot||0)+(e.cls==='engineer'?2:1);e.acted=true;if(S.prog.ebot>=2){b.down=false;b.hp=Math.round(b.maxHp*.5);S.prog.ebot=0;updBar(b);log('They got the bot running again.')}else log('The enemy is repairing the bot.');return}const bs=bestShot(e);if(bs&&bs.c>=30)await shoot(e,bs.t);return}
    const r=reach(e);let pick=null,bs=1e9;for(const k of r.d.keys()){const[x,z]=k.split(',').map(Number);if(Math.max(Math.abs(x-b.x),Math.abs(z-b.z))>1)continue;const sc=r.d.get(k)-coverHere(x,z)*2;if(sc<bs){bs=sc;pick=[x,z]}}
    if(pick){await moveAlong(e,pathTo(r,pick[0],pick[1]));if(!e.down&&b.down&&cheb(e,b)<=1&&!e.acted)return pushAct(e);const sh=bestShot(e);if(sh&&sh.c>=30&&!e.acted)await shoot(e,sh.t);return}return approach(e,b)}
  const sp=objSpots();if(!sp.length)return aiShootOrMove(e);const t=sp[0];if(cheb(e,t)<=1){await aiWork(e,o,t);return}
  const r=reach(e);let pick=null,bs=1e9;for(const k of r.d.keys()){const[x,z]=k.split(',').map(Number);if(Math.max(Math.abs(x-t.x),Math.abs(z-t.z))>1)continue;const sc=r.d.get(k)-coverHere(x,z)*2;if(sc<bs){bs=sc;pick=[x,z]}}
  if(pick){await moveAlong(e,pathTo(r,pick[0],pick[1]));if(!e.down&&cheb(e,t)<=1&&curObj()===o)await aiWork(e,o,t);return}return approach(e,t)}
function coverHere(x,z){const t=G[z][x];let c=0;for(const p of squad())if(!p.down)c+=coverOf(t,G[p.z][p.x]);return c}
async function approach(e,t){const far=reach(e,60),best=[...far.d.keys()].map(k=>k.split(',').map(Number)).sort((a,b)=>Math.hypot(a[0]-t.x,a[1]-t.z)-Math.hypot(b[0]-t.x,b[1]-t.z))[0];if(best){await moveAlong(e,pathTo(far,best[0],best[1]).slice(0,e.move))}if(!e.down){const sh=bestShot(e);if(sh&&sh.c>=30)await shoot(e,sh.t)}}
async function aiShootOrMove(e){const sh=bestShot(e);if(sh&&sh.c>=40){await shoot(e,sh.t);return}const sp=objSpots();if(sp.length)return approach(e,sp[0])}
function knownTargets(e){return living('p').filter(p=>p.cls==='turret'||!(p.disg>0)||cheb(p,e)<=1)}
function bestShot(e){let best=null;for(const t of knownTargets(e)){const c=hitChance(e,t);if(!c)continue;const s=c+(t.hp<40?15:0)+(t.carry?20:0)+(t.cls==='turret'?-10:0)+(t.cls==='bot'?(t.down?-60:-25):0);if(!best||s>best.s)best={t,c,s}}return best}
async function aiAct(e){
  if(M.defend&&e.role==='push'){if(e.seen)focus(e);await sleep(e.seen?260:60);if(e.stun>0)return;await pushAct(e);return}
  if(!S.alerted){const sp=living('p').find(p=>p.cls!=='turret'&&!(p.disg>0)&&dist(e,p)<=e.vis&&los(G[e.z][e.x],G[p.z][p.x]));if(sp){alarm(`${sp.name} has been spotted`)}else return}
  if(e.seen)focus(e);await sleep(e.seen?280:60);
  if(e.leader){const ex=S.info.exits;if(!ex.length)return;const far=reach(e,40);let best=null;for(const t of ex){if(far.d.has(key(t.x,t.z))&&(!best||far.d.get(key(t.x,t.z))<far.d.get(key(best.x,best.z))))best=t}
    if(best){const p=pathTo(far,best.x,best.z).slice(0,e.move);await moveAlong(e,p);if(G[e.z][e.x].exit&&!e.down){endMission(false,'The cell leader reached the boats and got away.');return}}
    else{const b=bestShot(e);if(b)await shoot(e,b.t)}return}
  if(e.cls==='medic'){const hurt=living('e').filter(a=>a!==e&&a.cls!=='turret'&&a.hp<a.maxHp*.6).sort((a,b)=>a.hp-b.hp)[0];
    if(hurt){const r=reach(e);let spot=null;for(const k of r.d.keys()){const[x,z]=k.split(',').map(Number);if(Math.max(Math.abs(x-hurt.x),Math.abs(z-hurt.z))<=1){spot=[x,z];break}}
      if(spot){await moveAlong(e,pathTo(r,spot[0],spot[1]));if(e.down)return;await face(e,hurt.x,hurt.z);hurt.hp=Math.min(hurt.maxHp,hurt.hp+35);updBar(hurt);if(hurt.seen)popup(hurt,'+35','good');return}}}
  if(e.cls==='engineer'&&!e.built){const spots=D4.map(([dx,dz])=>tileAt(e.x+dx,e.z+dz)).filter(t=>t&&t.type!=='water'&&!t.obj&&!t.cp&&!unitAt(t.x,t.z));if(spots.length&&bestShot(e)){const t=spots[0];e.built=true;const tu=spawnEnemy('turret',t.x,t.z,S.R);tu.fresh=false;tu.moved=tu.acted=true;applyFog();if(tu.seen)log('An enemy engineer deployed a turret');return}}
  let b=bestShot(e);const thr=e.type==='marksman'?40:50;
  if(b&&b.c>=thr){await shoot(e,b.t);return}
  const r=reach(e),ps=knownTargets(e);if(!ps.length)return;let pick=null,bs=-1e9;const ox=e.x,oz=e.z;
  for(const k of r.d.keys()){const[x,z]=k.split(',').map(Number);e.x=x;e.z=z;let shot=0,flank=0;for(const t of ps){const c=hitChance(e,t);if(c>shot){shot=c;flank=coverOf(G[t.z][t.x],G[z][x])===0?1:0}}
    let cov=2;for(const t of ps)cov=Math.min(cov,coverOf(G[z][x],G[t.z][t.x]));const near=Math.min(...ps.map(t=>dist(e,t)));const tl=G[z][x];
    let sc=shot+cov*18+tl.h*6+Math.random()*4;if(e.fallback&&M.stages){const fr=M.stages[S.stage].front;if(fr!=null&&z>fr)sc-=(z-fr)*6}sc+=e.type==='marksman'?Math.min(near,7)*1.2:e.type==='infiltrator'?flank*22-near*2:-near*1.6;
    if(tl.cp&&tl.owner!=='e')sc+=14;if(tl.zone&&curObj()&&curObj().type==='hold')sc+=10;const ct=S.carrier;if(ct)sc-=dist({x,z},ct)*1.5;sc+=objectiveGuard(x,z);
    if(sc>bs){bs=sc;pick=[x,z]}}
  e.x=ox;e.z=oz;if(pick&&!(pick[0]===ox&&pick[1]===oz))await moveAlong(e,pathTo(r,pick[0],pick[1]));if(e.down)return;
  b=bestShot(e);if(b&&b.c>=25)await shoot(e,b.t);else if(coverOf(G[e.z][e.x],G[ps[0].z][ps[0].x])>=1){e.ow=true;updBar(e)}}
function objectiveGuard(x,z){const o=curObj();if(o&&o.type==='escort'&&S.bot)return -Math.hypot(S.bot.x-x,S.bot.z-z)*.5;if(!o||!o.targets)return 0;let s=0;for(const[tx,tz]of o.targets)if((S.prog[key(tx,tz)]||0)<o.need)s-=Math.hypot(tx-x,tz-z)*.6;return s}

/* ---------- end ---------- */
function checkEnd(){if(S.over)return true;if(!squad().some(p=>!p.down)){endMission(false,'The whole squad is down.');return true}return false}
function endMission(won,why){if(S.over)return;S.over=true;S.phase='over';applyFog();refresh();
  const f=CUR.faction,m=M,res=[];let recruit=null;
  for(const u of squad()){const op=SAVE.roster[f].find(o=>o.id===u.op.id);if(!op)continue;const before=lvlOf(op.xp);
    let xp=won?m.xp:25;xp+=u.kills*15+(S.credit[op.id]||0)*25;if(won&&S.info.cps.length&&S.info.cps.every(t=>t.owner==='p'))xp+=20;
    op.xp+=xp;const after=lvlOf(op.xp);if(won&&u.down)op.injured=2;res.push({op,xp,before,after,kills:u.kills,down:u.down})}
  for(const op of SAVE.roster[f])if(op.injured>0)op.injured--;
  if(won){if(CUR.mi>=SAVE.prog[f]){SAVE.prog[f]=CUR.mi+1;if(m.recruit&&RECRUITS[m.recruit]){recruit=RECRUITS[m.recruit];SAVE.roster[f].push(mkOp(recruit))}}}
  const par=PAR[m.id]||8,third=m.defend?S.stage===0:S.turn<=par,stars=won?1+(S.stats.downs===0?1:0)+(third?1:0):0;if(won)SAVE.stars[m.id]=Math.max(SAVE.stars[m.id]||0,stars);
  const summary={stars,par,third,defend:!!m.defend,turns:S.turn,downs:S.stats.downs,acc:S.stats.shots?Math.round(S.stats.hits/S.stats.shots*100):null,kills:res.reduce((a,r)=>a+r.kills,0)};
  persist();sfx(won?'win':'lose');
  setTimeout(()=>viewDebrief(won,why,res,recruit,summary),1300);banner(won?'Mission complete':'Mission failed',won?'':'enemy')}
function viewDebrief(won,why,res,recruit,sm){const f=CUR.faction,m=M;
  $('#v-debrief').innerHTML=`<h2 class="vh"><small>${m.title}</small>${won?'Mission complete':'Mission failed'}</h2>
  <div class="story"><p>${won?(typeof m.debrief==='string'?m.debrief:m.debrief[f]):why+' Regroup and try again: everyone still keeps some of the experience they earned.'}</p></div>
  ${won?`<div class="stars"><b>${starStr(sm.stars)}</b><ul><li class="ok">Mission complete</li><li class="${sm.downs===0?'ok':''}">Nobody went down${sm.downs?` (${sm.downs} did)`:''}</li><li class="${sm.third?'ok':''}">${sm.defend?'The first line never fell':`Done within ${sm.par} turns (you took ${sm.turns})`}</li></ul></div>`:''}
  <p class="small">${sm.kills} enemies downed${sm.acc!==null?`, ${sm.acc}% of attacks landed`:''}.</p>
  <div class="dlist">${res.map(r=>{const l=r.after,nx=LEVELS[l]||null,pr=nx?Math.round((r.op.xp-LEVELS[l-1])/(nx-LEVELS[l-1])*100):100;const unl=[];for(let L=r.before+1;L<=r.after;L++){CLASS_AB[r.op.cls].forEach((a,i)=>{if(AB_LVL[i]===L)unl.push(AB[a].name)});if(L===3)unl.push('+1 move')}
    return `<div class="dcard"><div class="pf">${opPortrait(r.op)}</div><div class="oc"><b>${esc(r.op.name)} <i>Lv ${l}</i></b><span>+${r.xp} XP${r.kills?`, ${r.kills} kill${r.kills>1?'s':''}`:''}${r.down&&won?', injured':''}</span><div class="xp"><s style="width:${pr}%"></s></div>${r.after>r.before?`<p class="lvup">Level up!${unl.length?' Unlocked '+unl.join(', ')+'.':''} New perk to choose in the Roster.</p>`:''}</div></div>`}).join('')}</div>
  ${recruit?`<div class="recruit"><div class="pf">${portraitHTML(recruit)}</div><div><b>New recruit: ${esc(recruit.name)}</b><span>${BODY[recruit.body].label} ${recruit.cls} “${esc(recruit.callsign)}”</span></div></div>`:''}
  ${won&&SAVE.prog[f]>=4&&CUR.mi===3?`<div class="epi"><b>Campaign complete</b><p>${EPILOGUE[f]}</p></div>`:''}
  <div class="row"><button type="button" class="go" id="cont">Continue</button>${won?'':'<button type="button" class="btn" id="retry">Retry mission</button>'}</div>`;
  $('#cont').onclick=viewCamp;if(!won)$('#retry').onclick=viewBrief;show('debrief')}

/* ---------- input + loop ---------- */
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
function pickAt(cx,cy){const r=renderer.domElement.getBoundingClientRect();mv.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(mv,cam);
  let first=null;for(const h of ray.intersectObjects(scene.children,true)){const ud=h.object.userData;if(!h.object.visible)continue;if(ud.unit&&!ud.unit.gone&&(ud.unit.team==='p'||ud.unit.seen))return{unit:ud.unit};if(ud.tile&&h.object.parent===hl)return{tile:ud.tile};if(ud.tile&&!first)first=ud.tile}return first?{tile:first}:{}}
function zoomCam(f){camState.zoom=Math.max(.55,Math.min(2.4,camState.zoom*f))}
function rotateCam(d){const from=camState.angle,to=from+d*Math.PI/2;tween(320,k=>camState.angle=from+(to-from)*ease(k))}
const setCtl=()=>{$('#spd').textContent=SAVE.settings.fast?'2×':'1×';$('#snd').textContent=SAVE.settings.sound?'🔊':'🔇'};
$('#spd').onclick=()=>{SAVE.settings.fast=!SAVE.settings.fast;SPD=SAVE.settings.fast?.55:1;persist();setCtl()};
$('#snd').onclick=()=>{SAVE.settings.sound=!SAVE.settings.sound;persist();setCtl();sfx('ui');playMusic(CUR.faction)};setCtl();
$('#rotL').onclick=()=>rotateCam(-1);$('#rotR').onclick=()=>rotateCam(1);$('#zin').onclick=()=>zoomCam(1.2);$('#zout').onclick=()=>zoomCam(1/1.2);
function bindInput(){const cv=renderer.domElement,ptrs=new Map();let drag=null,pinch=null;
  let hold=null;cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===1){drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};clearTimeout(hold);const hx=e.clientX,hy=e.clientY;hold=setTimeout(()=>{if(!drag||drag.moved||ptrs.size!==1)return;const h=pickAt(hx,hy);const html=h.unit?unitTip(h.unit):h.tile?tileTip(h.tile):'';if(html){drag.held=true;showTip(html,hx,hy-10)}},450)}else clearTimeout(hold);
    if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:camState.zoom};drag=null}});
  cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&ptrs.size===2){const[a,b]=[...ptrs.values()];camState.zoom=Math.max(.55,Math.min(2.4,pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));return}
    if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>8){drag.moved=true;clearTimeout(hold)}
      if(drag.moved){camState.follow=null;const s=(cam.top-cam.bottom)/camState.zoom/stage.clientHeight,a=camState.angle,limx=NX/2+2,lim=NZ/2+2;camState.target.x-=(dx*Math.cos(a)+dy*Math.sin(a)*1.4)*s;camState.target.z-=(-dx*Math.sin(a)+dy*Math.cos(a)*1.4)*s;
        camState.target.x=Math.max(-limx,Math.min(limx,camState.target.x));camState.target.z=Math.max(-lim,Math.min(lim,camState.target.z))}drag.x=e.clientX;drag.y=e.clientY}});
  cv.addEventListener('pointerup',e=>{clearTimeout(hold);if(drag&&!drag.moved&&!drag.held&&ptrs.size===1)tap(e.clientX,e.clientY);ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size)drag=null});
  cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null;pinch=null});
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomCam(e.deltaY<0?1.1:1/1.1)},{passive:false})}
const tmpV=new THREE.Vector3(),t00=performance.now();let lastF=performance.now();
function overlayPos(el,u,yOff){tmpV.copy(u.group.position);tmpV.y+=yOff;tmpV.project(cam);el.style.transform=`translate(${(tmpV.x+1)/2*stage.clientWidth}px,${(1-tmpV.y)/2*stage.clientHeight}px) translate(-50%,-100%)`}
function frame(now){requestAnimationFrame(frame);const fdt=Math.min(.1,(now-lastF)/1000);lastF=now;if(document.body.dataset.view!=='game'||!scene)return;const t=(now-t00)/1000,a=camState.angle,tg=camState.target;animateWorld(fdt,t);
  if(camState.follow){const f=camState.follow,fp=f.group?f.group.position:f,wgt=camState.zoom>1.15?1:camState.zoom>.9?.75:.6;tg.x+=(fp.x*wgt-tg.x)*(1-Math.pow(.004,fdt));tg.z+=(fp.z*wgt-tg.z)*(1-Math.pow(.004,fdt))}
  cam.position.set(tg.x+Math.sin(a)*24,tg.y+19,tg.z+Math.cos(a)*24);cam.lookAt(tg);if(camState.shake>0){cam.position.x+=(Math.random()-.5)*camState.shake;cam.position.y+=(Math.random()-.5)*camState.shake;camState.shake=Math.max(0,camState.shake-fdt*.9)}cam.zoom=camState.zoom;cam.updateProjectionMatrix();
  for(const u of units){if(u.gone)continue;if(u.rig){u.rig.setBase(u.down?'Death':(u.ow||(u.crouch||1)<1)?'Duck':'Idle');if(u.group.visible)u.rig.update(fdt/SPD)}else if(u.lie&&u.cls!=='turret'&&u.cls!=='bot'){const cr=u.down?1:(u.crouch||1);u.lie.scale.y+=(cr-u.lie.scale.y)*.25}
    if(u.ow&&!u.down&&!u.owRing){const r=new THREE.Mesh(new THREE.RingGeometry(u.weapon.range-.07,u.weapon.range,80),new THREE.MeshBasicMaterial({color:u.team==='p'?0xffc04a:0xff5a4a,transparent:true,opacity:.4,side:THREE.DoubleSide,depthWrite:false}));r.rotation.x=-Math.PI/2;scene.add(r);u.owRing=r}
    if(u.owRing){if(!u.ow||u.down){scene.remove(u.owRing);u.owRing=null}else{u.owRing.position.set(u.group.position.x,u.group.position.y+.06,u.group.position.z);u.owRing.visible=u.team==='p'||u.seen;u.owRing.material.opacity=.3+.12*Math.sin(t*4)}}}
  for(const u of units){if(u.gone)continue;const hide=u.team==='e'&&(!u.seen||u.down);u.el.style.display=hide?'none':'';if(!hide)overlayPos(u.el,u,u.down?.35:u.cls==='turret'?.85:u.body==='heavy'?1.2:1.16)}
  $('#hud').querySelectorAll('.tg').forEach(l=>overlayPos(l,l._u,1.35));updObjMark();if(now-miniT>250){miniT=now;drawMini()}
  for(const u of units){if(!u.gh)continue;const on=!S.over&&!u.seen&&u.last&&!u.down&&!u.gone;u.gh.style.display=on?'':'none';if(on){const p=W(u.last[0],u.last[1]);tmpV.set(p.x,topY(G[u.last[1]][u.last[0]])+.5,p.z).project(cam);u.gh.style.transform=`translate(${(tmpV.x+1)/2*stage.clientWidth}px,${(1-tmpV.y)/2*stage.clientHeight}px) translate(-50%,-50%)`}}
  if(S.sel&&selRing.visible){selRing.position.copy(S.sel.group.position);selRing.position.y+=.025;selRing.scale.setScalar(1+.06*Math.sin(t*5))}
  for(const m of hl.children)if(m.userData.pulse)m.scale.setScalar(1+.08*Math.sin(t*6));
  if(S.itemMesh)S.itemMesh.rotation.y=t*1.5;
  renderer.render(scene,cam)}

setFaction('resistance');viewTitle();
if('serviceWorker' in navigator&&location.protocol==='https:'&&/github\.io$/.test(location.hostname)){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
window.ARKSIDE={MUS,moveAlong,advanceObj,camState,pickAt,get scene(){return scene},select,refresh,place,computeVis,get S(){return S},get units(){return units},get G(){return G},get cam(){return cam},tap,enemyTurn,endPlayerTurn,hitChance,startMission,MISSIONS,SAVE:()=>SAVE,viewBrief,CUR};
