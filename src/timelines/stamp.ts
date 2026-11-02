import { gsap } from '../lib/gsap';
import { POSE, stepped } from '../lib/paper';

/** Pressing a button stamps it: a worn red KAMYAR. mark slams down over it, the sheet takes the hit, and the ink dries off. */
export function stampButtons(): () => void {
  const press = (e: PointerEvent) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('.btn');
    if (!btn) return;
    btn.querySelector('.mark')?.remove();
    const mark = document.createElement('span');
    mark.className = 'mark';
    mark.textContent = 'KAMYAR.';
    mark.setAttribute('aria-hidden', 'true');
    btn.append(mark);
    gsap.timeline({ onComplete: () => mark.remove() })
      .fromTo(mark, { scale: 2.1, rotation: gsap.utils.random(-14, -6), autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 3 * POSE, ease: stepped('power2.in', 3) })
      .fromTo(btn, { y: 3 }, { y: 0, duration: 4 * POSE, ease: 'steps(4)' }, 3 * POSE)
      .to(mark, { autoAlpha: 0, duration: 4 * POSE, ease: 'steps(4)' }, 1.1);
  };
  document.addEventListener('pointerdown', press);
  return () => document.removeEventListener('pointerdown', press);
}
