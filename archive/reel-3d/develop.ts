import { DESK_POINTER, gsap, ScrollTrigger } from '../lib/gsap';
import { POSE } from '../lib/paper';

const LAST = 7;

/**
 * Every print hangs on the wall in black and red. Colour then bleeds through it in eight poses, from the middle out: on hover with a mouse, and
 * as the print crosses the middle of the screen on a phone. The poses are a mask sheet, so this costs one property change per pose.
 */
export function developPrints(): void {
  const mm = gsap.matchMedia();
  const run = (print: HTMLElement, on: boolean) => gsap.to(print, { '--f': on ? LAST : 0, duration: LAST * POSE, ease: `steps(${LAST})`, overwrite: true });
  const prints = gsap.utils.toArray<HTMLElement>('.print');

  mm.add(DESK_POINTER, () => {
    const off = prints.flatMap((print) => {
      const on = () => void run(print, true), out = () => void run(print, false);
      print.addEventListener('pointerenter', on);
      print.addEventListener('pointerleave', out);
      print.addEventListener('focus', on);
      print.addEventListener('blur', out);
      return [() => { print.removeEventListener('pointerenter', on); print.removeEventListener('pointerleave', out); print.removeEventListener('focus', on); print.removeEventListener('blur', out); }];
    });
    return () => off.forEach((fn) => fn());
  });

  mm.add('(hover: none)', () => {
    for (const print of prints) ScrollTrigger.create({ trigger: print, start: 'top 68%', end: 'bottom 32%', onToggle: (self) => void run(print, self.isActive) });
  });
}
