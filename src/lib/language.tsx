import { createContext, use, useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { copy, type Copy, type Lang } from '../content/site';
import { gsap } from './gsap';
import { jag, POSE, stepped } from './paper';

interface LanguageValue { lang: Lang; t: Copy; toggle: () => void }

const Language = createContext<LanguageValue | null>(null);
const POSES = 7;

/** Each language has its own address: Persian at /, English at /en. That keeps both linkable and ready for the blog's SEO. */
export const pathFor = (lang: Lang): string => (lang === 'en' ? '/en' : '/');
export const langOf = (pathname: string): Lang => (/^\/en(\/|$)/.test(pathname) ? 'en' : 'fa');

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
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
  const toggle = useCallback(() => {
    const go = () => navigate({ pathname: pathFor(lang === 'fa' ? 'en' : 'fa'), hash }, { preventScrollReset: true });
    const sheet = turn.current;
    if (!sheet || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
    if (turning.current) return;
    turning.current = true;
    const flip = document.documentElement.dir === 'ltr', leading = jag(11, 22, 1.6), trailing = jag(12, 22, 1.6), s = { lead: 0, trail: -8 };
    const draw = () => {
      // the part of the sheet on screen: everything from the trailing edge up to the leading edge
      const body = leading.map((j, i) => `${(flip ? 100 - (s.lead + j) : s.lead + j).toFixed(2)}% ${((i / 21) * 100).toFixed(2)}%`);
      const tail = trailing.map((j, i) => `${(flip ? 100 - (s.trail + j) : s.trail + j).toFixed(2)}% ${((i / 21) * 100).toFixed(2)}%`).reverse();
      sheet.style.clipPath = `polygon(${[...body, ...tail].join(',')})`;
    };
    gsap.set(sheet, { visibility: 'visible' });
    draw();
    gsap.timeline({ onComplete: () => { gsap.set(sheet, { visibility: 'hidden' }); turning.current = false; } })
      .to(s, { lead: 106, duration: POSES * POSE, ease: stepped('power2.inOut', POSES), onUpdate: draw })
      .call(go)
      .to(s, { trail: 106, duration: POSES * POSE, ease: stepped('power2.inOut', POSES), onUpdate: draw }, `+=${POSE}`);
  }, [lang, hash, navigate]);

  const value = useMemo(() => ({ lang, t, toggle }), [lang, t, toggle]);
  return <Language value={value}>{children}<div className="turn" ref={turn} aria-hidden="true" /></Language>;
}

export function useLanguage(): LanguageValue {
  const value = use(Language);
  if (!value) throw new Error('useLanguage needs LanguageProvider');
  return value;
}
