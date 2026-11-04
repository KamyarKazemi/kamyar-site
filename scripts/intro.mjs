// The language gate and the live intro: the gate first on a first visit, frames of each scene, the tape (pause, rewind, forward, drag), his reactions, and the hand-off to the site.
//   node scripts/intro.mjs [base] [--frames]     (--frames also saves a still of each scene in shots/intro-*.png)
import { pathToFileURL } from 'node:url';
const { launch } = await import(pathToFileURL('C:/mydesk/Desktop/video-pipeline/video-projects/okala/scripts/_pw.mjs').href);

const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5199';
const frames = process.argv.includes('--frames');
const b = await launch(), ok = (n, v) => console.log(v ? 'pass' : 'FAIL', n), errors = [];

async function open(path, viewport, motion = 'no-preference', returning = false) {
  const ctx = await b.newContext({ viewport, reducedMotion: motion });
  await ctx.addInitScript((returning) => { try { localStorage.setItem('kk-voice-note', '1'); if (returning) localStorage.setItem('kk-seen', '1'); } catch {} }, returning);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  return p;
}
// a language is picked by tapping the middle of its half's words; the paper takes a moment to get out of the way
const pick = async (p, lang, wait = 1700) => {
  const r = await p.locator(`.gate__half--${lang} .gate__in`).boundingBox();
  await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  await p.waitForTimeout(wait);
};
const seek = (p, t) => p.evaluate((t) => { window.__tape.play(false); window.__tape.seek(t); }, t);
const said = (p) => p.evaluate(() => document.querySelector('.li-say.is-on')?.dataset.said ?? '');
const shown = (p, rise) => p.evaluate((rise) => {
  const el = document.querySelector(`[data-rise="${rise}"]`), r = el.getBoundingClientRect();
  return getComputedStyle(el.parentElement).visibility === 'visible' && r.width > 20 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
}, rise);

for (const [tag, path, viewport] of [['d', '/intro', { width: 1440, height: 900 }], ['e', '/en/intro', { width: 1440, height: 900 }], ['m', '/intro', { width: 390, height: 844 }]]) {
  const p = await open(path, viewport);
  ok(`${tag} the language gate comes first`, await p.isVisible('.gate__half--fa') && await p.isVisible('.gate__half--en'));
  await pick(p, tag === 'e' ? 'en' : 'fa');
  ok(`${tag} the gate is gone once a language is picked`, !(await p.$('.gate')));
  ok(`${tag} it plays`, await p.evaluate(() => window.__tape.time > 0.2 && window.__tape.playing));

  for (const [t, rise, name] of [[1.6, 'hi', 'the hello'], [3.0, 'name', 'his name'], [3.0, 'me', 'his print'], [5.3, 'role2', 'the last role'], [9.6, 'work3', 'the last work print'], [17.2, 'board', 'the timeline board'], [17.3, 'live', 'LIVE'], [20.2, 'more', 'there is more in here'], [21.9, 'come', 'come in']]) {
    await seek(p, t);
    await p.waitForTimeout(120);
    ok(`${tag} ${name} stands up and is on screen at ${t}s`, await shown(p, rise));
  }
  if (frames) for (const t of [1.0, 3.0, 5.2, 7.4, 9.6, 12.6, 14.4, 17.2, 18.4, 20.2, 21.9, 22.8]) {
    await seek(p, t);
    await p.waitForTimeout(150);
    await p.screenshot({ path: `shots/intro-${tag}-${String(t).replace('.', '_')}.png` });
  }

  if (tag !== 'm') {
    // rewinding: hold the left arrow
    await seek(p, 6);
    await p.evaluate(() => window.__tape.play(true));
    await p.keyboard.down('ArrowLeft');
    await p.waitForTimeout(700);
    const back = await p.evaluate(() => window.__tape.rate);
    await p.keyboard.up('ArrowLeft');
    ok(`${tag} holding ← rewinds (rate ${back.toFixed(1)})`, back < -1.5);
    ok(`${tag} he notices the rewind (${await said(p)})`, (await said(p)).includes('rewind1'));
    await p.waitForTimeout(2200);
    await p.keyboard.down('ArrowRight');
    await p.waitForTimeout(700);
    ok(`${tag} holding → runs it forward and he notices (${await said(p)})`, (await said(p)).includes('forward'));
    await p.keyboard.up('ArrowRight');

    // the secret: rewinding back over the portfolio turns the backwards line the right way round, with a stamp and a burst
    await p.evaluate(() => localStorage.removeItem('kk-secret'));
    await seek(p, 10.4);
    await p.evaluate(() => window.__tape.play(true));
    await p.keyboard.down('ArrowLeft');
    await p.waitForTimeout(1300);
    await p.keyboard.up('ArrowLeft');
    await p.waitForTimeout(250);
    const secret = await p.evaluate(() => ({ found: document.querySelector('.li-secret').classList.contains('is-found'), stamp: getComputedStyle(document.querySelector('.li-found')).visibility, bits: document.querySelectorAll('.li-bit').length, kept: localStorage.getItem('kk-secret') }));
    ok(`${tag} rewinding over the portfolio finds the secret (stamp ${secret.stamp}, ${secret.bits} bits of paper)`, secret.found && secret.stamp === 'visible' && secret.bits > 20 && secret.kept === '1');
    await p.waitForTimeout(2600);

    // pushed too hard the timeline wears out: it complains in its own words, crawls, and then he says "told you"
    await seek(p, 21);
    await p.evaluate(() => window.__tape.play(true));
    await p.keyboard.down('ArrowLeft');
    await p.waitForTimeout(3900);
    const worn = await p.evaluate(() => ({ tired: document.querySelector('.li').classList.contains('is-tired'), groan: document.querySelector('.li-groan.is-on')?.textContent ?? '', rate: window.__tape.rate }));
    await p.keyboard.up('ArrowLeft');
    ok(`${tag} rewinding too long wears the timeline out ("${worn.groan}", crawling at ${worn.rate.toFixed(2)})`, worn.tired && worn.groan.length > 4 && Math.abs(worn.rate) < 0.6);
    await p.waitForTimeout(3800);
    ok(`${tag} rested, and he says "told you" (${await said(p)})`, (await said(p)).includes('told'));
    await p.waitForTimeout(1000);

    // the strip: dragging it puts the playhead there
    const strip = await p.locator('.li-strip').boundingBox();
    const x = strip.x + strip.width * 0.25;   // left to right in both languages
    await p.mouse.move(x, strip.y + 20);
    await p.mouse.down();
    await p.mouse.move(x + 2, strip.y + 20);
    await p.waitForTimeout(250);
    await p.mouse.up();
    const at = await p.evaluate(() => window.__tape.time / window.__tape.duration);
    ok(`${tag} the strip seeks to a quarter of the way (${at.toFixed(2)})`, Math.abs(at - 0.25) < 0.05);

    // space pauses; a long pause and he asks if you are still there
    await p.waitForTimeout(2000);
    await p.keyboard.press(' ');
    await p.waitForTimeout(400);
    ok(`${tag} space pauses`, await p.evaluate(() => Math.abs(window.__tape.rate) < 0.05));
    await p.waitForTimeout(5600);
    ok(`${tag} a long pause and he asks (${await said(p)})`, (await said(p)).includes('idle'));
  }

  // the end: the camera dives into the red dot and the site comes out from under the sheet
  await p.evaluate(() => { window.__tape.seek(window.__tape.duration - 0.6); window.__tape.play(true); });
  await p.waitForTimeout(3200);
  const end = await p.evaluate(() => ({ live: !!document.querySelector('.li'), path: location.pathname, h1: document.querySelector('h1')?.textContent ?? '', top: scrollY }));
  ok(`${tag} it hands over to the site (${end.path}, "${end.h1.slice(0, 20)}")`, !end.live && end.path === (tag === 'e' ? '/en' : '/') && end.h1.length > 0);
  if (frames) await p.screenshot({ path: `shots/intro-${tag}-site.png` });
  await p.context().close();
}

