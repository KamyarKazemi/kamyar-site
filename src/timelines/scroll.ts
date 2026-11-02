import { gsap, ScrollTrigger } from '../lib/gsap';
import { stepped } from '../lib/paper';

/** As you scroll: what sits in a section rises in, in stop-motion, and each piece of the route is drawn on, tied to the scroll. Everything starts visible; only this hides it. */
export function scrollTimelines(): void {
  const items = gsap.utils.toArray<HTMLElement>('.rise');
  gsap.set(items, { autoAlpha: 0, y: 22 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: stepped('power3.out', 6), overwrite: true }),
  });

  for (const pen of gsap.utils.toArray<SVGPathElement>('.route__pen')) {
    gsap.fromTo(pen, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: pen.closest('svg'), start: 'top 88%', end: 'bottom 55%', scrub: 0.4 } });
  }
}
