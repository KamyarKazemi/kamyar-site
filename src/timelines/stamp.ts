import { gsap } from '../lib/gsap';
import { POSE, stepped } from '../lib/paper';
import { sfx } from '../lib/sfx';

// a rubber stamp drawn in the house look: red knob, paper wood hatched in ink on the shadow side, black rubber; the rubber's edge is the bottom of the drawing
const FIGURE = `<svg viewBox="0 0 100 118" fill="none" stroke="#181614" stroke-width="3" stroke-linejoin="round" aria-hidden="true">
  <defs><pattern id="stamp-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><path d="M0 0V5" stroke-width="1.4"/></pattern></defs>
  <ellipse cx="50" cy="20" rx="21" ry="17" fill="#ce261e"/>
  <path d="M35 11c4-5 10-7 16-6" stroke="#f6f3ec" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M40 36h20l3 30H37z" fill="#f6f3ec"/><path d="M53 37h7l3 28h-9z" fill="url(#stamp-hatch)" stroke="none"/><path d="M40 36h20l3 30H37z"/>
  <rect x="25" y="66" width="50" height="10" rx="2" fill="#f6f3ec"/>
  <rect x="9" y="76" width="82" height="28" rx="2" fill="#f6f3ec"/><path d="M64 78h25v24H64z" fill="url(#stamp-hatch)" stroke="none"/><rect x="9" y="76" width="82" height="28" rx="2"/>
  <path d="M15 104h70v10H15z" fill="#181614"/><path d="M15 114h70" stroke="#ce261e" stroke-width="2.4"/>
</svg>`;

const make = (className: string, parent: HTMLElement, html = '') => {
  const el = document.createElement('span');
  el.className = className;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = html;
  parent.append(el);
  return el;
};

/**
 * Pressing a button stamps it. A rubber stamp comes down out of the air, its shadow growing on the button, rises a touch, then slams:
 * it squashes, the button is knocked down, puffs of smoke burst out from under the rubber and impact lines flash. It peels off and
 * lifts away, leaving a worn red KAMYAR. print that dries off. The stamp moves smoothly; the smoke and the print keep to the paper poses.
 */
