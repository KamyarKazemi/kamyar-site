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
  /** the three dots trail the last word: on its left in Persian, on its right in English */
  come: Place; dots: Place[]; comeEn: Place; dotsEn: Place[];
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
    // on the doormat's front corner, clear of the word whichever language it is in
    heart: { x: 380 * s, z: -5560 },
    matNote: { x: 0, z: -6020, y: 0 },
    board: { x: 0, z: -7300, ...(portrait ? { s: 0.78 } : {}) },
    live: { x: -170, z: -6950, ry: 6, s: 0.82, ...(portrait ? { x: 0, y: -280, z: -7240, s: 1 } : {}) },
    rec: { x: 300 * s, z: -7010, y: -150, ry: 8, ...(portrait ? { x: 210, y: -95, z: -7280, ry: 0 } : {}) },
    liveNote: { x: -170, z: -6960, y: -290, ry: 6, ...(portrait ? { x: 0, y: -640, z: -7245, ry: 0 } : {}) },
    play: { x: 0, z: portrait ? -6700 : -7310, y: portrait ? 0 : -470 },
    come: { x: 60 * s, z: -9800, ry: 4 },
    dots: [0, 1, 2].map((i) => ({ x: (portrait ? -330 : -440) - i * 70 * s, z: -9780, y: -70, ry: 4 })),
    // "Come in" is wider than «بفرما», so in English the word stands further left to leave room for the dots on its right
    comeEn: { x: portrait ? -60 : -110, z: -9800, ry: 4 },
    dotsEn: [0, 1, 2].map((i) => ({ x: (portrait ? 310 : 440) + i * 70 * s, z: -9780, y: -70, ry: 4 })),
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

/** When things happen, from his words in each recording (seconds): the Persian and the English takes are different scripts. */
export interface Beats {
  /** his name, and with it the camera's step to it */
  name: number;
  rolesCam: number; roles: [number, number, number];
  portCam: number; portfolio: number; works: [number, number, number, number];
  matCam: number; mat: number; matNote: number; heart: number;
  /** the "by the way" whip onto the board */
  whip: number; board: number; live: number; play: number;
  /** the board's playhead runs: [when, where 0–1, how long] */
  heads: [number, number, number][];
  come: number; dive: number; end: number;
}

/**
 * Persian (public/live/voice/greeting.mp3):
 *   0.00 «سلام» · 2.42 «من کامیار» · 3.36 «ادیتور» · 3.82 «فرانت‌اند» · 4.74 «موشن» · 6.02 «این پورتفولیوی منه…»
 *   11.24 «…وارد وب‌سایت بشی» (the doormat) · 13.34 «خوشت بیاد» (the heart) · 14.20 «آه، راستی!» (the whip) · 16.38 «زنده» · 17.94 «باهاش بازی کنی»
 *   19.0 his voice ends: «بفرما», three dots, the dive
 * English (greeting-en.mp3):
 *   0.00 "Hey" · 2.46 "Kamyar" · 3.62 "editor" · 4.18 "front-end" · 5.34 "motion" · 6.68 "portfolio"
 *   9.88 "So, I hope you like it" (doormat, heart on "like") · 11.10 "By the way" (whip) · 12.08 "interactive timeline" · 13.62 "play with it"
 *   14.26–17.04 "It took a lot of time…" (the playhead keeps running) · 17.64 "proceed" · 18.36 "Bye for now" (the dive)
 */
