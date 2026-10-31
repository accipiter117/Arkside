// Phone-size screenshots for visual review (390x800, 2x pixel ratio).
//
//   node tools/screens.mjs                    # -> shots/*.png
//   node tools/screens.mjs --out some/dir     # elsewhere
//   node tools/screens.mjs --mission s3       # in-mission view of another mission
//   node tools/screens.mjs --low              # Low graphics
//
// Saves: title, campaign, briefing, mission start, and a close-up of the squad.
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i+1] : null };
const OUT = path.resolve(opt('--out') || path.join(ROOT, 'shots'));
const MID = opt('--mission') || 'r1';
const LOW = args.includes('--low');
fs.mkdirSync(OUT, {recursive:true});

const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const errors = [];
try {
  const page = await newPage();
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()) });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + 'index.html');
  await page.waitForFunction(()=>window.ARKSIDE, null, {timeout:20000});
  await page.evaluate(low => { SAVE.settings.sound = false; SAVE.settings.gfx = low ? 'low' : 'high' }, LOW);
  const snap = async name => { await page.screenshot({path: path.join(OUT, name + '.png')}); console.log('saved', path.join(OUT, name + '.png')) };

  await page.waitForTimeout(400); await snap('1-title');
  const faction = MID[0] === 's' ? 'security' : 'resistance', mi = +MID[1] - 1;
  await page.evaluate(([f, mi]) => { setFaction(f); SAVE.prog[f] = Math.max(SAVE.prog[f], mi); viewCamp() }, [faction, mi]);
  await page.waitForTimeout(300); await snap('2-campaign');
  await page.evaluate(mi => { CUR.mi = mi; viewBrief() }, mi);
  await page.waitForTimeout(300); await snap('3-briefing');
  await page.click('#deploy');
  await page.waitForFunction(()=>ARKSIDE.units.length > 0);
  await page.waitForTimeout(2500); await snap('4-mission');
  // Zoom on the selected squad member to judge unit models.
  await page.evaluate(() => { const u = ARKSIDE.S.sel; if (u) { const p = u.group.position; ARKSIDE.camState.target.set(p.x, p.y, p.z) } ARKSIDE.camState.zoom = 2.4 });
  await page.waitForTimeout(1200); await snap('5-squad-closeup');
} finally { await browser.close(); close() }
if (errors.length) { console.error('Console errors:\n' + errors.join('\n')); process.exit(1) }
