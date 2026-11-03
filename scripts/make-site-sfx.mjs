// The site's sound effects: the chosen freesound candidates (CC0, from scripts/sfx-hunt.mjs) cut to one clean hit each, peak-levelled,
// and written to public/sfx/<name>.mp3 with a credits file. Every sound is a recording of paper, ink or a desk, like the site.
//   node scripts/make-site-sfx.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// name on the site: [candidate file, start, length, peak dB] — start/length in seconds after the leading silence is cut
const PICKS = {
  tap: ['hover/05-115496', 0, 0.25, -6],      // pointing at something: a pencil tapped on paper
  key: ['type/01-160678', 0, 0.18, -4],       // one typewriter key, for retyped lines
  pen: ['pen/01-761665', 0, 0.45, -5],        // the red pen drawing an underline
  stamp: ['stamp/01-470710', 0, 0.5, -1],     // a rubber stamp coming down on a button
  rip: ['rip/02-710163', 0, 0.45, -2],        // a red strip torn off a title
  scrap: ['scrap/01-406586', 0.09, 0.3, -8],    // a torn scrap landing
  turn: ['turn/01-755981', 0.18, 0.65, -3],       // the red sheet pulled across for the language switch
  knock: ['knock/06-335745', 0, 0.2, -4],     // the EN/FA knob pushed across
  deal: ['deal/01-787405', 0.22, 0.3, -4],      // a service card dealt onto the desk
  peel: ['peel/02-245199', 0.22, 0.5, -4],    // a print pulled off the wall
  swish: ['toss/04-667419', 0, 0.44, -5],     // a print tossed aside for the next one
  slap: ['place/02-67040', 0, 0.4, -3],       // a print put back on the wall
  slide: ['sheet/03-464302', 0.6, 0.8, -5],   // the menu sheet pulled down
};

const sources = JSON.parse(readFileSync('work/sfx-cand/sources.json', 'utf8'));
mkdirSync('public/sfx', { recursive: true });
const rows = [];
for (const [name, [cand, ss, len, peak]] of Object.entries(PICKS)) {
  const src = `work/sfx-cand/${cand}.mp3`, out = `public/sfx/${name}.mp3`, tmp = `work/sfx-cand/_${name}.wav`;
  // cut the silence in front, take the hit, fade its tail
  const fade = Math.min(0.12, len * 0.4);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-af', `silenceremove=start_periods=1:start_threshold=-48dB,atrim=start=${ss}:duration=${len},asetpts=N/SR/TB,afade=t=in:d=0.004,afade=t=out:st=${(len - fade).toFixed(3)}:d=${fade.toFixed(3)}`, '-ac', '1', '-ar', '44100', tmp]);
  // level it: the loudest point lands on its own target, so the quiet recordings are as present as the loud ones
  // ffmpeg reports the measurement on stderr
  const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', tmp, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const max = Number(/max_volume: (-?[\d.]+) dB/.exec(probe)?.[1] ?? 0);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-af', `volume=${(peak - max).toFixed(1)}dB`, '-c:a', 'libmp3lame', '-b:a', '96k', out]);
  const s = sources.find((x) => x.file.includes(cand));
  rows.push(`| ${name}.mp3 | "${s.title}" — ${s.page} | CC0 |`);
  console.log(name.padEnd(6), `${max} dB → ${peak} dB`, out);
}
writeFileSync('public/sfx/CREDITS.md', `# Sound credits

Every sound on the site is a freesound.org recording released under CC0 (no attribution needed), cut to one hit and levelled by
scripts/make-site-sfx.mjs. The sources are listed so each one can be traced.

| file | source | licence |
|---|---|---|
${rows.join('\n')}
`);
