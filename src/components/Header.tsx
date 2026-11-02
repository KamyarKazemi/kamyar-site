import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { links } from '../content/site';
import { DESK_POINTER, gsap, MOTION, useGSAP } from '../lib/gsap';
import { pathFor, useLanguage } from '../lib/language';
import { POSE } from '../lib/paper';

// three takes of the same pen stroke; hovering keeps swapping between them, so the line is alive and never quite the same twice
const STROKES = ['M2 6 C24 2 58 9 98 4', 'M2 4 C30 9 66 1 98 6', 'M2 7 C22 4 70 6 98 3'] as const;

/** Sticky header. A red pen underlines the link you point at and the section you are in. On phones the links live in a full-screen menu. */
export function Header() {
  const { lang, t, toggle } = useLanguage();
  const [active, setActive] = useState('');
  const root = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    for (const id of ['top', ...t.nav.map((n) => n.id)]) { const el = document.getElementById(id); if (el) seen.observe(el); }
    return () => seen.disconnect();
  }, [t]);

  useGSAP(() => {
    gsap.matchMedia().add(`${MOTION} and ${DESK_POINTER}`, () => {
      const off = gsap.utils.toArray<HTMLElement>('.head__nav a').map((link) => {
        const pen = link.querySelector('path')!;
        let take = 0, boil: gsap.core.Tween | undefined;
        const redraw = () => { take = (take + 1) % STROKES.length; pen.setAttribute('d', STROKES[take] ?? STROKES[0]); };
        const enter = () => {
          redraw();
          gsap.fromTo(pen, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 4 * POSE, ease: 'steps(4)', overwrite: true });
          boil?.kill();
          boil = gsap.to({}, { duration: 3 * POSE, repeat: -1, onRepeat: redraw });
        };
        const leave = () => {
          boil?.kill();
          if (link.getAttribute('aria-current')) return;
          gsap.to(pen, { strokeDashoffset: -1, duration: 3 * POSE, ease: 'steps(3)', overwrite: true });
        };
        link.addEventListener('pointerenter', enter);
        link.addEventListener('pointerleave', leave);
        return () => { boil?.kill(); link.removeEventListener('pointerenter', enter); link.removeEventListener('pointerleave', leave); };
      });
      return () => off.forEach((fn) => fn());
    });
  }, { scope: root, dependencies: [t], revertOnUpdate: true });

  const items = (onPick?: () => void) => t.nav.map((n) => (
    <a key={n.id} href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined} onClick={onPick}>
      {n.label}
      {!onPick && <svg className="pen" viewBox="0 0 100 10" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d={STROKES[0]} stroke="#ce261e" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray="1 1" /></svg>}
    </a>
  ));

  return (
    <header className="head" ref={root}>
      <Link className="head__name" to={{ pathname: pathFor(lang), hash: '#top' }}>{t.name}</Link>
      <nav className="head__nav" aria-label={t.menu.label}>{items()}</nav>
      <button type="button" className="head__lang" onClick={toggle} aria-label={t.otherLangName}>{t.otherLang}</button>
      <a className="btn btn--sm head__cta" href={links.dm} target="_blank" rel="noreferrer">{t.cta}</a>
      <button type="button" className="head__burger" aria-label={t.menu.open} onClick={() => menu.current?.showModal()}><i /><i /></button>

      <dialog className="menu" ref={menu} aria-label={t.menu.label}>
        <button type="button" className="menu__close" aria-label={t.menu.close} onClick={() => menu.current?.close()}><i /><i /></button>
        <nav aria-label={t.menu.label}>{items(() => menu.current?.close())}</nav>
        <a className="btn" href={links.dm} target="_blank" rel="noreferrer">{t.cta}</a>
      </dialog>
    </header>
  );
}
