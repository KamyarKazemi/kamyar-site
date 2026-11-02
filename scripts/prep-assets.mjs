// Turns the real work and fonts into web-weight files under public/. Textures come from make-textures.mjs.   node scripts/prep-assets.mjs
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), sharp = require('C:/mydesk/Desktop/video-pipeline/node_modules/sharp');

const VP = 'C:/mydesk/Desktop/video-pipeline/video-projects', K = `${VP}/kamyar-intro`;
mkdirSync('public/work', { recursive: true });

const WORK = {
  intro: `${K}/renders/intro-full-cover-v2.png`,
  cafe: 'C:/mydesk/Desktop/portfolio-cafe/cafe-story-v3.png',
  niloofar: 'C:/mydesk/Desktop/portfolio-niloofar/niloofar-story-v3.png',
  toolbox: `${VP}/toolbox-grid/posts/full_grid.png`,
  okala: 'C:/mydesk/Desktop/okala-poster-b/okala-poster-b.png',
};
for (const [n, f] of Object.entries(WORK)) {
  const b = await sharp(f).flatten({ background: '#f6f3ec' }).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 76 }).toFile(`public/work/${n}.webp`);
  console.log(n, b.width, b.height, Math.round(b.size / 1024) + 'KB');
}

// the reel itself, silent, for its row in the index
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-t', '12', '-i', `${K}/renders/intro-full-final-60fps-v2.mp4`, '-vf', 'scale=420:-2,fps=30', '-an', '-c:v', 'libx264', '-crf', '29', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'public/work/intro.mp4']);

// a lighter paper for phones
await sharp('public/tex/concrete.webp').resize(1024).webp({ quality: 56 }).toFile('public/tex/concrete-sm.webp');

// the woff2 font is generated once and committed; to remake it: npm i -D ttf2woff2, then uncomment
// writeFileSync('public/fonts/Lalezar-Regular.woff2', require('ttf2woff2')(readFileSync(`${K}/assets/fonts/Lalezar-Regular.ttf`)));
console.log('assets ready');
