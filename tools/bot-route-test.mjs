// Escort bot and friendly turrets: the bot passes through its own side's
// turrets, nothing can be built on its route, Engineers can dismantle their
// own turrets and barricades, and an enemy on the route still stops it.
// Covers Container City Push (bot is yours) and Hold (bot is the enemy's).
//   node tools/bot-route-test.mjs
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const p = await newPage();
const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) }); p.on('pageerror', e => errs.push(e.message));
await p.goto(url + 'index.html'); await p.waitForFunction(() => window.ARKSIDE);
const res = await p.evaluate(async () => {
  const out = {};
  const start = async op => { SAVE.settings.sound = false; SAVE.opProg = {resistance: 9, security: 9}; SPD = .05; setFaction('resistance'); CUR.mi = -1; CUR.op = op; viewBrief(); document.querySelector('#deploy').click();
    for (let i = 0; i < 100 && !ARKSIDE.units.length; i++) await new Promise(r => setTimeout(r, 50)); await RIG.wait(8000) };
  const clearEnemies = () => { for (const e of living('e')) { e.hp = 0; e.down = true; e.gone = true; e.group.visible = false; if (e.el) e.el.remove() } };
  const toEscort = async () => { const o = curObj(); if (o.targets) for (const [x, z] of o.targets) S.prog[key(x, z)] = o.need; clearEnemies(); advanceObj(); await new Promise(r => setTimeout(r, 200)); clearEnemies() };
  const park = (u, x, z) => { u.x = x; u.z = z; place(u) };
  const freeNear = (x, z, avoid) => { for (const [dx, dz] of [[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]) { const t = tileAt(x+dx, z+dz); if (t && t.type === 'floor' && !t.obj && !unitAt(t.x, t.z) && !avoid.has(key(t.x, t.z))) return t } };
  const turretAt = (team, x, z) => { if (team === 'e') return spawnEnemy('turret', x, z, S.R); const tu = newUnit({team:'p', name:'Turret', short:'Turret', cls:'turret', body:'turret', hp:60, maxHp:60, move:0, vis:4, weapon:{...WPN.turret}, x, z}); units.push(tu); makeUnitMesh(tu); return tu };

  // ---------- Push: the bot is yours ----------
  await start('x1'); await toEscort();
  const o = curObj(), b = S.bot, route = botRoute(); out.stage = `${M.stages[S.stage].name}, bot at ${b.x},${b.z} step ${b.step}`;
  const [nx, nz] = o.path[b.step + 1];
  // "old save": a friendly turret already sitting on the next route tile
  const tu = turretAt('p', nx, nz);
  for (const q of squad()) park(q, 1, 32); const esc = squad()[0]; const side = freeNear(b.x, b.z, route); park(esc, side.x, side.z);
  const s0 = b.step; await moveBot(); out.passThrough = `step ${s0} -> ${b.step}, turret still there ${!tu.gone && units.includes(tu)}`;
  // friendly units pass through the turret but can't stop on it
  // (sideways across the turret's tile, as the bot now stands beyond it)
  park(esc, tu.x + 1, tu.z); const r = reach(esc, 4); const beyond = key(tu.x - 1, tu.z);
  out.friendlyPass = `turret tile reachable ${r.d.has(key(tu.x, tu.z))}, tile beyond reachable ${r.d.has(beyond)}, path goes via turret ${pathTo(r, tu.x - 1, tu.z).some(([x, z]) => x === tu.x && z === tu.z)}`;
  // can't build on the route
  const eng = squad()[1]; eng.cls = 'engineer'; eng.perks = new Set(); eng.cd = {}; eng.acted = false;
  const [rx, rz] = o.path[b.step + 3]; const spot = freeNear(rx, rz, route); park(eng, spot.x, spot.z);
  const tg = abilityTargets(eng, 'turret'), bl = buildBlocked(eng);
  out.noBuild = `turret targets include route tile ${tg.some(t => t.x === rx && t.z === rz)}, greyed as blocked ${bl.some(t => t.x === rx && t.z === rz)}, tip "${tileTip(G[rz][rx]).replace(/<[^>]+>/g, ' ').trim().slice(0, 60)}"`;
  // dismantle the turret
  const near = freeNear(tu.x, tu.z, new Set()); park(eng, near.x, near.z); eng.acted = false;
  const dt = abilityTargets(eng, 'dismantle'); out.dismantleTargets = dt.length;
  await doAbility(eng, 'dismantle', G[tu.z][tu.x]); out.dismantle = `turret gone ${tu.gone}, engineer acted ${eng.acted}`;
  // an enemy on the route still stops the bot
  const [ex, ez] = o.path[b.step + 1]; const en = spawnEnemy('trooper', ex, ez, S.R); en.fresh = false; park(esc, side.x, side.z); esc.x = b.x + (side.x - b.x); place(esc);
  const sideNow = freeNear(b.x, b.z, route); park(esc, sideNow.x, sideNow.z); const s1 = b.step; await moveBot(); out.enemyBlocks = `step ${s1} -> ${b.step}`;

  // ---------- Hold: the bot is the enemy's ----------
  await start('x1d'); S.prog[key(5, 24)] = 4; advanceObj(); await new Promise(r => setTimeout(r, 200));
  const b2 = S.bot, o2 = curObj(); out.holdStage = `${M.stages[S.stage].name}, bot team ${b2 && b2.team}, step ${b2 && b2.step}`;
  const [hx, hz] = o2.path[b2.step + 1]; const etu = turretAt('e', hx, hz);
  for (const q of squad()) park(q, 1, 3); const att = living('e').find(e => e.cls !== 'turret' && e.cls !== 'bot'); const r2 = botRoute(); const s2 = freeNear(b2.x, b2.z, r2); park(att, s2.x, s2.z);
  for (const e of living('e')) if (e !== att && e.cls !== 'turret' && e.cls !== 'bot') park(e, 10, 30);
  const h0 = b2.step; await moveBot(); out.holdPassThrough = `enemy bot step ${h0} -> ${b2.step}, enemy turret still there ${!etu.gone}`;
  const peng = squad()[0]; peng.cls = 'engineer'; peng.perks = new Set(); peng.cd = {}; peng.acted = false; const [qx, qz] = o2.path[b2.step + 3]; const ps = freeNear(qx, qz, botRoute()); park(peng, ps.x, ps.z);
  out.holdNoBuild = `player turret targets include route tile ${abilityTargets(peng, 'turret').some(t => t.x === qx && t.z === qz)}`;
  return out });
await browser.close(); close();
for (const k in res) console.log(k.padEnd(18), res[k]);
const ok = /step 0 -> 2, turret still there true/.test(res.passThrough) && /reachable false, tile beyond reachable true, path goes via turret true/.test(res.friendlyPass) && /include route tile false, greyed as blocked true, tip ".*Can’t build/.test(res.noBuild)
  && res.dismantleTargets === 1 && /turret gone true, engineer acted true/.test(res.dismantle) && /step (\d+) -> \1$/.test(res.enemyBlocks) && /step 0 -> 2, enemy turret still there true/.test(res.holdPassThrough) && /include route tile false/.test(res.holdNoBuild) && !errs.length;
if (errs.length) console.error(errs);
console.log(ok ? '\nBOT ROUTE TEST PASSED' : '\nBOT ROUTE TEST FAILED'); process.exit(ok ? 0 : 1);
