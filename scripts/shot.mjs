// Tests the real navigation on desktop and phone: menu links, section jumps, the work viewer and its keys, and reports overflow and errors.
//   node scripts/shot.mjs            (with the dev server on :5199)
import { mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const { launch } = await import(pathToFileURL('C:/mydesk/Desktop/video-pipeline/video-projects/okala/scripts/_pw.mjs').href);
const sharp = createRequire(import.meta.url)('C:/mydesk/Desktop/video-pipeline/node_modules/sharp');

rmSync('shots', { recursive: true, force: true }); mkdirSync('shots', { recursive: true });
const b = await launch(), errors = [], ok = (name, v) => console.log(v ? 'pass' : 'FAIL', name);
const SECTIONS = ['about', 'services', 'work', 'terms', 'contact'];
for (const [tag, vp, mobile, lang] of [['d', { width: 1440, height: 900 }, false, 'fa'], ['m', { width: 390, height: 844 }, true, 'fa'], ['e', { width: 1440, height: 900 }, false, 'en'], ['n', { width: 390, height: 844 }, true, 'en']]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag}: ${m.text()}`); });
  p.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
  await p.goto(`http://localhost:5199${lang === 'en' ? '/en' : '/'}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  ok(`${tag} page direction`, (await p.evaluate(() => document.documentElement.dir)) === (lang === 'fa' ? 'rtl' : 'ltr'));
  await p.screenshot({ path: `shots/${tag}-0-top.png` });
  for (const [i, id] of SECTIONS.entries()) {
    if (mobile) { await p.tap('.head__burger'); await p.waitForTimeout(250); if (i === 0) await p.screenshot({ path: `shots/${tag}-menu.png` }); await p.tap(`.menu nav a[href="#${id}"]`); }
    else await p.click(`.head__nav a[href="#${id}"]`);
    await p.waitForTimeout(1900);
    const top = await p.evaluate((s) => Math.round(document.getElementById(s).getBoundingClientRect().top), id);
    const cur = await p.evaluate(() => document.querySelector('.head__nav a[aria-current]')?.getAttribute('href'));
    ok(`${tag} nav ${id} (top ${top}, current ${cur})`, Math.abs(top - (mobile ? 64 : 76)) < 8 || id === 'contact');
    await p.screenshot({ path: `shots/${tag}-${i + 1}-${id}.png` });
  }
  await p.evaluate(() => document.getElementById('work').scrollIntoView({ behavior: 'instant' }));
  await p.waitForTimeout(900);
  const open = (sel) => (mobile ? p.tap(sel) : p.click(sel));
  await open('.prints li:nth-child(2) .print');
  await p.waitForTimeout(500);
  ok(`${tag} viewer opens`, await p.evaluate(() => document.querySelector('.viewer').open));
  const t1 = await p.textContent('.viewer__bar strong');
  await open('.viewer__btns button:nth-child(2)');
  await p.waitForTimeout(300);
  const t2 = await p.textContent('.viewer__bar strong');
  ok(`${tag} viewer next (${t1} → ${t2})`, t1 !== t2);
  await p.keyboard.press(lang === 'fa' ? 'ArrowRight' : 'ArrowLeft'); await p.waitForTimeout(200);
  ok(`${tag} arrow key`, (await p.textContent('.viewer__bar strong')) === t1);
  await p.screenshot({ path: `shots/${tag}-viewer.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  ok(`${tag} Escape closes`, await p.evaluate(() => !document.querySelector('.viewer').open));
  console.log(tag, 'overflow-x', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  const before = await p.evaluate(() => document.documentElement.dir);
  await (mobile ? p.tap('.head__lang') : p.click('.head__lang')); await p.waitForTimeout(1500);
  ok(`${tag} language switch`, before !== (await p.evaluate(() => document.documentElement.dir)));
  await ctx.close();
}
await b.close();
console.log(errors.length ? [...new Set(errors)].slice(0, 6).join('\n') : 'no console errors');
const sheet = async (files, w, h, cols, out) => { const c = []; for (const [i, f] of files.entries()) c.push({ input: await sharp(`shots/${f}.png`).resize(w, h, { fit: 'cover', position: 'top' }).png().toBuffer(), left: (i % cols) * (w + 8), top: Math.floor(i / cols) * (h + 8) }); await sharp({ create: { width: cols * (w + 8), height: Math.ceil(files.length / cols) * (h + 8), channels: 3, background: '#333' } }).composite(c).jpeg({ quality: 88 }).toFile(out); };
await sheet(['d-0-top', 'd-1-about', 'd-5-contact', 'e-0-top', 'e-1-about', 'e-5-contact'], 800, 500, 3, 'shots/_d.jpg');
await sheet(['m-0-top', 'm-menu', 'm-1-about', 'm-5-contact', 'n-0-top', 'n-1-about', 'n-5-contact'], 300, 649, 7, 'shots/_m.jpg');