export const BEATS: Record<'fa' | 'en', Beats> = {
  fa: {
    name: 2.42, rolesCam: 2.95, roles: [3.32, 3.78, 4.7], portCam: 5.4, portfolio: 6.0, works: [6.56, 7.02, 7.5, 8.36],
    matCam: 10.5, mat: 11.2, matNote: 12.0, heart: 13.3, whip: 14.15, board: 15.6, live: 16.3, play: 17.4,
    heads: [[17.6, 0.15, 0.55], [18.15, 0.9, 0.65], [18.8, 0.5, 0.4]],
    come: 19.1, dive: 20.4, end: 21.7,
  },
  en: {
    name: 2.42, rolesCam: 3.15, roles: [3.58, 4.14, 5.3], portCam: 5.95, portfolio: 6.62, works: [7.2, 7.7, 8.2, 8.9],
    matCam: 9.25, mat: 9.9, matNote: 10.2, heart: 10.55, whip: 11.0, board: 11.85, live: 12.1, play: 13.55,
    heads: [[13.7, 0.15, 0.55], [14.25, 0.9, 0.65], [14.9, 0.3, 0.6], [15.5, 0.8, 0.6], [16.1, 0.5, 0.5]],
    come: 17.05, dive: 18.35, end: 19.65,
  },
};

