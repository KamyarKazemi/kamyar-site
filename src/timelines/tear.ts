import { gsap, ScrollTrigger } from '../lib/gsap';
import { flap, jag, POSE, remains, stepped } from '../lib/paper';
import { dropScraps } from '../lib/scraps';
import { sfx } from '../lib/sfx';

const POSES = 10;
// fewer scraps on a phone, where seven of them round one title read as confetti
const scraps = () => (window.matchMedia('(max-width: 760px)').matches ? 3 : 7);

/**
 * A printed red strip covers a title and is ripped off in the reading direction, in ten poses, its white paper core showing along the tear and a
 * folded flap riding the edge. Scraps break off where the paper gives way and fall onto whatever is below. Every title tears along its own line.
 */
function ripTitle(title: HTMLElement, seed: number): gsap.core.Timeline {
  const tear = title.querySelector<HTMLElement>('.tear')!;
  const strip = tear.querySelector<HTMLElement>('.tear__strip')!;
  const core = tear.querySelector<HTMLElement>('.tear__core')!;
  const fold = tear.querySelector<HTMLElement>('.tear__flap')!;
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
  tl.call(() => sfx('rip', 0.55), [], 0);
  tl.to(state, { edge: 108, duration: POSES * POSE, ease: stepped('power1.in', POSES), onUpdate: draw }, 0);
  const count = scraps();
  for (let i = 0; i < count; i++) {
    const along = (i + 1) / (count + 1);
    tl.call(() => {
      const r = tear.getBoundingClientRect();
      dropScraps([{ x: r.left + scrollX + (flip ? 1 - along : along) * r.width, y: r.top + scrollY + r.height * gsap.utils.random(0.25, 0.75) }]);
    }, [], along * POSES * POSE);
  }
  // the title's red plate lands a touch out of register under the strip, and snaps in once it is free
  tl.fromTo(title.querySelector('.st__band'), { x: 7, y: -4 }, { x: 0, y: 0, duration: 3 * POSE, ease: 'steps(3)' }, POSES * POSE - POSE);
  return tl;
}

/** The hero rips on load; every other title rips as it scrolls in. Arriving from the live intro the hero is not torn (it rises instead). */
export function tearTitles(tearHero = true): gsap.core.Timeline {
  const [hero, ...rest] = gsap.utils.toArray<HTMLElement>('.st');
  rest.forEach((title, i) => {
    const tl = ripTitle(title, i + 2).pause();
    ScrollTrigger.create({ trigger: title, start: 'top 84%', once: true, onEnter: () => void tl.play() });
  });
  return tearHero ? ripTitle(hero!, 1) : gsap.timeline();
}
