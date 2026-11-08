// Checks the addresses: / is Persian, /en is English, the switch changes the address and keeps the section, an unknown address shows the 404.
//   node scripts/routes.mjs [base]       (default http://localhost:5199; pass the preview URL to test a production build)
import { pathToFileURL } from 'node:url';
const { launch } = await import(pathToFileURL('C:/mydesk/Desktop/video-pipeline/video-projects/okala/scripts/_pw.mjs').href);

const base = process.argv[2] ?? 'http://localhost:5199';
const b = await launch(), ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('kk-voice-note', '1'); localStorage.setItem('kk-seen', '1'); } catch {} });
const p = await ctx.newPage(), errors = [], ok = (n, v) => console.log(v ? 'pass' : 'FAIL', n);
p.on('pageerror', (e) => errors.push(e.message));
const state = () => p.evaluate(() => ({ path: location.pathname, hash: location.hash, lang: document.documentElement.lang, dir: document.documentElement.dir, h1: document.querySelector('h1 .st__face')?.textContent }));

await p.goto(`${base}/`, { waitUntil: 'networkidle' });
let s = await state();
ok(`/ is Persian (${s.h1})`, s.lang === 'fa' && s.dir === 'rtl');

await p.goto(`${base}/en`, { waitUntil: 'networkidle' });
s = await state();
ok(`/en loads directly in English (${s.h1})`, s.lang === 'en' && s.dir === 'ltr');

await p.goto(`${base}/#work`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.click('.head__lang');
await p.waitForTimeout(1500);
s = await state();
ok(`switch goes to /en and keeps the section (${s.path}${s.hash})`, s.path === '/en' && s.hash === '#work' && s.lang === 'en');
await p.goBack();
await p.waitForTimeout(600);
s = await state();
ok(`back button returns to Persian (${s.path})`, s.path === '/' && s.lang === 'fa');

await p.goto(`${base}/no-such-page`, { waitUntil: 'networkidle' });
s = await state();
ok(`unknown address shows the 404 (${s.h1})`, s.h1 === '۴۰۴');
await p.goto(`${base}/en/no-such-page`, { waitUntil: 'networkidle' });
s = await state();
ok(`unknown English address shows the English 404 (${s.h1})`, s.h1 === '404' && s.lang === 'en');
await p.click('.lost .btn');
await p.waitForTimeout(500);
ok('404 button returns home', (await state()).path === '/en');

// the case study: its own page in each language, reached from the work section, with a switch that stays on it and a way back
await p.goto(`${base}/#work`, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.click('.case-link');
// the page turns under a torn sheet; the next press waits until it has gone
await p.waitForTimeout(1800);
s = await state();
ok(`the work section opens the case study (${s.path}, ${s.h1})`, s.path === '/work/atarinaji' && s.h1 === 'عطاری ناجی' && s.lang === 'fa');
ok('the case study has its own title', (await p.title()).startsWith('عطاری ناجی'));
const nums = await p.evaluate(() => [...document.querySelectorAll('.cs-stats dd')].map((d) => d.textContent).join(' '));
ok(`it shows the real Search Console numbers (${nums})`, nums.includes('۹٫۸') && nums.includes('۷۵۴') && nums.includes('۶۴'));
await p.click('.cs-top__lang');
await p.waitForTimeout(1500);
s = await state();
ok(`the switch stays on the case study (${s.path}, ${s.h1})`, s.path === '/en/work/atarinaji' && s.h1 === 'Atarinaji' && s.lang === 'en');
await p.click('.cs-top__back');
await p.waitForTimeout(1800);
s = await state();
const at = await p.evaluate(() => Math.round(document.getElementById('work').getBoundingClientRect().top));
ok(`back goes to the English work section, scrolled to it (${s.path}${s.hash}, ${at}px from the top)`, s.path === '/en' && s.hash === '#work' && at > -40 && at < 200);
// the browser's own back and forward turn the page too: the sheet comes up over the new page and pulls away
await p.goto(`${base}/#work`, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.click('.case-link');
await p.waitForTimeout(1800);
const sheet = () => p.evaluate(() => getComputedStyle(document.querySelector('.turn')).visibility);
await p.goBack();
await p.waitForTimeout(120);
let mid = await sheet();
await p.waitForTimeout(1300);
s = await state();
ok(`the back gesture turns the page (sheet ${mid}, then ${await sheet()}, at ${s.path})`, mid === 'visible' && (await sheet()) === 'hidden' && s.path === '/');
await p.goForward();
await p.waitForTimeout(120);
mid = await sheet();
await p.waitForTimeout(1300);
s = await state();
ok(`and so does forward (sheet ${mid}, at ${s.path})`, mid === 'visible' && s.path === '/work/atarinaji');
await p.goto(`${base}/en/work/atarinaji`, { waitUntil: 'networkidle' });
s = await state();
ok(`/en/work/atarinaji loads directly in English (${s.h1})`, s.h1 === 'Atarinaji' && s.dir === 'ltr');

await b.close();
console.log(errors.length ? [...new Set(errors)].join('\n') : 'no page errors');
