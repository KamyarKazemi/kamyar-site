import { sfx } from '../lib/sfx';

const PRESSABLE = 'a, button, [role="slider"]';
// these already make their own sound when pressed: the stamp, a print peeling off, the knob, the menu, the gate's tear, the tape
const OWN_PRESS = '.btn, .card__btn, .head__lang, .head__burger, .gate__half, .li-key, .li-strip, .focus__btns button';
// pointing at a section link already draws the pen
const OWN_HOVER = '.head__nav a, .li-view';

/**
 * The quiet sounds of the page under the hand: pointing at anything you can press taps a pencil on the paper (only with a real
 * pointer), and pressing it taps a little harder, unless that press makes its own sound already.
 */
export function pointerSounds(): () => void {
  let over: Element | null = null;
  const hover = window.matchMedia('(hover: hover)').matches;
  const enter = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest(PRESSABLE) ?? null;
    if (el && el !== over && hover && e.pointerType === 'mouse' && !el.matches(OWN_HOVER)) sfx('tap', 0.2, 1.2);
    over = el;
  };
  const press = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest(PRESSABLE);
    if (el && !el.matches(OWN_PRESS) && !el.closest(OWN_PRESS)) sfx('tap', 0.45, 0.92);
  };
  addEventListener('pointerover', enter, { passive: true });
  addEventListener('pointerdown', press, { passive: true });
  return () => { removeEventListener('pointerover', enter); removeEventListener('pointerdown', press); };
}
