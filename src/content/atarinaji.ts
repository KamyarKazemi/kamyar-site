import type { Lang } from './site';

// The Atarinaji case study, in both languages. Every number is real: the search figures are Google Search Console's for
// 23 Sep – 2 Nov 2026 (the first six weeks the property was verified), the build figures are counted from the shop's WordPress.

/** Impressions per day in Google search, 23 Sep → 2 Nov 2026. */
export const daily = [4, 1, 7, 2, 2, 14, 9, 9, 12, 7, 12, 12, 13, 9, 3, 0, 2, 9, 11, 24, 13, 38, 35, 34, 31, 38, 27, 38, 32, 19, 22, 17, 25, 36, 26, 32, 28, 25, 24, 30, 22];

interface Fact { big: string; label: string; detail?: string }
interface Query { q: string; pos: number }

export interface CaseCopy {
  meta: { title: string; description: string };
  back: string;
  kicker: string;
  title: string;
  lead: string;
  facts: { key: string; value: string; href?: string }[];
  shotAlt: { desktop: string; phone: string; product: string; blog: string };
  deal: { note: string; title: string; body: string; zero: Fact; share: Fact; why: { title: string; body: string }[] };
  search: {
    note: string; title: string; source: string; stats: Fact[];
    chart: { title: string; growth: string; alt: string; from: string; to: string };
    ruler: { title: string; detail: string; pageOne: string; queries: Query[] };
    wins: Fact[];
  };
  built: { note: string; title: string; lead: string; counts: Fact[]; list: string[] };
  next: { note: string; title: string; body: string; goals: { q: string; now: string }[] };
  cta: string;
  ctaButton: string;
}

const queries: { fa: string; en: string; pos: number }[] = [
  { fa: 'عطاری آنلاین شیراز', en: 'online herbal shop Shiraz', pos: 4.5 },
  { fa: 'عطاری شیراز انلاین', en: 'Shiraz herbal shop online', pos: 5.3 },
  { fa: 'روغن چهل مغز', en: 'forty-nut oil', pos: 7.0 },
  { fa: 'عطاری انلاین', en: 'herbal shop online', pos: 9.5 },
  { fa: 'عطاری آنلاین', en: 'online herbal shop', pos: 23.1 },
  { fa: 'ادویه‌های غذای ایرانی', en: 'Persian cooking spices', pos: 35.4 },
  { fa: 'عطاری شیراز', en: 'herbal shop Shiraz', pos: 41.9 },
];

