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
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  // a returning visitor: the language gate and the live intro are tested in intro.mjs
  await ctx.addInitScript(() => { try { localStorage.setItem('kk-seen', '1'); } catch {} });
  const p = await ctx.newPage();
  // the voice and its listen button left the site for the live intro; the page itself stays quiet
  if (lang === 'fa') {
    const v = await ctx.newPage();
    v.on('pageerror', (e) => errors.push(e.message));
    await v.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
    await v.waitForTimeout(3600);
    ok('no listen button or note on the site', await v.evaluate(() => !document.querySelector('.dock, .note-card')));
    // services are dealt while the section holds still
    const top = await v.evaluate(() => { const r = document.getElementById('services').getBoundingClientRect(); return scrollY + r.top - 80; });
    await v.evaluate((y) => window.scrollTo({ top: y + 40, behavior: 'instant' }), top); await v.waitForTimeout(900);
    const early = await v.evaluate(() => [...document.querySelectorAll('.list__row')].filter((r) => parseFloat(getComputedStyle(r).opacity) > 0.9).length);
    await v.evaluate((y) => window.scrollTo({ top: y + innerHeight * 2, behavior: 'instant' }), top); await v.waitForTimeout(1200);
    const late = await v.evaluate(() => [...document.querySelectorAll('.list__row')].filter((r) => parseFloat(getComputedStyle(r).opacity) > 0.9).length);
    ok(`services are dealt one by one as you scroll (${early} then ${late} of 5)`, early < 5 && late === 5);
    ok('a tick on the header pen line for each chapter', await v.evaluate(() => document.querySelectorAll('.head__ticks i').length === 5));
    await v.mouse.move(700, 500);
    for (let k = 0; k < 4; k++) { await v.mouse.wheel(0, 900); await v.waitForTimeout(40); }
    await v.waitForTimeout(100);
    const leaning = await v.evaluate(() => [...document.querySelectorAll('main .sec > :not(.rise, dialog)')].some((e) => Math.abs(new DOMMatrix(getComputedStyle(e).transform).b) > 0.006));
    await v.waitForTimeout(1600);
    const settled = await v.evaluate(() => [...document.querySelectorAll('main .sec > :not(.rise, dialog)')].every((e) => Math.abs(new DOMMatrix(getComputedStyle(e).transform).b) < 0.001));
    ok('scrolling fast makes the sheets lean, and they settle when it stops', leaning && settled);
    await v.close();
  }
  await ctx.addInitScript(() => { try { localStorage.setItem('kk-voice-note', '1'); localStorage.setItem('kk-seen', '1'); } catch {} });
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`http://localhost:5199${lang === 'en' ? '/en' : '/'}`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('.tear') && getComputedStyle(document.querySelector('.tear')).visibility === 'visible', null, { timeout: 8000 });
  const t0 = Date.now();
  for (const at of [420, 760, 1000]) { await p.waitForTimeout(Math.max(0, at - (Date.now() - t0))); await shot(p, `${lang}-rip-${at}`); }
  await p.waitForTimeout(650);
  await shot(p, `${lang}-landed`);
  // scraps must come to rest ON something: the bottom of a still scrap sits on the top edge of a surface under it
  const landing = await p.evaluate(() => {
    const tops = [...document.querySelectorAll('.hero__floor, .hero__roles, .hero__actions .btn')].map((e) => e.getBoundingClientRect());
    const scraps = [...document.querySelectorAll('.scrap')].map((e) => e.getBoundingClientRect());
    const resting = scraps.filter((s) => tops.some((t) => s.left + s.width / 2 >= t.left && s.left + s.width / 2 <= t.right && Math.abs(s.top + s.height / 2 + Math.max(s.width, s.height) / 2 - t.top) < 14));
    return { scraps: scraps.length, resting: resting.length };
  });
  ok(`${lang} scraps land on the floor and the roles (${landing.resting} of ${landing.scraps})`, landing.scraps > 0 && landing.resting >= Math.ceil(landing.scraps / 2));
  await p.waitForTimeout(950);
  ok(`${lang} strip gone after the tear`, await p.evaluate(() => getComputedStyle(document.querySelector('.tear')).visibility === 'hidden'));
  ok(`${lang} title readable under it`, (await p.textContent('.hero__title .st__face'))?.length > 0);

  if (lang === 'fa') {
    await p.evaluate(() => document.getElementById('work').scrollIntoView({ behavior: 'instant' }));
    await p.waitForTimeout(2300);
    ok('section title torn on scroll', await p.evaluate(() => getComputedStyle(document.querySelector('#work .tear')).visibility === 'hidden'));
    const flown = () => p.evaluate(() => { const r = document.querySelector('.focus__print').getBoundingClientRect(); return { w: r.width - 20, h: r.height - 20, cx: r.left + r.width / 2, top: r.top, bottom: r.bottom, f: Math.round(parseFloat(getComputedStyle(document.querySelector('.focus__print')).getPropertyValue('--f'))) }; });
    await p.evaluate(() => { const r = document.querySelector('.strip').getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 140, behavior: 'instant' }); });
    await p.waitForTimeout(1200);
    const sizes = await p.evaluate(() => [...document.querySelectorAll('.card')].map((c) => Math.round(c.getBoundingClientRect().width)));
    ok(`prints hang side by side at one size (${sizes.join(', ')})`, Math.max(...sizes) - Math.min(...sizes) <= 1);
    ok('they hang in ink', await p.evaluate(() => [...document.querySelectorAll('.card')].every((c) => Math.round(parseFloat(getComputedStyle(c).getPropertyValue('--f'))) === 0)));
    await shot(p, 'focus-0-wall');
    await p.click('.card:nth-child(2) .card__btn');
    await p.waitForTimeout(120); await shot(p, 'focus-1-lift');
    await p.waitForTimeout(260); await shot(p, 'focus-2-fly');
    const bumped = await p.evaluate(() => [...document.querySelectorAll('.card:not(:nth-child(2)) .card__btn')].filter((b) => { const m = new DOMMatrix(getComputedStyle(b).transform); return Math.abs(m.e) > 1 || Math.abs(m.f) > 1 || Math.abs(m.a - 1) > 0.01; }).length);
    ok(`the other prints take the bump (${bumped} of 4)`, bumped >= 3);
    await p.waitForTimeout(1100); await shot(p, 'focus-3-landed');
    let fl = await flown();
    ok('pulled off the wall into a focus view', await p.evaluate(() => document.querySelector('.focus').open));
    ok(`it lands at its real shape, 9:16 (${(fl.w / fl.h).toFixed(3)})`, Math.abs(fl.w / fl.h - 9 / 16) < 0.012);
    ok(`centred and on screen (centre ${fl.cx.toFixed(0)}, ${fl.top.toFixed(0)}–${fl.bottom.toFixed(0)})`, Math.abs(fl.cx - 720) < 3 && fl.top >= 0 && fl.bottom <= 900);
    ok('and soaks into full colour', fl.f === 7);
    ok('its slot on the wall is empty while it is out', await p.evaluate(() => getComputedStyle(document.querySelector('.card:nth-child(2) .card__btn')).visibility === 'hidden'));
    await p.click('.focus__btns button:nth-child(2)'); await p.waitForTimeout(90); await shot(p, 'swap-1-toss');
    await p.waitForTimeout(260); await shot(p, 'swap-2-cross');
    await p.waitForTimeout(900); await shot(p, 'swap-3-landed');
    await p.click('.focus__btns button:nth-child(2)'); await p.waitForTimeout(1300);
    fl = await flown();
    ok(`next twice brings out the toolbox grid at 3:4 (${(await p.textContent('.focus__name strong'))}, ${(fl.w / fl.h).toFixed(3)})`, Math.abs(fl.w / fl.h - 3 / 4) < 0.012 && fl.f === 7);
    ok(`after a swap the print sits centred (${fl.cx.toFixed(0)}) with the old one gone`, Math.abs(fl.cx - 720) < 3 && (await p.evaluate(() => document.querySelectorAll('.focus__ghost').length)) === 0);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(1300);
    fl = await flown();
    ok(`an arrow key brings out Okala at 4:5 (${(fl.w / fl.h).toFixed(3)})`, Math.abs(fl.w / fl.h - 4 / 5) < 0.012);
    const before = await p.textContent('.focus__name strong');
    for (let k = 0; k < 3; k++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(70); }
    await p.waitForTimeout(1400);
    fl = await flown();
    const riffle = await p.evaluate(() => ({ ghosts: document.querySelectorAll('.focus__ghost').length, out: [...document.querySelectorAll('.card__btn')].filter((b) => getComputedStyle(b).visibility === 'hidden').length }));
    ok(`three quick presses riffle three prints back (${before} → ${await p.textContent('.focus__name strong')}, ${riffle.ghosts} ghosts, ${riffle.out} slot empty)`, (await p.textContent('.focus__name strong')) !== before && riffle.ghosts === 0 && riffle.out === 1 && fl.f === 7 && Math.abs(fl.cx - 720) < 3);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); await shot(p, 'focus-4-home');
    await p.waitForTimeout(900);
    ok('Escape flies it home and closes the view', await p.evaluate(() => !document.querySelector('.focus').open && getComputedStyle(document.querySelector('.card:nth-child(5) .card__btn')).visibility === 'visible'));
    await p.click('.card:nth-child(1) .card__btn'); await p.waitForTimeout(1300);
    await p.mouse.click(60, 450); await p.waitForTimeout(1200);
    ok('clicking outside the print closes it too', await p.evaluate(() => !document.querySelector('.focus').open));
    ok('everything settles back on the wall', await p.evaluate(() => [...document.querySelectorAll('.card__btn')].every((b) => { const m = new DOMMatrix(getComputedStyle(b).transform); return Math.abs(m.e) < 1 && Math.abs(m.a - 1) < 0.01 && getComputedStyle(b).visibility === 'visible'; })));


    await p.hover('.head__nav a[href="#terms"]');
    await p.waitForTimeout(450);
    await shot(p, 'pen', { x: 0, y: 0, width: 1440, height: 80 });
    const drawn = () => p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.head__nav a[href="#terms"] path')).strokeDashoffset));
    ok('pen draws the underline on hover', Math.abs(await drawn()) < 0.02);
    const d1 = await p.getAttribute('.head__nav a[href="#terms"] path', 'd');
    await p.mouse.move(700, 400); await p.waitForTimeout(400); await p.hover('.head__nav a[href="#terms"]'); await p.waitForTimeout(450);
    ok('each hover draws a different take of the stroke', d1 !== await p.getAttribute('.head__nav a[href="#terms"] path', 'd'));

    // the header: the red block on the section you are in, the torn strip, the progress pen, the typed names
    const head = () => p.evaluate(() => { const ink = document.querySelector('.head__ink').getBoundingClientRect(), cur = document.querySelector('.head__nav a[aria-current]')?.getBoundingClientRect(); return { onLink: !!cur && Math.abs(ink.left - cur.left) < 2 && Math.abs(ink.width - cur.width) < 2, lifted: document.querySelector('.head').classList.contains('is-lifted'), pen: parseFloat(document.querySelector('.head__progress path').getAttribute('stroke-dashoffset')) }; });
    await p.evaluate(() => { const r = document.getElementById('services').getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 200, behavior: 'instant' }); });
    await p.waitForTimeout(1400);
    let h = await head();
    ok(`the red block sits under the section you are in, the header lifts as a torn strip, the pen measures the page (${h.pen.toFixed(2)})`, h.onLink && h.lifted && h.pen > 0.05 && h.pen < 0.95);
    await p.evaluate(() => { const r = document.getElementById('terms').getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 200, behavior: 'instant' }); });
    await p.waitForTimeout(1400);
    ok('it slides along to the next section', (await head()).onLink && (await p.getAttribute('.head__nav a[aria-current]', 'href')) === '#terms');
    await p.mouse.move(700, 600); await p.hover('.head__nav a[href="#about"]'); await p.waitForTimeout(150);
    const typed = await p.evaluate(() => { const t = document.querySelector('.head__nav a[href="#about"] .head__tag'); return { typing: t.classList.contains('is-typing'), so: t.querySelector('.head__type').textContent }; });
    ok(`pointing at a link retypes its second name (${typed.so})`, typed.typing && typed.so.length > 0 && typed.so.length < 7);
    await p.waitForTimeout(1000);
    ok('then the real line is back', await p.evaluate(() => !document.querySelector('.head__nav a[href="#about"] .head__tag').classList.contains('is-typing')));
    await p.hover('.head__name'); await p.waitForTimeout(700);
    ok('away from the top the name offers the way back up', (await p.evaluate(() => document.querySelector('.head__sub .head__type').textContent)).includes('BACK TO TOP'));
    await p.mouse.move(700, 600); await p.waitForTimeout(1300);
    ok('and puts its name back', await p.evaluate(() => !document.querySelector('.head__sub').classList.contains('is-typing')));

    await p.evaluate(() => document.getElementById('top').scrollIntoView({ behavior: 'instant' }));
    await p.waitForTimeout(500);
    const btn = await p.locator('.hero__actions .btn').first().boundingBox();
    await p.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2); await p.mouse.down();
    await p.waitForTimeout(420);
    await shot(p, 'stamp', { x: 400, y: 640, width: 640, height: 200 });
    ok('a rubber stamp comes down and prints the mark', await p.evaluate(() => !!document.querySelector('.btn .stamp svg') && getComputedStyle(document.querySelector('.mark')).visibility === 'visible' && document.querySelectorAll('.btn .stamp__puff').length > 0));
    await p.mouse.move(5, 5); await p.mouse.up();
    await p.waitForTimeout(1600);
    ok('the stamp lifts away and the print dries off', await p.evaluate(() => !document.querySelector('.mark, .stamp, .stamp-fx')));

    await p.click('.head__lang');
    await p.waitForTimeout(380);
    await shot(p, 'turn-in');
    await p.waitForTimeout(420);
    await shot(p, 'turn-out');
    await p.waitForTimeout(4000);
    ok('language changed behind the sheet', (await p.evaluate(() => document.documentElement.lang)) === 'en');
    ok('sheet cleared', await p.evaluate(() => getComputedStyle(document.querySelector('.turn')).visibility === 'hidden'));
    ok('the header parts walked to their new places and settled', await p.evaluate(() => !document.querySelector('.head').classList.contains('is-walking') && [...document.querySelectorAll('[data-walk]')].every((el) => !el.style.transform)));
  }
  await ctx.close();
}
// phones: two prints a row; a tapped print flies out at its real shape and fits the screen
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('kk-voice-note', '1'); localStorage.setItem('kk-seen', '1'); } catch {} });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  await p.evaluate(() => { const r = document.querySelector('.strip').getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 80, behavior: 'instant' }); });
  await p.waitForTimeout(900);
  ok('phone: prints hang two to a row', await p.evaluate(() => getComputedStyle(document.querySelector('.strip')).gridTemplateColumns.split(' ').length === 2));
  await p.locator('.card:nth-child(4) .card__btn').tap(); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'shots/motion/phone-focus.png' });
  const r = await p.evaluate(() => { const b = document.querySelector('.focus__print').getBoundingClientRect(), bar = document.querySelector('.focus__bar').getBoundingClientRect(); return { w: b.width - 20, h: b.height - 20, left: b.left, right: b.right, top: b.top, barBottom: bar.bottom }; });
  ok(`phone: it opens at its real shape inside the screen (${(r.w / r.h).toFixed(3)}, ${r.left.toFixed(0)}–${r.right.toFixed(0)}, bar ends ${r.barBottom.toFixed(0)})`, Math.abs(r.w / r.h - 3 / 4) < 0.012 && r.left >= 0 && r.right <= 390 && r.barBottom <= 844);
  const keys = await p.evaluate(() => [...document.querySelectorAll('.focus__btns .btn')].map((e) => { const k = e.getBoundingClientRect(); return k.height >= 44 && k.left >= 0 && k.right <= innerWidth && k.bottom <= innerHeight; }));
  ok('phone: back, close and next are full-size taps inside the screen', keys.length === 3 && keys.every(Boolean));
  // a swipe the way the arrow keys go brings out the next print
  const name = () => p.textContent('.focus__name strong');
  const before = await name();
  await p.evaluate(() => {
    const el = document.querySelector('.focus__print'), at = (x) => [new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 })];
    el.dispatchEvent(new TouchEvent('touchstart', { touches: at(120), targetTouches: at(120), changedTouches: at(120), bubbles: true }));
    el.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], changedTouches: at(300), bubbles: true }));
  });
  await p.waitForTimeout(1300);
  ok(`phone: swiping brings out the next print (${before} → ${await name()})`, (await name()) !== before);
  await p.locator('.focus__close').tap(); await p.waitForTimeout(1100);
  ok('phone: close sends it home', await p.evaluate(() => !document.querySelector('.focus').open));
  await ctx.close();
}
// after a language switch the services are still dealt: the cards wait off the desk, then land as you scroll to them
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript(() => { try { localStorage.setItem('kk-voice-note', '1'); localStorage.setItem('kk-seen', '1'); } catch {} });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.head__lang').click());
  await p.waitForTimeout(3500);
  const waiting = await p.evaluate(() => [...document.querySelectorAll('.list__row')].every((r) => Number(getComputedStyle(r).opacity) < 0.1));
  const top = await p.evaluate(() => document.getElementById('services').getBoundingClientRect().top + scrollY);
  for (let y = top - h; y < top + h * 2.5; y += 120) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(80); }
  await p.waitForTimeout(1500);
  const dealt = await p.evaluate(() => [...document.querySelectorAll('.list__row')].every((r) => Number(getComputedStyle(r).opacity) > 0.95));
  ok(`${w < 500 ? 'phone' : 'desktop'}: after switching language the services wait, then are dealt as you scroll`, waiting && dealt);
  await ctx.close();
}
// reduced motion: no strip, no hidden text, prints in full colour, language still switches
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('kk-voice-note', '1'); localStorage.setItem('kk-seen', '1'); } catch {} });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  ok('reduced motion: titles uncovered', await p.evaluate(() => [...document.querySelectorAll('.tear')].every((t) => getComputedStyle(t).visibility === 'hidden')));
  await p.evaluate(() => document.querySelector('.strip').scrollIntoView({ block: 'center' })); await p.click('.card:nth-child(3) .card__btn'); await p.waitForTimeout(150);
  ok('reduced motion: a print opens at once, in colour', await p.evaluate(() => document.querySelector('.focus').open && Math.round(parseFloat(getComputedStyle(document.querySelector('.focus__print')).getPropertyValue('--f'))) === 7));
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok('reduced motion: no smooth scroll', await p.evaluate(() => !document.documentElement.classList.contains('lenis')));
  ok('reduced motion: everything visible', await p.evaluate(() => [...document.querySelectorAll('.rise')].every((t) => getComputedStyle(t).visibility === 'visible')));
  await p.click('.head__lang'); await p.waitForTimeout(150);
  ok('reduced motion: language switches', (await p.evaluate(() => document.documentElement.lang)) === 'en');
  await ctx.close();
}
await b.close();
console.log(errors.length ? [...new Set(errors)].slice(0, 6).join('\n') : 'no console errors');

const list = async (names, w, h, cols, out) => { const c = []; for (const [i, n] of names.entries()) c.push({ input: await sharp(`shots/motion/${n}.png`).resize(w, h, { fit: 'cover', position: 'top' }).png().toBuffer(), left: (i % cols) * (w + 8), top: Math.floor(i / cols) * (h + 8) }); await sharp({ create: { width: cols * (w + 8), height: Math.ceil(names.length / cols) * (h + 8), channels: 3, background: '#333' } }).composite(c).jpeg({ quality: 88 }).toFile(out); };
await list(['fa-rip-420', 'fa-rip-760', 'fa-rip-1000', 'en-rip-420', 'en-rip-760', 'en-rip-1000'], 640, 400, 3, 'shots/_rip.jpg');
await list(['focus-0-wall', 'focus-1-lift', 'focus-2-fly', 'focus-3-landed', 'swap-1-toss', 'swap-2-cross', 'swap-3-landed', 'focus-4-home', 'stamp'], 640, 400, 3, 'shots/_det.jpg');
