import { gsap } from './gsap';
import { POSE } from './paper';
import { sfx } from './sfx';

/** What a scrap can land on, and which of those take the hit with a small jolt. */
const SURFACES = '.hero__floor, .hero__roles, .hero__actions .btn, .about__lead, .about__body, .about__stack, .list__row, .card, .price, .contact__label, .contact__line, .contact__btn, .channels';
const JOLTS = '.btn, .hero__roles, .about__lead, .list__row, .price, .contact__label, .channels, .card';
const GRAVITY = 2600, BOUNCE = 0.32, REST_SPEED = 220, LINGER = 1.8;

interface Surface { el: HTMLElement; top: number; left: number; right: number; jolt: boolean }
interface Scrap { el: HTMLElement; x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; floor: Surface | undefined; all: Surface[]; still: number }

let layer: HTMLElement | null = null;
const live: Scrap[] = [];
let since = 0, running = false;

const measure = (): Surface[] => [...document.querySelectorAll<HTMLElement>(SURFACES)].flatMap((el) => {
  const r = el.getBoundingClientRect();
  return r.width ? [{ el, top: r.top + scrollY, left: r.left + scrollX, right: r.right + scrollX, jolt: el.matches(JOLTS) }] : [];
});

// the nearest top edge under the scrap; nothing found means it falls out of the page
const floorUnder = (s: Scrap) => s.all.filter((f) => s.x >= f.left && s.x <= f.right && f.top >= s.y + s.h / 2 - 2).sort((a, b) => a.top - b.top)[0];

function dust(x: number, y: number) {
  for (let i = 0; i < 3; i++) {
    const d = document.createElement('i');
    d.className = 'dust';
    layer?.append(d);
    gsap.fromTo(d, { x, y: y - 3, scale: 1 }, { x: x + (i - 1) * gsap.utils.random(14, 26), y: y - gsap.utils.random(8, 18), scale: 0.3, autoAlpha: 0, duration: 5 * POSE, ease: 'steps(5)', onComplete: () => d.remove() });
  }
}

function impact(s: Scrap, f: Surface, speed: number) {
  dust(s.x, f.top);
  sfx('scrap', Math.min(0.55, 0.12 + speed / 2400), 1.1);
  if (!f.jolt || f.el.dataset.hit) return;
  f.el.dataset.hit = '1';
  gsap.fromTo(f.el, { y: Math.min(5, speed / 380) }, { y: 0, duration: 4 * POSE, ease: 'steps(4)', onComplete: () => void delete f.el.dataset.hit });
}

function step(_time: number, deltaMs: number) {
  const dt = Math.min(deltaMs, 40) / 1000;
  since += dt;
  for (let i = live.length - 1; i >= 0; i--) {
    const s = live[i]!;
    if (s.still) {
      s.still += dt;
      if (s.still > LINGER) { live.splice(i, 1); gsap.to(s.el, { autoAlpha: 0, duration: 4 * POSE, ease: 'steps(4)', onComplete: () => s.el.remove() }); }
      continue;
    }
    s.vy += GRAVITY * dt;
    s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.vr * dt; s.vx *= 0.996;
    const f = s.floor;
    if (f && (s.x < f.left || s.x > f.right)) s.floor = floorUnder(s);            // slid off the edge: it keeps falling to whatever is below
    else if (f && s.y + s.h / 2 >= f.top) {
      s.y = f.top - s.h / 2;
      if (s.vy > REST_SPEED) { impact(s, f, s.vy); s.vy *= -BOUNCE; s.vx *= 0.55; s.vr *= -0.45; }
      else { s.vy = s.vx = s.vr = 0; s.r = Math.round(s.r / 180) * 180 + gsap.utils.random(-14, 14); s.still = 1e-4; }
    }
    if (!s.floor && s.y > document.documentElement.scrollHeight) { live.splice(i, 1); s.el.remove(); }
  }
  // paper moves in twelve poses a second, so the result is shown a pose at a time even though the fall is computed every frame
  if (since >= POSE) {
    since = 0;
    for (const s of live) s.el.style.transform = `translate(${(s.x - s.w / 2).toFixed(1)}px,${(s.y - s.h / 2).toFixed(1)}px) rotate(${s.r.toFixed(0)}deg)`;
  }
  if (!live.length) { gsap.ticker.remove(step); running = false; }
}

/** Torn scraps falling under gravity from page points. They bounce on what is below them, jolt it, settle, and dry away. */
export function dropScraps(points: { x: number; y: number }[]): void {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'scrap-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
  }
  layer.style.height = `${document.documentElement.scrollHeight}px`;
  const all = measure(), r = gsap.utils.random;
  for (const p of points) {
    const el = document.createElement('i'), w = r(10, 20), h = w * r(0.7, 1.2);
    el.className = 'scrap';
    el.style.cssText = `width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;clip-path:polygon(${r(0, 25)}% 0,100% ${r(0, 30)}%,${r(70, 100)}% 100%,0 ${r(60, 100)}%)`;
    layer.append(el);
    const s: Scrap = { el, x: p.x, y: p.y, vx: r(-170, 170), vy: r(-280, -60), r: r(0, 360), vr: r(-560, 560), w, h, floor: undefined, all, still: 0 };
    s.floor = floorUnder(s);
    live.push(s);
  }
  if (!running) { running = true; gsap.ticker.add(step); }
}
