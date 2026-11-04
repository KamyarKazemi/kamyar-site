import { gsap } from '../lib/gsap';
import { stepped } from '../lib/paper';
import type { Hit } from './sound';

/**
 * The live greeting is the reel's 3D paper world built in the page instead of rendered to video: a ruled paper floor with a red dashed
 * route, and stations standing on it, one for each thing he says. His recorded voice is the tape (public/live/voice/greeting.mp3), and
 * every station rises on the word it belongs to (word times from work/voice/greeting.json). It all sits on one paused timeline, so the
 * tape can play it, stop it, run it backwards or drag it to any moment, and the voice goes with it.
 *
 * World units are pixels. x runs right, y runs down (the floor is y = 0, the eye stands above it), z comes towards the viewer, so the
 * route leads into negative z.
 */

export const EYE = -260;
/** The radius of the three red dots. */
export const DOT = 40;
/** The giant timeline board: its size, and where its legs stand. */
export const BOARD = { w: 1300, h: 300, top: 40, bottom: 200, legs: [130, 1170] } as const;
/** How far down the route the floor goes. */
export const FLOOR_END = -10400;

export interface Place { x: number; z: number; y?: number; ry?: number; s?: number }
export interface Layout {
  portrait: boolean;
  width: number;
  height: number;
  /** how far back the camera stands from what it looks at */
  dist: number;
  hi: Place; name: Place; me: Place; hiNote: Place;
  roles: (Place & { print?: Place; note: Place })[];
  portfolio: Place; portfolioNote: Place; works: Place[];
  mat: Place; heart: Place; matNote: Place;
  board: Place; live: Place; rec: Place; liveNote: Place; play: Place;
  come: Place; dots: Place[];
  route: [number, number][];
}

/** Where everything stands. A phone is narrow, so there things are stacked rather than side by side, and the camera stands further back. */
export function layout(portrait: boolean): Layout {
  const s = portrait ? 0.55 : 1;
  // the three roles: side by side on a wide screen, a list of three lines on a phone
  const roles = portrait
    ? [-720, -440, -160].map((y) => ({ x: 0, y, z: -2900, note: { x: 0, y: y - 210, z: -2905 } }))
    : [-540, 0, 540].map((x, i) => ({ x, z: -2900 - i * 120, ry: -x / 40, print: { x: x + (i - 1) * 40, y: -380, z: -3040 - i * 120, ry: -x / 40 }, note: { x, y: -290, z: -2905 - i * 120, ry: -x / 40 } }));
  // his work, standing in a row like prints on a wall (two rows on a phone)
  const works = portrait
    ? [[-185, -740], [185, -740], [-185, -300], [185, -300]].map(([x, y]) => ({ x: x!, y: y!, z: -4550 }))
    : [-570, -190, 190, 570].map((x) => ({ x, y: -110, z: -4600, ry: -x / 60 }));
  return {
    portrait,
    width: portrait ? 900 : 1600,
    height: portrait ? 1600 : 900,
    dist: portrait ? 1650 : 1050,
    hi: { x: -140 * s, z: -1400, ry: -6 },
    name: { x: 420 * s, z: -1620, ry: -10, ...(portrait ? { y: 0, x: -60 } : {}) },
    me: portrait ? { x: 200, z: -2050, ry: -8 } : { x: 820, z: -1820, ry: -14 },
    hiNote: { x: -500 * s, z: -1420, y: -430, ry: -6 },
    roles,
    portfolio: { x: 0, z: -3980, y: portrait ? -40 : 0 },
    portfolioNote: { x: 0, z: -3990, y: portrait ? -210 : -160 },
    works,
    mat: { x: 0, z: -5700, ...(portrait ? { s: 0.82 } : {}) },
    heart: { x: 280 * s, z: -5620 },
    matNote: { x: 0, z: -6020, y: 0 },
    board: { x: 0, z: -7300, ...(portrait ? { s: 0.78 } : {}) },
    live: { x: -170, z: -6950, ry: 6, s: 0.82, ...(portrait ? { x: 0, y: -280, z: -7240, s: 1 } : {}) },
    rec: { x: 300 * s, z: -7010, y: -150, ry: 8, ...(portrait ? { x: 210, y: -95, z: -7280, ry: 0 } : {}) },
    liveNote: { x: -170, z: -6960, y: -290, ry: 6, ...(portrait ? { x: 0, y: -640, z: -7245, ry: 0 } : {}) },
    play: { x: 0, z: portrait ? -6700 : -7310, y: portrait ? 0 : -470 },
    come: { x: 60 * s, z: -9800, ry: 4 },
    dots: [0, 1, 2].map((i) => ({ x: (portrait ? -330 : -440) - i * 70 * s, z: -9780, y: -70, ry: 4 })),
    route: [[0, 600], [0, -900], [-90 * s, -1600], [-60 * s, -2400], [120 * s, -3400], [-40 * s, -4100], [60 * s, -5200], [-80 * s, -6200], [100 * s, -7000], [-60 * s, -8000], [60 * s, -9000], [0, -9800]],
  };
}

