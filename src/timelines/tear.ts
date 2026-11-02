import { gsap, ScrollTrigger } from '../lib/gsap';
import { flap, jag, POSE, remains, stepped } from '../lib/paper';

const POSES = 10;

/**
 * A printed red strip covers a title and is ripped off in the reading direction, in ten poses, its white paper core showing along the tear and a
 * folded flap riding the edge. Scraps fall from where the paper gave way. Every title tears along its own seeded line.
 */
function ripTitle(title: HTMLElement, seed: number): gsap.core.Timeline {
  const tear = title.querySelector<HTMLElement>('.tear')!;
  const strip = tear.querySelector<HTMLElement>('.tear__strip')!;
  const core = tear.querySelector<HTMLElement>('.tear__core')!;
  const fold = tear.querySelector<HTMLElement>('.tear__flap')!;
  const scraps = gsap.utils.toArray<HTMLElement>('.scrap', tear);
  const line = jag(seed), inner = jag(seed + 40), rim = jag(seed + 80, 16, 3.4);
  const flip = getComputedStyle(title).direction === 'rtl';
  const state = { edge: -4 };

  const draw = () => {
    strip.style.clipPath = remains(state.edge, line, flip);
    core.style.clipPath = remains(state.edge - 1.5, inner, flip);
    fold.style.clipPath = flap(state.edge, Math.max(0, 9 * (1 - state.edge / 112)), rim, flip);
  };
  draw();
  gsap.set(tear, { visibility: 'visible' });

  const tl = gsap.timeline({ onComplete: () => void gsap.set(tear, { visibility: 'hidden' }) });
  tl.to(state, { edge: 108, duration: POSES * POSE, ease: stepped('power1.in', POSES), onUpdate: draw }, 0);
  scraps.forEach((scrap, i) => {
    const r = gsap.utils.random, along = (i + 1) / (scraps.length + 1), left = flip ? 100 - along * 100 : along * 100;
    gsap.set(scrap, { left: `${left}%`, top: `${r(18, 82)}%`, rotation: r(0, 180), autoAlpha: 0, clipPath: `polygon(${r(0, 25)}% 0,100% ${r(0, 30)}%,${r(70, 100)}% 100%,0 ${r(60, 100)}%)` });
    tl.set(scrap, { autoAlpha: 1 }, along * POSES * POSE)
      .to(scrap, { y: r(110, 240), x: r(-46, 46), rotation: `+=${r(160, 420)}`, duration: 0.85, ease: stepped('power2.in', 10) }, along * POSES * POSE)
      .set(scrap, { autoAlpha: 0 });
  });
  // the title's red plate lands a touch out of register under the strip, and snaps in once it is free
  tl.fromTo(title.querySelector('.st__band'), { x: 7, y: -4 }, { x: 0, y: 0, duration: 3 * POSE, ease: 'steps(3)' }, POSES * POSE - POSE);
  return tl;
}

/** The hero rips on load; every other title rips as it scrolls in. */
export function tearTitles(): gsap.core.Timeline {
  const [hero, ...rest] = gsap.utils.toArray<HTMLElement>('.st');
  rest.forEach((title, i) => {
    const tl = ripTitle(title, i + 2).pause();
    ScrollTrigger.create({ trigger: title, start: 'top 84%', once: true, onEnter: () => void tl.play() });
  });
  return ripTitle(hero!, 1);
}
