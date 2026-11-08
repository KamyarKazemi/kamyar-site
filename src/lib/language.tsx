import { createContext, use, useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate, useNavigationType, type To } from 'react-router-dom';
import { copy, type Copy, type Lang } from '../content/site';
import { gsap } from './gsap';
import { jag, POSE, stepped } from './paper';
import { sfx } from './sfx';

interface LanguageValue { lang: Lang; t: Copy; toggle: () => void; turnTo: (to: To) => void }

const Language = createContext<LanguageValue | null>(null);
const POSES = 7;

/** Each language has its own address: Persian at /, English at /en. That keeps both linkable and ready for the blog's SEO. */
export const pathFor = (lang: Lang): string => (lang === 'en' ? '/en' : '/');
export const langOf = (pathname: string): Lang => (/^\/en(\/|$)/.test(pathname) ? 'en' : 'fa');
/** The same page in the other language: /work/atarinaji ↔ /en/work/atarinaji, / ↔ /en. */
export const pathIn = (lang: Lang, pathname: string): string => {
  const rest = pathname.replace(/^\/en(?=\/|$)/, '');
  return lang === 'en' ? `/en${rest === '/' ? '' : rest}` : rest || '/';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation(), { pathname } = location;
  const navigate = useNavigate();
  const navigation = useNavigationType();
  const lang = langOf(pathname);
  const turn = useRef<HTMLDivElement>(null);
  const turning = useRef(false);
  const t = copy[lang];

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description);
  }, [lang, t]);

  // a torn red sheet is pulled across the screen; the address changes while it covers the page, and the sheet carries on off the other side
  // `covered`: the page has already changed under it (a back or forward gesture), so the sheet starts over it and only pulls away
  const sweep = useCallback((go: () => void, covered = false) => {
    const sheet = turn.current;
    if (!sheet || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
    if (turning.current) return;
    turning.current = true;
    const flip = document.documentElement.dir === 'ltr', leading = jag(11, 22, 1.6), trailing = jag(12, 22, 1.6), s = { lead: covered ? 106 : 0, trail: -8 };
    const draw = () => {
      // the part of the sheet on screen: everything from the trailing edge up to the leading edge
      const body = leading.map((j, i) => `${(flip ? 100 - (s.lead + j) : s.lead + j).toFixed(2)}% ${((i / 21) * 100).toFixed(2)}%`);
      const tail = trailing.map((j, i) => `${(flip ? 100 - (s.trail + j) : s.trail + j).toFixed(2)}% ${((i / 21) * 100).toFixed(2)}%`).reverse();
      sheet.style.clipPath = `polygon(${[...body, ...tail].join(',')})`;
    };
    gsap.set(sheet, { visibility: 'visible' });
    draw();
    sfx('turn', 0.7);
    const tl = gsap.timeline({ onComplete: () => { gsap.set(sheet, { visibility: 'hidden' }); turning.current = false; } });
    if (!covered) tl.to(s, { lead: 106, duration: POSES * POSE, ease: stepped('power2.inOut', POSES), onUpdate: draw });
    tl.call(go).to(s, { trail: 106, duration: POSES * POSE, ease: stepped('power2.inOut', POSES), onUpdate: draw }, `+=${POSE}`);
  }, []);
  // the browser's own back and forward (a button, a swipe on a phone, a touchpad gesture) change the page at once, before anything can
  // cover it: the new page comes up under the sheet, and the sheet pulls away from it, so the turn still plays
  const seen = useRef(location.key);
  useLayoutEffect(() => {
    if (location.key === seen.current) return;
    seen.current = location.key;
    if (navigation === 'POP' && !turning.current && !/\/intro\/?$/.test(pathname)) sweep(() => undefined, true);
  }, [location.key]);
  // the language switch: the same page in the other language. The section you are on is read at the moment of the switch: smooth
  // scrolling keeps it in the address without telling the router
  const toggle = useCallback(() => sweep(() => navigate({ pathname: pathIn(lang === 'fa' ? 'en' : 'fa', window.location.pathname), hash: window.location.hash }, { preventScrollReset: true })), [lang, navigate, sweep]);
  /** Goes to another page of the site under the same torn sheet: into a case study and back out of it. */
  const turnTo = useCallback((to: To) => sweep(() => navigate(to)), [navigate, sweep]);

  const value = useMemo(() => ({ lang, t, toggle, turnTo }), [lang, t, toggle, turnTo]);
  return <Language value={value}>{children}<div className="turn" ref={turn} aria-hidden="true" /></Language>;
}

export function useLanguage(): LanguageValue {
  const value = use(Language);
  if (!value) throw new Error('useLanguage needs LanguageProvider');
  return value;
}
