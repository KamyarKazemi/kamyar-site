// Every word on the site, in both languages. `Copy` makes the two versions match key for key, so neither can fall behind.

export type Lang = 'fa' | 'en';

export interface WorkItem {
  id: string;
  title: string;
  kind: string;
  image: string;
  alt: string;
  /** the real width / height of the work, so it opens at its true shape */
  ratio: number;
  /** a short silent loop shown in the viewer */
  video?: string;
}

export interface Copy {
  meta: { title: string; description: string };
  name: string;
  fullName: string;
  /** in the order the sections come down the page, so the highlight walks through the header in step with the scroll */
  nav: { id: string; label: string }[];
  cta: string;
  /** the header's call to action, shown next to the other language's */
  reach: string;
  /** typed over the name's second line when you point at it away from the top; in the second line's own language */
  toTop: string;
  hero: { title: string; size: string; roles: string; primary: string };
  /** body paragraphs may mark a key phrase with *asterisks*: the red pen underlines it as you read */
  about: { note: string; title: string; lead: string; body: string[]; stackNote: string; stack: string };
  /** each service: what it is, one plain line of what you get, and what the work actually involves */
  services: { note: string; title: string; items: { label: string; motto: string; detail: string }[] };
  work: { note: string; title: string; items: WorkItem[]; caseStudy: { note: string; title: string; teaser: string; go: string } };
  /** `price`: prices are not listed; they are asked for on Telegram, straight to him */
  terms: { note: string; title: string; price: { note: string; title: string; body: string; button: string } };
  contact: { label: string; title: string; note: string; telegram: string; email: string; instagram: string; github: string };
  viewer: { close: string; next: string; prev: string };
  menu: { open: string; close: string; label: string };
  skip: string;
  notFound: { title: string; text: string; back: string };
  otherLang: string;
  otherLangName: string;
  /** the sound switch in the header: what it does when pressed */
  sound: { off: string; on: string };
}

export const links = {
  handle: '@kamyar__kazemi',
  instagram: 'https://instagram.com/kamyar__kazemi',
  // every "message me" button opens his Telegram
  dm: 'https://t.me/Kazemi_Kamyar',
  telegram: 'https://t.me/Kazemi_Kamyar',
  telegramName: '@Kazemi_Kamyar',
  github: 'https://github.com/KamyarKazemi',
  githubName: 'KamyarKazemi',
  email: 'kamiyarkazemii@gmail.com',
};

export const stack = ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript', 'GSAP', 'Git', 'Vite', 'HyperFrames', 'Claude', 'Adobe Creative Cloud'];

const media = {
  intro: { id: 'intro', image: '/work/intro.webp', video: '/work/intro.mp4', ratio: 9 / 16 },
  cafe: { id: 'cafe', image: '/work/cafe.webp', ratio: 9 / 16 },
  niloofar: { id: 'niloofar', image: '/work/niloofar.webp', ratio: 9 / 16 },
  toolbox: { id: 'toolbox', image: '/work/toolbox.webp', ratio: 3 / 4 },
  okala: { id: 'okala', image: '/work/okala.webp', ratio: 4 / 5 },
};

