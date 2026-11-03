import { gsap } from '../lib/gsap';
import { stepped } from '../lib/paper';
import { tearTitles } from './tear';

/**
 * The page on load. In seconds:
 *   0.00  the header drops in and the thin frame appears, in stop-motion
 *   0.35  the red strip over the name is ripped off
 *   1.15  the roles and the two buttons land on the floor
 * Arriving from the live intro ('live'), the visitor has just come out of a red sheet, so the name is not torn out of another red
 * strip: it rises off the floor the way every title in the intro did, and the rest follows it a little sooner.
 */
export function introTimeline(arrival: 'load' | 'live' = 'load'): gsap.core.Timeline {
  const live = arrival === 'live', after = live ? 0.75 : 1.15;
  const tl = gsap.timeline()
    .from('.head', { y: -24, autoAlpha: 0, duration: 0.5, ease: stepped('power3.out', 6) }, 0)
    .from('.hero__frame', { autoAlpha: 0, duration: 0.5, ease: 'steps(4)' }, 0.05);
  if (live) {
    tearTitles(false);
    tl.from('.hero__title', { rotationX: 90, transformPerspective: 1100, transformOrigin: '50% 100%', duration: 0.6, ease: stepped('back.out(1.6)', 7) }, 0.2);
  } else tl.add(tearTitles(), 0.35);
  return tl
    .from('.hero__roles', { autoAlpha: 0, y: 14, duration: 0.5, ease: stepped('power3.out', 6) }, after)
    .from('.hero__actions > *', { autoAlpha: 0, y: 12, stagger: 0.08, duration: 0.42, ease: stepped('power3.out', 5) }, after + 0.07);
}
