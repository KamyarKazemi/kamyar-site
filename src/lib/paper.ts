import { gsap } from './gsap';

/** The house rule for paper: it moves in twelve poses a second, like the reel, never in smooth web easing. */
export const POSE = 1 / 12;

/** Any ease, held in n poses. */
export function stepped(ease: string, n: number): (t: number) => number {
  const curve = gsap.parseEase(ease);
  return (t) => curve(Math.round(t * n) / n);
}

const lehmer = (seed: number) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

/** One torn line down the height of an element, as x offsets in percent. Seeded, so the same tear happens every time. */
export function jag(seed: number, rows = 16, amount = 2.6): number[] {
  const r = lehmer(seed * 7919 + 17);
  return Array.from({ length: rows }, () => (r() - 0.5) * amount * 2);
}

const pair = (x: number, y: number, flip: boolean) => `${(flip ? 100 - x : x).toFixed(2)}% ${y.toFixed(2)}%`;

/**
 * The paper left behind a tear. `edge` runs from 0 (nothing torn) to 100 along the reading direction, and everything after the edge stays.
 * `flip` is for right-to-left pages, where the tear starts on the right.
 */
export function remains(edge: number, line: number[], flip: boolean): string {
  const rows = line.length - 1;
  const torn = line.map((j, i) => pair(edge + j, (i / rows) * 100, flip));
  return `polygon(${[...torn, pair(130, 100, flip), pair(130, 0, flip)].join(',')})`;
}

/** The band of paper folded back at the tear, `width` percent wide. */
export function flap(edge: number, width: number, line: number[], flip: boolean): string {
  const rows = line.length - 1;
  const near = line.map((j, i) => pair(edge + j, (i / rows) * 100, flip));
  const far = line.map((j, i) => pair(edge - width * (0.72 + 0.28 * Math.sin(i * 1.7)) - j * 0.4, (i / rows) * 100, flip)).reverse();
  return `polygon(${[...near, ...far].join(',')})`;
}
