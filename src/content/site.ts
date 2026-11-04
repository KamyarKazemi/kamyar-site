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
  services: { note: string; title: string; items: { label: string; detail: string }[] };
  work: { note: string; title: string; items: WorkItem[]; caseStudy: { note: string; title: string; teaser: string; go: string } };
  terms: { note: string; title: string; items: { big: string; detail: string }[] };
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

export const stack = ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript', 'GSAP', 'Git', 'Vite'];

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
      lead: 'فرانت‌اند می‌سازم، و هر چیزی که دورش حرکت می‌کنه.',
      body: [
        'یه طرف ری‌اکت، تایپ‌اسکریپت و وب؛ طرف دیگه ادیت و موشن گرافیک. *همون دستی که ریلز رو کات می‌زنه*، گرافیکش رو متحرک می‌کنه و سایتش رو می‌نویسه.',
        'کارهای پروداکشنی که انجام دادم تحت NDA بوده، پس نشون دادنشون با من نیست. چیزی که می‌تونم نشون بدم اینه که چطور می‌سازم، و *این سایت اولین نمونه‌شه*.',
      ],
      stackNote: 'STACK',
      stack: 'چیزایی که واقعاً باهاشون کار می‌کنم، نه لیست هر چیزی که یه بار بازش کردم.',
    },
    services: {
      note: 'SERVICES',
      title: 'چی می‌سازم؟',
      items: [
        { label: 'ادیت ریلز و ویدیو', detail: 'طوری که تا آخر دیده بشه' },
        { label: 'موشن گرافیک و کاور', detail: 'با هویت خودت' },
        { label: 'برنامه محتوا، کپشن و استوری', detail: 'انتشار منظم' },
        { label: 'سایت و اپ', detail: 'سفارش و پرداخت، بدون وابستگی به دایرکت' },
        { label: 'اتوماسیون با n8n', detail: 'تو فقط نتیجه رو می‌بینی' },
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
      items: [
        { big: 'قیمت', detail: 'برای هر پروژه، بدون قرارداد ماهانه' },
        { big: '۵۰٪ + ۵۰٪', detail: '۵۰٪ موقع شروع، ۵۰٪ موقع تحویل' },
        { big: '۲ بار', detail: 'اصلاح، توی قیمت حساب شده' },
      ],
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
      lead: 'I build frontends, and everything that moves around them.',
      body: [
        'React, TypeScript and the web on one side, editing and motion graphics on the other. *The same hands cut the reel*, animate the graphics and write the site.',
        'The production work I have done was under NDA, so none of it is mine to show. What I can show is how I build, and *this site is the first piece*.',
      ],
      stackNote: 'STACK',
      stack: 'What I actually reach for. Not a list of everything I have opened once.',
    },
    services: {
      note: 'SERVICES',
      title: 'What I make',
      items: [
        { label: 'Reels and video editing', detail: 'Cut so people watch to the end' },
        { label: 'Motion graphics and covers', detail: 'In your own identity' },
        { label: 'Content plans, captions and stories', detail: 'Published on schedule' },
        { label: 'Websites and apps', detail: 'Orders and payments, without depending on DMs' },
        { label: 'Automation with n8n', detail: 'You only see the result' },
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
      items: [
        { big: 'Pricing', detail: 'Per project, no monthly contract' },
        { big: '50% + 50%', detail: '50% at the start, 50% on delivery' },
        { big: '2 rounds', detail: 'Of revisions, included in the price' },
      ],
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
