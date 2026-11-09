// Movement-rule test: builds a small test map with a ladder, a climb step,
// a vault rail, gaps (plain and marked), a two-level wall and a zipline,
// then checks what each body type can reach and what it costs, against the
// table in src/mechanics.js. No browser rendering needed beyond the page.
//
//   node tools/mech-test.mjs
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const p = await newPage();
const errs = [];p.on('pageerror', e => errs.push(e.message));
await p.goto(url + 'index.html');await p.waitForFunction(() => window.ARKSIDE);
const res = await p.evaluate(() => {
  // row 0: start . ladder(level 1)          row 2: start . step(level 1)
  // row 4: start rail land                   row 6: start gap land   row 8: start marked-gap land
  // row 10: start wall(level 2)              row 12: zip start ... zip end
  // row 14: barricade   row 16: sheet wall   row 18: three-level drop   row 20: ledge grab (gap, landing a level up)   row 22: plain one-level climb (mantle)
  const m = {map:[
    '.........','.........','.........','.........','.........','.........','.........','.........','.........','.........','.........','.........','.........',
    '.........','..w......','.........','..F......','.........','.........','.........','.........','.........','.........','.........','.........','.........','.........'],
   h:[
    '002000000','000000000','002000000','000000000','000000000','000000000','000000000','000000000','000000000','000000000','004000000','000000000','000000000',
    '000000000','000000000','000000000','000000000','000000000','060000000','000000000','000200000','000000000','002000000','000000000','000000000','000000000','004000000'],
   feat:[
    '..L......','.........','..s......','.........','..r......','.........','.._......','.........','..=......','.........','.........','.........','.........',
    '.........','.........','.........','.........','.........','.........','.........','.._......','.........','.........','.........','.........','.........','.........'],
   zips:[[1,12,7,12]],vents:[[1,24,7,24]],winches:[[1,26,2,26]]};
  S = {zips:[]}; units = []; parseMap(m);
  const U = b => ({x:1,z:0,body:b,move:9,perks:new Set(),team:'p'});
  const cost = (b, sx, sz, tx, tz) => {const u = U(b);u.x = sx;u.z = sz;const r = reach(u, 9);const k = key(tx, tz);return r.d.has(k) ? r.d.get(k) + (r.kind.get(k) ? ' ' + r.kind.get(k) : '') : 'no'};
  const out = {};
  for (const b of ['light','medium','heavy']) out[b] = {
    ladder:cost(b,1,0,2,0), step:cost(b,1,2,2,2), vault:cost(b,1,4,3,4), gap:cost(b,1,6,3,6), markedGap:cost(b,1,8,3,8), wallHop:cost(b,1,10,2,10), zip:cost(b,1,12,7,12), dropFromLadder:cost(b,2,0,3,0),
    barricade:cost(b,1,14,2,14), sheet:cost(b,1,16,2,16), drop3:cost(b,1,18,2,18), ledgeGrab:cost(b,1,20,3,20), climb1:cost(b,1,22,2,22),vent:cost(b,1,24,7,24),winch:cost(b,1,26,2,26)};
  return out});
await browser.close(); close();
// expected, from the table (cost to reach the far tile; jumps include the landing step)
const want = {
  light:{ladder:1,step:1,vault:'2 vault',gap:'2 jump',markedGap:'2 jump',wallHop:2,zip:'1 zip',dropFromLadder:1,barricade:'no',sheet:'no',drop3:1,ledgeGrab:'2 jump',climb1:1,vent:'1 vent',winch:'1 winch'},
  medium:{ladder:1,step:1,vault:'3 vault',gap:'3 jump',markedGap:'2 jump',wallHop:3,zip:'1 zip',dropFromLadder:1,barricade:'no',sheet:'no',drop3:1,ledgeGrab:'4 jump',climb1:2,vent:'round',winch:'1 winch'},
  heavy:{ladder:2,step:2,vault:'round',gap:'round',markedGap:'round',wallHop:'no',zip:'round',dropFromLadder:1,barricade:2,sheet:2,drop3:'no',ledgeGrab:'round',climb1:2,vent:'round',winch:'no'}};
// 'round': not allowed directly, so the unit walks round the open test map
// (any plain cost, no jump, vault or zip).
let bad = 0;
for (const b in want) for (const k in want[b]) { const got = String(res[b][k]); const ok = want[b][k]==='round' ? /^\d+$/.test(got) && +got >= 4 : got === String(want[b][k]); if (!ok) bad++; console.log(`${ok?'ok  ':'FAIL'} ${b.padEnd(6)} ${k.padEnd(15)} got ${got.padEnd(8)} want ${want[b][k]}`) }
if (errs.length) { console.error(errs); bad++ }
console.log(bad ? `\nMECH TEST FAILED (${bad})` : '\nMECH TEST PASSED'); process.exit(bad ? 1 : 0);
