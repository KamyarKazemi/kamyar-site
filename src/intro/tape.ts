import type { Groan, Reaction } from '../content/intro';
import { gsap } from '../lib/gsap';
import type { Cue } from './scene';
import type { TapeSound } from './sound';

export type TapeEvent = Reaction | Groan | 'end';

const SPIN = 3;           // how fast the tape runs while rewind or forward is held
const COOL = 1.8;         // seconds between two reactions, so he never talks over himself
const IDLE = 5;           // a pause this long and he asks whether you are still there
const WORN = 9;           // this much running off normal speed (seconds × speed) and the timeline is worn out
const REST = 3.4;         // how long a worn-out timeline only crawls
const CRAWL = 0.35;       // how fast it will go while it rests

/**
 * The transport. It owns the playhead and moves the paused timeline to it every frame, so the film can run at any speed in either
 * direction. Like a real tape it has weight: it spins up and slows down instead of jumping. Sounds on the way are played as the
 * playhead crosses them, backwards when it is going backwards. It also watches what the visitor does with it, and says so. Push it too hard, rewinding or fast-forwarding, and the timeline itself
 * wears out: it says so in its own words, crawls for a few seconds whatever you do, and then he says "told you".
 */
export class Tape {
  time = 0;
  rate = 0;
  playing = false;
  held: -1 | 0 | 1 = 0;
  private scrubbing = 0;          // seconds left of hand control after the last drag or wheel input
  private moved = 0;              // playhead movement by hand this frame
  private lastDir = 0;
  private flips: number[] = [];
  private rewinds = 0;
  private inRewind = false;
  private inForward = false;
  private still = 0;
  private quiet = -COOL;
  private ended = false;
  private started = false;      // nothing is watched until the tape first plays (the language gate is still up before that)
  private clock = 0;
  private drawnRate = NaN;     // the speed the world was last drawn at
  private effort = 0;
  private pushed = 0;            // which way it was last pushed: -1 back, 1 forward
  /** seconds left of rest while the timeline is worn out */
  tired = 0;
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

  /** Puts the playhead at a moment and draws it at once (the tests use this; a background tab gets no frames). */
  /** Draws the world again on the next frame, though nothing has moved (the screen changed size). */
  redraw(): void { this.drawnRate = NaN; }

  seek(time: number): void { this.time = time; this.rate = 0; this.drawnRate = 0; this.tl.time(time); this.frame(time, 0); }

  play(on: boolean): void { this.playing = on; this.still = 0; if (on) this.started = true; }

  hold(dir: -1 | 0 | 1): void { this.held = dir; }

  /** Moves the playhead by hand: dragging the film or the strip, or the wheel. */
  scrubBy(seconds: number): void { this.scrubbing = 0.14; this.moved += seconds; }
  scrubTo(time: number): void { this.scrubBy(time - this.time - this.moved); }

  private say(e: TapeEvent): void {
    // the end and the timeline's own complaints always come through; his asides wait their turn
    if (e !== 'end' && e !== 'tiredBack' && e !== 'tiredForward' && this.clock - this.quiet < COOL) return;
    this.quiet = this.clock;
    this.event(e);
  }

  private tick = (_t: number, ms: number): void => {
    const dt = Math.min(ms / 1000, 0.1), was = this.time;
    this.clock += dt;
    if (this.scrubbing > 0) {
      this.scrubbing -= dt;
      // worn out, it only gives a little under the hand
      this.time += this.tired > 0 ? this.moved * 0.25 : this.moved;
      // the speed the hand is moving it at, smoothed, drives the sound and the smear; capped, or a long jump on the strip
      // leaves so much speed behind that the tape slides on past where it was put
      const hand = Math.max(-2 * SPIN, Math.min(2 * SPIN, this.moved / Math.max(dt, 1e-3)));
      this.rate += (hand - this.rate) * 0.35;
      const dir = Math.sign(this.moved);
      if (dir && dir !== this.lastDir) { if (this.lastDir) this.flips.push(this.clock); this.lastDir = dir; }
      this.moved = 0;
    } else {
      const spin = this.tired > 0 ? CRAWL : SPIN, play = this.tired > 0 ? 0.6 : 1;
      const target = this.held ? this.held * spin : this.playing ? play : 0;
      this.rate += (target - this.rate) * (1 - Math.exp(-dt * 9));
      if (Math.abs(this.rate) < 0.01 && !target) this.rate = 0;
      this.time += this.rate * dt;
    }
    if (this.time <= 0 && was > 0) { this.time = 0; if (this.rate < 0) this.say('start'); }
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
      this.sound?.spool(this.rate, this.tired > 0);
      this.tl.time(this.time);
      this.frame(this.time, this.rate);
      this.drawnRate = this.rate;
    }
    this.watch(dt);
  };

  // what the visitor is doing, as reactions
  private watch(dt: number): void {
    // running hard either way wears the timeline out; normal play lets it get its breath back
    if (this.tired > 0) {
      this.tired -= dt;
      if (this.tired <= 0) { this.tired = 0; this.effort = 0; this.quiet = -COOL; this.drawnRate = NaN; this.say('told'); }
    } else if (this.rate < -0.6 || this.rate > 1.6) {
      // capped, so one long jump on the strip does not count as a marathon
      this.effort += Math.min(Math.abs(this.rate), 4) * dt;
      this.pushed = Math.sign(this.rate);
      if (this.effort > WORN) { this.tired = REST; this.drawnRate = NaN; this.say(this.pushed < 0 ? 'tiredBack' : 'tiredForward'); }
    } else this.effort = Math.max(0, this.effort - dt * 0.6);
    if (this.rate < -0.6 && !this.inRewind && this.time > 0.3) {
      this.inRewind = true;
      this.rewinds++;
      if (this.rewinds <= 2) this.say(this.rewinds === 1 ? 'rewind1' : 'rewind2');
    }
    if (this.rate > 0.2) this.inRewind = false;
    if (this.rate > 1.8 && !this.inForward) { this.inForward = true; if (!this.tired) this.say('forward'); }
    if (this.rate < 1.2) this.inForward = false;
    this.flips = this.flips.filter((t) => this.clock - t < 2.5);
    if (this.flips.length >= 4) { this.flips = []; this.say('dizzy'); }
    if (!this.started) return;
    const resting = !this.playing && !this.held && this.scrubbing <= 0 && !this.ended;
    this.still = resting ? this.still + dt : 0;
    if (this.still > IDLE) { this.still = -1e9; this.say('idle'); }
    if (this.time >= this.duration && !this.ended && this.scrubbing <= 0) { this.ended = true; this.say('end'); }
  }
}