/** The greeting in one language, on its own recording's beats; the dots and «بفرما» / "Come in" stand on that language's side. */
export function buildScene(root: HTMLElement, L: Layout, cam: Camera, drawBoard: (sag: number, head: number, drop: number) => void, lang: 'fa' | 'en'): { tl: gsap.core.Timeline; cues: Cue[] } {
  const B = BEATS[lang], rtl = lang === 'fa';
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
    tl.fromTo(seg, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'none' }, (i / segs.length) * (B.end - 1.7));
  });

  // 1 — hello, and his name
  tl.to(cam, { ...at(L.hi), duration: 1.4, ease: 'power3.out' }, 0);
  cue(0, 'whoosh', 0.4);
  up('hi', 0.0, 'thud');
  breathe('hi', 0.6, B.name, 1.2);
  tl.to(cam, { ...at(L.portrait ? L.name : { x: (L.name.x + L.me.x) / 2 - 120, z: L.name.z }, L.dist + (L.portrait ? 0 : 120)), ry: L.portrait ? 0 : -4, duration: 0.6, ease: 'power3.inOut' }, B.name - 0.32);
  fold(['hi'], B.name - 0.12);
  up('name', B.name, 'thud');
  up('me', B.name + 0.13, 'flip', 0.55);
  note('hiNote', B.name + 0.28);
  breathe('name', B.name + 0.48, B.rolesCam + 0.35);

  // 2 — the three roles: a step back to see all three, each rises on its word
  tl.to(cam, { ...at(L.roles[1] ?? L.roles[0]!, L.dist * (L.portrait ? 1 : 1.35), 0, L.portrait ? EYE - 260 : EYE), rx: L.portrait ? -6 : -3, ry: 0, duration: 0.55, ease: 'power3.inOut' }, B.rolesCam);
  cue(B.rolesCam, 'whoosh', 0.45);
  B.roles.forEach((t, i) => { up(`role${i}`, t, 'thud', 0.42); up(`print${i}`, t + 0.12, 'pop', 0.45); note(`rnote${i}`, t + 0.2); });
  tl.to(cam, { z: `-=${120}`, duration: 0.9, ease: 'sine.inOut' }, B.roles[2] - 0.1);

  // 3 — his portfolio: his work stands up, print by print
  tl.to(cam, { ...at(L.portfolio, L.dist * (L.portrait ? 1.05 : 1.25), L.portrait ? 0 : -260), rx: -4, ry: 0, duration: 0.8, ease: 'power3.inOut' }, B.portCam);
  cue(B.portCam, 'whoosh', 0.45);
  up('portfolio', B.portfolio, 'thud', 0.45);
  note('portfolioNote', B.portfolio + 0.3);
  B.works.forEach((t, i) => up(`work${i}`, t, 'flip', 0.5));
  tl.to(cam, { x: L.portrait ? 0 : 260, z: L.portfolio.z + L.dist * (L.portrait ? 1.05 : 1.25) - 220, duration: B.matCam - B.portfolio - 0.1, ease: 'sine.inOut' }, B.portfolio + 0.2);
  breathe('portfolio', B.portfolio + 0.6, B.matCam - 0.1);

  // 4 — the doormat, then a heart on it
  tl.to(cam, { ...at(L.mat, L.dist * 0.82, 0, EYE - 520), rx: -30, ry: 0, duration: 0.9, ease: 'power3.inOut' }, B.matCam);
  cue(B.matCam, 'whoosh', 0.45);
  tl.set(q('.li-mat'), { autoAlpha: 0, scaleY: 0 }, 0).set(q('.li-mat'), { autoAlpha: 1 }, B.mat)
    .to(q('.li-mat'), { scaleY: 1, duration: 0.6, ease: stepped('power2.out', 7) }, B.mat);
  cue(B.mat, 'rustle');
  up('heart', B.heart, 'pop', 0.4);
  note('matNote', B.matNote);
  tl.to(cam, { z: L.mat.z + L.dist * 0.82 - 120, duration: Math.max(0.6, B.whip - B.mat - 0.35), ease: 'sine.inOut' }, B.mat + 0.2);

  // 5 — "by the way": a whip, the camera swings round, overshoots and comes back onto the board; it is live, and you can play with it
  const boardBack = L.portrait ? 1 : 1.25;
  tl.to(cam, { ...at(L.board, L.dist * boardBack, 0, EYE - 40), rx: -4, duration: 0.75, ease: 'power3.inOut' }, B.whip)
    .to(cam, { keyframes: { ry: [0, -16, 9, -3, 0], easeEach: 'sine.inOut' }, duration: 0.95, ease: 'none' }, B.whip);
  cue(B.whip, 'whoosh', 0.8);
  cue(B.whip + 0.05, 'glitch', 0.35);
  up('board', B.board, 'thud', 0.5);
  note('liveNote', B.live - 0.4);
  up('live', B.live, 'thud', 0.5);
  up('rec', B.live + 0.25, 'pop', 0.3);
  tl.fromTo(q('.li-rec'), { opacity: 1 }, { opacity: 0.15, duration: 0.3, ease: 'steps(1)', repeat: 3, yoyo: true, immediateRender: false }, B.live + 0.6);
  const board = { sag: 0, head: 0.62, drop: 0 }, redraw = () => drawBoard(board.sag, board.head, board.drop);
  up('play', B.play, 'pop', 0.45);
  B.heads.forEach(([t, head, d], i, list) => {
    tl.to(board, { head, duration: d, ease: 'power2.inOut', onUpdate: redraw }, t)
      .to(q('.li-deck'), { '--nudge': `${Math.round((head - 0.5) * 92)}px`, duration: d, ease: 'power2.inOut' }, t);
    if (i < list.length - 1) cue(t, 'flip', 0.45);
  });
  tl.to(cam, { z: L.board.z + L.dist * boardBack - 140, duration: B.come - B.whip - 0.95, ease: 'sine.inOut' }, B.whip + 0.75);
  breathe('live', B.live + 0.6, B.come - 0.2, 1.2);

  // and in, right after his last word: «بفرما» / "Come in", three dots, and the camera walks into the last one
  const come = rtl ? L.come : L.comeEn, dots = rtl ? L.dots : L.dotsEn, last = dots[2]!;
  tl.to(cam, { ...at(come, L.dist + 80, rtl ? 0 : L.portrait ? 60 : 150), rx: -3, ry: -2, duration: 0.9, ease: 'power3.inOut' }, B.come);
  cue(B.come, 'whoosh', 0.5);
  up('come', B.come + 0.55, 'thud', 0.5);
  dots.forEach((_, i) => up(`dot${i}`, B.come + 0.8 + i * 0.16, 'pop', 0.25));
  tl.to(cam, { x: last.x, y: (last.y ?? 0) - DOT, z: last.z + 24, rx: 0, ry: -(last.ry ?? 0), duration: 1.3, ease: 'power3.in' }, B.dive);
  cue(B.dive, 'whoosh', 0.8);
  tl.fromTo(q('.li-red'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'none' }, B.end - 0.08);

  cues.sort((x, y) => x.t - y.t);
  tl.set({}, {}, B.end);
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
