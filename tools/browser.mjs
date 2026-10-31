// Shared Playwright setup for the test tools.
//
// Some sandboxes (including the Claude Code cloud environment) block the
// three.js CDNs. When OFFLINE_CDN is on (the default), requests for the pinned
// r128 files on cdnjs and jsDelivr are answered from the same three@0.128.0
// package fetched once from npm into tools/.cache. Google Fonts is answered
// with empty CSS. The shipped game is unchanged: it still uses the CDNs.
//
// Set ARK_LIVE_CDN=1 to let requests go to the real CDNs instead.
import {createRequire} from 'node:module';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const {chromium} = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(HERE, '.cache');
const THREE_DIR = path.join(CACHE, 'package');

function ensureThree(){
  if (fs.existsSync(path.join(THREE_DIR, 'build/three.min.js'))) return;
  fs.mkdirSync(CACHE, {recursive:true});
  execSync('npm pack three@0.128.0 --silent && tar xzf three-0.128.0.tgz', {cwd:CACHE, stdio:'inherit'});
}

// Map a CDN URL to a file inside the three@0.128.0 package.
function localFor(url){
  let m = url.match(/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/(.+)$/);
  if (m) return path.join(THREE_DIR, 'build', m[1]);
  m = url.match(/cdn\.jsdelivr\.net\/(?:npm|gh\/mrdoob)\/three@0\.128\.0\/(.+)$/);
  if (m) return path.join(THREE_DIR, m[1]);
  return null;
}

export async function launch(){
  const browser = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const live = process.env.ARK_LIVE_CDN === '1';
  if (!live) ensureThree();
  const newPage = async (opts={}) => {
    const page = await browser.newPage({viewport:{width:390,height:800}, deviceScaleFactor:2, hasTouch:true, isMobile:true, ...opts});
    if (!live) {
      await page.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/, route => {
        const f = localFor(route.request().url());
        if (f && fs.existsSync(f)) return route.fulfill({path:f, contentType:'text/javascript'});
        return route.fulfill({status:404, body:'not in local three cache'});
      });
      await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({status:200, contentType:'text/css', body:''}));
    }
    return page;
  };
  return {browser, newPage};
}