// a first visit to / starts at the gate; picking English moves the address to /en and the intro speaks English
{
  const p = await open('/', { width: 1440, height: 900 });
  ok('a first visit to / opens on the language gate', await p.isVisible('.gate'));
  await pick(p, 'en');
  const s = await p.evaluate(() => ({ path: location.pathname, lang: document.querySelector('.li')?.getAttribute('lang'), name: document.querySelector('[data-rise="name"] text')?.textContent }));
  ok(`picking English goes to /en and the intro is in English (${s.path}, ${s.name})`, s.path === '/en' && s.lang === 'en' && s.name === 'Kamyar');
  await p.context().close();
}
// a returning visitor goes straight to the site
{
  const p = await open('/', { width: 1440, height: 900 }, 'no-preference', true);
  ok('a returning visitor gets the site, no gate', await p.evaluate(() => !document.querySelector('.gate, .li') && !!document.querySelector('h1')));
  await p.context().close();
}
// skip goes straight to the site
{
  const p = await open('/intro', { width: 1440, height: 900 });
  await pick(p, 'fa', 1300);
  await p.click('.li-skip');
  await p.waitForTimeout(1600);
  ok('skip hands over to the site', await p.evaluate(() => !document.querySelector('.li') && location.pathname === '/'));
  await p.context().close();
}
// reduced motion: the gate asks for the language, then the site opens, with no film
{
  const p = await open('/intro', { width: 1440, height: 900 }, 'reduce');
  ok('reduced motion: the gate, no film', await p.evaluate(() => !!document.querySelector('.gate') && !document.querySelector('.li')));
  await pick(p, 'en', 400);
  ok('reduced motion: picking English opens the English site', await p.evaluate(() => !document.querySelector('.gate, .li') && location.pathname === '/en' && document.documentElement.lang === 'en'));
  await p.context().close();
}
ok(`no page errors${errors.length ? ': ' + [...new Set(errors)].slice(0, 4).join(' | ') : ''}`, !errors.length);
await b.close();
