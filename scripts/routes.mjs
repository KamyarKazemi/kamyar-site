// Checks the addresses: / is Persian, /en is English, the switch changes the address and keeps the section, an unknown address shows the 404.
//   node scripts/routes.mjs [base]       (default http://localhost:5199; pass the preview URL to test a production build)
import { pathToFileURL } from 'node:url';
const { launch } = await import(pathToFileURL('C:/mydesk/Desktop/video-pipeline/video-projects/okala/scripts/_pw.mjs').href);

const base = process.argv[2] ?? 'http://localhost:5199';
const b = await launch(), p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errors = [], ok = (n, v) => console.log(v ? 'pass' : 'FAIL', n);
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

await b.close();
console.log(errors.length ? [...new Set(errors)].join('\n') : 'no page errors');
