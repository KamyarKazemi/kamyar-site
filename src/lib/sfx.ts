/**
 * The site's sounds: short recordings of paper, ink and a desk (public/sfx, credited there), one for each thing that happens. They are
 * loaded once and decoded up front; the browser only lets them be heard after the visitor's first tap or key, so until then they are
 * simply quiet. Each play varies its pitch a touch, so a sound repeated never sounds like a machine, and the ones that can fire in
 * bursts are spaced out. The visitor can turn them off, and that is remembered.
 */
export type Sfx = 'tap' | 'key' | 'pen' | 'stamp' | 'rip' | 'scrap' | 'turn' | 'knock' | 'deal' | 'peel' | 'swish' | 'slap' | 'slide';
const ALL: Sfx[] = ['tap', 'key', 'pen', 'stamp', 'rip', 'scrap', 'turn', 'knock', 'deal', 'peel', 'swish', 'slap', 'slide'];
// the least time between two of the same sound, in seconds
const GAP: Partial<Record<Sfx, number>> = { tap: 0.07, key: 0.035, scrap: 0.06, pen: 0.12, deal: 0.05 };
const KEY = 'kk-sound';

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
const bank = new Map<Sfx, AudioBuffer>();
const last = new Map<Sfx, number>();
let off = (() => { try { return localStorage.getItem(KEY) === 'off'; } catch { return false; } })();
const listeners = new Set<(off: boolean) => void>();
// set by the visitor's first press: before it, sounds are not even queued
let woken = false;

/** Gets the sounds ready. Safe to call more than once; the first tap or key anywhere lets them be heard. */
export function primeSfx(): void {
  if (ctx || typeof AudioContext === 'undefined') return;
  ctx = new AudioContext();
  out = ctx.createGain();
  out.gain.value = off ? 0 : 0.7;
  out.connect(ctx.destination);
  for (const name of ALL) {
    void fetch(`/sfx/${name}.mp3`).then((r) => r.arrayBuffer()).then((b) => ctx!.decodeAudioData(b)).then((buf) => bank.set(name, buf)).catch(() => {});
  }
  const wake = () => { woken = true; void ctx?.resume(); };
  for (const type of ['pointerdown', 'keydown', 'touchend'] as const) addEventListener(type, wake, { capture: true, passive: true });
}

/** Plays a sound: `level` 0–1, `rate` its speed (higher is higher pitched), nudged a little each time unless `exact`. */
export function sfx(name: Sfx, level = 1, rate = 1, exact = false): void {
  if (!ctx || !out || off) return;
  // the first press wakes the sound, but waking takes a moment; a sound asked for in that moment waits for it instead of being lost
  if (ctx.state !== 'running') {
    if (woken) void ctx.resume().then(() => { if (ctx?.state === 'running') sfx(name, level, rate, exact); });
    return;
  }
  const buf = bank.get(name), now = ctx.currentTime;
  if (!buf || now - (last.get(name) ?? -1) < (GAP[name] ?? 0.02)) return;
  last.set(name, now);
  const src = ctx.createBufferSource(), gain = ctx.createGain();
  src.buffer = buf;
  src.playbackRate.value = exact ? rate : rate * (0.94 + Math.random() * 0.12);
  gain.gain.value = level;
  src.connect(gain).connect(out);
  src.start();
  // the tests read what played
  if (import.meta.env.DEV) ((window as unknown as { __sfx?: string[] }).__sfx ??= []).push(name);
}

export const sfxOff = (): boolean => off;

/** Turns the sounds off or on, remembers it, and tells whoever is showing the switch. */
export function setSfxOff(next: boolean): void {
  off = next;
  try { localStorage.setItem(KEY, next ? 'off' : 'on'); } catch { /* private window: it resets next visit */ }
  if (ctx && out) out.gain.setTargetAtTime(next ? 0 : 0.7, ctx.currentTime, 0.03);
  listeners.forEach((fn) => fn(next));
}

export function onSfxChange(fn: (off: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