export function stampButtons(): () => void {
  const live = new Map<HTMLElement, gsap.core.Timeline>();
  const clear = (btn: HTMLElement) => btn.querySelectorAll('.mark, .stamp, .stamp-fx').forEach((el) => el.remove());

  const press = (e: PointerEvent) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('.btn');
    if (!btn) return;
    live.get(btn)?.kill();
    clear(btn);
    gsap.set(btn, { x: 0, y: 0 });

    const mark = make('mark', btn);
    mark.textContent = 'KAMYAR.';
    // near the top of the screen the stamp could not be seen coming down, so it prints on the lower corner instead
    if (btn.getBoundingClientRect().top < 130) mark.classList.add('mark--low');
    const tilt = gsap.utils.random(-14, -6);
    gsap.set(mark, { rotation: tilt, autoAlpha: 0 });

    // the stamp is sized to the print and stands on it, so the rubber covers the mark at the moment of impact
    const mw = mark.offsetWidth, mh = mark.offsetHeight, cx = mark.offsetLeft + mw / 2, foot = mark.offsetTop + mh / 2 + 6;
    const w = (mw + 8) / 0.7, h = w * 1.18, half = (w * 0.7) / 2;
    const stamp = make('stamp', btn, FIGURE);
    gsap.set(stamp, { left: cx - w / 2, top: foot - h, width: w, height: h, transformOrigin: '50% 100%' });
    const shade = make('stamp-fx stamp__shade', btn);
    gsap.set(shade, { left: cx - w * 0.42, top: foot - 9, width: w * 0.84, height: 18, rotation: tilt });
    const fx = make('stamp-fx', btn);
    gsap.set(fx, { left: cx, top: foot, rotation: tilt });

    // cartoon smoke: puffs burst out from under each end of the rubber, swell and burn off
    const puffs = Array.from({ length: 10 }, (_, k) => {
      const side = k % 2 ? 1 : -1, size = gsap.utils.random(12, 24);
      const puff = make('stamp__puff', fx);
      gsap.set(puff, { width: size, height: size, x: side * (half - 4) - size / 2, y: -size / 2 - 2, scale: 0.55, autoAlpha: 0 });
      return { puff, side, size };
    });
    const lines = Array.from({ length: 6 }, (_, k) => {
      const side = k < 3 ? 1 : -1, angle = side === 1 ? -8 - (k % 3) * 30 : -172 + (k % 3) * 30;
      const line = make('stamp__line', fx);
      gsap.set(line, { x: side * (half + 8), y: -4, rotation: angle, scaleX: 0 });
      return line;
    });

    const hit = 0.34;
    const tl = gsap.timeline({ onComplete: () => { clear(btn); live.delete(btn); } });
    live.set(btn, tl);
    tl
      // it comes down out of the air, turning to the angle it will print at
      .fromTo(stamp, { y: -h * 0.9, rotation: tilt + 16, autoAlpha: 0, scale: 1.12 }, { y: -h * 0.3, rotation: tilt + 4, autoAlpha: 1, scale: 1.04, duration: 0.18, ease: 'power3.out' }, 0)
      .fromTo(shade, { scaleX: 0.3, autoAlpha: 0 }, { scaleX: 0.75, autoAlpha: 0.22, duration: 0.18, ease: 'power2.out' }, 0)
      // a breath of a rise before the hit
      .to(stamp, { y: -h * 0.38, rotation: tilt + 6, duration: 0.08, ease: 'sine.out' }, 0.18)
      .to(stamp, { y: 0, rotation: tilt, scale: 1, duration: hit - 0.26, ease: 'power4.in' }, 0.26)
      .to(shade, { scaleX: 1.05, autoAlpha: 0.42, duration: hit - 0.26, ease: 'power4.in' }, 0.26)
      // impact: the stamp squashes, the button takes the blow and shudders, the print is there
      .set(mark, { autoAlpha: 1 }, hit)
      .call(() => sfx('stamp', 0.85), [], hit - 0.02)
      .fromTo(stamp, { scaleY: 0.82, scaleX: 1.1 }, { scaleY: 1, scaleX: 1, duration: 0.42, ease: 'elastic.out(1.2, 0.35)', immediateRender: false }, hit)
      .fromTo(btn, { y: 6, x: -2 }, { y: 0, x: 0, duration: 0.5, ease: 'elastic.out(1.4, 0.3)', immediateRender: false }, hit)
      .set(lines, { scaleX: 1 }, hit)
      .to(lines, { scaleX: 0, x: (i) => (i < 3 ? 1 : -1) * (half + 30), duration: 2 * POSE, ease: 'steps(2)' }, hit + 2 * POSE);
    for (const { puff, side, size } of puffs) {
      const at = hit + gsap.utils.random(0, 2, 1) * POSE;
      tl.set(puff, { autoAlpha: 1 }, at)
        .to(puff, { x: `+=${side * gsap.utils.random(18, 52)}`, y: `-=${gsap.utils.random(2, 22)}`, scale: gsap.utils.random(1.1, 1.6), duration: 5 * POSE, ease: stepped('expo.out', 5) }, at)
        .to(puff, { scale: 0, y: `-=${size * 0.4}`, duration: 3 * POSE, ease: stepped('power1.in', 3) }, at + 5 * POSE);
    }
    tl
      // it rocks to peel the rubber off the paper and lifts away
      .to(stamp, { rotation: tilt - 5, duration: 0.1, ease: 'sine.inOut' }, hit + 0.2)
      .to(stamp, { rotation: tilt + 9, y: -h * 0.6, autoAlpha: 0, duration: 0.34, ease: 'power2.in' }, hit + 0.3)
      .to(shade, { scaleX: 0.3, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, hit + 0.3)
      // and the ink dries off the button
      .to(mark, { autoAlpha: 0, duration: 4 * POSE, ease: 'steps(4)' }, 1.5);
  };
  document.addEventListener('pointerdown', press);
  return () => {
    document.removeEventListener('pointerdown', press);
    live.forEach((tl) => tl.progress(1));
  };
}
