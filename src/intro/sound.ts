/**
 * The greeting's sound: real paper and air from the sound library (public/live/sfx, credited there), each also turned round so it
 * plays backwards when the tape rewinds, a quiet room under everything, and the whir of a tape spooling, made in the browser.
 */
export type Hit = 'pop' | 'thud' | 'whoosh' | 'flip' | 'rustle' | 'glitch' | 'type';
const HITS: Hit[] = ['pop', 'thud', 'whoosh', 'flip', 'rustle', 'glitch', 'type'];

const lehmer = (seed: number) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 * 2 - 1; };

export class TapeSound {
  private ctx: AudioContext;
  private out: GainNode;
  private bank = new Map<string, AudioBuffer>();
  private whir: { gain: GainNode; band: BiquadFilterNode };
  private room: GainNode;

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

  // every sound forwards and backwards; the room tone loops under the whole greeting
  private async load(): Promise<void> {
    const get = async (name: string) => this.ctx.decodeAudioData(await (await fetch(`/live/sfx/${name}.mp3`)).arrayBuffer());
    await Promise.all(HITS.map(async (hit) => {
      const buf = await get(hit), back = this.ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
      for (let c = 0; c < buf.numberOfChannels; c++) back.copyToChannel(buf.getChannelData(c).slice().reverse(), c);
      this.bank.set(`${hit}>`, buf);
      this.bank.set(`${hit}<`, back);
    }));
    const room = this.ctx.createBufferSource();
    room.buffer = await get('room');
    room.loop = true;
    room.connect(this.room);
    room.start();
    this.room.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.8);
  }

  /** Browsers only allow sound after a tap; the language gate is that tap. */
  resume(): Promise<void> { return this.ctx.resume(); }

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

  /** How fast the tape is moving, signed; 1 is normal play. A tired tape groans: the spool drops low. */
  spool(rate: number, tired = false): void {
    const off = Math.abs(rate - 1) < 0.05 || Math.abs(rate) < 0.05, now = this.ctx.currentTime;
    this.whir.gain.gain.setTargetAtTime(off ? 0 : Math.min(0.35, 0.08 + Math.abs(rate) * 0.07), now, 0.04);
    this.whir.band.frequency.setTargetAtTime(tired ? 140 + Math.abs(rate) * 120 : 300 + Math.abs(rate) * 650, now, 0.05);
  }

  muted(on: boolean): void { this.out.gain.setTargetAtTime(on ? 0 : 0.9, this.ctx.currentTime, 0.05); }

  /** The room fades out as the greeting hands over to the site. */
  fade(): void { this.room.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); }

  close(): void { void this.ctx.close(); }
}
