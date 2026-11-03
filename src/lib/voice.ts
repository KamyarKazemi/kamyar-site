import type { Lang } from '../content/site';
import type { Chapter } from '../content/voice';
import { gsap } from './gsap';

/** One spoken word: a word of the narration (no element) or a word of the section's own text, read aloud. */
interface Token { text: string; line: number; el: HTMLElement | null }

export interface Performance { stop: () => void }

interface Options {
  lang: Lang;
  id: Chapter;
  section: HTMLElement | null;
  narration: string[];
  /** with sound the section's own text is read too, word by word; without, only the narration is typed, silently */
  sound: boolean;
  /** the narration line being said, and how many of its words have been said */
  caption?: (line: string, said: number) => void;
}

// reading pace, used until a recording exists and whenever there is no sound: about how long a word takes to say
const pace = (tokens: Token[]): [number, number][] => {
  let t = 0.5;
  return tokens.map((tok, i) => {
    const start = t, said = 0.17 + [...tok.text].length * 0.055;
    t += said;
    if (/[.!?؟،,؛;:]$/.test(tok.text)) t += 0.3;
    if (tokens[i + 1] && tokens[i + 1]!.line !== tok.line) t += tokens[i + 1]!.el && !tok.el ? 0.7 : 0.4;
    return [start, start + said];
  });
};

// a recording comes with its word timings, aligned to the same words in the same order; if it does not match, it is not used
async function recording(lang: Lang, id: Chapter, count: number): Promise<{ audio: HTMLAudioElement; times: [number, number][] } | null> {
  try {
    const res = await fetch(`/voice/${lang}/${id}.json`);
    if (!res.ok) return null;
    const { times } = (await res.json()) as { times: [number, number][] };
    if (!Array.isArray(times) || times.length !== count) return null;
    const audio = new Audio(`/voice/${lang}/${id}.mp3`);
    audio.preload = 'auto';
    return { audio, times };
  } catch {
    return null;
  }
}

/**
 * Plays one section: the narration as a typed caption, then, with sound on, the section's own words inked in one by one as they are
 * said, the word being said underlined in red and the words still to come pale. With a recording it follows the audio; without one,
 * reading pace. Stopping fades the voice out and gives the words their ink back.
 */
export function perform(o: Options): Performance {
  const narration: Token[] = o.narration.flatMap((line, k) => line.split(/\s+/).filter(Boolean).map((text) => ({ text, line: k, el: null })));
  const blocks = o.sound && o.section ? [...o.section.querySelectorAll<HTMLElement>('[data-read]')] : [];
  const read = blocks.flatMap((block, b) => [...block.querySelectorAll<HTMLElement>('.w')].map((el) => ({ text: el.textContent ?? '', line: 1000 + b, el })));
  const tokens: Token[] = [...narration, ...read];
  let times = pace(tokens), audio: HTMLAudioElement | null = null, stopped = false, last = -1, clock = 0, shown = '';

  const tidy = () => {
    o.section?.classList.remove('is-reading');
    for (const tok of read) tok.el!.classList.remove('is-said', 'is-now');
  };
  const show = (line: string, said: number) => { const key = `${line}|${said}`; if (key !== shown) { shown = key; o.caption?.(line, said); } };

  const tick = (_: number, delta: number) => {
    const now = audio ? audio.currentTime : (clock += delta / 1000);
    let i = last;
    while (i + 1 < tokens.length && times[i + 1]![0] <= now) i++;
    if (i !== last) {
      for (let k = Math.max(0, last); k <= i; k++) tokens[k]?.el?.classList.add('is-said');
      tokens[last]?.el?.classList.remove('is-now');
      const tok = tokens[i];
      tok?.el?.classList.add('is-now');
      if (tok?.el) o.section?.classList.add('is-reading');
      last = i;
    }
    const tok = tokens[Math.max(0, i)];
    if (tok && !tok.el && i >= 0) {
      const line = narration.filter((n) => n.line === tok.line);
      show(line.map((n) => n.text).join(' '), line.indexOf(tok) + 1);
    } else if (tok?.el) show('', 0);
    // a beat after the last word everything is just text again
    if (now > (times.at(-1)?.[1] ?? 0) + 1.2) { gsap.ticker.remove(tick); tidy(); show('', 0); }
  };

  void (async () => {
    if (o.sound) {
      const rec = await recording(o.lang, o.id, tokens.length);
      if (stopped) return;
      if (rec) { audio = rec.audio; times = rec.times; await audio.play().catch(() => { audio = null; times = pace(tokens); }); }
    }
    if (!stopped) gsap.ticker.add(tick);
  })();

  return {
    stop: () => {
      stopped = true;
      gsap.ticker.remove(tick);
      tidy();
      if (audio) { const a = audio; gsap.to(a, { volume: 0, duration: 0.4, onComplete: () => a.pause() }); }
    },
  };
}
