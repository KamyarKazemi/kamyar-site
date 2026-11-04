import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { copy, links } from '../content/site';
import { DESK_POINTER, gsap, MOTION, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useLanguage } from '../lib/language';
import { smooth } from '../lib/smooth';
import { knock, measure, openMenu, placeInk, typeOver, untype, walkHome } from '../timelines/header';
import { onSfxChange, setSfxOff, sfx, sfxOff } from '../lib/sfx';

// three takes of the same pen stroke; hovering keeps swapping between them, so the line is alive and never quite the same twice
const STROKES = ['M2 6 C24 2 58 9 98 4', 'M2 4 C30 9 66 1 98 6', 'M2 7 C22 4 70 6 98 3'] as const;
// the pen line along the bottom of the header that measures how far down the page you are
const RULE = 'M0 3 C90 1.5 170 4.5 260 3 S430 1.4 520 3.2 S700 4.6 790 2.8 S930 1.6 1000 3';

// where the header's parts stood just before a language switch; read once the other language has laid them out again
let before: Map<string, DOMRect> | null = null;
const moving = () => window.matchMedia(MOTION).matches;

/**
 * Sticky header: the name, the sections each with its name in the other language under it, the language switch and the call to action.
 * The section you are in sits on a red block that slides along as you scroll; a red pen measures how far down you are; past the top
 * the header lifts off the page as a torn strip. Pointing at a link retypes its second name; pointing at the name away from the top
 * offers the way back up. The switch knocks across, and after the page turn every part walks over to its new side.
 */
/** A speaker with its sound waves, and a red stroke through it when the sound is off. */
const SoundIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" /><path className="head__waves" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path className="head__mute" d="M3 21L21 3" stroke="#ce261e" strokeWidth="2.6" strokeLinecap="round" /></svg>
);

