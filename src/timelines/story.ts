import { gsap, ScrollTrigger } from '../lib/gsap';
import { smooth } from '../lib/smooth';
import { sfx } from '../lib/sfx';

/**
 * The page told as a story, tied to the scroll:
 * - About reads like a page: a paragraph you have read fades to pencil grey, and the red pen underlines each key phrase as it
 *   passes the middle of the screen.
 * - Services are dealt onto the desk one by one while the section holds still (on phones each is dealt as it arrives).
 * - The paper feels the scroll: scroll fast and the sections lag and lean like loose sheets, stop and they settle.
 */
export function storyTimelines(): () => void {
  for (const p of gsap.utils.toArray<HTMLElement>('.about__text [data-read]')) {
    ScrollTrigger.create({ trigger: p, start: 'bottom 30%', onEnter: () => p.classList.add('is-passed'), onLeaveBack: () => p.classList.remove('is-passed') });
  }
  for (const pen of gsap.utils.toArray<SVGPathElement>('.key__pen path')) {
    gsap.fromTo(pen, { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.6, ease: 'power2.out', onStart: () => sfx('pen', 0.28), scrollTrigger: { trigger: pen.closest('mark'), start: 'top 58%', toggleActions: 'play none none reverse' } });
  }

  const mm = gsap.matchMedia();
  const rows = gsap.utils.toArray<HTMLElement>('.list__row');
  // each card comes off the deck below, spinning a little, and lands in its place
  const deal = (i: number) => ({ y: () => innerHeight * 0.75, x: (i % 2 ? 1 : -1) * gsap.utils.random(30, 90), rotation: gsap.utils.random(-16, 16), scale: 0.92, autoAlpha: 0 });
  mm.add('(min-width: 761px)', () => {
    const head = document.querySelector<HTMLElement>('.head')?.offsetHeight ?? 80;
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#services', start: `top ${head}px`, end: () => `+=${rows.length * innerHeight * 0.32}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true } });
    rows.forEach((row, i) => tl.from(row, { ...deal(i), duration: 1, ease: 'power3.out', onStart: () => sfx('deal', 0.5) }, i * 0.75));
    tl.to({}, { duration: 0.6 });
  });
  mm.add('(max-width: 760px)', () => {
    rows.forEach((row, i) => gsap.from(row, { ...deal(i), y: 120, duration: 0.7, ease: 'power3.out', onStart: () => sfx('deal', 0.5), scrollTrigger: { trigger: row, start: 'top 92%', once: true } }));
  });

  // loose sheets: what sits in each section lags behind fast scrolling and leans with it, then settles. Not the pieces that rise in
  // (they own their own y) and not the work's dialog, which covers the screen
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => mm.revert();
  const sheets = gsap.utils.toArray<HTMLElement>('main .sec > :not(.rise, dialog)');
  const lean = sheets.map((el, i) => ({ skew: gsap.quickTo(el, 'skewY', { duration: 0.5 + (i % 3) * 0.08, ease: 'power3.out' }), lag: gsap.quickTo(el, 'y', { duration: 0.55 + (i % 3) * 0.1, ease: 'power3.out' }) }));
  const feel = () => {
    const v = gsap.utils.clamp(-60, 60, smooth.velocity());
    for (const { skew, lag } of lean) { skew(v * -0.045); lag(v * -0.35); }
  };
  gsap.ticker.add(feel);

  return () => { gsap.ticker.remove(feel); gsap.set(sheets, { clearProps: 'transform' }); mm.revert(); };
}
