import { gsap } from '../lib/gsap';
import type { Cue } from './scene';
import type { TapeSound } from './sound';

export type TapeEvent = 'end';

const SPIN = 3;           // how fast the tape runs while rewind or forward is held

/**
 * The transport. It owns the playhead and moves the paused timeline to it every frame, so the film can run at any speed in either
 * direction. Like a real tape it has weight: it spins up and slows down instead of jumping. Sounds on the way are played as the
 * playhead crosses them, backwards when it is going backwards, and his voice follows the playhead.
 */
export class Tape {
  time = 0;
  rate = 0;
  playing = false;
  held: -1 | 0 | 1 = 0;
  private scrubbing = 0;          // seconds left of hand control after the last drag or wheel input
  private moved = 0;              // playhead movement by hand this frame
  private ended = false;
  private drawnRate = NaN;     // the speed the world was last drawn at
  readonly duration: number;

  constructor(
    private tl: gsap.core.Timeline,
    private cues: Cue[],
    private frame: (time: number, rate: number) => void,
    private event: (e: TapeEvent) => void,
    public sound: TapeSound | null,
  ) {
    this.duration = tl.duration();
    gsap.ticker.add(this.tick);
  }

  stop(): void { gsap.ticker.remove(this.tick); }

  /** Draws the world again on the next frame, though nothing has moved (the screen changed size). */
  redraw(): void { this.drawnRate = NaN; }

  /** Puts the playhead at a moment and draws it at once (the tests use this; a background tab gets no frames). */
  seek(time: number): void { this.time = time; this.rate = 0; this.drawnRate = 0; this.tl.time(time); this.frame(time, 0); }

  play(on: boolean): void { this.playing = on; }

  hold(dir: -1 | 0 | 1): void { this.held = dir; }

  /** Moves the playhead by hand: dragging the film or the strip, or the wheel. */
  scrubBy(seconds: number): void { this.scrubbing = 0.14; this.moved += seconds; }
  scrubTo(time: number): void { this.scrubBy(time - this.time - this.moved); }

  private tick = (_t: number, ms: number): void => {
    const dt = Math.min(ms / 1000, 0.1), was = this.time;
    if (this.scrubbing > 0) {
      this.scrubbing -= dt;
      this.time += this.moved;
      // the speed the hand is moving it at, smoothed, drives the sound and the smear; capped, or a long jump on the strip
      // leaves so much speed behind that the tape slides on past where it was put
      const hand = Math.max(-2 * SPIN, Math.min(2 * SPIN, this.moved / Math.max(dt, 1e-3)));
      this.rate += (hand - this.rate) * 0.35;
      this.moved = 0;
    } else {
      const target = this.held ? this.held * SPIN : this.playing ? 1 : 0;
      this.rate += (target - this.rate) * (1 - Math.exp(-dt * 9));
      if (Math.abs(this.rate) < 0.01 && !target) this.rate = 0;
      this.time += this.rate * dt;
    }
    this.time = Math.min(this.duration, Math.max(0, this.time));
    if (this.time <= 0 && this.rate < 0) this.rate = 0;

    // the sounds on the way: skipped when the playhead jumps, or there would be a burst of them
    const span = this.time - was;
    if (this.sound && span && Math.abs(span) < 0.6) {
      const lo = Math.min(was, this.time), hi = Math.max(was, this.time), back = span < 0;
      for (const c of this.cues) if (c.t > lo && c.t <= hi) this.sound.play(c.hit, back, Math.abs(this.rate) || 1, c.level ?? 1);
    }
    // his voice is the tape: it follows the playhead every frame, forwards, backwards or still
    this.sound?.voiceAt(this.time, this.time >= this.duration ? 0 : this.rate);
    // a tape standing still has nothing new to draw: the world is only redrawn when the playhead or its speed has moved
    if (span || this.rate !== this.drawnRate) {
      this.sound?.spool(this.rate);
      this.tl.time(this.time);
      this.frame(this.time, this.rate);
      this.drawnRate = this.rate;
    }
    if (this.time >= this.duration && !this.ended && this.scrubbing <= 0) { this.ended = true; this.event('end'); }
  };
}
