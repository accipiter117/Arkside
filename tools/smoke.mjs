// Smoke test: load index.html, start every mission in both campaigns, play a
// few turns (squad shoots or goes on overwatch, then the enemy moves) and fail
// on any console error or uncaught exception.
//
//   node tools/smoke.mjs            # all 8 missions, 3 turns each, high graphics
//   node tools/smoke.mjs --low      # same on Low graphics
//   node tools/smoke.mjs --turns 5  # more turns per mission
//
// Needs Playwright (preinstalled in the cloud environment; locally: npm i -g playwright).
// See tools/browser.mjs for how the three.js CDN is handled in sandboxes.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const LOW = args.includes('--low');
const TURNS = +(args[args.indexOf('--turns')+1] || 0) || 3;
const PAGE = args.find(a=>a.endsWith('.html')) || 'index.html';

const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const errors = [];
let failed = false;

const JOBS = [];
for (const faction of ['resistance','security']) for (let mi = 0; mi < 4; mi++) JOBS.push([faction, mi]);
const PAR = +(process.env.ARK_PAR || 4);
const lines = {};

async function run([faction, mi]) {
      const page = await newPage({deviceScaleFactor:1});
      const tag = `${faction} ${mi+1}`;
      page.on('console', m => { if (m.type()==='error') errors.push(`[${tag}] console: ${m.text()}`) });
      page.on('pageerror', e => errors.push(`[${tag}] exception: ${e.message}`));
      await page.goto(url + PAGE);
      await page.waitForFunction(()=>window.ARKSIDE, null, {timeout:20000});
      const title = await page.evaluate(async ([faction, mi, low, turns])=>{
        SAVE.settings.fast = true; SPD = .2; SAVE.settings.sound = false; SAVE.settings.gfx = low ? 'low' : 'high';
        setFaction(faction); CUR.mi = mi; viewBrief();
        document.querySelector('#deploy').click();
        const S0 = ARKSIDE.S; if (!S0 || !ARKSIDE.units.length) throw new Error('mission did not start');
        for (let t = 0; t < turns && !ARKSIDE.S.over; t++) {
          // Simple squad behaviour: shoot the best visible target, otherwise overwatch.
          for (const u of squad().filter(p=>!p.down)) {
            if (ARKSIDE.S.over) break;
            let best = null;
            for (const e of living('e')) { if (!canSee('p', e)) continue; const c = hitChance(u, e); if (c && (!best || c > best.c)) best = {e, c}; }
            if (best) await shoot(u, best.e); else u.ow = true;
            u.acted = u.moved = true;
          }
          if (!ARKSIDE.S.over) await endPlayerTurn();
          await new Promise(r=>setTimeout(r, 50));
        }
        return `${M.title}: turn ${ARKSIDE.S.turn}, ${living('e').length} enemies, ${squad().filter(p=>!p.down).length} squad up${ARKSIDE.S.over?' (mission ended)':''}`;
      }, [faction, mi, LOW, TURNS]).catch(e=>{ errors.push(`[${tag}] ${e.message.split('\n')[0]}`); return 'FAILED'; });
      lines[tag] = `${tag.padEnd(14)} ${title}`; console.log(lines[tag]);
      await page.close();
}

try {
  const queue = [...JOBS];
  await Promise.all(Array.from({length:PAR}, async () => { while (queue.length) await run(queue.shift()); }));
} finally {
  await browser.close(); close();
}

if (errors.length) { console.error('\nErrors:\n' + errors.join('\n')); failed = true; }
console.log(failed ? '\nSMOKE FAILED' : `\nSMOKE PASSED (${LOW?'low':'high'} graphics, ${TURNS} turns per mission)`);
process.exit(failed ? 1 : 0);
