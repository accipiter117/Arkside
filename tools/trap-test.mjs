// Traps and interactive points test: injects one of each into Dry Docks,
// triggers them, and checks their effects. Fails on console errors.
//   node tools/trap-test.mjs
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const p = await newPage();
const errs = [];p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });p.on('pageerror', e => errs.push(e.message));
await p.goto(url + 'index.html');await p.waitForFunction(() => window.ARKSIDE);
const res = await p.evaluate(async () => {
  SAVE.settings.sound = false; SPD = .1; setFaction('resistance'); CUR.mi = 0;
  const m = MISSIONS.resistance[0], keep = {points:m.points, traps:m.traps};
  // free ground tiles near the middle
  const free = []; for (let z = 3; z < 10; z++) for (let x = 2; x < 10; x++) if (m.map[z][x] === '.' && (!m.h || m.h[z][x] === '0')) free.push([x, z]);
  const F = i => free[i % free.length];
  m.traps = [{type:'barrels', x:F(0)[0], z:F(0)[1]}, {type:'steam', x:F(5)[0], z:F(5)[1], line:[F(6),F(7)]}, {type:'shutter', x:F(10)[0], z:F(10)[1], tiles:[F(11)]}];
  m.points = [{type:'supply', x:F(14)[0], z:F(14)[1]}, {type:'hatch', x:F(16)[0], z:F(16)[1], ladder:F(17)}];
  viewBrief(); document.querySelector('#deploy').click();
  for (let i = 0; i < 100 && !ARKSIDE.units.length; i++) await new Promise(r => setTimeout(r, 50));
  m.points = keep.points; m.traps = keep.traps;
  const out = {}, u = squad()[0];
  // an enemy next to the barrels, then set them off
  const b = S.traps[0], e = living('e').find(x => x.cls !== 'turret'); const n1 = mechFreeNear(b); e.x = n1.x; e.z = n1.z; place(e); const hp0 = e.hp;
  await trapFire(b, u); out.barrels = `used ${b.used}, enemy hp ${hp0}->${e.hp}`;
  const st = S.traps[1]; await trapFire(st, u); out.steam = `hazards ${S.hazards.length}, smoke ${G[st.line[0][1]][st.line[0][0]].smoke}`;
  const sh = S.traps[2]; await trapFire(sh, u); out.shutter = `tile blocked ${!!G[sh.tiles[0][1]][sh.tiles[0][0]].obj}`;
  // supply: stand next to it and heal
  const sp = S.points[0], ns = mechFreeNear(sp); u.x = ns.x; u.z = ns.z; place(u); u.hp = 40; u.acted = false;
  const acts = mechActions(u); out.supplyActions = acts.map(a => a.label).join(', ');
  await mechDo(u, acts.find(a => a.a === 'heal')); out.supply = `hp ${u.hp}, used ${sp.used}`;
  // hatch: two units of work drops a ladder
  const ha = S.points[1], nh = mechFreeNear(ha); const v = squad()[1]; v.x = nh.x; v.z = nh.z; place(v);
  for (let i = 0; i < 2; i++) { v.acted = false; const a = mechActions(v).find(x => x.k === 'pt'); if (a) await mechDo(v, a) }
  out.hatch = `ladder ${!!G[ha.ladder[1]][ha.ladder[0]].ladder}`;
  // hazards tick away over two enemy turns
  for (let i = 0; i < 2; i++) { mechTurnTick('p'); mechTurnTick('e') } out.hazardsAfter = S.hazards.length;
  return out});
await browser.close(); close();
for (const k in res) console.log(k.padEnd(14), res[k]);
const ok = /used true/.test(res.barrels) && !/hp (\d+)->\1$/.test(res.barrels) && res.steam.startsWith('hazards 1, smoke true') && res.shutter === 'tile blocked true' && /hp 70/.test(res.supply) && res.hatch === 'ladder true' && res.hazardsAfter === 0 && !errs.length;
if (errs.length) console.error(errs);
console.log(ok ? '\nTRAP TEST PASSED' : '\nTRAP TEST FAILED'); process.exit(ok ? 0 : 1);
