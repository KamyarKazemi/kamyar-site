// Every event on the site makes its sound: the dev build logs each sound it plays to window.__sfx, and this walks through the events.
//   node scripts/sounds.mjs [base]
import { pathToFileURL } from 'node:url';
const { launch } = await import(pathToFileURL('C:/mydesk/Desktop/video-pipeline/video-projects/okala/scripts/_pw.mjs').href);

const base = process.argv[2] ?? 'http://localhost:5199';
const b = await launch(), ok = (n, v) => console.log(v ? 'pass' : 'FAIL', n), errors = [];
async function open(path, viewport, seen = true, mobile = false) {
  const ctx = await b.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript((seen) => { try { localStorage.setItem('kk-voice-note', '1'); if (seen) localStorage.setItem('kk-seen', '1'); } catch {} }, seen);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  return p;
}
// what played since the last look
const heard = async (p) => p.evaluate(() => { const s = window.__sfx ?? []; window.__sfx = []; return s; });
const has = (list, ...names) => names.every((n) => list.includes(n));

{
  const p = await open('/', { width: 1440, height: 900 });
  await p.waitForTimeout(2200);
  // the browser only lets sound play after a first press
  await p.mouse.click(700, 500);
  await p.waitForTimeout(300);
  await heard(p);

  await p.hover('.head__nav a:nth-of-type(2)');
  await p.waitForTimeout(700);
  let s = await heard(p);
  ok(`pointing at a section link: the pen and the typewriter (${[...new Set(s)].join(', ')})`, has(s, 'pen', 'key'));

  await p.hover('.head__lang');
  await p.waitForTimeout(200);
  ok('pointing at a button taps the pencil', has(await heard(p), 'tap'));

  await p.click('.hero__actions .btn--ghost', { modifiers: ['Control'] }).catch(() => {});
  await p.evaluate(() => document.querySelector('.hero__actions .btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await p.waitForTimeout(700);
  s = await heard(p);
  ok(`a button press: the stamp (${[...new Set(s)].join(', ')})`, has(s, 'stamp'));

  // scrolling down: titles rip, scraps land, services are dealt, the pen underlines key phrases
  for (let y = 0; y < 4200; y += 300) { await p.mouse.wheel(0, 300); await p.waitForTimeout(260); }
  await p.waitForTimeout(800);
  s = await heard(p);
  ok(`scrolling: rips, scraps, dealt cards and the pen (${[...new Set(s)].join(', ')})`, has(s, 'rip', 'scrap', 'deal', 'pen'));

  // the work: peeled off the wall, tossed aside for the next, slapped back
  await p.evaluate(() => document.getElementById('work').scrollIntoView());
  await p.waitForTimeout(900);
  await heard(p);
  await p.locator('.card__btn').first().click();
  await p.waitForTimeout(1400);
  s = await heard(p);
  ok(`a print pulled off the wall peels (${[...new Set(s)].join(', ')})`, has(s, 'peel'));
  await p.locator('.focus__btns .btn').nth(1).click();
  await p.waitForTimeout(1300);
  s = await heard(p);
  ok(`next: the print is tossed aside and the next lands (${[...new Set(s)].join(', ')})`, has(s, 'swish', 'slap'));
  await p.locator('.focus__close').click();
  await p.waitForTimeout(1300);
  ok('close: slapped back on the wall', has(await heard(p), 'slap'));

  // the language switch: the knob clicks, the sheet is pulled across, the parts step into place
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(600);
  await heard(p);
  await p.click('.head__lang');
  await p.waitForTimeout(3600);
  s = await heard(p);
  ok(`switching language: knob, sheet and steps (${[...new Set(s)].join(', ')})`, has(s, 'knock', 'turn', 'tap'));

  // the switch turns it all off, and it stays off
  await p.click('.head__sound');
  await heard(p);
  await p.hover('.head__nav a:nth-of-type(3)');
  await p.waitForTimeout(600);
  ok('the sound switch silences the site', (await heard(p)).length === 0);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  ok('and it is remembered', await p.evaluate(() => document.querySelector('.head__sound').classList.contains('is-off')));
  await p.context().close();
}
{
  // the phone menu slides down
  const p = await open('/', { width: 390, height: 844 }, true, true);
  await p.waitForTimeout(2000);
  await p.tap('.hero');
  await p.waitForTimeout(200);
  await heard(p);
  await p.tap('.head__burger');
  await p.waitForTimeout(500);
  ok('the phone menu slides down', has(await heard(p), 'slide'));
  await p.context().close();
}
{
  // the gate: it tears, and the two halves slide apart off the screen
  const p = await open('/', { width: 1440, height: 900 }, false);
  await p.waitForTimeout(2200);
  const r = await p.locator('.gate__half--fa .gate__in').boundingBox();
  await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  await p.waitForTimeout(1600);
  const s = await heard(p);
  ok(`the language gate tears and slides apart (${[...new Set(s)].join(', ')})`, has(s, 'rip', 'slide'));
  await p.context().close();
}
ok(`no page errors${errors.length ? ': ' + [...new Set(errors)].slice(0, 3).join(' | ') : ''}`, !errors.length);
await b.close();
