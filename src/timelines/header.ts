import { gsap, MOTION } from '../lib/gsap';
import { jag, POSE, stepped } from '../lib/paper';
import { sfx } from '../lib/sfx';

const typing = new WeakMap<HTMLElement, gsap.core.Tween>();

/**
 * Retypes a line of the header on a typewriter. The real text stays in place but goes clear while a copy is typed over it, so nothing
 * around it shifts. `keep` leaves the typed copy showing (the name's "back to top"); otherwise the real text comes back once it is typed.
 */
export function typeOver(host: HTMLElement, text: string, keep = false): gsap.core.Tween {
  const sheet = host.querySelector<HTMLElement>('.head__type')!;
  const chars = Array.from(text), s = { n: 0 };
  let typed = 0;
  typing.get(host)?.kill();
  host.classList.add('is-typing');
  sheet.textContent = '';
  const tween = gsap.to(s, {
    n: chars.length,
    duration: chars.length * 0.034,
    ease: `steps(${chars.length})`,
    onUpdate: () => {
      const n = Math.round(s.n);
      if (n > typed) sfx('key', 0.2);
      typed = n;
      sheet.textContent = chars.slice(0, n).join('');
    },
    // the caret blinks a moment on the last letter, then the line is just text again
    onComplete: () => { if (!keep) gsap.delayedCall(0.5, () => { if (typing.get(host) === tween) host.classList.remove('is-typing'); }); },
  });
  typing.set(host, tween);
  return tween;
}

/** Puts the typed copy away and shows the real line again, at once. */
export function untype(host: HTMLElement): void {
  typing.get(host)?.kill();
  host.classList.remove('is-typing');
}

/**
 * The red block under the section you are in. It slides to the next link like a block being pushed across the press, lands a touch
 * out of register and settles; with nothing to mark, it lifts off. `still` places it without motion.
 */
