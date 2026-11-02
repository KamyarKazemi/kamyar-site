import { gsap } from '../lib/gsap';
import { stepped } from '../lib/paper';
import { tearTitles } from './tear';

/**
 * The page on load. In seconds:
 *   0.00  the header drops in and the thin frame appears, in stop-motion
 *   0.35  the red strip over the name is ripped off
 *   1.15  the roles and the two buttons land on the floor
 */
export function introTimeline(): gsap.core.Timeline {
  return gsap.timeline()
    .from('.head', { y: -24, autoAlpha: 0, duration: 0.5, ease: stepped('power3.out', 6) }, 0)
    .from('.hero__frame', { autoAlpha: 0, duration: 0.5, ease: 'steps(4)' }, 0.05)
    .add(tearTitles(), 0.35)
    .from('.hero__roles', { autoAlpha: 0, y: 14, duration: 0.5, ease: stepped('power3.out', 6) }, 1.15)
    .from('.hero__actions > *', { autoAlpha: 0, y: 12, stagger: 0.08, duration: 0.42, ease: stepped('power3.out', 5) }, 1.22);
}
