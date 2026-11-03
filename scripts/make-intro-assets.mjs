// The live greeting's prints, taken from the intro reel's project: each sticker trimmed to its paper and saved small as webp.
//   node scripts/make-intro-assets.mjs   (needs the video-pipeline checkout next to this one, for sharp and the sources)
import { createRequire } from 'node:module';
const require = createRequire('C:/mydesk/Desktop/video-pipeline/package.json');
const sharp = require('sharp');
const SRC = 'C:/mydesk/Desktop/video-pipeline/video-projects/kamyar-intro/assets/media2';
// only his print is used now; the four role objects of the first prototype are in archive/greeting-roles
const jobs = [
  ['trim/ch1-sticker-h.png', 'me', 900],
];
for (const [src, name, w] of jobs) {
  const buf = await sharp(`${SRC}/${src}`).trim({ threshold: 1 }).toBuffer();
  const info = await sharp(buf).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toFile(`public/live/${name}.webp`);
  console.log(name, info.width, info.height, info.size);
}
