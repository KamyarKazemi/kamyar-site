// Catches the paper motion mid-action: the tear, the ink bleeding, the pen, the stamp and the page turn, in both directions.
//   node scripts/motion.mjs            (with the dev server on :5199)
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const { launch } = await import(pathToFileURL('C:/mydesk/Desktop/video-pipeline/video-projects/okala/scripts/_pw.mjs').href);
const sharp = createRequire(import.meta.url)('C:/mydesk/Desktop/video-pipeline/node_modules/sharp');

mkdirSync('shots/motion', { recursive: true });
const b = await launch(), errors = [], ok = (n, v) => console.log(v ? 'pass' : 'FAIL', n), frames = [];
const shot = async (p, n, clip) => { await p.screenshot({ path: `shots/motion/${n}.png`, ...(clip ? { clip } : {}) }); frames.push(n); };

for (const lang of ['fa', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`http://localhost:5199${lang === 'en' ? '/en' : '/'}`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('.tear') && getComputedStyle(document.querySelector('.tear')).visibility === 'visible', null, { timeout: 8000 });
  const t0 = Date.now();
  for (const at of [420, 760, 1000]) { await p.waitForTimeout(Math.max(0, at - (Date.now() - t0))); await shot(p, `${lang}-rip-${at}`); }
  await p.waitForTimeout(1600);
  ok(`${lang} strip gone after the tear`, await p.evaluate(() => getComputedStyle(document.querySelector('.tear')).visibility === 'hidden'));
  ok(`${lang} title readable under it`, (await p.textContent('.hero__title .st__face'))?.length > 0);

  if (lang === 'fa') {
    await p.evaluate(() => document.getElementById('work').scrollIntoView({ behavior: 'instant' }));
    await p.waitForTimeout(2300);
    ok('section title torn on scroll', await p.evaluate(() => getComputedStyle(document.querySelector('#work .tear')).visibility === 'hidden'));
    const clip = { x: 700, y: 180, width: 700, height: 520 };
    await shot(p, 'print-rest', clip);
    await p.hover('.prints li:nth-child(2) .print');
    await p.waitForTimeout(260);
    await shot(p, 'print-mid', clip);
    await p.waitForTimeout(600);
    await shot(p, 'print-full', clip);
    ok('ink developed on hover', Math.round(await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.prints li:nth-child(2) .print')).getPropertyValue('--f')))) === 7);
    await p.mouse.move(10, 400);
    await p.waitForTimeout(800);
    ok('ink returns on leave', Math.round(await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.prints li:nth-child(2) .print')).getPropertyValue('--f')))) === 0);

    await p.hover('.head__nav a[href="#terms"]');
    await p.waitForTimeout(450);
    await shot(p, 'pen', { x: 0, y: 0, width: 1440, height: 80 });
    const d1 = await p.getAttribute('.head__nav a[href="#terms"] path', 'd'); await p.waitForTimeout(330);
    ok('pen line stays alive', d1 !== await p.getAttribute('.head__nav a[href="#terms"] path', 'd'));

    await p.evaluate(() => document.getElementById('top').scrollIntoView({ behavior: 'instant' }));
    await p.waitForTimeout(500);
    const btn = await p.locator('.hero__actions .btn').first().boundingBox();
    await p.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2); await p.mouse.down();
    await p.waitForTimeout(350);
    await shot(p, 'stamp', { x: 400, y: 640, width: 640, height: 200 });
    ok('stamp lands', await p.evaluate(() => !!document.querySelector('.mark')));
    await p.mouse.move(5, 5); await p.mouse.up();
    await p.waitForTimeout(1600);
    ok('stamp dries off', await p.evaluate(() => !document.querySelector('.mark')));

    await p.click('.head__lang');
    await p.waitForTimeout(380);
    await shot(p, 'turn-in');
    await p.waitForTimeout(420);
    await shot(p, 'turn-out');
    await p.waitForTimeout(800);
    ok('language changed behind the sheet', (await p.evaluate(() => document.documentElement.lang)) === 'en');
    ok('sheet cleared', await p.evaluate(() => getComputedStyle(document.querySelector('.turn')).visibility === 'hidden'));
  }
  await ctx.close();
}
// a phone has no hover: a print develops as it crosses the middle of the screen
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  await p.evaluate(() => { const r = document.querySelector('.prints li .print').getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: 'instant' }); });
  await p.waitForTimeout(1300);
  ok('phone print develops mid-screen', Math.round(await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.print')).getPropertyValue('--f')))) === 7);
  await ctx.close();
}
// reduced motion: no strip, no hidden text, prints in full colour, language still switches
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  ok('reduced motion: titles uncovered', await p.evaluate(() => [...document.querySelectorAll('.tear')].every((t) => getComputedStyle(t).visibility === 'hidden')));
  ok('reduced motion: prints in colour', (await p.evaluate(() => getComputedStyle(document.querySelector('.print')).getPropertyValue('--f').trim())) === '7');
  ok('reduced motion: everything visible', await p.evaluate(() => [...document.querySelectorAll('.rise')].every((t) => getComputedStyle(t).visibility === 'visible')));
  await p.click('.head__lang'); await p.waitForTimeout(150);
  ok('reduced motion: language switches', (await p.evaluate(() => document.documentElement.lang)) === 'en');
  await ctx.close();
}
await b.close();
console.log(errors.length ? [...new Set(errors)].slice(0, 6).join('\n') : 'no console errors');

const list = async (names, w, h, cols, out) => { const c = []; for (const [i, n] of names.entries()) c.push({ input: await sharp(`shots/motion/${n}.png`).resize(w, h, { fit: 'cover', position: 'top' }).png().toBuffer(), left: (i % cols) * (w + 8), top: Math.floor(i / cols) * (h + 8) }); await sharp({ create: { width: cols * (w + 8), height: Math.ceil(names.length / cols) * (h + 8), channels: 3, background: '#333' } }).composite(c).jpeg({ quality: 88 }).toFile(out); };
await list(['fa-rip-420', 'fa-rip-760', 'fa-rip-1000', 'en-rip-420', 'en-rip-760', 'en-rip-1000'], 640, 400, 3, 'shots/_rip.jpg');
await list(['print-rest', 'print-mid', 'print-full', 'stamp', 'turn-in', 'turn-out'], 640, 400, 3, 'shots/_det.jpg');
