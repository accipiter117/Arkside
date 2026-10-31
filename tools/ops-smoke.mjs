// Operations smoke test at 390x800: open a campaign, start each operation
// from the Operations section, play a few turns (squad shoots or goes on
// overwatch, then the enemy and the escort bot move), and fail on any
// console error. Saves shots/ops-<id>.png.
//
//   node tools/ops-smoke.mjs [--animated] [--turns N]
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), ANIM = args.includes('--animated');
const TURNS = +(args[args.indexOf('--turns') + 1] || 0) || 3;
fs.mkdirSync(path.join(ROOT, 'shots'), {recursive: true});
const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const errors = [];
try {
  for (const faction of ['resistance', 'security']) {
    const page = await newPage();
    page.on('console', m => { if (m.type() === 'error') errors.push(`[${faction}] ${m.text()}`) });
    page.on('pageerror', e => errors.push(`[${faction}] ${e.message}`));
    await page.goto(url + 'index.html');
    await page.waitForFunction(() => window.ARKSIDE, null, {timeout: 20000});
    await page.evaluate(a => { SAVE.settings.sound = false; SAVE.settings.units = a ? 'animated' : 'classic' }, ANIM);
    await page.click(`.fac.${faction}`);
    const ids = await page.$$eval('.mis.op', b => b.map(x => x.dataset.op));
    if (!ids.length) throw new Error(`no Operations section on the ${faction} campaign`);
    for (const id of ids) {
      if (!(await page.isVisible(`.mis.op[data-op="${id}"]`))) await page.click('#v-camp .bk, #v-camp .btn.ghost');
      await page.click(`.mis.op[data-op="${id}"]`);
      await page.click('#deploy');
      await page.waitForFunction(() => ARKSIDE.units.length > 0, null, {timeout: 20000});
      await page.waitForTimeout(1200);
      if (faction === 'resistance') await page.screenshot({path: path.join(ROOT, 'shots', `ops-${id}.png`)});
      const res = await page.evaluate(async turns => {
        SPD = .2;
        for (let t = 0; t < turns && !ARKSIDE.S.over; t++) {
          for (const u of squad().filter(p => !p.down)) {
            if (ARKSIDE.S.over) break;
            let best = null;
            for (const e of living('e')) { if (!canSee('p', e)) continue; const c = hitChance(u, e); if (c && (!best || c > best.c)) best = {e, c} }
            if (best) await shoot(u, best.e); else u.ow = true;
            u.acted = u.moved = true;
          }
          if (!ARKSIDE.S.over) await endPlayerTurn();
        }
        return `${M.title}: turn ${ARKSIDE.S.turn}, ${living('e').length} enemies, ${squad().filter(p => !p.down).length} squad up${ARKSIDE.S.over ? ' (ended)' : ''}`;
      }, TURNS);
      console.log(`${faction.padEnd(11)} ${res}`);
      await page.evaluate(() => { ARKSIDE.S.over = true; viewCamp() });
    }
    await page.close();
  }
} catch (e) { errors.push('FAILED: ' + e.message.split('\n')[0]) }
finally { await browser.close(); close() }
if (errors.length) { console.error('Errors:\n' + errors.join('\n')); process.exit(1) }
console.log(`OPS SMOKE PASSED (${ANIM ? 'animated' : 'classic'} units, ${TURNS} turns)`);
