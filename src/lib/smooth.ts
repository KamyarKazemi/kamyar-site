import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

let lenis: Lenis | null = null;

/** The header's height, so a section never lands underneath it. */
const offset = () => -(document.querySelector<HTMLElement>('.head')?.offsetHeight ?? 0);

/**
 * Smooth scrolling for the whole site, driven by GSAP's own clock so the scroll and every ScrollTrigger move in the same frame.
 * Touch keeps the phone's native scrolling, which is already smooth and which people expect to feel like their phone.
 * In-page links glide to their section and still update the address, so the language switch keeps your place.
 */
export function startSmoothScroll(): () => void {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const glide = (e: MouseEvent) => {
    const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    const id = link?.getAttribute('href')?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!link || !target || !lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    // measured from the page as it stands right now, so a click during a glide still lands exactly; forced, because the phone menu
    // holds the page still at the moment its own link is pressed
    const y = id === 'top' ? 0 : target.getBoundingClientRect().top + scrollY + offset();
    lenis.start();
    lenis.scrollTo(Math.max(0, y), { duration: 1.2, force: true });
    history.replaceState(history.state, '', `#${id}`);
  };
  document.addEventListener('click', glide);

  return () => {
    document.removeEventListener('click', glide);
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

/** Holds the page still while a dialog is open, and says how fast the page is moving (pixels a frame, signed). */
export const smooth = {
  stop: (): void => lenis?.stop(),
  start: (): void => lenis?.start(),
  velocity: (): number => lenis?.velocity ?? 0,
};
