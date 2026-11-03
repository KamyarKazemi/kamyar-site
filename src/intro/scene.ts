import { gsap } from '../lib/gsap';
import { stepped } from '../lib/paper';
import type { Hit } from './sound';

/**
 * The live greeting is the reel's 3D paper world built in the page instead of rendered to video: a ruled paper floor with a red
 * dashed route, and six stations standing on it, one for each line he says. Each rises off the floor as the camera reaches it. It all
 * sits on one paused timeline, so the tape can play it, stop it, run it backwards or drag it to any moment.
 *
 * World units are pixels. x runs right, y runs down (the floor is y = 0, the eye stands above it), z comes towards the viewer, so the
 * route leads into negative z. The timings are a draft until his recording exists; then each station moves to its word.
 */

export const EYE = -260;
/** The radius of the three red dots. */
export const DOT = 40;
/** The giant timeline board: its size, and where its legs stand. */
export const BOARD = { w: 1300, h: 300, top: 40, bottom: 200, legs: [130, 1170] } as const;

export interface Place { x: number; z: number; y?: number; ry?: number; s?: number }
export interface Layout {
  portrait: boolean;
  width: number;
  height: number;
  /** how far back the camera stands from what it looks at */
  dist: number;
  hi: Place; me: Place; hiNote: Place;
  mat: Place; matNote: Place;
  live: Place; rec: Place; liveNote: Place;
  board: Place; yours: Place; yoursNote: Place; tires: Place; tiresNote: Place;
  come: Place; dots: Place[]; comeNote: Place;
  route: [number, number][];
}

