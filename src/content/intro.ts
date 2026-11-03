import type { Lang } from './site';

/** What Kamyar reacts to, in his own voice; until he records them the line is typed on a label. Script: work/greeting-script.md */
export type Reaction = 'rewind1' | 'rewind2' | 'forward' | 'idle' | 'dizzy' | 'start' | 'told';
/** What the timeline itself says when it has been pushed too hard. These are written, never spoken. */
export type Groan = 'tiredBack' | 'tiredForward';

interface IntroCopy {
  /** the six stations of the greeting, one per spoken line */
  hi: string;
  hiNote: string;
  welcome: string;
  welcomeNote: string;
  live: string;
  liveNote: string;
  yours: string;
  yoursNote: string;
  tires: string;
  tiresNote: string;
  come: string;
  comeNote: string;
  skip: string;
  rewind: string;
  forward: string;
  pause: string;
  resume: string;
  scrub: string;
  reactions: Record<Reaction, string>;
  groans: Record<Groan, string>;
}

// draft 1 of the greeting; the spoken lines are rewritten to what he actually says once he has recorded them
export const intro: Record<Lang, IntroCopy> = {
  fa: {
    hi: 'سلام!',
    hiNote: '01 — HI.',
    welcome: 'خوش اومدی',
    welcomeNote: '02 — WELCOME',
    live: 'زنده‌ست',
    liveNote: '03 — LIVE · NOT A VIDEO',
    yours: 'تایم‌لاین دست خودته',
    yoursNote: '04 — THE TIMELINE IS YOURS',
    tires: 'زود خسته می‌شه',
    tiresNote: '05 — IT GETS TIRED',
    come: 'بفرما',
    comeNote: '06 — COME ON IN',
    skip: 'برو به سایت',
    rewind: 'عقب',
    forward: 'جلو',
    pause: 'مکث',
    resume: 'ادامه',
    scrub: 'بکشش عقب و جلو',
    reactions: {
      rewind1: 'عه! داری برمی‌گردی؟',
      rewind2: 'باز؟ باشه.',
      forward: 'عجله داری؟',
      idle: 'هنوز اونجایی؟',
      dizzy: 'آروم… سرم گیج رفت.',
      start: 'از اول؟ باشه.',
      told: 'دیدی گفتم؟',
    },
    groans: {
      tiredBack: 'اوف… بسه دیگه، کمرم گرفت.',
      tiredForward: 'یواش! نفسم بند اومد.',
    },
  },
  en: {
    hi: 'Hi!',
    hiNote: '01 — سلام',
    welcome: 'Welcome',
    welcomeNote: '02 — خوش اومدی',
    live: "It's live",
    liveNote: '03 — LIVE · NOT A VIDEO',
    yours: "The timeline's yours",
    yoursNote: '04 — THE TIMELINE IS YOURS',
    tires: 'It gets tired',
    tiresNote: '05 — زود خسته می‌شه',
    come: 'Come in',
    comeNote: '06 — بفرما',
    skip: 'Skip to the site',
    rewind: 'Rewind',
    forward: 'Forward',
    pause: 'Pause',
    resume: 'Play',
    scrub: 'Drag it back and forth',
    reactions: {
      rewind1: 'Oh! Going back?',
      rewind2: 'Again? Sure.',
      forward: 'In a hurry?',
      idle: 'Still there?',
      dizzy: "Easy… my head's spinning.",
      start: 'From the top? Okay.',
      told: 'Told you.',
    },
    groans: {
      tiredBack: "Ugh… enough, my back's gone.",
      tiredForward: "Slow down! I'm out of breath.",
    },
  },
};

/** The language choice before the greeting: each half speaks in its own language. */
export const gate: Record<Lang, { key: string; title: string; go: string; label: string; hello: string; ask: string; sound: string }> = {
  fa: { key: 'FA', title: 'فارسی', go: 'ادامه به فارسی', label: 'ادامه به فارسی', hello: 'سلام', ask: 'زبان رو انتخاب کن', sound: 'با صدا' },
  en: { key: 'EN', title: 'English', go: 'Continue in English', label: 'Continue in English', hello: 'Hi', ask: 'Choose a language', sound: 'SOUND ON' },
};