export function placeInk(nav: HTMLElement, still: boolean): void {
  const ink = nav.querySelector<HTMLElement>('.head__ink')!, link = nav.querySelector<HTMLElement>('a[aria-current]');
  gsap.killTweensOf(ink);
  if (!link) {
    if (still) gsap.set(ink, { autoAlpha: 0 });
    else gsap.to(ink, { autoAlpha: 0, scale: 1.08, duration: 0.25, ease: 'power2.in' });
    return;
  }
  const box = { left: link.offsetLeft, top: link.offsetTop, width: link.offsetWidth, height: link.offsetHeight };
  if (still) { gsap.set(ink, { ...box, x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1 }); return; }
  const shown = getComputedStyle(ink).visibility !== 'hidden' && Number(gsap.getProperty(ink, 'opacity')) > 0.5;
  if (!shown) {
    // nothing was marked: the block is stamped down onto the link
    gsap.set(ink, box);
    gsap.fromTo(ink, { autoAlpha: 0, scale: 1.18, rotation: -3, x: 3, y: -3 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power3.in' });
    gsap.to(ink, { rotation: 0, x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1.1, 0.4)', delay: 0.22 });
    return;
  }
  const from = Number(gsap.getProperty(ink, 'left')), lean = Math.sign(box.left - from) || 1;
  gsap.to(ink, { ...box, duration: 0.55, ease: 'expo.out' });
  gsap.fromTo(ink, { x: lean * 5, y: -2, rotation: lean * 1.6 }, { x: 0, y: 0, rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.35)', delay: 0.12 });
}

/** The switch's red knob is pushed across to the other language and lands with a knock; `then` runs once it has landed. */
export function knock(button: HTMLElement, toLeft: boolean, then: () => void): void {
  const knob = button.querySelector<HTMLElement>('.head__knob')!;
  gsap.timeline()
    .to(knob, { xPercent: toLeft ? -100 : 100, duration: 0.2, ease: 'power3.in' })
    .call(() => { button.classList.add('is-flipped'); sfx('knock', 0.6); })
    .fromTo(knob, { scaleX: 1.18, scaleY: 0.84 }, { scaleX: 1, scaleY: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.35)', immediateRender: false })
    .fromTo(button, { x: toLeft ? -4 : 4, y: 3 }, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1.4, 0.3)', immediateRender: false }, '<')
    .call(then, [], 0.3);
}

/** Where every walking part of the header stood, keyed by its data-walk name. */
export function measure(head: HTMLElement): Map<string, DOMRect> {
  return new Map([...head.querySelectorAll<HTMLElement>('[data-walk]')].map((el) => [el.dataset.walk!, el.getBoundingClientRect()]));
}

/**
 * After the language changes, everything in the header has a new place on the other side. Each part starts where it stood before and
 * walks to its new place: leaning into the walk, a few little hops, a wobble and a squash as it stops. The red page-turn sheet covers
 * the start, so as it clears the parts are still finding their places. Resolves when the last one has settled.
 */
export function walkHome(head: HTMLElement, before: Map<string, DOMRect>): Promise<void> {
  const parts = [...head.querySelectorAll<HTMLElement>('[data-walk]')].filter((el) => el.offsetWidth > 0 && before.has(el.dataset.walk!));
  const tl = gsap.timeline();
  parts.forEach((el, i) => {
    const a = before.get(el.dataset.walk!)!, b = el.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    const way = Math.sign(-dx) || 1, far = Math.abs(dx), time = 1.05 + Math.min(far, 1400) / 1150, hops = Math.max(2, Math.round(far / 220));
    // the order reverses between the languages, so they have to pass each other: each keeps to its own lane on the way, and the
    // ones heading against the reading direction duck behind, a little smaller, while the others pass in front
    const lane = (i % 2 ? 1 : -1) * 22, behind = way === (head.closest('[dir="rtl"]') ? -1 : 1) ? 0 : 1, n = hops * 2;
    const lift = Array.from({ length: n + 1 }, (_, k) => (k % 2 ? -(26 - (k / n) * 14) : 0) + lane * Math.sin((Math.PI * k) / n));
    // the sheet is still over the page for the first moment, so they set off a beat late and are mid-walk when it clears
    const at = 0.18 + 0.07 * i + gsap.utils.random(0, 0.1);
    gsap.set(el, { x: dx, y: dy, transformOrigin: '50% 100%', zIndex: behind ? 1 : 3 });
    tl.to(el, { x: 0, y: 0, duration: time, ease: 'power2.inOut' }, at)
      .to(el, { keyframes: { yPercent: lift, easeEach: 'sine.inOut' }, duration: time, ease: 'none' }, at)
      .to(el, { keyframes: { scale: behind ? [1, 0.84, 0.84, 1] : [1, 1.04, 1.04, 1], filter: behind ? ['brightness(1)', 'brightness(.9)', 'brightness(.9)', 'brightness(1)'] : ['brightness(1)', 'brightness(1)', 'brightness(1)', 'brightness(1)'], easeEach: 'sine.inOut' }, duration: time, ease: 'none' }, at)
      .to(el, { keyframes: { rotation: [0, way * 8, way * 5, way * 8, way * 4], easeEach: 'sine.inOut' }, duration: time, ease: 'none' }, at)
      // the stop: it rocks back past upright and settles, squashed for a moment by its own weight
      .to(el, { rotation: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.3)' }, at + time)
      .call(() => sfx('tap', 0.32, 1.25), [], at + time)
      .fromTo(el, { scaleY: 0.86, scaleX: 1.08 }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.35)', immediateRender: false }, at + time);
  });
  return new Promise((done) => { tl.eventCallback('onComplete', () => { gsap.set(parts, { clearProps: 'transform,zIndex,filter' }); done(); }); });
}

/** The phone menu is a sheet of paper pulled down over the page, torn bottom edge first; then its links land one after another. */
export function openMenu(menu: HTMLElement): void {
  if (!window.matchMedia(MOTION).matches) return;
  const edge = jag(5, 14, 2.4), s = { p: 0 };
  sfx('slide', 0.5);
  const draw = () => {
    const torn = edge.map((j, i) => `${(100 - (i / 13) * 100).toFixed(2)}% ${Math.min(100, s.p + j).toFixed(2)}%`);
    menu.style.clipPath = `polygon(0 0, 100% 0, ${torn.join(', ')})`;
  };
  draw();
  gsap.timeline({ onComplete: () => void menu.style.removeProperty('clip-path') })
    .to(s, { p: 108, duration: 6 * POSE, ease: stepped('power3.out', 6), onUpdate: draw })
    .from(menu.querySelectorAll('nav a, .btn'), { y: 18, autoAlpha: 0, stagger: 0.05, duration: 4 * POSE, ease: stepped('power3.out', 4) }, 2 * POSE);
}
