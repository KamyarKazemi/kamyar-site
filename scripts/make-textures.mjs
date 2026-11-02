// The reel's two surfaces as seamless tiles, from the same 4K concrete scan: the cool grey wall, and the warm printed red.   node scripts/make-textures.mjs
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)('C:/mydesk/Desktop/video-pipeline/node_modules/sharp');

const SCAN = 'C:/mydesk/Desktop/video-pipeline/video-projects/day-in-my-life/design/layers/paper.png', P = 1024;
const crop = await sharp(SCAN).flatten({ background: '#fff' }).removeAlpha().extract({ left: 500, top: 1200, width: P, height: P }).png().toBuffer();
const tile = await sharp({ create: { width: P * 2, height: P * 2, channels: 3, background: '#fff' } }).composite([
  { input: crop, left: 0, top: 0 }, { input: await sharp(crop).flop().toBuffer(), left: P, top: 0 },
  { input: await sharp(crop).flip().toBuffer(), left: 0, top: P }, { input: await sharp(crop).flip().flop().toBuffer(), left: P, top: P },
]).png().toBuffer();

await sharp(tile).webp({ quality: 60 }).toFile('public/tex/wall.webp');
await sharp(tile).resize(1024).webp({ quality: 54 }).toFile('public/tex/wall-sm.webp');

const { data, info } = await sharp(tile).raw().toBuffer({ resolveWithObject: true });
const n = info.width * info.height, c = info.channels, mean = (() => { let s = 0; for (let i = 0; i < n; i++) s += data[i * c]; return s / n; })();
const red = Buffer.alloc(n * 3), RED = [206, 38, 30], PAPER = [240, 236, 226];
for (let i = 0; i < n; i++) {
  const l = data[i * c] / mean, show = Math.max(0, Math.min(1, (l - 1.1) * 3.2));
  for (let k = 0; k < 3; k++) red[i * 3 + k] = Math.max(0, Math.min(255, (RED[k] ?? 0) * (0.62 + 0.42 * l) * (1 - show) + (PAPER[k] ?? 0) * show));
}
await sharp(red, { raw: { width: info.width, height: info.height, channels: 3 } }).resize(1024).webp({ quality: 80, smartSubsample: true }).toFile('public/tex/ink-red.webp');
console.log('textures ready');
