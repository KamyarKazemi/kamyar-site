// Everything the paper motion needs, generated from the real work so it stays deterministic:
//   work/<id>-ink.webp  each print as a black and red halftone on paper
//   tex/bleed-blob.webp one ragged ink blot, grown as a mask to soak colour through a print
//   tex/edge.svg        a seamless torn edge
//   cursor/scissors.svg the cursor over the prints
//   node scripts/make-paper-assets.mjs
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)('C:/mydesk/Desktop/video-pipeline/node_modules/sharp');

mkdirSync('public/cursor', { recursive: true });
copyFileSync('archive/invoice-prototype/worn.webp', 'public/tex/worn.webp');

// ── halftone: ink and red plates, a 45° dot screen, on his paper ──
const W = 480, H = 853, CELL = 6, PAPER = [239, 235, 226], INK = [24, 22, 20], RED = [206, 38, 30];
for (const id of ['intro', 'cafe', 'niloofar', 'toolbox', 'okala']) {
  const { data } = await sharp(`public/work/${id}.webp`).flatten({ background: '#f6f3ec' }).resize(W, H, { fit: 'cover', position: 'top' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(W * H * 3), s = Math.SQRT1_2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3, r = data[i] ?? 0, g = data[i + 1] ?? 0, b = data[i + 2] ?? 0;
    const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255, warm = r - Math.max(g, b) > 42 && r > 96;
    const u = (x + y) * s, v = (x - y) * s, screen = 0.5 + 0.25 * (Math.cos((2 * Math.PI * u) / CELL) + Math.cos((2 * Math.PI * v) / CELL));
    const tone = warm ? Math.min(1, lum * 1.5) : Math.min(1, Math.max(0, (lum - 0.5) * 1.5 + 0.56));
    const col = tone > screen ? PAPER : warm ? RED : INK;
    out[i] = col[0] ?? 0; out[i + 1] = col[1] ?? 0; out[i + 2] = col[2] ?? 0;
  }
  const f = await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 72 }).toFile(`public/work/${id}-ink.webp`);
  console.log(id, Math.round(f.size / 1024) + 'KB');
}

// ── the ink blot: one ragged, soft-edged blot; grown smoothly as a mask, colour seems to soak through the print ──
const BN = 512, field = async (sigma, shift) => sharp({ create: { width: BN + shift, height: BN, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 90 } } }).extract({ left: shift, top: 0, width: BN, height: BN }).blur(sigma).normalise().greyscale().extractChannel(0).raw().toBuffer();
const [coarse, fine] = await Promise.all([field(10, 0), field(2.5, 7)]);
const blot = Buffer.alloc(BN * BN * 4);
for (let y = 0; y < BN; y++) for (let x = 0; x < BN; x++) {
  const i = y * BN + x, d = Math.hypot(x / BN - 0.5, y / BN - 0.5) * 2, edge = 0.78 + 0.28 * ((coarse[i] ?? 0) / 255 - 0.5) + 0.1 * ((fine[i] ?? 0) / 255 - 0.5);
  blot[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, (edge - d) / 0.06)) * 255);
}
const b = await sharp(blot, { raw: { width: BN, height: BN, channels: 4 } }).webp({ lossless: true }).toFile('public/tex/bleed-blob.webp');
console.log('blot', Math.round(b.size / 1024) + 'KB');

// ── the torn edge: filled below a jagged line that meets itself at both ends ──
let s = 1693; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
const EW = 1600, EH = 36, N = 150, ys = Array.from({ length: N }, (_, i) => 18 + Math.sin((i / N) * Math.PI * 2 * 3) * 5 + Math.sin((i / N) * Math.PI * 2 * 11) * 2.5 + (R() - 0.5) * 9);
ys[N - 1] = ys[0] ?? 18;
const path = `M0 ${EH}` + ys.map((y, i) => `L${((i / (N - 1)) * EW).toFixed(1)} ${y.toFixed(1)}`).join('') + `L${EW} ${EH}Z`;
writeFileSync('public/tex/edge.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${EW}" height="${EH}" viewBox="0 0 ${EW} ${EH}"><path d="${path}"/></svg>\n`);

// ── scissors ──
writeFileSync('public/cursor/scissors.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none"><g stroke="#181614" stroke-width="2.4" stroke-linecap="round"><path d="M31 5 13 21" /><path d="M31 31 13 15" /></g><g fill="#ce261e" stroke="#181614" stroke-width="2"><circle cx="8" cy="24" r="5" /><circle cx="8" cy="12" r="5" /></g><circle cx="19.6" cy="18" r="1.6" fill="#f6f3ec" stroke="#181614" stroke-width="1.2" /></svg>\n`);
console.log('paper assets ready');