/** Where everything stands. A phone is narrow, so there the world closes in and the camera stands further back. */
export function layout(portrait: boolean): Layout {
  const s = portrait ? 0.55 : 1;
  return {
    portrait,
    width: portrait ? 900 : 1600,
    height: portrait ? 1600 : 900,
    dist: portrait ? 1650 : 1050,
    hi: { x: -40 * s, z: -1400, ry: -6 },
    me: { x: 470 * s, z: -1680, ry: -14 },
    hiNote: { x: -420 * s, z: -1420, y: -420, ry: -6 },
    mat: { x: 0, z: -2800, ...(portrait ? { s: 0.82 } : {}) },
    matNote: { x: 0, z: -3120, y: 0 },
    live: { x: -160 * s, z: -3900, ry: 8 },
    rec: { x: 330 * s, z: -3920, y: -150, ry: 8 },
    liveNote: { x: -160 * s, z: -3910, y: -330, ry: 8 },
    // on a phone the board is drawn smaller, so it fits across the screen
    board: { x: 0, z: -5300, ...(portrait ? { s: 0.78 } : {}) },
    yours: { x: 0, z: -5310, y: portrait ? -230 : -330 },
    yoursNote: { x: 0, z: -5320, y: portrait ? -400 : -470 },
    // it says it gets tired in the same place, once the line before has folded down
    tires: { x: 0, z: -5310, y: portrait ? -230 : -330 },
    tiresNote: { x: 0, z: -5320, y: portrait ? -400 : -470 },
    come: { x: 60 * s, z: -6900, ry: 4 },
    dots: [0, 1, 2].map((i) => ({ x: (portrait ? -330 : -440) - i * 70 * s, z: -6880, y: -70, ry: 4 })),
    comeNote: { x: 60 * s, z: -6920, y: -380, ry: 4 },
    route: [[0, 600], [0, -900], [-90 * s, -1600], [-60 * s, -2400], [120 * s, -3400], [-140 * s, -4400], [60 * s, -5600], [-80 * s, -6300], [0, -6900]],
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
 * The greeting. In seconds (a draft; his recording sets the real moments):
 *   0.00  the camera glides in over the floor, the route drawing itself ahead · «سلام!» slams up, his print stands beside it
 *   2.00  the camera looks down: a paper doormat unrolls, «خوش اومدی»
 *   3.60  «زنده‌ست» — LIVE, NOT A VIDEO, a red REC dot
 *   6.20  the giant timeline board: its playhead runs back, then forward — and the real one at the bottom nudges with it
 *  10.60  «زود خسته می‌شه»: the board sags in the middle, a drop of sweat falls
 *  12.80  «بفرما» and three dots; the camera walks into the last dot until the screen is red
 */
export function buildScene(root: HTMLElement, L: Layout, cam: Camera, drawBoard: (sag: number, head: number, drop: number) => void): { tl: gsap.core.Timeline; cues: Cue[] } {
  const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const all = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
  const rise = stepped('back.out(1.7)', 7);
  const tl = gsap.timeline({ paused: true });
  const cues: Cue[] = [];
  const at = (p: Place, back = L.dist, dx = 0, y = EYE) => ({ x: p.x + dx, y, z: p.z + back });
  const cue = (t: number, hit: Hit, level = 1) => cues.push({ t, hit, level });

  Object.assign(cam, at(L.hi, L.dist + 1500), { rx: -3, ry: 0 });

  // things are not there at all until their moment, then stand up off the floor; their shadow spreads as they rise
  tl.set(all('[data-rise]'), { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' }, 0);
  tl.set(all('.li-shade'), { scale: 0.2, autoAlpha: 0 }, 0);
  const up = (name: string, t: number, hit: Hit | null = 'pop', dur = 0.55) => {
    const el = q(`[data-rise="${name}"]`), shade = el.parentElement!.querySelector('.li-shade');
    tl.set(el, { autoAlpha: 1 }, t).to(el, { rotationX: 0, duration: dur, ease: rise }, t);
    if (shade) tl.to(shade, { scale: 1, autoAlpha: 1, duration: dur, ease: 'power2.out' }, t);
    if (hit) cue(t, hit, hit === 'thud' ? 0.7 : 0.8);
  };
  // once up, nothing stands still: each piece breathes on its own small loop until the camera has passed it
  const breathe = (name: string, from: number, to: number, size = 1) => {
    const anchor = q(`[data-rise="${name}"] .li-anchor`), n = Math.max(2, Math.round((to - from) / 0.9));
    tl.fromTo(anchor, { y: 0, rotation: 0 }, { keyframes: { y: Array.from({ length: n + 1 }, (_, k) => (k % 2 ? -5 : 0) * size), rotation: Array.from({ length: n + 1 }, (_, k) => (k % 2 ? (k % 4 === 1 ? -0.7 : 0.6) : 0) * size), easeEach: 'sine.inOut' }, duration: to - from, ease: 'none', immediateRender: false }, from);
  };
  const note = (name: string, t: number) => { up(name, t, 'type', 0.3); };

  // the route draws itself ahead of the camera
  all('.li-route b').forEach((seg, i, segs) => {
    tl.fromTo(seg, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'none' }, (i / segs.length) * 13);
  });

  // 1 — سلام!
  tl.to(cam, { ...at(L.hi), duration: 1.6, ease: 'power3.out' }, 0);
  cue(0, 'whoosh', 0.5);
  up('hi', 0.45, 'thud', 0.5);
  up('me', 0.8, 'flip', 0.6);
  note('hiNote', 1.15);
  tl.to(cam, { x: L.hi.x - 70, z: L.hi.z + L.dist - 140, ry: 3, duration: 0.6, ease: 'sine.inOut' }, 1.6);
  breathe('hi', 1.0, 2.6, 1.2);
  breathe('me', 1.4, 2.6);

  // 2 — خوش اومدی: the camera looks down at the floor, where a doormat unrolls towards it
  // it rises as it goes, so it passes over «سلام!» instead of through it
  tl.to(cam, { ...at(L.mat, L.dist * 0.82, 0, EYE - 520), rx: -30, ry: 0, duration: 0.9, ease: 'power3.inOut' }, 2.0);
  cue(2.0, 'whoosh', 0.45);
  tl.set(q('.li-mat'), { autoAlpha: 0, scaleY: 0 }, 0).set(q('.li-mat'), { autoAlpha: 1 }, 2.5)
    .to(q('.li-mat'), { scaleY: 1, duration: 0.6, ease: stepped('power2.out', 7) }, 2.5);
  cue(2.5, 'rustle');
  note('matNote', 3.0);
  tl.to(cam, { z: L.mat.z + L.dist * 0.82 - 90, duration: 0.7, ease: 'sine.inOut' }, 2.9);

  // 3 — زنده‌ست: NOT A VIDEO first, as he says it, then the word, then the REC dot starts blinking
  tl.to(cam, { ...at(L.live, L.dist, -60), rx: -3, ry: -4, duration: 0.9, ease: 'power3.inOut' }, 3.6);
  cue(3.6, 'whoosh', 0.5);
  note('liveNote', 4.3);
  up('live', 5.2, 'thud', 0.5);
  up('rec', 5.5, 'pop', 0.3);
  tl.fromTo(q('.li-rec'), { opacity: 1 }, { opacity: 0.15, duration: 0.3, ease: 'steps(1)', repeat: 3, yoyo: true, immediateRender: false }, 5.9);
  tl.to(cam, { x: L.live.x + 20, z: L.live.z + L.dist - 110, ry: 2, duration: 1.3, ease: 'sine.inOut' }, 4.6);
  breathe('live', 5.8, 7.0, 1.2);

  // 4 — the timeline is yours: the giant board stands up, its playhead runs back, then forward; the real one nudges with it
  const board = { sag: 0, head: 0.62, drop: 0 }, redraw = () => drawBoard(board.sag, board.head, board.drop);
  // a phone already stands further back, so it comes in closer to the board than a wide screen does
  const boardBack = L.portrait ? 1 : 1.25;
  tl.to(cam, { ...at(L.board, L.dist * boardBack, 0, EYE - 40), rx: -4, ry: 0, duration: 1.0, ease: 'power3.inOut' }, 6.2);
  cue(6.2, 'whoosh', 0.5);
  up('board', 7.0, 'thud', 0.6);
  up('yours', 7.5, 'pop', 0.45);
  tl.to(board, { head: 0.15, duration: 0.7, ease: 'power2.inOut', onUpdate: redraw }, 8.0)
    .to(board, { head: 0.92, duration: 0.8, ease: 'power2.inOut', onUpdate: redraw }, 8.8)
    .to(board, { head: 0.5, duration: 0.6, ease: 'power2.inOut', onUpdate: redraw }, 9.7);
  tl.to(q('.li-deck'), { '--nudge': '-46px', duration: 0.7, ease: 'power2.inOut' }, 8.0)
    .to(q('.li-deck'), { '--nudge': '46px', duration: 0.8, ease: 'power2.inOut' }, 8.8)
    .to(q('.li-deck'), { '--nudge': '0px', duration: 0.6, ease: 'power2.inOut' }, 9.7);
  cue(8.0, 'flip', 0.5); cue(8.8, 'flip', 0.5);
  note('yoursNote', 9.4);
  tl.to(cam, { z: L.board.z + L.dist * boardBack - 160, duration: 4.4, ease: 'sine.inOut' }, 7.2);

  // 5 — it gets tired: the line above the board folds down and the new one stands up in its place; the board sags between its legs
  // and a drop of sweat falls off it
  tl.to(all('[data-rise="yours"], [data-rise="yoursNote"]'), { rotationX: -90, duration: 0.3, ease: stepped('power2.in', 4) }, 11.1).set(all('[data-rise="yours"], [data-rise="yoursNote"]'), { autoAlpha: 0 }, 11.4);
  up('tires', 11.4, 'pop', 0.5);
  note('tiresNote', 11.6);
  tl.to(board, { sag: 1, duration: 0.6, ease: stepped('power2.in', 6), onUpdate: redraw }, 11.7);
  cue(11.7, 'rustle', 0.6);
  tl.to(board, { drop: 1, duration: 0.7, ease: 'power2.in', onUpdate: redraw }, 12.1);
  breathe('tires', 11.9, 12.9);

  // 6 — بفرما تو: the word, three dots, and the camera walks into the last one
  tl.to(cam, { ...at(L.come, L.dist + 80), rx: -3, ry: -2, duration: 1.0, ease: 'power3.inOut' }, 12.8);
  cue(12.8, 'whoosh', 0.5);
  up('come', 13.8, 'thud', 0.5);
  L.dots.forEach((_, i) => up(`dot${i}`, 14.1 + i * 0.18, 'pop', 0.25));
  note('comeNote', 14.3);
  breathe('come', 14.3, 14.9);
  const last = L.dots[2]!;
  tl.to(cam, { x: last.x, y: (last.y ?? 0) - DOT, z: last.z + 24, rx: 0, ry: -last.ry!, duration: 1.35, ease: 'power3.in' }, 14.9);
  cue(14.9, 'whoosh', 0.8);
  tl.fromTo(q('.li-red'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'none' }, 16.25 - 0.08);

  cues.sort((x, y) => x.t - y.t);
  tl.set({}, {}, 16.25);
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
