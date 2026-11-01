// Frame-rate and draw-call check with every unit on screen.
//
//   node tools/perf.mjs              # Lockdown, all units on screen, High vs Low
//   node tools/perf.mjs --mission r4
//
// Headless Chromium renders with SwiftShader (on the CPU), so absolute frame
// rates are far below a phone's. Compare the numbers between modes, and use
// draw calls and triangles as the device-independent measure.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from './serve.mjs';
import {launch} from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i+1] : null };
const MID = opt('--mission') || 's4';
const {url, close} = await serve(ROOT);
const {browser, newPage} = await launch();
const rows = [];
try {
  for (const units of ['animated']) for (const gfx of ['high', 'low']) {
    const page = await newPage({deviceScaleFactor:2});
    await page.goto(url + 'index.html');
    await page.waitForFunction(()=>window.ARKSIDE, null, {timeout:20000});
    const r = await page.evaluate(async ([units, gfx, mid]) => {
      SAVE.settings.sound = false; SAVE.settings.gfx = gfx; SAVE.settings.units = units; if (units === 'animated') await RIG.wait(8000);
      const f = mid[0] === 's' ? 'security' : 'resistance'; setFaction(f); CUR.mi = +mid[1] - 1; viewBrief();
      document.querySelector('#deploy').click();
      for (let i = 0; i < 100 && !ARKSIDE.units.length; i++) await new Promise(r=>setTimeout(r, 50));
      // Reveal everyone and frame the whole board.
      ARKSIDE.S.over = true; applyFog(); ARKSIDE.camState.target.set(0, 0, 0); ARKSIDE.camState.zoom = .8;
      for (const u of ARKSIDE.units) if (u.rig) u.rig.play('Idle');
      await new Promise(r=>setTimeout(r, 1500));
      let n = 0; const t0 = performance.now(); await new Promise(res => { const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res() }; requestAnimationFrame(f) });
      const fps = n / ((performance.now() - t0) / 1000);
      renderer.info.autoReset = true; await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const i = {...renderer.info.render};
      // Same frame without units, to separate unit cost from the scene.
      for (const u of ARKSIDE.units) u.group.visible = false;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const e = renderer.info.render, nu = ARKSIDE.units.filter(u=>!u.gone).length;
      return {units, gfx, onScreen: nu, fps: Math.round(fps * 10) / 10, calls: i.calls, tris: i.triangles, unitCalls: Math.round((i.calls - e.calls) / nu), unitTris: Math.round((i.triangles - e.triangles) / nu)};
    }, [units, gfx, MID]);
    rows.push(r); console.log(JSON.stringify(r));
    await page.close();
  }
} finally { await browser.close(); close() }
console.log('\nunits     gfx   units  fps    draw calls  triangles  per unit: calls  triangles');
for (const r of rows) console.log(`${r.units.padEnd(9)} ${r.gfx.padEnd(5)} ${String(r.onScreen).padEnd(6)} ${String(r.fps).padEnd(6)} ${String(r.calls).padEnd(11)} ${String(r.tris).padEnd(10)} ${String(r.unitCalls).padEnd(16)} ${r.unitTris}`);
console.log('(High includes the shadow pass, so each unit is drawn twice.)');
