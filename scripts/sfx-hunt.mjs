// Finds candidate sound effects on freesound: CC0 only, best rated first, short single sounds. Downloads the top few of each into
// work/sfx-cand/<event>/ with a list of where each came from, and a waveform strip per candidate for choosing by eye.
//   node scripts/sfx-hunt.mjs            (all events)      node scripts/sfx-hunt.mjs stamp rip   (some)
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

// what happens on the site, and what to look for: [search, longest acceptable duration in seconds]
const EVENTS = {
  hover: [['paper tap', 1.2], ['pencil tap', 1.2]],
  type: [['typewriter key', 1.2], ['typewriter single key', 1.5]],
  pen: [['pen scribble', 2.5], ['marker scribble paper', 2.5]],
  stamp: [['rubber stamp', 2], ['stamp paper', 2]],
  rip: [['paper tear', 2.5], ['paper rip', 2.5]],
  scrap: [['paper drop', 1.5], ['paper flutter', 2]],
  turn: [['page turn', 2], ['page flip', 2]],
  knock: [['toggle switch', 1], ['wood knock', 1]],
  deal: [['card deal', 1.5], ['card slide', 1.5]],
  peel: [['tape peel', 2], ['sticker peel', 2]],
  toss: [['paper whoosh', 1.5], ['swish', 1.2]],
  place: [['paper slap', 1.5], ['paper on table', 1.5]],
  sheet: [['paper slide', 2], ['paper unroll', 2.5]],
};

const pick = process.argv.slice(2);
const sources = [];
for (const [event, queries] of Object.entries(EVENTS)) {
  if (pick.length && !pick.includes(event)) continue;
  const dir = `work/sfx-cand/${event}`;
  mkdirSync(dir, { recursive: true });
  const seen = new Set();
  let n = 0;
  for (const [q, max] of queries) {
    const url = `https://freesound.org/search/?q=${encodeURIComponent(q)}&f=${encodeURIComponent('license:"Creative Commons 0"')}&s=Rating+highest+first`;
    const html = execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '--max-time', '25', url], { encoding: 'utf8', maxBuffer: 1 << 24 });
    // each result: its page link and title, its preview and its length, in page order
    const pages = [...html.matchAll(/<a class="bw-link--black" href="(\/people\/[^"]+\/sounds\/(\d+)\/)" title="([^"]*)"/g)].map((m) => ({ page: m[1], id: m[2], title: m[3] }));
    const mp3 = [...html.matchAll(/data-mp3="(https:\/\/cdn\.freesound\.org\/previews\/\d+\/(\d+)_\d+-lq\.mp3)"/g)].map((m) => ({ id: m[2], url: m[1].replace('-lq.mp3', '-hq.mp3') }));
    const dur = [...html.matchAll(/data-duration="([\d.]+)"/g)].map((m) => Number(m[1]));
    mp3.forEach((m, i) => {
      const p = pages.find((x) => x.id === m.id), d = dur[i];
      if (!p || seen.has(m.id) || !(d > 0.08 && d <= max) || n >= 6) return;
      seen.add(m.id);
      const file = `${dir}/${String(++n).padStart(2, '0')}-${m.id}.mp3`;
      execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', '--max-time', '30', '-o', file, m.url]);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-filter_complex', 'showwavespic=s=600x80:colors=black', '-frames:v', '1', file.replace('.mp3', '.png')]);
      sources.push({ event, file, title: p.title.replace(/&amp;/g, '&'), page: `https://freesound.org${p.page}`, duration: d });
      console.log(event.padEnd(6), d.toFixed(2).padStart(5), file, '|', p.title);
    });
  }
}
writeFileSync(`work/sfx-cand/sources${pick.length ? '-' + pick.join('-') : ''}.json`, JSON.stringify(sources, null, 2));