export function Header() {
  const { lang, t, toggle } = useLanguage();
  const other = copy[lang === 'fa' ? 'en' : 'fa'];
  const tag = (id: string) => other.nav.find((n) => n.id === id)?.label;
  const [active, setActive] = useState('');
  const root = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const [ticks, setTicks] = useState<number[]>([]);
  const walking = useRef(false);
  const [quiet, setQuiet] = useState(sfxOff);
  useEffect(() => onSfxChange(setQuiet), []);
  const switching = useRef(false);

  useEffect(() => {
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id === 'top' ? '' : e.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    for (const id of ['top', ...t.nav.map((n) => n.id)]) { const el = document.getElementById(id); if (el) seen.observe(el); }
    return () => seen.disconnect();
  }, [t]);

  // a tick on the pen line where each chapter starts, measured again whenever the page is measured
  useEffect(() => {
    const mark = () => {
      const max = ScrollTrigger.maxScroll(window), head = root.current?.offsetHeight ?? 0;
      if (max > 0) setTicks(t.nav.map((n) => { const el = document.getElementById(n.id); return el ? Math.min(1, Math.max(0, (el.getBoundingClientRect().top + scrollY - head) / max)) : 0; }));
    };
    mark();
    ScrollTrigger.addEventListener('refresh', mark);
    return () => ScrollTrigger.removeEventListener('refresh', mark);
  }, [t]);

  // past the very top the header lifts off the page as a strip of torn paper
  useEffect(() => {
    const lift = () => root.current?.classList.toggle('is-lifted', scrollY > 6);
    lift();
    addEventListener('scroll', lift, { passive: true });
    return () => removeEventListener('scroll', lift);
  }, []);

  // the red block follows the section you are in; it waits while the parts are walking after a language switch. Measured a moment
  // later: the page's direction is only set once this commit's effects have run, and the new language lays out the other way round
  useLayoutEffect(() => {
    queueMicrotask(() => { if (nav.current && !walking.current) placeInk(nav.current, !moving()); });
  }, [active, lang]);

  useEffect(() => {
    const strip = nav.current;
    if (!strip) return;
    const fit = new ResizeObserver(() => { if (!walking.current) placeInk(strip, true); });
    fit.observe(strip);
    return () => fit.disconnect();
  }, []);

  // after the page turn the parts walk from where they stood in the old language to their places in the new one
  useLayoutEffect(() => {
    const head = root.current, was = before;
    before = null;
    switching.current = false;
    // the knob was pushed across by hand; now the new language owns it
    head?.querySelector('.head__lang')?.classList.remove('is-flipped');
    gsap.set(head?.querySelector('.head__knob') ?? [], { xPercent: 0, scale: 1 });
    if (!head || !was || !moving()) return;
    walking.current = true;
    head.classList.add('is-walking');
    gsap.set(head.querySelector('.head__ink'), { autoAlpha: 0 });
    queueMicrotask(() => void walkHome(head, was).then(() => {
      walking.current = false;
      head.classList.remove('is-walking');
      if (nav.current) placeInk(nav.current, false);
    }));
  }, [lang]);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      // tweened as the attribute: as a CSS length GSAP rounds it to whole pixels, and this line is only one unit long
      gsap.fromTo('.head__progress path', { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.4 }, onUpdate() { root.current?.style.setProperty('--p', this.progress().toFixed(4)); } });
    });
    mm.add(`${MOTION} and ${DESK_POINTER}`, () => {
      const off = gsap.utils.toArray<HTMLElement>('.head__nav a').map((link) => {
        const pen = link.querySelector('path')!, line = link.querySelector<HTMLElement>('.head__tag')!;
        let take = 0;
        // each hover draws a different take of the stroke and types the link's second name out again
        const enter = () => {
          take = (take + 1) % STROKES.length;
          pen.setAttribute('d', STROKES[take] ?? STROKES[0]);
          gsap.fromTo(pen, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.38, ease: 'power2.out', overwrite: true });
          typeOver(line, line.dataset.text ?? '');
          sfx('pen', 0.3);
        };
        const leave = () => {
          if (link.getAttribute('aria-current')) return;
          gsap.to(pen, { strokeDashoffset: -1, duration: 0.28, ease: 'power2.in', overwrite: true });
        };
        link.addEventListener('pointerenter', enter);
        link.addEventListener('pointerleave', leave);
        return () => { link.removeEventListener('pointerenter', enter); link.removeEventListener('pointerleave', leave); };
      });
      // away from the top, the name's second line offers the way back up
      const name = document.querySelector<HTMLElement>('.head__name')!, line = name.querySelector<HTMLElement>('.head__sub')!;
      const enter = () => { if (scrollY > innerHeight * 0.5) typeOver(line, line.dataset.top ?? '', true); };
      const leave = () => { if (line.classList.contains('is-typing')) typeOver(line, line.dataset.text ?? ''); };
      name.addEventListener('pointerenter', enter);
      name.addEventListener('pointerleave', leave);
      return () => {
        off.forEach((fn) => fn());
        name.removeEventListener('pointerenter', enter);
        name.removeEventListener('pointerleave', leave);
        untype(line);
      };
    });
  }, { scope: root, dependencies: [t], revertOnUpdate: true });

  const flip = (e: MouseEvent<HTMLButtonElement>) => {
    if (!moving() || !root.current) { toggle(); return; }
    if (switching.current) return;
    switching.current = true;
    const head = root.current;
    knock(e.currentTarget, lang === 'fa', () => { before = measure(head); toggle(); });
  };

  const items = (onPick?: () => void) => t.nav.map((n) => (
    <a key={n.id} href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined} onClick={onPick} data-walk={onPick ? undefined : `nav-${n.id}`}>
      {onPick ? n.label : <><span className="head__label">{n.label}</span><span className="head__tag" data-text={`[${tag(n.id)}]`}>[{tag(n.id)}]<i className="head__type" aria-hidden="true" /></span></>}
      {!onPick && <svg className="pen" viewBox="0 0 100 10" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d={STROKES[0]} stroke="#ce261e" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray="1 1" /></svg>}
    </a>
  ));

  const hush = () => { setSfxOff(!quiet); if (quiet) sfx('tap', 0.5); };
  return (
    <header className="head" ref={root}>
      <a className="head__name" href="#top" data-walk="name">
        <strong>{t.fullName}</strong>
        <span className="head__sub" data-text={other.fullName} data-top={t.toTop}>{other.fullName}<i className="head__type" aria-hidden="true" /></span>
      </a>
      <nav className="head__nav" ref={nav} aria-label={t.menu.label}><i className="head__ink" aria-hidden="true" />{items()}</nav>
      <button type="button" className="head__lang" onClick={flip} aria-label={t.otherLangName} data-walk="lang">
        <i className={`head__knob${lang === 'fa' ? ' is-fa' : ''}`} aria-hidden="true" />
        <span aria-current={lang === 'en' ? 'true' : undefined}>EN</span><span aria-current={lang === 'fa' ? 'true' : undefined}>FA</span>
      </button>
      <button type="button" className={`head__sound${quiet ? ' is-off' : ''}`} aria-pressed={!quiet} aria-label={quiet ? t.sound.on : t.sound.off} data-walk="sound"
        onClick={hush}>
        <SoundIcon />
      </button>
      <a className="btn btn--sm head__cta" href={links.dm} target="_blank" rel="noreferrer" data-walk="cta">{t.reach}<i>/</i><span>{other.reach}</span></a>
      <button type="button" className="head__burger" aria-label={t.menu.open} onClick={() => { if (!menu.current) return; menu.current.showModal(); openMenu(menu.current); smooth.stop(); }} data-walk="burger"><i /><i /></button>
      <span className="head__ticks" aria-hidden="true">{ticks.map((f, i) => <i key={i} style={{ insetInlineStart: `${(f * 100).toFixed(2)}%` }} />)}</span>
      <svg className="head__progress" viewBox="0 0 1000 6" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d={RULE} stroke="#ce261e" strokeWidth="2.5" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset="1" /></svg>

      <dialog className="menu" ref={menu} aria-label={t.menu.label} onClose={() => smooth.start()}>
        <button type="button" className="menu__close" aria-label={t.menu.close} onClick={() => menu.current?.close()}><i /><i /></button>
        <nav aria-label={t.menu.label}>{items(() => menu.current?.close())}</nav>
        {/* on a phone the sound switch lives here, not in the crowded header */}
        <button type="button" className={`menu__sound${quiet ? ' is-off' : ''}`} aria-pressed={!quiet} onClick={hush}><SoundIcon /><span>{quiet ? t.sound.on : t.sound.off}</span></button>
        <a className="btn" href={links.dm} target="_blank" rel="noreferrer">{t.cta}</a>
      </dialog>
    </header>
  );
}
