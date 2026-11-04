import type { Lang } from './site';

/** What the timeline reacts to, in his own (glitched) voice. Words below are what he says in the recording, work/voice/transcript.md */
export type Reaction = 'rewind1' | 'rewind2' | 'forward' | 'idle' | 'dizzy' | 'start' | 'told';
/** The timeline's complaints when it has been pushed too hard; his voice too. */
export type Groan = 'tiredBack' | 'tiredForward';

interface IntroCopy {
  /** the stations, one for each thing he says */
  hi: string;
  name: string;
  hiNote: string;
  roles: { word: string; note: string; print: string }[];
  portfolio: string;
  portfolioNote: string;
  welcome: string;
  welcomeNote: string;
  live: string;
  liveNote: string;
  play: string;
  more: string;
  moreNote: string;
  come: string;
  /** the secret: written backwards on the floor, and the right way round once it is found by rewinding over it */
  secret: string;
  found: string;
  skip: string;
  rewind: string;
  forward: string;
  pause: string;
  resume: string;
  scrub: string;
  reactions: Record<Reaction, string>;
  groans: Record<Groan, string>;
}

export const intro: Record<Lang, IntroCopy> = {
  fa: {
    hi: 'سلام!',
    name: 'کامیار',
    hiNote: "01 — HI, I'M KAMYAR",
    roles: [
      { word: 'ادیتور', note: 'EDITOR.', print: '/live/editor.webp' },
      { word: 'فرانت‌اند', note: 'FRONT-END DEV.', print: '/live/developer.webp' },
      { word: 'موشن', note: 'MOTION DESIGNER.', print: '/live/motion.webp' },
    ],
    portfolio: 'پورتفولیوی من',
    portfolioNote: '03 — MY PORTFOLIO',
    welcome: 'خوش اومدی',
    welcomeNote: '04 — COME ON IN',
    live: 'زنده‌ست',
    liveNote: '05 — A LIVE TIMELINE',
    play: 'باهاش بازی کن',
    more: 'چیزای جالبی این توئه…',
    moreNote: '06 — LOOK AROUND',
    come: 'بفرما',
    secret: 'پیدام کردی! حالا این یه راز بین من و توئه.',
    found: 'پیدا شد!',
    skip: 'برو به سایت',
    rewind: 'عقب',
    forward: 'جلو',
    pause: 'مکث',
    resume: 'ادامه',
    scrub: 'بکشش عقب و جلو',
    reactions: {
      rewind1: 'اِ، برگشتی که؟',
      rewind2: 'بازم؟ خب باشه.',
      forward: 'عجله داری؟',
      idle: 'هنوزم اونجایی؟',
      dizzy: 'آروم… سرم گیج رفت.',
      start: 'از اول؟ … باشه.',
      told: 'دیدی گفتم تایم‌لاین خسته می‌شه؟',
    },
    groans: {
      tiredBack: 'باشه بابا، کمرِ تایم‌لاینو شکوندی.',
      tiredForward: 'بسه دیگه!',
    },
  },
  en: {
    hi: 'Hi!',
    name: 'Kamyar',
    hiNote: '01 — سلام، من کامیارم',
    roles: [
      { word: 'Editor', note: 'ادیتور', print: '/live/editor.webp' },
      { word: 'Front-end', note: 'فرانت‌اند', print: '/live/developer.webp' },
      { word: 'Motion', note: 'موشن دیزاینر', print: '/live/motion.webp' },
    ],
    portfolio: 'My portfolio',
    portfolioNote: '03 — پورتفولیوی من',
    welcome: 'Welcome',
    welcomeNote: '04 — COME ON IN',
    live: "It's live",
    liveNote: '05 — A LIVE TIMELINE',
    play: 'Play with it',
    more: "There's more in here…",
    moreNote: '06 — LOOK AROUND',
    come: 'Come in',
    secret: "You found me! Now it's our little secret.",
    found: 'FOUND IT!',
    skip: 'Skip to the site',
    rewind: 'Rewind',
    forward: 'Forward',
    pause: 'Pause',
    resume: 'Play',
    scrub: 'Drag it back and forth',
    reactions: {
      rewind1: 'Oh, you came back?',
      rewind2: 'Again? Fine.',
      forward: 'In a hurry?',
      idle: 'Still there?',
      dizzy: "Easy… my head's spinning.",
      start: 'From the top? … Fine.',
      told: 'Told you the timeline gets tired.',
    },
    groans: {
      tiredBack: "Fine, you broke the timeline's back.",
      tiredForward: 'Enough!',
    },
  },
};

/** The language choice before the greeting: each half speaks in its own language. */
export const gate: Record<Lang, { key: string; title: string; go: string; label: string; hello: string; ask: string; sound: string }> = {
  fa: { key: 'FA', title: 'فارسی', go: 'ادامه به فارسی', label: 'ادامه به فارسی', hello: 'سلام', ask: 'زبان رو انتخاب کن', sound: 'با صدا' },
  en: { key: 'EN', title: 'English', go: 'Continue in English', label: 'Continue in English', hello: 'Hi', ask: 'Choose a language', sound: 'SOUND ON' },
};
