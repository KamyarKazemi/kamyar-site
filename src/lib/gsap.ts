import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);
gsap.defaults({ ease: 'expo.out' });

/** Every timeline on the site runs inside this condition; without it the page simply stands still, complete. */
export const MOTION = '(prefers-reduced-motion: no-preference)';
/** Hover only means something with a real pointer. */
export const DESK_POINTER = '(hover: hover)';

export { gsap, ScrollTrigger, useGSAP };
