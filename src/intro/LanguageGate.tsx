import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StickerTitle } from '../components/StickerTitle';
import type { Lang } from '../content/site';
import { gate } from '../content/intro';
import { gsap, MOTION } from '../lib/gsap';
import { jag, POSE, stepped } from '../lib/paper';
import './intro.css';
import { sfx } from '../lib/sfx';

const ROWS = 18;
const tall = () => window.innerHeight > window.innerWidth;

/**
 * The first thing on the site: choose a language. The screen is two halves of paper torn down the middle (across it on a phone):
 * «فارسی» on the reading side, English on the other, the hello label pinned on the seam. Each half is one big button. The half you
 * did not pick is torn away and falls; the half you kept lies down flat, and the intro starts on the floor it became.
 *
 * `onPress` runs inside the tap, so the browser lets the intro start its sound; `onGone` runs once the paper is out of the way.
 */
export function LanguageGate({ onPress, onGone, solid = false }: { onPress: (lang: Lang) => void; onGone: (lang: Lang) => void; solid?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [portrait, setPortrait] = useState(tall);
  const picked = useRef<Lang | null>(null);

  useLayoutEffect(() => {
    const fit = () => setPortrait(tall());
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);

  // the torn seam: one line, the two halves cut along either side of it, and a strip of the white paper core showing in between
  const cut = useMemo(() => {
    const line = jag(31, ROWS, 1.4), core = jag(47, ROWS, 1.1);
    const pts = (offset: number[], shift: number) => offset.map((j, i) => {
      const along = (i / (ROWS - 1)) * 100, across = 50 + j + shift;
      return portrait ? `${(100 - along).toFixed(2)}% ${across.toFixed(2)}%` : `${across.toFixed(2)}% ${along.toFixed(2)}%`;
    });
    // English is the second half: left of the seam on a wide screen, under it on a tall one
    const en = portrait ? ['0 100%', '100% 100%', ...pts(line, 0)] : ['0 0', ...pts(line, 0), '0 100%'];
    const ink = portrait ? ['0 100%', '100% 100%', ...pts(core, -0.9)] : ['0 0', ...pts(core, 0.9), '0 100%'];
    return { en: `polygon(${en.join(',')})`, core: `polygon(${ink.join(',')})` };
  }, [portrait]);

  // the halves are pushed together from either side, the seam settles, the label is pinned on it and the titles stand up
  useLayoutEffect(() => {
    const el = root.current!;
    if (!window.matchMedia(MOTION).matches) return;
    const ctx = gsap.context(() => {
      const away = portrait ? { yPercent: 8 } : { xPercent: -8 };
      gsap.timeline()
        .from('.gate__half--fa', { ...(portrait ? { yPercent: -8 } : { xPercent: 8 }), autoAlpha: 0, duration: 6 * POSE, ease: stepped('power3.out', 6) }, 0)
        .from('.gate__half--en, .gate__core', { ...away, autoAlpha: 0, duration: 6 * POSE, ease: stepped('power3.out', 6) }, POSE)
        .from('.gate__in .st', { rotationX: 90, transformPerspective: 900, transformOrigin: '50% 100%', duration: 7 * POSE, ease: stepped('back.out(1.6)', 7), stagger: 2 * POSE }, 5 * POSE)
        .from('.gate__in > :not(.st)', { y: 12, autoAlpha: 0, duration: 4 * POSE, ease: stepped('power3.out', 4), stagger: POSE }, 8 * POSE)
        .from('.gate__label', { scale: 1.6, rotation: -14, autoAlpha: 0, duration: 3 * POSE, ease: 'power4.in' }, 9 * POSE)
        .fromTo('.gate__seam', { x: 0, y: 0 }, { keyframes: { x: [3, -2, 0], y: [2, -1, 0] }, duration: 4 * POSE, ease: 'steps(4)' }, 12 * POSE);
    }, el);
    return () => ctx.revert();
  }, [portrait]);

  const pick = (lang: Lang) => {
    if (picked.current) return;
    picked.current = lang;
    onPress(lang);
    const el = root.current!;
    el.classList.add('is-picked', `is-${lang}`);
    if (!window.matchMedia(MOTION).matches || solid) { onGone(lang); return; }
    const kept = el.querySelectorAll(lang === 'fa' ? '.gate__half--fa' : '.gate__half--en, .gate__core'), lost = el.querySelectorAll(lang === 'fa' ? '.gate__half--en, .gate__core' : '.gate__half--fa');
    const side = lang === 'fa' ? -1 : 1;
    gsap.timeline({ onComplete: () => onGone(lang) })
      .call(() => sfx('rip', 0.85, 0.9), [], POSE)
      .call(() => sfx('slap', 0.45, 0.85), [], 13 * POSE)
      // the kept half takes the press, the label is torn off the seam with the other half
      .fromTo(el.querySelector(`.gate__half--${lang} .gate__in`), { scale: 0.97 }, { scale: 1, duration: 3 * POSE, ease: 'steps(3)' }, 0)
      .to('.gate__label', { y: 40, rotation: side * -22, autoAlpha: 0, duration: 5 * POSE, ease: stepped('power2.in', 5) }, POSE)
      .to(lost, { ...(portrait ? { yPercent: side * -18 } : { xPercent: side * 14 }), y: '+=140', rotation: side * 9, autoAlpha: 0, duration: 7 * POSE, ease: stepped('power2.in', 7) }, POSE)
      // then the half you kept lies down flat: it is the floor the intro starts on
      .to(kept, { rotationX: 82, transformPerspective: 1200, transformOrigin: '50% 100%', autoAlpha: 0, duration: 8 * POSE, ease: stepped('power2.in', 8) }, 7 * POSE);
  };

  const half = (lang: Lang) => {
    const c = gate[lang];
    return (
      <button type="button" className={`gate__half gate__half--${lang}`} lang={lang} dir={lang === 'fa' ? 'rtl' : 'ltr'} aria-label={c.label}
        style={lang === 'en' ? { clipPath: cut.en } : undefined} onClick={() => pick(lang)}>
        <span className="gate__in">
          <span className="gate__key">{c.key}</span>
          <StickerTitle as="p" size={portrait ? 'clamp(56px, 17vw, 104px)' : 'clamp(64px, 8.4vw, 150px)'}>{c.title}</StickerTitle>
          <span className="gate__go">{c.go}</span>
        </span>
      </button>
    );
  };

  return (
    <div className={`gate${portrait ? ' is-tall' : ''}${solid ? ' is-solid' : ''}`} ref={root} role="dialog" aria-modal="true" aria-label={`${gate.fa.ask} · ${gate.en.ask}`}>
      {half('fa')}
      <i className="gate__core" style={{ clipPath: cut.core }} aria-hidden="true" />
      {half('en')}
      <span className="gate__seam" aria-hidden="true">
        <span className="gate__label">
          <span lang="fa">{gate.fa.hello}</span><i /><span lang="en">{gate.en.hello}</span>
          <small>{gate.en.sound} · <span lang="fa">{gate.fa.sound}</span></small>
        </span>
      </span>
    </div>
  );
}