export const place = (p: Place, extra = '') => `translate3d(${p.x}px, ${p.y ?? 0}px, ${p.z}px) rotateY(${p.ry ?? 0}deg)${p.s ? ` scale(${p.s})` : ''}${extra}`;

/** One stretch of the red route, lying flat on the floor from its far end towards its near end. */
export function segment(far: [number, number], near: [number, number]) {
  const dx = near[0] - far[0], dz = near[1] - far[1];
  return { length: Math.hypot(dx, dz), transform: `translate3d(${far[0]}px, -1px, ${far[1]}px) rotateY(${(Math.atan2(dx, dz) * 180) / Math.PI}deg) rotateX(90deg)` };
}

/** The giant timeline board drawn for a sag (0 straight, 1 tired) and a playhead position (0–1): face, ticks, playhead, sweat. */
export function boardPaths(sag: number, head: number, drop: number) {
  const { w, top, bottom, legs } = BOARD, span = legs[1] - legs[0];
  // it hangs between its two legs: nothing at the legs, the most in the middle
  const dip = (x: number) => sag * 70 * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - legs[0]) / span)));
  const edge = (y: number) => Array.from({ length: 27 }, (_, i) => { const x = (i / 26) * w; return `${x.toFixed(1)} ${(y + dip(x)).toFixed(1)}`; });
  const face = `M${edge(top).join(' L')} L${edge(bottom).reverse().join(' L')}Z`;
  let ticks = '';
  for (let x = 30; x < w - 20; x += 20) { const y = bottom + dip(x), big = (x - 30) % 100 === 0; ticks += `M${x} ${y.toFixed(1)}V${(y - (big ? 46 : 22)).toFixed(1)}`; }
  const hx = 60 + head * (w - 120), hy = dip(hx);
  return {
    face, ticks,
    head: `M${hx.toFixed(1)} ${(top - 18 + hy).toFixed(1)}V${(bottom + 18 + hy).toFixed(1)}`,
    knob: `M${(hx - 16).toFixed(1)} ${(top - 34 + hy).toFixed(1)}H${(hx + 16).toFixed(1)}L${hx.toFixed(1)} ${(top - 12 + hy).toFixed(1)}Z`,
    drop: { x: w / 2 + 40, y: bottom + dip(w / 2) + 10 + drop * 240, o: drop > 0 && drop < 1 ? 1 : 0 },
  };
}

export interface Camera { x: number; y: number; z: number; rx: number; ry: number }
export interface Cue { t: number; hit: Hit; level?: number }