export const atarinaji: Record<Lang, CaseCopy> = {
  fa: {
    meta: { title: 'عطاری ناجی | نمونه‌کار وردپرس کامیار کاظمی', description: 'ساخت فروشگاه آنلاین عطاری ناجی با وردپرس و ووکامرس، بدون دستمزد و در ازای ۴۰٪ سود فروش آنلاین؛ با نتیجه‌ی واقعی سرچ کنسول گوگل.' },
    back: 'همه‌ی نمونه‌کارها',
    kicker: 'CASE STUDY · 01 · WORDPRESS',
    title: 'عطاری ناجی',
    lead: 'فروشگاه آنلاین یک عطاری با دو شعبه در شیراز و رامجرد. از صفر تا یک فروشگاه کامل: طراحی، ساخت، کاتالوگ محصولات، سئو و محتوا.',
    facts: [
      { key: 'ROLE', value: 'طراحی، ساخت، سئو و محتوا؛ همه‌اش' },
      { key: 'STACK', value: 'وردپرس، المنتور، ووکامرس، رنک‌مث' },
      { key: 'SINCE', value: 'تیر ۱۴۰۵، هنوز ادامه داره' },
      { key: 'LIVE', value: 'atarinaji.ir ↗', href: 'https://atarinaji.ir' },
    ],
    shotAlt: { desktop: 'صفحه‌ی اصلی atarinaji.ir روی دسکتاپ', phone: 'صفحه‌ی اصلی atarinaji.ir روی موبایل', product: 'صفحه‌ی محصول روغن چهل مغز', blog: 'راهنمای حنا در بلاگ عطاری ناجی' },
    deal: {
      note: '02 — THE DEAL',
      title: 'قرار همکاری',
      body: 'این فروشگاه رو بدون دستمزد ساختم. به‌جای پول، با صاحب عطاری قرار گذاشتیم *چهل درصد سود هر فروش آنلاین* سهم من باشه. هزینه‌ی شروع برای اون صفر بود، و درآمد من مستقیم به فروشی گره خورده که سایت می‌سازه، نه به ساعت‌هایی که پاش گذاشتم.',
      zero: { big: '۰', label: 'دستمزد ساخت', detail: 'هزینه‌ی اولیه‌ای که صاحب کار پرداخت کرد' },
      share: { big: '۴۰٪', label: 'از سود هر فروش آنلاین', detail: 'سهم من، تا وقتی سایت می‌فروشه' },
      why: [
        { title: 'چرا ساده و کم‌هزینه؟', body: 'وقتی دستمزدی در کار نیست، هر ساعت باید خرج چیزی بشه که فروش میاره. برای همین روی یه پایه‌ی آماده و قابل اعتماد ساختم، نه طراحی سفارشی از صفر.' },
        { title: 'وقت کجا رفت', body: 'کاتالوگ کامل با وزن و قیمت‌های مختلف، سرعت، پرداخت آنلاین، و از همه مهم‌تر دیده شدن توی گوگل: سئو، داده‌ی ساختاریافته و راهنماهای بلاگ.' },
        { title: 'ریسک مشترک', body: 'من فقط وقتی درآمد دارم که عطاری درآمد داشته باشه. پس هر تصمیم، از ساختار صفحه تا انتخاب کلمه‌ها، با یه سؤال گرفته شد: این فروش میاره؟' },
      ],
    },
    search: {
      note: '03 — SEARCH',
      title: 'نتیجه توی گوگل',
      source: 'سرچ کنسول گوگل، ۱ مهر تا ۱۱ آبان ۱۴۰۵؛ شش هفته‌ی اول. دامنه‌ی تازه، بدون تبلیغ و بدون بک‌لینک خریدنی: همه‌ی این بازدیدها از جستجوی معمولی اومده.',
      stats: [
        { big: '۹٫۸', label: 'میانگین جایگاه', detail: 'یعنی صفحه‌ی اول گوگل' },
        { big: '۸٫۵٪', label: 'نرخ کلیک', detail: 'از هر ۱۲ نفری که دیدن، یکی اومد' },
        { big: '۷۵۴', label: 'بار نمایش', detail: 'توی نتایج جستجو' },
        { big: '۶۴', label: 'کلیک', detail: 'آدم واقعی، از گوگل به سایت' },
      ],
      chart: { title: 'نمایش روزانه در گوگل', growth: '۱۱۳ نمایش در دو هفته‌ی اول، ۳۷۶ در دو هفته‌ی آخر: ۳٫۳ برابر', alt: 'نمودار نمایش روزانه در گوگل از ۱ مهر تا ۱۱ آبان ۱۴۰۵؛ از حدود ۸ به حدود ۲۷ نمایش در روز', from: '۱ مهر', to: '۱۱ آبان' },
      ruler: { title: 'کجای گوگل ایستاده', detail: 'جایگاه واقعی هر جستجو، از ۱ تا ۵۰', pageOne: 'صفحه‌ی اول گوگل (جایگاه ۱ تا ۱۰)', queries: queries.map((q) => ({ q: q.fa, pos: q.pos })) },
      wins: [
        { big: '۴٫۵', label: '«عطاری آنلاین شیراز»', detail: 'جستجوی اصلی کسب‌وکار، بالای صفحه‌ی اول. ۲۸٪ از کسایی که دیدنش کلیک کردن.' },
        { big: '۴۳', label: 'صفحه‌ی ایندکس‌شده', detail: 'صفحه‌های تکراری عمداً بیرون موندن: نسخه‌های وزن هر محصول به صفحه‌ی اصلیش اشاره می‌کنن.' },
        { big: '۵٫۹', label: 'راهنماهای بلاگ هم رتبه گرفتن', detail: 'نگهداری ادویه جایگاه ۵٫۹، روغن‌های گیاهی ۶٫۳، و راهنمای حنا ۸۱ بار نمایش.' },
      ],
    },
    built: {
      note: '04 — WHAT I BUILT',
      title: 'چی ساختم',
      lead: 'روی پایه‌ی آماده، با کد اختصاصی هرجا که فروش بهش بسته بود.',
      counts: [
        { big: '۷۱', label: 'محصول' }, { big: '۸۹', label: 'وزن و قیمت جدا' }, { big: '۱۰', label: 'دسته‌بندی' },
        { big: '۷', label: 'ماژول کد اختصاصی' }, { big: '۶', label: 'راهنمای بلاگ' }, { big: '۲', label: 'شعبه برای جستجوی محلی' },
      ],
      list: [
        'هدر، آرشیو محصول، سبد خرید و حساب کاربری بازنویسی‌شده',
        'داده‌ی ساختاریافته‌ی محصول با قیمت، برند و ارسال',
        'دو شعبه به‌عنوان فروشگاه محلی برای گوگل',
        'پرسش‌های پرتکرار با اسکیمای FAQ',
        'فایل llms.txt برای جستجوی هوش مصنوعی',
        'پرداخت زرین‌پال، خرید بدون ثبت‌نام، ارسال رایگان',
      ],
    },
    next: {
      note: '05 — NEXT',
      title: 'قدم بعدی',
      body: 'شش هفته از شروع سرچ کنسول گذشته. جستجوهای عمومی‌تر هنوز جای رشد دارن، و هدف بعدی همین‌هاست.',
      goals: [{ q: '«عطاری شیراز»', now: '42' }, { q: '«عطاری آنلاین»', now: '23' }, { q: '«ادویه‌های غذای ایرانی»', now: '35' }],
    },
    cta: 'پروژه‌ی بعدی مال تو؟',
    ctaButton: 'پیام بده',
  },
  en: {
    meta: { title: 'Atarinaji | WordPress case study by Kamyar Kazemi', description: 'An online herbal shop built on WordPress and WooCommerce for no fee, in exchange for 40% of the profit on every online sale, with its real Google Search Console results.' },
    back: 'All work',
    kicker: 'CASE STUDY · 01 · WORDPRESS',
    title: 'Atarinaji',
    lead: 'The online store of a traditional herbal shop with two branches, in Shiraz and Ramjerd. From nothing to a complete shop: design, build, product catalogue, SEO and content.',
    facts: [
      { key: 'ROLE', value: 'Design, build, SEO and content: all of it' },
      { key: 'STACK', value: 'WordPress, Elementor, WooCommerce, Rank Math' },
      { key: 'SINCE', value: 'July 2026, still running' },
      { key: 'LIVE', value: 'atarinaji.ir ↗', href: 'https://atarinaji.ir' },
    ],
    shotAlt: { desktop: 'The atarinaji.ir home page on a desktop', phone: 'The atarinaji.ir home page on a phone', product: 'The product page for forty-nut oil', blog: 'The henna guide on the Atarinaji blog' },
    deal: {
      note: '02 — THE DEAL',
      title: 'The deal',
      body: 'I built this store without a fee. Instead of payment, the owner and I agreed that *40% of the profit on every online sale* is mine. His upfront cost was zero, and my income is tied directly to what the site sells, not to the hours I put into it.',
      zero: { big: '0', label: 'Build fee', detail: 'What the owner paid upfront' },
      share: { big: '40%', label: 'Of the profit on each online sale', detail: 'My share, for as long as the site sells' },
      why: [
        { title: 'Why simple and lean?', body: 'With no fee, every hour had to go into something that sells. So the store stands on a proven, ready-made base rather than a custom design built from scratch.' },
        { title: 'Where the time went', body: 'A full catalogue with every weight and price, speed, online payment and, above all, being found on Google: SEO, structured data and buying guides.' },
        { title: 'Shared risk', body: 'I only earn when the shop earns. So every decision, from page structure to word choice, was made against one question: does this sell?' },
      ],
    },
    search: {
      note: '03 — SEARCH',
      title: 'Results on Google',
      source: 'Google Search Console, 23 September to 2 November 2026, the first six weeks. A brand-new domain, no ads and no bought links: every one of these visits came from ordinary search.',
      stats: [
        { big: '9.8', label: 'Average position', detail: 'Page one of Google' },
        { big: '8.5%', label: 'Click-through rate', detail: 'One in twelve who saw it came in' },
        { big: '754', label: 'Impressions', detail: 'In search results' },
        { big: '64', label: 'Clicks', detail: 'Real people, from Google to the site' },
      ],
      chart: { title: 'Daily impressions on Google', growth: '113 impressions in the first two weeks, 376 in the last two: 3.3×', alt: 'Daily Google impressions from 23 September to 2 November 2026, rising from about 8 to about 27 a day', from: '23 Sep', to: '2 Nov' },
      ruler: { title: 'Where it stands on Google', detail: 'The real position of each search, from 1 to 50', pageOne: 'Page one of Google (positions 1–10)', queries: queries.map((q) => ({ q: q.en, pos: q.pos })) },
      wins: [
        { big: '4.5', label: '"Online herbal shop Shiraz"', detail: 'The business\'s main search, near the top of page one. 28% of the people who saw it clicked.' },
        { big: '43', label: 'Pages indexed', detail: 'Duplicates are kept out on purpose: each product\'s weight options point to its main page.' },
        { big: '5.9', label: 'The blog guides rank too', detail: 'Spice storage at 5.9, plant oils at 6.3, and the henna guide shown 81 times.' },
      ],
    },
    built: {
      note: '04 — WHAT I BUILT',
      title: 'What I built',
      lead: 'On a ready-made base, with custom code wherever sales depended on it.',
      counts: [
        { big: '71', label: 'Products' }, { big: '89', label: 'Weights and prices' }, { big: '10', label: 'Categories' },
        { big: '7', label: 'Custom code modules' }, { big: '6', label: 'Blog guides' }, { big: '2', label: 'Branches in local search' },
      ],
      list: [
        'Rewritten header, product archive, cart and account pages',
        'Product structured data with price, brand and shipping',
        'Both branches marked up as local stores for Google',
        'Frequently asked questions with FAQ schema',
        'An llms.txt file for AI search',
        'ZarinPal payment, guest checkout, free shipping',
      ],
    },
    next: {
      note: '05 — NEXT',
      title: 'Next',
      body: 'Six weeks into Search Console. The broader searches still have room to grow, and they are the next target.',
      goals: [{ q: '"Herbal shop Shiraz"', now: '42' }, { q: '"Online herbal shop"', now: '23' }, { q: '"Persian cooking spices"', now: '35' }],
    },
    cta: 'Is the next project yours?',
    ctaButton: 'Get in touch',
  },
};
