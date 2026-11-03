// How smooth the site and the greeting run on a phone: a 390×844 touch screen with the processor slowed 4×, frame times measured
// while the page scrolls and while the greeting plays. Prints the median and slow-frame share for each.
//   node scripts/phone-perf.mjs [base]
import { pathToFileURL } from 'node:url';
const { launch } = await import(pathToFileURL('C:/mydesk/Desktop/video-pipeline/video-projects/okala/scripts/_pw.mjs').href);
const base = process.argv[2] ?? 'http://localhost:5199';
const b = await launch();

async function phone(path, seen) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await ctx.addInitScript((seen) => { try { if (seen) localStorage.setItem('kk-seen', '1'); } catch {} }, seen);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  return p;
}
// frame intervals over `ms`, while `act` runs in the page
const frames = (p, ms) => p.evaluate((ms) => new Promise((done) => {
  const t = [], end = performance.now() + ms;
  const step = (now) => { t.push(now); if (now < end) requestAnimationFrame(step); else done(t.slice(1).map((v, i) => v - t[i])); };
  requestAnimationFrame(step);
}), ms);
const report = (name, d) => {
  const s = [...d].sort((a, b) => a - b), med = s[Math.floor(s.length / 2)], slow = d.filter((x) => x > 34).length / d.length;
  console.log(`${name.padEnd(28)} frames ${String(d.length).padStart(4)}  median ${med.toFixed(1)} ms  slow (>34 ms) ${(slow * 100).toFixed(0)}%  worst ${s.at(-1).toFixed(0)} ms`);
};

{
  const p = await phone('/', true);
  await p.waitForTimeout(2500);
  // scroll the whole page down in small steps, as a thumb would
  const run = frames(p, 6000);
  await p.evaluate(async () => { for (let i = 0; i < 120; i++) { scrollBy(0, 40); await new Promise((r) => setTimeout(r, 45)); } });
  report('site, scrolling', await run);
}
{
  const p = await phone('/intro', false);
  await p.waitForTimeout(1500);
  const r = await p.locator('.gate__half--fa .gate__in').boundingBox();
  await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  await p.waitForTimeout(1800);
  report('greeting, playing', await frames(p, 6000));
}
await b.close();
