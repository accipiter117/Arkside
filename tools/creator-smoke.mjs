// In-game Operative Creator test at phone size (390x800): recruit an
// operative, edit one (name, class, sniper rifle), dismiss one, then start a
// mission with the recruit in the squad. Fails on any console error.
// Screenshots go to shots/creator-*.png and shots/roster.png.
//
//   node tools/creator-smoke.mjs [--dark]
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'shots'); fs.mkdirSync(OUT, {recursive:true});
const ANIM = process.argv.includes('--animated'), DARK = process.argv.includes('--dark');
const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const errors = [], log = m => console.log('  ' + m);
let ok = false;
try {
  const page = await newPage({colorScheme: DARK ? 'dark' : 'light'});
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + 'index.html');
  await page.waitForFunction(() => window.ARKSIDE, null, {timeout: 20000});
  await page.evaluate(a => { SAVE.settings.sound = false; SAVE.settings.units = 'animated' }, ANIM);
  const snap = async n => { await page.waitForTimeout(350); await page.screenshot({path: path.join(OUT, n + '.png')}) };
  const count = () => page.evaluate(() => SAVE.roster[CUR.faction].length);

  await page.click('.fac.resistance'); await page.click('#v-camp button:has-text("Roster")');
  const n0 = await count(); log(`roster starts with ${n0}`);

  // Recruit
  await page.click('.crt-recruit'); await page.waitForSelector('#v-creator:not([hidden]) #crtPv');
  await page.fill('#crtName', 'Testa'); await page.fill('#crtCall', 'Smoke');
  await page.click('.crt-card[data-k="body"][data-v="medium"]');
  await page.click('.crt-chip[data-k="weapon"][data-v="sniper"]');
  await snap('creator-role');
  for (const t of ['face', 'hair', 'gear']) { await page.click(`[data-tab="${t}"]`); await page.locator('#crtPanel button').nth(1).click(); await snap('creator-' + t) }
  await page.click('[data-crt="rand"]'); await page.click('[data-tab="role"]'); await page.fill('#crtName', 'Testa');
  await page.click('[data-crt="save"]');
  if (await count() !== n0 + 1) throw new Error('recruit did not join the roster');
  const recruit = await page.evaluate(() => SAVE.roster[CUR.faction].at(-1));
  log(`recruited ${recruit.name}, ${recruit.body} ${recruit.cls} with ${recruit.weapon}, level ${Math.floor(recruit.xp)} xp`);

  // Edit the first operative: body is locked, name/class/weapon change.
  const first = await page.evaluate(() => SAVE.roster[CUR.faction][0]);
  await page.locator('[data-edit]').first().click(); await page.waitForSelector('#crtName');
  const locked = await page.locator('.crt-card[data-k="body"]:disabled').count();
  await page.fill('#crtName', 'Edited'); await page.click('.crt-card[data-k="cls"][data-v="medic"]');
  await page.click('[data-crt="save"]');
  const after = await page.evaluate(id => SAVE.roster[CUR.faction].find(o => o.id === id), first.id);
  if (after.name !== 'Edited' || after.cls !== 'medic' || after.body !== first.body || after.xp !== first.xp) throw new Error('edit did not save as expected');
  log(`edited ${first.name} -> ${after.name}, medic, body ${after.body} kept (${locked} body cards locked), xp kept`);

  // Dismiss the second operative (two taps).
  const second = await page.evaluate(() => SAVE.roster[CUR.faction][1].name);
  const d = page.locator('[data-dismiss]').nth(1); await d.click(); await d.click();
  if (await count() !== n0) throw new Error('dismiss failed');
  log(`dismissed ${second}`); await snap('roster');

  // Reload: saves persist.
  await page.reload(); await page.waitForFunction(() => window.ARKSIDE);
  const persisted = await page.evaluate(() => SAVE.roster.resistance.some(o => o.name === 'Testa'));
  if (!persisted) throw new Error('recruit not saved'); log('recruit survives a reload');

  // Start a mission with the recruit.
  await page.evaluate(a => { SAVE.settings.sound = false; SAVE.settings.units = 'animated'; SPD = .2; setFaction('resistance'); CUR.mi = 0; const r = SAVE.roster.resistance; PICK = [r.at(-1).id, ...r.slice(0, 3).map(o => o.id)]; viewBrief() }, ANIM);
  await page.click('#deploy');
  await page.waitForFunction(() => ARKSIDE.units.length > 0, null, {timeout: 20000});
  const inSquad = await page.evaluate(() => squad().some(u => u.name === 'Testa'));
  if (!inSquad) throw new Error('recruit not in the deployed squad');
  await page.evaluate(async () => { await endPlayerTurn() });
  log('mission started with the recruit and an enemy turn played'); await snap('creator-mission');
  ok = true;
} catch (e) { errors.push('FAILED: ' + e.message) }
finally { await browser.close(); close() }
if (errors.length) { console.error('Errors:\n' + errors.join('\n')); process.exit(1) }
console.log(ok ? 'CREATOR SMOKE PASSED' : 'CREATOR SMOKE FAILED');
