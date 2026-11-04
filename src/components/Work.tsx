import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DESK_POINTER, gsap, MOTION, useGSAP } from '../lib/gsap';
import { Link } from 'react-router-dom';
import { pathFor, useLanguage } from '../lib/language';
import { smooth } from '../lib/smooth';
import { SectionHead } from './Sections';
import { sfx } from '../lib/sfx';

const REST = [-1.2, 0.9, -0.6, 1.1, -0.9];
/** the height kept for the caption bar under a print: on a phone it is a bottom sheet, the name over three buttons */
const bar = () => (innerWidth <= 720 ? 150 : 92);
/** the paper border around a print in the focus view, both sides together */
const PAD = 20;

/**
 * The work as prints hung side by side, all in black and red. Pick one and it is pulled off the wall: it lifts, flies to the middle of the
 * screen at its real shape, lands with a little swing and soaks into colour, while the page dims behind it and the other prints take the bump.
 * Close it (outside, Escape, or the button) and it flies back into its slot. Previous and next send it home and bring the neighbour out.
 */
export function Work() {
  const { lang, t, turnTo } = useLanguage();
  const items = t.work.items, count = items.length;
  const [open, setOpen] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const flight = useRef<gsap.core.Timeline | null>(null);
  const shown = useRef<number | null>(null);
  /** set when a print comes in from the side (previous / next) rather than off the wall: which side, on screen */
  const entry = useRef<number | null>(null);

  const still = () => !window.matchMedia(MOTION).matches;
  const time = (s: number) => (still() ? 0 : s);
  const faces = () => gsap.utils.toArray<HTMLElement>('.strip .card__btn', root.current);
  const slot = (i: number) => root.current!.querySelectorAll<HTMLElement>('.strip .print__img')[i]!.getBoundingClientRect();
  const parts = () => {
    const d = dialog.current!;
    return { print: d.querySelector<HTMLElement>('.focus__print')!, shade: d.querySelector<HTMLElement>('.focus__shade')!, bar: d.querySelector<HTMLElement>('.focus__bar')!, video: d.querySelector('video') };
  };
  // the largest picture of the work's real shape that fits the screen above its caption bar, plus its paper border
  const stage = (ratio: number) => {
    const maxW = Math.min(innerWidth * 0.9, 1080) - PAD, maxH = innerHeight - bar() - 56 - PAD;
    let h = maxH, w = h * ratio;
    if (w > maxW) { w = maxW; h = w / ratio; }
    const width = w + PAD, height = h + PAD;
    return { left: (innerWidth - width) / 2, top: Math.max(24, (innerHeight - bar() - height) / 2), width, height };
  };
  // the other prints take the bump, a wave outward from the picked one; `back` lets them settle again
  const bump = (picked: number, back: boolean) => {
    const column = innerWidth <= 720, along = lang === 'fa' ? -1 : 1;
    faces().forEach((face, i) => {
      if (i === picked) return;
      const d = Math.abs(i - picked), away = Math.sign(i - picked) * along;
      if (back) { gsap.to(face, { x: 0, y: 0, scale: 1, rotation: REST[i] ?? 0, duration: time(0.9), ease: 'elastic.out(1, 0.55)', delay: time(d * 0.04), overwrite: 'auto' }); return; }
      gsap.timeline({ delay: time((d - 1) * 0.05) })
        .to(face, { x: column ? 0 : away * (26 / d), y: column ? 10 : -10 / d, rotation: (REST[i] ?? 0) + away * (3 / d), duration: time(0.2), ease: 'power2.out', overwrite: 'auto' })
        .to(face, { x: 0, y: 8, scale: 0.96, rotation: REST[i] ?? 0, duration: time(0.8), ease: 'elastic.out(1, 0.55)' });
    });
  };

  const { contextSafe } = useGSAP(() => {
    gsap.set(faces(), { rotation: (i: number) => REST[i] ?? 0 });
  }, { scope: root });

  // with a mouse, a print you point at lifts and lets a little colour in
  useGSAP(() => {
    gsap.matchMedia().add(`${MOTION} and ${DESK_POINTER}`, () => {
      const off = faces().map((face, i) => {
        const card = face.closest<HTMLElement>('.card')!;
        const enter = () => { gsap.to(face, { y: -8, rotation: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' }); gsap.to(card, { '--f': 1.6, duration: 0.45, ease: 'power2.out', overwrite: 'auto' }); };
        const leave = () => { if (shown.current !== null) return; gsap.to(face, { y: 0, rotation: REST[i] ?? 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' }); gsap.to(card, { '--f': 0, duration: 0.35, ease: 'power1.in', overwrite: 'auto' }); };
        face.addEventListener('pointerenter', enter);
        face.addEventListener('pointerleave', leave);
        return () => { face.removeEventListener('pointerenter', enter); face.removeEventListener('pointerleave', leave); };
      });
      return () => off.forEach((fn) => fn());
    });
  }, { scope: root });

  // pulling a print off the wall
  useLayoutEffect(() => {
    if (open === null || !dialog.current) return;
    const i = open, item = items[i]!, face = faces()[i]!, card = face.closest<HTMLElement>('.card')!;
    const { print, shade, bar, video } = parts(), from = slot(i), to = stage(item.ratio);
    if (!dialog.current.open) { dialog.current.showModal(); smooth.stop(); }
    shown.current = i;
    flight.current?.kill();
    const side = entry.current;
    entry.current = null;
    if (video) { video.currentTime = 0; gsap.set(video, { autoAlpha: 0 }); }
    const play = () => { if (video) { void video.play().catch(() => undefined); gsap.to(video, { autoAlpha: 1, duration: 0.35 }); } };

    if (side !== null) {
      // swapped at the centre: the new print sweeps in from the side that was asked for, already at its own shape
      const off = Math.min(innerWidth * 0.62, to.width * 1.6 + 160);
      gsap.set(print, { left: to.left, top: to.top, width: to.width, height: to.height, x: side * off, y: 40, scale: 0.9, rotation: side * 13, autoAlpha: 1, '--f': 0 });
      gsap.set(bar, { top: to.top + to.height + 26 });
      gsap.set(face, { autoAlpha: 0 });
      bump(i, false);
      flight.current = gsap.timeline()
        .to(print, { x: 0, y: 0, scale: 1, duration: time(0.78), ease: 'power4.out' }, time(0.06))
        .call(() => sfx('slap', 0.35, 1.1), [], time(0.32))
        .to(print, { rotation: 0, duration: time(1.2), ease: 'elastic.out(1, 0.42)' }, time(0.1))
        .to(print, { '--f': 7, duration: time(0.85), ease: 'power2.out' }, time(0.24))
        .fromTo(bar, { opacity: 0, x: side * 46 }, { opacity: 1, x: 0, duration: time(0.55), ease: 'power3.out' }, time(0.2))
        .call(play, [], time(0.8));
      return;
    }

    gsap.set(print, { left: from.left, top: from.top, width: from.width, height: from.height, x: 0, y: 0, scale: 1, rotation: REST[i] ?? 0, autoAlpha: 1, '--f': gsap.getProperty(card, '--f') || 0 });
    // the bar only fades, never hides: hiding it would throw keyboard focus out of the view
    gsap.set(bar, { top: to.top + to.height + 26, x: 0, visibility: 'visible' });
    gsap.set(face, { autoAlpha: 0 });
    bump(i, false);
    flight.current = gsap.timeline()
      .to(shade, { autoAlpha: 1, duration: time(0.5), ease: 'power2.out' }, 0)
      .call(() => sfx('peel', 0.6), [], 0)
      .call(() => sfx('swish', 0.3, 0.9), [], time(0.14))
      .to(print, { y: -22, scale: 1.06, rotation: -(REST[i] ?? 0) * 2.5, duration: time(0.18), ease: 'power2.out' }, 0)
      .to(print, { left: to.left, top: to.top, width: to.width, height: to.height, duration: time(0.8), ease: 'expo.out' }, time(0.14))
      .to(print, { y: 0, scale: 1, duration: time(0.7), ease: 'power3.out' }, time(0.16))
      .to(print, { rotation: 0, duration: time(1.1), ease: 'elastic.out(1, 0.45)' }, time(0.22))
      .to(print, { '--f': 7, duration: time(0.95), ease: 'power2.out' }, time(0.3))
      .fromTo(bar, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: time(0.5), ease: 'back.out(1.8)' }, time(0.55))
      .call(play, [], time(0.9));
    if (!dialog.current.querySelector('.focus__bar')?.contains(document.activeElement)) dialog.current.querySelector<HTMLElement>('.focus__close')?.focus({ preventScroll: true });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // a print back on the wall lands in its slot with a small jolt
  const rehang = (i: number) => {
    const face = faces()[i]!;
    gsap.set(face, { autoAlpha: 1 });
    gsap.fromTo(face, { y: -10 }, { y: 0, duration: time(0.6), ease: 'elastic.out(1, 0.5)' });
  };

  /** Send the print back into its slot and close the view. */
  const home = contextSafe(() => {
    const i = shown.current;
    if (i === null || !dialog.current) return;
    const { print, shade, bar, video } = parts(), back = slot(i);
    video?.pause();
    flight.current?.kill();
    bump(i, true);
    flight.current = gsap.timeline({
      onComplete: () => {
        sfx('slap', 0.55);
        rehang(i);
        gsap.set(print, { autoAlpha: 0 });
        shown.current = null;
        dialog.current?.close();
        smooth.start();
        setOpen(null);
      },
    })
      .to(bar, { opacity: 0, y: 14, duration: time(0.18), ease: 'power2.in' }, 0)
      .to(video ?? {}, { autoAlpha: 0, duration: time(0.15) }, 0)
      .to(print, { '--f': 0, duration: time(0.4), ease: 'power1.in' }, 0)
      .to(print, { left: back.left, top: back.top, width: back.width, height: back.height, x: 0, rotation: REST[i] ?? 0, scale: 1, y: 0, duration: time(0.62), ease: 'power3.inOut' }, 0)
      .to(shade, { autoAlpha: 0, duration: time(0.45), ease: 'power2.inOut' }, time(0.12));
  });

  /**
   * Previous / next, at the centre: the print on screen is lifted and tossed out to one side, turning back to ink as it goes, while the
   * neighbour sweeps in from the other side. Every press acts at once, so quick presses riffle through the prints.
   */
  const go = contextSafe((by: number) => {
    const i = shown.current;
    if (i === null || !dialog.current) return;
    const n = (i + by + count) % count, side = by * (lang === 'fa' ? -1 : 1);
    const { print, bar, video } = parts();
    video?.pause();
    flight.current?.kill();
    const ghost = print.cloneNode(true) as HTMLElement;
    ghost.classList.add('focus__ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.querySelector('video')?.remove();
    ghost.style.setProperty('--f', String(gsap.getProperty(print, '--f')));
    print.after(ghost);
    const off = Math.min(innerWidth * 0.62, print.offsetWidth * 1.6 + 160);
    sfx('swish', 0.6);
    gsap.timeline({ onComplete: () => ghost.remove() })
      .to(ghost, { y: -18, scale: 1.04, rotation: -side * 3, duration: time(0.1), ease: 'power2.out' })
      .to(ghost, { x: -side * off, y: 70, scale: 0.86, rotation: -side * 17, '--f': 1.2, duration: time(0.46), ease: 'power2.in' })
      .to(ghost, { autoAlpha: 0, duration: time(0.14) }, '-=0.14');
    gsap.to(bar, { opacity: 0, x: -side * 34, duration: time(0.16), ease: 'power2.in', overwrite: 'auto' });
    gsap.set(print, { autoAlpha: 0 });
    rehang(i);
    entry.current = side;
    setOpen(n);
  });
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === (lang === 'fa' ? 'ArrowLeft' : 'ArrowRight')) { e.preventDefault(); go(1); }
    if (e.key === (lang === 'fa' ? 'ArrowRight' : 'ArrowLeft')) { e.preventDefault(); go(-1); }
  };
  // on a touch screen the print is swiped: sideways to the next one the way the arrow keys go, down to put it back on the wall
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const touchStart = (e: React.TouchEvent) => { const p = e.touches[0]; swipe.current = p ? { x: p.clientX, y: p.clientY } : null; };
  const touchEnd = (e: React.TouchEvent) => {
    const from = swipe.current, p = e.changedTouches[0];
    swipe.current = null;
    if (!from || !p || (e.target as Element).closest('button')) return;
    const dx = p.clientX - from.x, dy = p.clientY - from.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go((dx > 0) === (lang === 'fa') ? 1 : -1);
    else if (dy > 80 && dy > Math.abs(dx) * 1.3) home();
  };
  const current = open === null ? null : items[open];
  // the case study is its own download: fetched while the page is idle, so the sheet that turns to it never uncovers a blank page
  useEffect(() => {
    const get = () => { void import('./CaseStudy'); };
    const id = 'requestIdleCallback' in window ? requestIdleCallback(get, { timeout: 4000 }) : setTimeout(get, 2500);
    return () => { if ('cancelIdleCallback' in window) cancelIdleCallback(id as number); else clearTimeout(id); };
  }, []);
  const caseHref = `${pathFor(lang) === '/' ? '' : pathFor(lang)}/work/atarinaji`;

  return (
    <section className="sec" id="work" ref={root}>
      <SectionHead note={t.work.note} title={t.work.title} />
      <ul className="strip" aria-label={t.work.title}>
        {items.map((item, i) => (
          <li className="card" key={item.id}>
            <button type="button" className="card__btn" aria-haspopup="dialog" aria-label={`${item.title}, ${item.kind}`} onClick={() => { if (shown.current === null) setOpen(i); }}>
              <i className="card__tape" aria-hidden="true" />
              <span className="print__img">
                <img src={`/work/${item.id}-ink.webp`} alt={item.alt} loading="lazy" decoding="async" width="480" height="853" draggable={false} />
                <img className="print__colour" src={item.image} alt="" loading="lazy" decoding="async" width="720" height="1280" draggable={false} />
              </span>
              <span className="card__tag"><strong>{item.title}</strong><span>{item.kind}</span></span>
            </button>
          </li>
        ))}
      </ul>

      {/* the work told in full: a case study on its own page */}
      <Link className="case-link rise" to={caseHref} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); sfx('peel', 0.5); turnTo(caseHref); }}>
        <img src="/work/atarinaji/home.webp" alt="" width="1600" height="1000" loading="lazy" decoding="async" />
        <span className="case-link__text">
          <span className="note">{t.work.caseStudy.note}</span>
          <strong>{t.work.caseStudy.title}</strong>
          <span>{t.work.caseStudy.teaser}</span>
        </span>
        <span className="case-link__go">{t.work.caseStudy.go} {lang === 'fa' ? '←' : '→'}</span>
      </Link>

      <dialog className="focus" ref={dialog} aria-label={current?.title ?? t.work.title} onKeyDown={keys} onTouchStart={touchStart} onTouchEnd={touchEnd} onCancel={(e) => { e.preventDefault(); home(); }}>
        <div className="focus__shade" onClick={() => home()} aria-hidden="true" />
        <div className="focus__print">
          <i className="card__tape" aria-hidden="true" />
          {current && (
            <>
              <img className="focus__ink" src={`/work/${current.id}-ink.webp`} alt="" />
              <img className="focus__colour" src={current.image} alt={current.alt} />
              {current.video && <video key={current.id} src={current.video} poster={current.image} muted loop playsInline preload="none" />}
            </>
          )}
        </div>
        <div className="focus__bar">
          <div className="focus__name"><strong>{current?.title}</strong><span>{current?.kind}</span></div>
          <div className="focus__btns">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => go(-1)}>{t.viewer.prev}</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => go(1)}>{t.viewer.next}</button>
            <button type="button" className="btn btn--sm focus__close" onClick={() => home()}>{t.viewer.close}</button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
