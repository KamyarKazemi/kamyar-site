import type { Lang } from './site';

/** The sections the voice speaks over, top to bottom. Each one has its own recording: public/voice/<lang>/<id>.mp3 */
export const CHAPTERS = ['top', 'about', 'services', 'work', 'terms', 'contact'] as const;
export type Chapter = (typeof CHAPTERS)[number];

/**
 * What Kamyar says as each section arrives, before he reads the section's own text aloud. It shows as a typed caption, word by word
 * as he says it. A draft for him to rewrite in his own words; the recording is the final say, and these lines are changed to match it.
 */
export const narration: Record<Lang, Record<Chapter, string[]>> = {
  fa: {
    top: ['سلام، خوش اومدی.', 'من کامیار کاظمی‌ام؛ فرانت‌اند می‌نویسم، ادیت می‌کنم و موشن می‌سازم.', 'بیا با هم یه دور بزنیم.'],
    about: ['اول یه کم از خودم بگم.'],
    services: ['حالا ببین چی کار می‌تونم برات بکنم.'],
    work: ['حرف کافیه؛ اینا کارهامه.', 'روی هر کدوم بزنی، بزرگ می‌شه.'],
    terms: ['و اگه بخوایم با هم کار کنیم، اینجوریه.'],
    contact: ['همین بود. حالا نوبت توئه.', 'یه پیام بده.'],
  },
  en: {
    top: ['Hi, welcome.', "I'm Kamyar Kazemi. I build frontends, edit video and make motion.", 'Let me show you around.'],
    about: ['First, a little about me.'],
    services: ["Here's what I can make for you."],
    work: ['Enough talk. This is the work.', 'Tap any print to open it.'],
    terms: ['And if we work together, this is how it goes.'],
    contact: ["That's the tour. Your turn now.", 'Send me a message.'],
  },
};

/** The dock's own words: the welcome note that points at the listen button, and the button itself. */
export const dock: Record<Lang, { hello: string; ask: string; listen: string; mute: string; dismiss: string }> = {
  fa: { hello: 'سلام!', ask: 'این سایت رو با صدای خودم برات تعریف کردم. برای شنیدن، این دکمه رو بزن.', listen: 'صدام رو بشنو', mute: 'قطع صدا', dismiss: 'بعداً' },
  en: { hello: 'Hi!', ask: 'I recorded a walk through this site in my own voice. Press this button to listen.', listen: 'Listen', mute: 'Mute', dismiss: 'Later' },
};
