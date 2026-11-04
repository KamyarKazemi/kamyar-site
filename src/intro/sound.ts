/**
 * The greeting's sound. His voice is the tape itself: it plays in step with the playhead, backwards when the tape rewinds, higher and
 * faster when it runs fast, and stops when it stops. Over it, real paper and air from the sound library (public/live/sfx, credited there), each also turned round to play backwards, a quiet room under everything,
 * and the whir of a tape spooling, made in the browser.
 */
export type Hit = 'pop' | 'thud' | 'whoosh' | 'flip' | 'rustle' | 'glitch' | 'type';
const HITS: Hit[] = ['pop', 'thud', 'whoosh', 'flip', 'rustle', 'glitch', 'type'];
// the voice is put back in step when it has drifted this far from the playhead (seconds)
const DRIFT = 0.12;

const lehmer = (seed: number) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 * 2 - 1; };
const reversed = (ctx: AudioContext, buf: AudioBuffer) => {
  const back = ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
  for (let c = 0; c < buf.numberOfChannels; c++) back.copyToChannel(buf.getChannelData(c).slice().reverse(), c);
  return back;
};

interface Playing { node: AudioBufferSourceNode; gain: GainNode; dir: 1 | -1; at: number; from: number; rate: number }

export class TapeSound {
  private ctx: AudioContext;
  private out: GainNode;
  private bank = new Map<string, AudioBuffer>();
  private whir: { gain: GainNode; band: BiquadFilterNode };
  private room: GainNode;
  /** his voice in each language, forwards and turned round */
  private voices: Partial<Record<'fa' | 'en', [AudioBuffer, AudioBuffer]>> = {};
  private lang: 'fa' | 'en' = 'fa';
  private get voice(): [AudioBuffer, AudioBuffer] | null { return this.voices[this.lang] ?? null; }
  private speaking: Playing | null = null;
  private awake = false;
  private roomReady = false;

  constructor() {
    this.ctx = new AudioContext();
    this.out = this.ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(this.ctx.destination);
    this.room = this.ctx.createGain();
    this.room.gain.value = 0;
    this.room.connect(this.out);
    // the spool: looped noise through a band that rises with the speed, silent at normal play
    const rate = this.ctx.sampleRate, noise = this.ctx.createBuffer(1, rate * 2, rate), r = lehmer(7), d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = r();
    const src = this.ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 5;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(band).connect(gain).connect(this.out);
    src.start();
    this.whir = { gain, band };
    void this.load();
  }

  // every sound forwards and backwards, his voice both ways; the room tone loops under the whole greeting
  private async load(): Promise<void> {
    const get = async (path: string) => this.ctx.decodeAudioData(await (await fetch(path)).arrayBuffer());
    await Promise.all([
      ...HITS.map(async (hit) => {
        const buf = await get(`/live/sfx/${hit}.mp3`);
        this.bank.set(`${hit}>`, buf);
        this.bank.set(`${hit}<`, reversed(this.ctx, buf));
      }),
      ...(['fa', 'en'] as const).map(async (lang) => { const v = await get(`/live/voice/greeting${lang === 'en' ? '-en' : ''}.mp3`); this.voices[lang] = [v, reversed(this.ctx, v)]; }),
    ]);
    const room = this.ctx.createBufferSource();
    room.buffer = await get('/live/sfx/room.mp3');
    room.loop = true;
    room.connect(this.room);
    room.start();
    this.roomReady = true;
    if (this.awake) this.room.gain.setTargetAtTime(0.4, this.ctx.currentTime, 0.8);
  }

  /** Which recording the tape plays: Persian or English. */
  speak(lang: 'fa' | 'en'): void { if (lang !== this.lang) { this.hush(); this.lang = lang; } }

  /**
   * Browsers only allow sound after a tap; the language gate is that tap. The sound itself is made (and the voice decoded) before
   * it, while the gate is up: making an AudioContext takes a phone the better part of a second, which inside the tap froze the gate.
   */
  resume(): Promise<void> {
    this.awake = true;
    if (this.roomReady) this.room.gain.setTargetAtTime(0.4, this.ctx.currentTime, 0.8);
    return this.ctx.resume();
  }

  play(hit: Hit, backwards: boolean, speed: number, level = 1): void {
    const buf = this.bank.get(`${hit}${backwards ? '<' : '>'}`);
    if (!buf) return;
    const src = this.ctx.createBufferSource(), gain = this.ctx.createGain();
    src.buffer = buf;
    // a tape that runs faster plays higher, and slower lower
    src.playbackRate.value = Math.min(2.2, Math.max(0.55, speed));
    gain.gain.value = level;
    src.connect(gain).connect(this.out);
    src.start();
  }

  /**
   * Keeps his voice in step with the tape: where the playhead is (seconds) and how fast it moves, signed. A tape that stands still is
   * silent; one running backwards plays the voice backwards from the same moment; a jump or a change of direction starts it again there.
   */
  voiceAt(time: number, rate: number): void {
    if (!this.voice) return;
    const now = this.ctx.currentTime, speed = Math.abs(rate), dir: 1 | -1 = rate < 0 ? -1 : 1, length = this.voice[0].duration;
    const pace = Math.min(4, Math.max(0.25, speed));
    let p = this.speaking;
    if (p) {
      const at = p.from + p.dir * (now - p.at) * p.rate;
      if (speed < 0.08 || time >= length || p.dir !== dir || Math.abs(at - time) > DRIFT) { this.hush(); p = null; }
      else if (Math.abs(p.rate - pace) > 0.01) { Object.assign(p, { from: at, at: now, rate: pace }); p.node.playbackRate.setValueAtTime(pace, now); }
    }
    if (p || speed < 0.08 || time >= length - 0.02) return;
    const node = this.ctx.createBufferSource(), gain = this.ctx.createGain();
    node.buffer = this.voice[dir > 0 ? 0 : 1];
    node.playbackRate.value = pace;
    // a few milliseconds in, so starting mid-word never clicks
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + 0.012);
    node.connect(gain).connect(this.out);
    node.start(now, dir > 0 ? time : Math.max(0, length - time));
    this.speaking = { node, gain, dir, at: now, from: time, rate: pace };
  }

  private hush(): void {
    const p = this.speaking;
    if (!p) return;
    const now = this.ctx.currentTime;
    p.gain.gain.setTargetAtTime(0, now, 0.01);
    p.node.stop(now + 0.06);
    this.speaking = null;
  }

  /** How fast the tape is moving, signed; 1 is normal play. */
  spool(rate: number): void {
    const off = Math.abs(rate - 1) < 0.05 || Math.abs(rate) < 0.05, now = this.ctx.currentTime;
    this.whir.gain.gain.setTargetAtTime(off ? 0 : Math.min(0.3, 0.06 + Math.abs(rate) * 0.06), now, 0.04);
    this.whir.band.frequency.setTargetAtTime(300 + Math.abs(rate) * 650, now, 0.05);
  }

  muted(on: boolean): void { this.out.gain.setTargetAtTime(on ? 0 : 0.9, this.ctx.currentTime, 0.05); }

  /** The room fades out and the voice stops as the greeting hands over to the site. */
  fade(): void { this.room.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); this.hush(); }

  close(): void { void this.ctx.close(); }
}