/**
 * The greeting, on his words (seconds into his recording):
 *   0.00  «سلام» — «سلام!» slams up            2.42  «من کامیار هستم» — «کامیار» and his engraved print
 *   3.36  «ادیتور» · 3.82 «فرانت‌اند دولوپر» · 4.74 «موشن دیزاینر» — the three roles, one on each word, each with its object
 *   6.02  «این پورتفولیوی منه…» — his real work stands up print by print
 *  11.24  «…وارد وب‌سایت بشی» — the doormat unrolls · 13.34 «خوشت بیاد» — a red heart lands on it
 *  14.20  «آه، راستی!» — the camera whips round · 16.38 «زنده» — the board, «زنده‌ست», REC · 17.94 «باهاش بازی کنی» — its playhead runs
 *  19.10  his voice has ended — «بفرما», three dots, and the dive into the last red dot
 */
export function buildScene(root: HTMLElement, L: Layout, cam: Camera, drawBoard: (sag: number, head: number, drop: number) => void): { tl: gsap.core.Timeline; cues: Cue[] } {
  const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const all = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
  const rise = stepped('back.out(1.7)', 7);
  const tl = gsap.timeline({ paused: true });
  const cues: Cue[] = [];
  const at = (p: Place, back = L.dist, dx = 0, y = EYE) => ({ x: p.x + dx, y, z: p.z + back });
  const cue = (t: number, hit: Hit, level = 1) => cues.push({ t, hit, level });

  Object.assign(cam, at(L.hi, L.dist + 700), { rx: -3, ry: 0 });

  // things are not there at all until their moment, then stand up off the floor; their shadow spreads as they rise
  tl.set(all('[data-rise]'), { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' }, 0);
  tl.set(all('.li-shade'), { scale: 0.2, autoAlpha: 0 }, 0);
  const up = (name: string, t: number, hit: Hit | null = 'pop', dur = 0.5) => {
    const el = root.querySelector<HTMLElement>(`[data-rise="${name}"]`);
    if (!el) return;
    const shade = el.parentElement!.querySelector('.li-shade');
    tl.set(el, { autoAlpha: 1 }, t).to(el, { rotationX: 0, duration: dur, ease: rise }, t);
    if (shade) tl.to(shade, { scale: 1, autoAlpha: 1, duration: dur, ease: 'power2.out' }, t);
    if (hit) cue(t, hit, hit === 'thud' ? 0.6 : 0.7);
  };
  // once up, nothing stands still: each piece breathes on its own small loop until the camera has passed it
  const breathe = (name: string, from: number, to: number, size = 1) => {
    const anchor = root.querySelector<HTMLElement>(`[data-rise="${name}"] .li-anchor`), n = Math.max(2, Math.round((to - from) / 0.9));
    if (!anchor) return;
    tl.fromTo(anchor, { y: 0, rotation: 0 }, { keyframes: { y: Array.from({ length: n + 1 }, (_, k) => (k % 2 ? -5 : 0) * size), rotation: Array.from({ length: n + 1 }, (_, k) => (k % 2 ? (k % 4 === 1 ? -0.7 : 0.6) : 0) * size), easeEach: 'sine.inOut' }, duration: to - from, ease: 'none', immediateRender: false }, from);
  };
  const note = (name: string, t: number) => { up(name, t, 'type', 0.3); };
  const fold = (names: string[], t: number) => {
    const els = names.map((n) => root.querySelector<HTMLElement>(`[data-rise="${n}"]`)).filter(Boolean) as HTMLElement[];
    tl.to(els, { rotationX: -90, duration: 0.3, ease: stepped('power2.in', 4) }, t).set(els, { autoAlpha: 0 }, t + 0.3);
  };

  // the route draws itself ahead of the camera
  all('.li-route b').forEach((seg, i, segs) => {
    tl.fromTo(seg, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'none' }, (i / segs.length) * 20);
  });

  // 1 — «سلام. … من کامیار هستم.»
  tl.to(cam, { ...at(L.hi), duration: 1.4, ease: 'power3.out' }, 0);
  cue(0, 'whoosh', 0.4);
  up('hi', 0.0, 'thud');
  breathe('hi', 0.6, 2.4, 1.2);
  tl.to(cam, { ...at(L.portrait ? L.name : { x: (L.name.x + L.me.x) / 2 - 120, z: L.name.z }, L.dist + (L.portrait ? 0 : 120)), ry: L.portrait ? 0 : -4, duration: 0.6, ease: 'power3.inOut' }, 2.1);
  fold(['hi'], 2.3);
  up('name', 2.42, 'thud');
  up('me', 2.55, 'flip', 0.55);
  note('hiNote', 2.7);
  breathe('name', 2.9, 3.3);

  // 2 — «ادیتور، فرانت‌اند دولوپر و موشن دیزاینر.» — a step back to see all three, each rises on its word
  tl.to(cam, { ...at(L.roles[1] ?? L.roles[0]!, L.dist * (L.portrait ? 1 : 1.35), 0, L.portrait ? EYE - 260 : EYE), rx: L.portrait ? -6 : -3, ry: 0, duration: 0.55, ease: 'power3.inOut' }, 2.95);
  cue(2.95, 'whoosh', 0.45);
  [3.32, 3.78, 4.7].forEach((t, i) => { up(`role${i}`, t, 'thud', 0.42); up(`print${i}`, t + 0.12, 'pop', 0.45); note(`rnote${i}`, t + 0.2); });
  tl.to(cam, { z: `-=${120}`, duration: 0.9, ease: 'sine.inOut' }, 4.6);

  // 3 — «این پورتفولیوی منه و اینجا به اطلاعاتی که درباره‌ی من نیاز داری…» — his work stands up, print by print
  tl.to(cam, { ...at(L.portfolio, L.dist * (L.portrait ? 1.05 : 1.25), L.portrait ? 0 : -260), rx: -4, ry: 0, duration: 0.8, ease: 'power3.inOut' }, 5.4);
  cue(5.4, 'whoosh', 0.45);
  up('portfolio', 6.0, 'thud', 0.45);
  note('portfolioNote', 6.3);
  [6.56, 7.02, 7.5, 8.36].forEach((t, i) => up(`work${i}`, t, 'flip', 0.5));
  tl.to(cam, { x: L.portrait ? 0 : 260, z: L.portfolio.z + L.dist * (L.portrait ? 1.05 : 1.25) - 220, duration: 4.4, ease: 'sine.inOut' }, 6.2);
  breathe('portfolio', 6.6, 10.4);

  // 4 — «حالا راحت می‌تونی وارد وب‌سایت بشی. امیدوارم که ازش خوشت بیاد.» — the doormat, then a heart on it
  tl.to(cam, { ...at(L.mat, L.dist * 0.82, 0, EYE - 520), rx: -30, ry: 0, duration: 0.9, ease: 'power3.inOut' }, 10.5);
  cue(10.5, 'whoosh', 0.45);
  tl.set(q('.li-mat'), { autoAlpha: 0, scaleY: 0 }, 0).set(q('.li-mat'), { autoAlpha: 1 }, 11.2)
    .to(q('.li-mat'), { scaleY: 1, duration: 0.6, ease: stepped('power2.out', 7) }, 11.2);
  cue(11.2, 'rustle');
  up('heart', 13.3, 'pop', 0.4);
  note('matNote', 12.0);
  tl.to(cam, { z: L.mat.z + L.dist * 0.82 - 120, duration: 2.6, ease: 'sine.inOut' }, 11.4);

  // 5 — «آه، راستی! یه چیز دیگه. این یه تایم‌لاین زنده‌ست. برای همین می‌تونی یکم باهاش بازی کنی.»
  // the "oh, wait" is a whip: the camera swings round, overshoots, and comes back onto the board
  const boardBack = L.portrait ? 1 : 1.25;
  tl.to(cam, { ...at(L.board, L.dist * boardBack, 0, EYE - 40), rx: -4, duration: 0.75, ease: 'power3.inOut' }, 14.15)
    .to(cam, { keyframes: { ry: [0, -16, 9, -3, 0], easeEach: 'sine.inOut' }, duration: 0.95, ease: 'none' }, 14.15);
  cue(14.15, 'whoosh', 0.8);
  cue(14.2, 'glitch', 0.35);
  up('board', 15.6, 'thud', 0.5);
  note('liveNote', 15.9);
  up('live', 16.3, 'thud', 0.5);
  up('rec', 16.55, 'pop', 0.3);
  tl.fromTo(q('.li-rec'), { opacity: 1 }, { opacity: 0.15, duration: 0.3, ease: 'steps(1)', repeat: 3, yoyo: true, immediateRender: false }, 16.9);
  const board = { sag: 0, head: 0.62, drop: 0 }, redraw = () => drawBoard(board.sag, board.head, board.drop);
  up('play', 17.4, 'pop', 0.45);
  tl.to(board, { head: 0.15, duration: 0.55, ease: 'power2.inOut', onUpdate: redraw }, 17.6)
    .to(board, { head: 0.9, duration: 0.65, ease: 'power2.inOut', onUpdate: redraw }, 18.15)
    .to(board, { head: 0.5, duration: 0.4, ease: 'power2.inOut', onUpdate: redraw }, 18.8);
  tl.to(q('.li-deck'), { '--nudge': '-46px', duration: 0.55, ease: 'power2.inOut' }, 17.6)
    .to(q('.li-deck'), { '--nudge': '46px', duration: 0.65, ease: 'power2.inOut' }, 18.15)
    .to(q('.li-deck'), { '--nudge': '0px', duration: 0.4, ease: 'power2.inOut' }, 18.8);
  cue(17.6, 'flip', 0.45); cue(18.15, 'flip', 0.45);
  tl.to(cam, { z: L.board.z + L.dist * boardBack - 140, duration: 3.4, ease: 'sine.inOut' }, 14.9);
  breathe('live', 16.9, 18.9, 1.2);

  // and in, right after his last word: «بفرما», three dots, and the camera walks into the last one
  tl.to(cam, { ...at(L.come, L.dist + 80), rx: -3, ry: -2, duration: 0.9, ease: 'power3.inOut' }, 19.1);
  cue(19.1, 'whoosh', 0.5);
  up('come', 19.65, 'thud', 0.5);
  L.dots.forEach((_, i) => up(`dot${i}`, 19.9 + i * 0.16, 'pop', 0.25));
  const last = L.dots[2]!;
  tl.to(cam, { x: last.x, y: (last.y ?? 0) - DOT, z: last.z + 24, rx: 0, ry: -last.ry!, duration: 1.3, ease: 'power3.in' }, 20.4);
  cue(20.4, 'whoosh', 0.8);
  tl.fromTo(q('.li-red'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'none' }, 21.7 - 0.08);

  cues.sort((x, y) => x.t - y.t);
  tl.set({}, {}, 21.7);
  // run it once through and back, so every piece starts in its first state before the tape moves
  tl.progress(1, true).progress(0, true);
  redraw();
  return { tl, cues };
}

/** The camera as a transform on the world: the eye stands `perspective` in front of the screen, looking from `cam`. */
export const lens = (cam: Camera, perspective: number) =>
  `translateZ(${perspective}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) translate3d(${-cam.x}px, ${-cam.y}px, ${-cam.z}px)`;

/** The hand holding the camera: a slow drift that never stops, made from the playhead so it runs backwards with the tape. */
export const drift = (t: number, shake: number): Camera => ({
  x: 9 * Math.sin(t * 0.83) + 4 * Math.sin(t * 1.9) + shake * Math.sin(t * 37),
  y: 6 * Math.sin(t * 1.13 + 1) + shake * 0.7 * Math.sin(t * 43 + 2),
  z: 0,
  rx: 0.35 * Math.sin(t * 0.97 + 2),
  ry: 0.55 * Math.sin(t * 0.61) + shake * 0.04 * Math.sin(t * 29),
});