export const copy: Record<Lang, Copy> = {
  fa: {
    meta: { title: 'کامیار کاظمی | فرانت‌اند، ادیت و موشن', description: 'کامیار کاظمی، فرانت‌اند دولوپر، ادیتور و موشن دیزاینر. سایت و اپ، ادیت ریلز و موشن گرافیک.' },
    name: 'کامیار',
    fullName: 'کامیار کاظمی',
    nav: [
      { id: 'about', label: 'درباره من' },
      { id: 'services', label: 'خدمات' },
      { id: 'work', label: 'نمونه‌کارها' },
      { id: 'terms', label: 'روند همکاری' },
      { id: 'contact', label: 'تماس' },
    ],
    cta: 'پیام بده',
    reach: 'ارتباط با من',
    toTop: '↑ BACK TO TOP',
    hero: { title: 'کامیار کاظمی', size: 'clamp(60px, 13.4vw, 196px)', roles: 'فرانت‌اند دولوپر، ادیتور و موشن دیزاینر', primary: 'نمونه کارها' },
    about: {
      note: 'ABOUT',
      title: 'درباره',
      lead: 'سلام. من کامیارم؛ گیمر، ادیتور، فرانت‌اند دولوپر و موشن دیزاینر.',
      body: [
        'بیش از دو ساله تو یه استارتاپ تو شیراز *همه‌ی همین نقش‌ها* رو انجام می‌دم. بعضی از کارام تحت NDA هستن، پس نمی‌تونم نشونشون بدم.',
        'تو وب با *ری‌اکت، تایپ‌اسکریپت، Tailwind، GSAP و وردپرس* کار می‌کنم، تو ویدیو با *نرم‌افزارای ادوبی و HyperFrames*، و *Claude* هم جزو ابزارای هر روزمه.',
        'سطح انگلیسیم *C2* هست و روون صحبت می‌کنم، و سرپرستی تیم مارکتینگ یه استودیوی بازی‌سازی تو آمریکای شمالی هم تو کارنامه‌مه. دارم فنی و حرفه‌ای می‌خونم و خرداد ۱۴۰۶ فارغ‌التحصیل می‌شم.',
      ],
      stackNote: 'STACK',
      stack: 'چیزایی که واقعاً باهاشون کار می‌کنم، نه لیست هر چیزی که یه بار بازش کردم.',
    },
    services: {
      note: 'SERVICES',
      title: 'چی می‌سازم؟',
      items: [
        { label: 'ادیت ریلز و ویدیو', motto: 'طوری که تا آخر دیده بشه', detail: 'کات، ریتم، زیرنویس، صدا و رنگ؛ از فوتیج خام تا ریلزی که آماده‌ی انتشاره. سه ثانیه‌ی اول طوری ساخته می‌شه که مخاطب رد نشه، و بقیه طوری چیده می‌شه که تا آخر بمونه.' },
        { label: 'موشن گرافیک و کاور', motto: 'با هویت خودت', detail: 'تیتر متحرک، اینفوگرافیک، اینترو و کاور پست، با رنگ و فونت و حس برند خودت؛ تا پیجت از دور شناخته بشه و هر پست ادامه‌ی پست قبلی باشه.' },
        { label: 'برنامه محتوا، کپشن و استوری', motto: 'انتشار منظم', detail: 'تقویم محتوای ماهانه، ایده‌ی ریلز، کپشن و استوری‌های روزانه. از قبل معلومه چی و کی منتشر می‌شه، و پیج هیچ‌وقت ساکت نمی‌مونه.' },
        { label: 'سایت و اپ', motto: 'سفارش و پرداخت آنلاین، بدون نیاز به پیام دادن', detail: 'فروشگاه آنلاین، سایت معرفی یا وب‌اپ، با سفارش و پرداخت آنلاین، سرعت بالا و سئو؛ تا مشتری بدون پیام دادن و منتظر جواب موندن خرید کنه. وردپرس برای شروع سریع، ری‌اکت برای کار اختصاصی.' },
        { label: 'اتوماسیون با بهترین ابزارها و سیستم‌های اختصاصی', motto: 'کارهای تکراری خودکار انجام می‌شن و دیگه وقتت سرشون هدر نمی‌ره', detail: 'ثبت سفارش، جواب پیام‌های پرتکرار، صدور فاکتور، گزارش فروش و انتشار پست رو به هم وصل می‌کنم تا خودشون انجام بشن. هرجا ابزار آماده کافی باشه از همون استفاده می‌کنم، و هرجا نباشه سیستم اختصاصی می‌نویسم.' },
      ],
    },
    work: {
      note: 'WORK',
      title: 'حرف نه، نمونه کار',
      items: [
        { ...media.intro, title: 'ویدیوی معرفی', kind: 'ریلز', alt: 'کاور ویدیوی معرفی کامیار' },
        { ...media.cafe, title: 'لاته دارچین', kind: 'پوستر', alt: 'پوستر لاته دارچین' },
        { ...media.niloofar, title: 'سرم آبرسان', kind: 'پوستر', alt: 'پوستر سرم آبرسان' },
        { ...media.toolbox, title: 'جعبه‌ابزار', kind: 'گرید نه‌تایی', alt: 'گرید نه‌تایی جعبه‌ابزار' },
        { ...media.okala, title: 'اوکالا', kind: 'کانسپت اپ', alt: 'پوستر کانسپت اپ اوکالا' },
      ],
      caseStudy: { note: 'CASE STUDY · 01 · WORDPRESS', title: 'عطاری ناجی', teaser: 'فروشگاهی که بدون دستمزد ساختم، در ازای ۴۰٪ سود هر فروش آنلاین؛ و حالا صفحه‌ی اول گوگله.', go: 'بخون' },
    },
    terms: {
      note: 'HOW IT WORKS',
      title: 'نحوه‌ی همکاری',
      price: { note: 'PRICES', title: 'قیمت؟ تو تلگرام بپرس', body: 'هر پروژه فرق داره، برای همین لیست قیمت ثابت این‌جا نیست. تو تلگرام پیام بده و بگو چی لازم داری؛ *مستقیم با خودم حرف می‌زنی*، نه ربات و نه واسطه، و قیمتش رو از خودم می‌گیری.', button: 'پیام در تلگرام' },
    },
    contact: { label: 'تو کارتو بکن؛', title: 'بقیه‌ش با من', note: 'هر کدوم از اینا که دم دستته، به من می‌رسه.', telegram: 'تلگرام', email: 'ایمیل', instagram: 'اینستاگرام', github: 'گیت‌هاب' },
    viewer: { close: 'بستن', next: 'بعدی', prev: 'قبلی' },
    menu: { open: 'باز کردن منو', close: 'بستن منو', label: 'بخش‌های سایت' },
    skip: 'رفتن به محتوا',
    notFound: { title: '۴۰۴', text: 'این صفحه پیدا نشد.', back: 'برگشت به صفحه‌ی اصلی' },
    otherLang: 'EN',
    otherLangName: 'English',
    sound: { off: 'بی‌صدا کن', on: 'صدا رو روشن کن' },
  },
  en: {
    meta: { title: 'Kamyar Kazemi | Frontend, editing and motion', description: 'Kamyar Kazemi, frontend developer, editor and motion designer. Websites and apps, reels and motion graphics.' },
    name: 'Kamyar',
    fullName: 'Kamyar Kazemi',
    nav: [
      { id: 'about', label: 'About' },
      { id: 'services', label: 'Services' },
      { id: 'work', label: 'Work' },
      { id: 'terms', label: 'Process' },
      { id: 'contact', label: 'Contact' },
    ],
    cta: 'Get in touch',
    reach: 'Get in touch',
    toTop: '↑ برگرد بالا',
    hero: { title: 'Kamyar Kazemi', size: 'clamp(44px, 10vw, 150px)', roles: 'Frontend developer, editor and motion designer', primary: 'See the work' },
    about: {
      note: 'ABOUT',
      title: 'About',
      lead: 'Hi, I’m Kamyar: a gamer, editor, front-end developer and motion designer.',
      body: [
        'For more than two years I’ve worked at a startup in Shiraz in *all of these roles*. Some of that work is under NDA, so I can’t show it.',
        'On the web I work with *React, TypeScript, Tailwind, GSAP and WordPress*; for video, *Adobe apps and HyperFrames*; and *Claude* is one of my everyday tools.',
        'My English is *C2* and I speak it fluently, and I’ve headed the marketing team of a game studio in North America. I’m studying at a technical and vocational school and graduate in June 2027.',
      ],
      stackNote: 'STACK',
      stack: 'What I actually reach for. Not a list of everything I have opened once.',
    },
    services: {
      note: 'SERVICES',
      title: 'What I make',
      items: [
        { label: 'Reels and video editing', motto: 'Cut so people watch to the end', detail: 'Cutting, pacing, subtitles, sound and colour: from raw footage to a reel that is ready to post. The first three seconds are built to stop the scroll, the rest is paced to keep people watching.' },
        { label: 'Motion graphics and covers', motto: 'In your own identity', detail: 'Animated titles, infographics, intros and post covers in your brand’s colours, type and tone, so your page is recognisable at a glance and every post belongs with the last.' },
        { label: 'Content plans, captions and stories', motto: 'Published on schedule', detail: 'A monthly content calendar, reel ideas, captions and daily stories. You know in advance what goes out and when, and the page never goes quiet.' },
        { label: 'Websites and apps', motto: 'Online ordering and payment, no messaging needed', detail: 'Online stores, company sites and web apps with online ordering and payment, speed and SEO, so customers can buy without messaging you and waiting for a reply. WordPress for a quick start, React for custom work.' },
        { label: 'Automation with the best tools available and custom systems', motto: 'Repetitive tasks run on their own, so you stop wasting time on them', detail: 'Order intake, replies to common messages, invoices, sales reports and post publishing, connected so they happen by themselves. Ready-made tools wherever they are enough, a custom system wherever they are not.' },
      ],
    },
    work: {
      note: 'WORK',
      title: 'Less talk, more work',
      items: [
        { ...media.intro, title: 'Intro film', kind: 'Reel', alt: 'Cover of the intro film' },
        { ...media.cafe, title: 'Cinnamon latte', kind: 'Poster', alt: 'Cinnamon latte poster' },
        { ...media.niloofar, title: 'Hydrating serum', kind: 'Poster', alt: 'Hydrating serum poster' },
        { ...media.toolbox, title: 'Toolbox', kind: 'Nine-post grid', alt: 'Toolbox nine-post grid' },
        { ...media.okala, title: 'Okala', kind: 'App concept', alt: 'Okala app concept poster' },
      ],
      caseStudy: { note: 'CASE STUDY · 01 · WORDPRESS', title: 'Atarinaji', teaser: 'A store I built for no fee, in exchange for 40% of the profit on every online sale. It is now on page one of Google.', go: 'Read it' },
    },
    terms: {
      note: 'HOW IT WORKS',
      title: 'How it works',
      price: { note: 'PRICES', title: 'Prices? Ask on Telegram', body: 'Every project is different, so there is no fixed price list here. Message me on Telegram and tell me what you need: *you talk to me directly*, not a bot or a middleman, and you get the price from me.', button: 'Message me on Telegram' },
    },
    contact: { label: 'You run the business.', title: 'I handle the rest', note: 'Any of these reaches me. Take whichever you already have open.', telegram: 'Telegram', email: 'Email', instagram: 'Instagram', github: 'GitHub' },
    viewer: { close: 'Close', next: 'Next', prev: 'Previous' },
    menu: { open: 'Open menu', close: 'Close menu', label: 'Site sections' },
    skip: 'Skip to content',
    notFound: { title: '404', text: 'This page does not exist.', back: 'Back to the home page' },
    otherLang: 'فا',
    otherLangName: 'فارسی',
    sound: { off: 'Turn the sound off', on: 'Turn the sound on' },
  },
};
