import type { Lang } from './site';

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
  come: string;
  skip: string;
  rewind: string;
  forward: string;
  pause: string;
  resume: string;
  scrub: string;
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
    come: 'بفرما',
    skip: 'برو به سایت',
    rewind: 'عقب',
    forward: 'جلو',
    pause: 'مکث',
    resume: 'ادامه',
    scrub: 'بکشش عقب و جلو',
  },
  en: {
    hi: 'Hey!',
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
    come: 'Come in',
    skip: 'Skip to the site',
    rewind: 'Rewind',
    forward: 'Forward',
    pause: 'Pause',
    resume: 'Play',
    scrub: 'Drag it back and forth',
  },
};

/** The language choice before the greeting: each half speaks in its own language. */
export const gate: Record<Lang, { key: string; title: string; go: string; label: string; hello: string; ask: string; sound: string }> = {
  fa: { key: 'FA', title: 'فارسی', go: 'ادامه به فارسی', label: 'ادامه به فارسی', hello: 'سلام', ask: 'زبان رو انتخاب کن', sound: 'با صدا' },
  en: { key: 'EN', title: 'English', go: 'Continue in English', label: 'Continue in English', hello: 'Hi', ask: 'Choose a language', sound: 'SOUND ON' },
};
