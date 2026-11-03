// Walks down the site on a phone, a screen at a time, and saves what each screen looks like once its animations have played.
//   node scripts/phone-audit.mjs <out-dir> [width] [height] [lang]
import { pathToFileURL } from 'node:url';
const { launch } = await import(pathToFileURL('C:/mydesk/Desktop/video-pipeline/video-projects/okala/scripts/_pw.mjs').href);
const [out, w = '390', h = '844', lang = 'fa'] = process.argv.slice(2);
const b = await launch();
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem('kk-voice-note', '1'); localStorage.setItem('kk-seen', '1'); } catch {} });
const p = await ctx.newPage();
await p.goto(`http://localhost:5199/${lang === 'en' ? 'en' : ''}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
let y = 0, n = 0;
while (y < total) {
  await p.evaluate((y) => window.scrollTo(0, y), y);
  await p.waitForTimeout(1300);
  await p.screenshot({ path: `${out}/${lang}-${w}-${String(n++).padStart(2, '0')}.png` });
  y += Math.round(+h * 0.8);
}
console.log(lang, w, 'screens', n, 'page height', total, 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
await b.close();
