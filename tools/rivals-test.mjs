// Rival squads and AI allies test at 390x800. For each faction it plays the
// three campaign operations in a row and checks: the rival roster is
// generated once and kept, four rivals and two militia allies spawn, allies
// act on their own, traits reveal (downing, intel), downed rivals are
// injured and replaced from the bench next time, levels go up, and an old
// save without a rivals field loads cleanly. Fails on any console error.
//
//   node tools/rivals-test.mjs
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const errors = [], notes = [];
const check = (ok, msg) => { if (!ok) errors.push('CHECK FAILED: ' + msg); else notes.push('ok  ' + msg) };
try {
  for (const faction of ['resistance', 'security']) {
    const page = await newPage();
    page.on('console', m => { if (m.type() === 'error') errors.push(`[${faction}] ${m.text()}`) });
    page.on('pageerror', e => errors.push(`[${faction}] ${e.message}`));
    await page.goto(url + 'index.html');
    await page.waitForFunction(() => window.ARKSIDE, null, {timeout: 20000});
    await page.evaluate(() => { SAVE.settings.sound = false; SAVE.settings.units = 'animated'; SAVE.opProg = {resistance: 9, security: 9} });
    await page.click(`.fac.${faction}`);
    // Roster generated on the campaign screen.
    const roster = await page.evaluate(f => { const R = SAVE.rivals[f]; return {n: R ? R.members.length : 0, cls: R ? [...new Set(R.members.map(r => r.cls))].length : 0, cards: document.querySelectorAll('#v-camp .rboard .rc').length, unknown: document.querySelectorAll('#v-camp .rboard .tr:not(.known)').length, name: R && R.name} }, faction);
    check(roster.n === 6 && roster.cls === 4, `${faction}: roster has six rivals covering four classes (${roster.name})`);
    check(roster.cards === 6 && roster.unknown === 6, `${faction}: Rivals board shows six cards, all "Trait ?"`);
    const firstIds = await page.evaluate(f => SAVE.rivals[f].members.map(r => r.id).join(','), faction);
    let downedId = null, beforeLvls = null;
    const ops = await page.evaluate(f => CAMPAIGN[f], faction);
    for (let i = 0; i < ops.length; i++) {
      const id = ops[i];
      if (!(await page.isVisible(`.mis.op[data-op="${id}"]`))) await page.click('#v-camp .bk, #v-camp .btn.ghost');
      await page.click(`.mis.op[data-op="${id}"]`);
      const brief = await page.$$eval('#v-brief .rv-brief div', d => d.map(x => x.textContent));
      check(brief.length === 2 && /^Rivals: /.test(brief[0]) && /Grunts: \d+/.test(brief[1]), `${faction} op ${i + 1}: briefing has the two rival lines (${brief.join(' / ')})`);
      if (i === 1) check(brief[1].includes('injured'), `${faction} op 2: briefing names the injured rival`);
      await page.click('#deploy');
      await page.waitForFunction(() => ARKSIDE.units.length > 0, null, {timeout: 20000});
      await page.waitForTimeout(800);
      const sp = await page.evaluate(() => ({on: S.rivalsOn, rivals: units.filter(u => u.rival && !u.gone).map(u => u.rival.id), tags: units.filter(u => u.rival).every(u => u.el && u.el.classList.contains('rival') && u.el.textContent.includes(u.name)), allies: units.filter(u => u.ally && !u.gone).length, allyTags: units.filter(u => u.ally).every(u => u.el && u.el.classList.contains('ally')), intel: (S.intel || []).length, grunts: living('e').filter(e => !e.rival && e.cls !== 'bot').length}));
      check(sp.on && sp.rivals.length === 4, `${faction} op ${i + 1}: four rivals deployed (${sp.rivals.join(',')})`);
      check(sp.tags, `${faction} op ${i + 1}: rivals carry name tags with the rival marker`);
      check(sp.allies === 2 && sp.allyTags, `${faction} op ${i + 1}: two militia allies spawned`);
      check(sp.intel === 2, `${faction} op ${i + 1}: two intel pickups placed`);
      check(sp.grunts >= 3, `${faction} op ${i + 1}: grunts fill out the force (${sp.grunts})`);
      if (i === 1) {
        check(!sp.rivals.includes(downedId), `${faction} op 2: the injured rival ${downedId} sat out`);
        const benchIn = await page.evaluate(ids => ids.some(id => !window.__dep1.includes(id)), sp.rivals);
        check(benchIn, `${faction} op 2: a bench rival was deployed in their place`);
      }
      if (i === 2) check(sp.rivals.includes(downedId), `${faction} op 3: ${downedId} returned after sitting out`);
      if (i === 0) await page.evaluate(ids => { window.__dep1 = ids }, sp.rivals);
      // Play: squad shoots rivals first, allies are counted when they shoot or move.
      const res = await page.evaluate(async i => {
        SPD = .2; let allyActs = 0;
        const orig = allyAct; allyAct = async a => { const x = a.x, z = a.z, hp = living('e').reduce((s, e) => s + e.hp, 0); await orig(a); if (a.x !== x || a.z !== z || living('e').reduce((s, e) => s + e.hp, 0) !== hp) allyActs++ };
        let downed = null, intelHit = false, revealedBefore = living('e').filter(e => e.rival && e.rival.revealed).length;
        for (let t = 0; t < 4 && !S.over; t++) {
          for (const u of squad().filter(p => !p.down)) {
            if (S.over) break;
            let best = null;
            for (const e of living('e')) { if (!canSee('p', e)) continue; const c = hitChance(u, e) + (e.rival ? 100 : 0); if (c && (!best || c > best.c)) best = {e, c} }
            if (best) await shoot(u, best.e); else u.ow = true;
            u.acted = u.moved = true;
          }
          if (t === 1 && !S.over) {
            // Guarantee one downing and one intel pickup so the follow-on rules can be tested.
            const r = living('e').find(e => e.rival); const p = squad().find(p => !p.down);
            if (r && p) { damage(r, 999, p); downed = r.rival.id }
            const it = (S.intel || []).find(t => t.intel); if (it && p) { rivalIntel(p, it); intelHit = !it.intel }
          }
          if (!S.over) await endPlayerTurn();
        }
        const revealed = SAVE.rivals[CUR.faction].members.filter(r => r.revealed).length;
        const out = {turn: S.turn, allyActs, downed, intelHit, revealedGain: revealed - revealedBefore, downedSet: downed ? S.rivalDowned.has(downed) : false, nemesis: downed ? !!SAVE.rivals[CUR.faction].members.find(r => r.id === downed).nemesis : false, over: S.over};
        if (!S.over) endMission(true, 'test');
        return out;
      }, i);
      check(res.allyActs > 0, `${faction} op ${i + 1}: allies acted on their own (${res.allyActs} actions over ${res.turn} turns)`);
      check(res.downed && res.downedSet && res.nemesis, `${faction} op ${i + 1}: downing ${res.downed} recorded them and their nemesis`);
      check(res.intelHit && res.revealedGain >= 1, `${faction} op ${i + 1}: traits revealed by downing and intel (+${res.revealedGain})`);
      if (i === 0) downedId = res.downed;
      await page.waitForSelector('#v-debrief:not([hidden]) .rv-brief', {timeout: 8000});
      const after = await page.evaluate(d => { const R = SAVE.rivals[CUR.faction]; const r = R.members.find(r => r.id === d); return {injured: r && r.injured, lvls: R.members.map(r => r.lvl), xp: R.members.map(r => r.xp), debrief: document.querySelectorAll('#v-debrief .rv-brief div').length, benchXp: R.members.filter(r => !S.rivalIds.includes(r.id)).every(r => r.xp > 0), ids: R.members.map(r => r.id).join(',')} }, res.downed);
      check(after.injured === true, `${faction} op ${i + 1}: ${res.downed} is injured for the next operation`);
      check(after.debrief >= 1, `${faction} op ${i + 1}: debrief lists rival lines (${after.debrief})`);
      check(after.xp.every(x => x > 0) && after.benchXp, `${faction} op ${i + 1}: every rival earned XP (bench half)`);
      check(after.ids === firstIds, `${faction} op ${i + 1}: same six rivals kept for the whole campaign`);
      if (i === 0) beforeLvls = after.lvls;
      if (i === ops.length - 1) check(Math.max(...after.lvls) > 1 && after.lvls.some((l, k) => l > beforeLvls[k]), `${faction}: rivals levelled up over the campaign (${after.lvls.join(',')})`);
      await page.evaluate(() => { viewCamp() });
      const greyed = await page.evaluate(() => document.querySelectorAll('#v-camp .rboard .rc.inj').length);
      check(greyed >= 1, `${faction} op ${i + 1}: injured rival greyed on the Rivals board`);
    }
    // Old save: strip the rivals field and reload.
    await page.evaluate(() => { const v = JSON.parse(localStorage.getItem('arkside.campaign.v1')); delete v.rivals; localStorage.setItem('arkside.campaign.v1', JSON.stringify(v)) });
    await page.reload();
    await page.waitForFunction(() => window.ARKSIDE, null, {timeout: 20000});
    await page.click(`.fac.${faction}`);
    const old = await page.evaluate(f => ({has: !!(SAVE.rivals && SAVE.rivals[f] && SAVE.rivals[f].members.length === 6), cards: document.querySelectorAll('#v-camp .rboard .rc').length}), faction);
    check(old.has && old.cards === 6, `${faction}: old save without rivals loads and generates a roster`);
    await page.screenshot({path: path.join(ROOT, 'shots', `rivals-${faction}.png`)});
    await page.close();
  }
} catch (e) { errors.push('FAILED: ' + e.message.split('\n')[0]) }
finally { await browser.close(); close() }
console.log(notes.join('\n'));
if (errors.length) { console.error('Errors:\n' + errors.join('\n')); process.exit(1) }
console.log('RIVALS TEST PASSED');
