import { Fragment, startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { intro } from '../content/intro';
import { gsap } from '../lib/gsap';
import { useNavigate } from 'react-router-dom';
import type { Lang } from '../content/site';
import { pathFor, useLanguage } from '../lib/language';
import { LanguageGate } from './LanguageGate';
import { jag, POSE, stepped } from '../lib/paper';
import { BOARD, boardPaths, buildScene, DOT, drift, EYE, FLOOR_END, layout, lens, place, segment, type Camera, type Layout } from './scene';
import { drawGround } from './ground';
import { TapeSound } from './sound';
import { Tape, type TapeEvent } from './tape';
import './intro.css';
import { sfx, sfxOff } from '../lib/sfx';

const PERSPECTIVE = 1100;
// his work, the prints in the portfolio station
const WORKS = ['cafe', 'intro', 'toolbox', 'okala'] as const;
// the hand-off: the red holds this long, then the hole opens over this many paper poses
const HOLD = 0.35, OPEN = 14;
const INK = '#181614', RED = '#ce261e', PAPER = '#f6f3ec', SIDE = '#2b2420';

// the sticker title as a solid, one svg, as in the reel: ink extrusion, black edge, red band, black line, paper face, hatching
function Solid({ text, size, rtl, depth = 7 }: { text: string; size: number; rtl: boolean; depth?: number }) {
  const id = useMemo(() => `li-hat-${Math.random().toString(36).slice(2, 8)}`, []);
  const y = -size * 0.3;
  const T = (props: Record<string, unknown>, dx = 0, dy = 0) => (
    <text x={dx} y={y + dy} textAnchor="middle" direction={rtl ? 'rtl' : 'ltr'} style={{ fontFamily: 'Lalezar', fontSize: size, paintOrder: 'stroke', strokeLinejoin: 'round' }} {...props}>{text}</text>
  );
  return (
    <svg className="li-svg" width="2" height="2" aria-hidden="true">
      <defs><pattern id={id} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><rect width="1.8" height="9" fill={INK} fillOpacity=".6" /></pattern></defs>
      {Array.from({ length: depth }, (_, k) => depth - k).map((k) => <g key={k}>{T({ fill: SIDE, stroke: SIDE, strokeWidth: size * 0.227 }, (k * 7 / depth) * size * 0.009, (k * 7 / depth) * size * 0.016)}</g>)}
      {T({ fill: 'none', stroke: INK, strokeWidth: size * 0.227 })}
      {T({ fill: 'none', stroke: RED, strokeWidth: size * 0.164 })}
      {T({ fill: 'none', stroke: INK, strokeWidth: size * 0.041 })}
      {T({ fill: PAPER })}
      {T({ fill: `url(#${id})` })}
    </svg>
  );
}

// plain heavy type with a thin ink shadow: the second voice
function Plain({ text, size, rtl }: { text: string; size: number; rtl: boolean }) {
  return (
    <svg className="li-svg" width="2" height="2" aria-hidden="true">
      {[true, false].map((shadow) => (
        <text key={String(shadow)} x={shadow ? size * 0.03 : 0} y={-size * 0.3 + (shadow ? size * 0.05 : 0)} textAnchor="middle" direction={rtl ? 'rtl' : 'ltr'} fill={shadow ? SIDE : INK} style={{ fontFamily: 'Vazirmatn Variable', fontWeight: 900, fontSize: size }}>{text}</text>
      ))}
    </svg>
  );
}

/**
 * A thing standing on the floor at a place; it lies flat until the timeline raises it. The rising part needs a real box the size of
 * what it holds: Chrome draws a 3D layer only inside its own bounds, so an empty box with its picture overflowing it shows nothing.
 */
function Stand({ at, rise, box: [w, h], keep, near, shade, children }: { at: Parameters<typeof place>[0]; rise: string; box: [number, number]; keep?: boolean; near?: number | undefined; shade?: number | undefined; children: ReactNode }) {
  return (
    <div className="li-at" data-z={at.z} data-keep={keep ? '' : undefined} data-near={near} style={{ transform: place(at) }}>
      {/* its shadow on the floor, spreading as it stands up */}
      {shade && <i className="li-shade-at" style={{ top: -(at.y ?? 0) }}><i className="li-shade" style={{ width: shade, height: shade * 0.34, left: -shade / 2, top: -shade * 0.17 }} /></i>}
      <div className="li-rise" data-rise={rise} style={{ left: -w / 2, top: -h, width: w, height: h }}><div className="li-anchor" style={{ left: w / 2, top: h }}>{children}</div></div>
    </div>
  );
}

/** The giant timeline board standing on two legs; its face, ticks, playhead and sweat are redrawn from the timeline. */
function Board({ refs }: { refs: RefObject<Record<string, SVGElement | null>> }) {
  const set = (k: string) => (el: SVGElement | null) => { refs.current[k] = el; };
  return (
    <svg className="li-board" width={BOARD.w} height={BOARD.h} viewBox={`0 0 ${BOARD.w} ${BOARD.h}`} style={{ left: -BOARD.w / 2, top: -BOARD.h }} aria-hidden="true">
      {BOARD.legs.map((x) => <path key={x} d={`M${x} ${BOARD.bottom} L${x - 8} ${BOARD.h} M${x} ${BOARD.bottom} L${x + 8} ${BOARD.h}`} stroke={INK} strokeWidth="7" strokeLinecap="round" />)}
      <path ref={set('face')} fill={PAPER} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <path ref={set('ticks')} fill="none" stroke={INK} strokeWidth="3" />
      <text x="70" y="105" style={{ font: "700 30px 'Courier Prime'" }} fill={RED}>◀◀</text>
      <text x={BOARD.w - 70} y="105" textAnchor="end" style={{ font: "700 30px 'Courier Prime'" }} fill={RED}>▶▶</text>
      <path ref={set('head')} stroke={RED} strokeWidth="7" strokeLinecap="round" />
      <path ref={set('knob')} fill={RED} />
      <circle ref={set('drop')} r="11" fill={INK} />
    </svg>
  );
}

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;

/**
 * The live intro, in front of the site. A tape you put in: it plays the reel's paper world live, and you can pause it, hold rewind or
 * forward, drag it back and forth by the strip, the film or the wheel, and his recorded voice goes with it. At the end the camera dives into a red dot, the red is the page-turn sheet, and the site is under it.
 */
export function LiveIntro({ onReveal, onDone }: { onReveal: (after: number) => void; onDone: () => void }) {
  // the greeting speaks the language picked on the gate. The address (and with it the whole site behind) only switches to it once the
  // red covers the screen at the end: switching at the tap re-lays the site out in the middle of the gate tearing apart
  const { lang: address } = useLanguage();
  const [picked, setPicked] = useState<Lang | null>(null);
  const lang = picked ?? address;
  const c = intro[lang], rtl = lang === 'fa';
  const [L] = useState<Layout>(() => layout(window.innerHeight > window.innerWidth));
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const camEl = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLCanvasElement>(null);
  const hud = useRef<HTMLSpanElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const tape = useRef<Tape | null>(null);
  const sound = useRef<TapeSound | null>(null);
  const [phase, setPhase] = useState<'ready' | 'running' | 'leaving'>('ready');
  const [gateUp, setGateUp] = useState(true);
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const board = useRef<Record<string, SVGElement | null>>({});

  // the world is drawn at the scale that covers the screen
  useLayoutEffect(() => {
    const fit = () => {
      const s = Math.max(innerWidth / L.width, innerHeight / L.height);
      stage.current?.style.setProperty('transform', `translate(-50%, -50%) scale(${s})`);
      const c = ground.current, dpr = Math.min(2, devicePixelRatio || 1);
      if (c) { c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr); c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0); }
      tape.current?.redraw();
    };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [L]);

  // the film and the tape it runs on
  useEffect(() => {
    const el = root.current!;
    const cam: Camera = { x: 0, y: EYE, z: 0, rx: 0, ry: 0 };
    const drawBoard = (sag: number, head: number, drop: number) => {
      const b = board.current, p = boardPaths(sag, head, drop);
      b.face?.setAttribute('d', p.face);
      b.ticks?.setAttribute('d', p.ticks);
      b.head?.setAttribute('d', p.head);
      b.knob?.setAttribute('d', p.knob);
      if (b.drop) { b.drop.setAttribute('cx', String(p.drop.x)); b.drop.setAttribute('cy', p.drop.y.toFixed(1)); b.drop.setAttribute('opacity', String(p.drop.o)); }
    };
    const { tl, cues } = buildScene(el, L, cam, drawBoard);
    const stations = [...el.querySelectorAll<HTMLElement>('.li-at')].map((at) => ({ at, z: Number(at.dataset.z), near: at.dataset.near ? Number(at.dataset.near) : null, keep: 'keep' in at.dataset, face: at.querySelector<HTMLElement>('.li-anchor') }));
    const frame = (time: number, rate: number) => {
      if (!camEl.current) return;
      // the hand holding the camera never stops; off normal speed it shakes, more the faster the tape runs
      const off = Math.abs(rate - 1), shake = off > 0.3 && Math.abs(rate) > 0.05 ? Math.min(7, off * 2) : 0, h = drift(time, shake);
      const eye = { x: cam.x + h.x, y: cam.y + h.y, z: cam.z, rx: cam.rx + h.rx, ry: cam.ry + h.ry };
      camEl.current.style.transform = lens(eye, PERSPECTIVE);
      const g = ground.current?.getContext('2d');
      if (g) {
        const stretches = L.route.length - 1;
        drawGround(g, { width: innerWidth, height: innerHeight, scale: Math.max(innerWidth / L.width, innerHeight / L.height), perspective: PERSPECTIVE }, eye, L.route,
          (i) => Math.min(1, Math.max(0, (time - (i / stretches) * 20) / 1.4)));
      }
      // only what is near the camera is drawn: Chrome drops 3D layers past its budget, and far things are lost in the distance anyway.
      // On a phone the camera walks right past earlier pieces, so those are put away before they fill the lens; the dots are what it
      // dives into at the end, so they stay
      // Anything the camera is about to pass through fades away over its last few hundred pixels instead of filling the lens; the
      // doormat lies flat, so it can be close before it is in the way; the dots are what it dives into at the end, so they stay
      for (const s of stations) {
        const d = cam.z - s.z, near = s.near ?? (s.keep ? -120 : L.portrait ? L.dist * 0.6 : 60);
        const shown = d > near && d < (L.portrait ? 3200 : 4600);
        s.at.style.visibility = shown ? 'visible' : 'hidden';
        if (s.face && !s.keep) s.face.style.opacity = shown ? String(Math.min(1, Math.max(0, (d - near) / 640))) : '0';
      }
      // spooling: tracking bands run over the picture and a stamp says which way and how fast
      const spool = rate < -0.4 ? 'rew' : rate > 1.4 ? 'ff' : '';
      if (el.dataset.spool !== spool) el.dataset.spool = spool;
      if (spool && fx.current) fx.current.textContent = `${spool === 'rew' ? '◀◀' : '▶▶'} ×${Math.abs(rate).toFixed(1)}`;
      deck.current?.style.setProperty('--p', (time / tl.duration()).toFixed(4));
      if (hud.current) {
        const mode = rate < -0.5 ? `◀◀ REW ×${Math.abs(rate).toFixed(1)}` : rate > 1.5 ? `▶▶ FF ×${rate.toFixed(1)}` : Math.abs(rate) < 0.05 ? '❚❚ PAUSE' : '▶ PLAY';
        hud.current.textContent = `${mode}   ${clock(time)} / ${clock(tl.duration())}`;
      }
    };
    const event = (e: TapeEvent) => { if (e === 'end') setPhase('leaving'); };
    tape.current = new Tape(tl, cues, frame, event, null);
    // the tests drive the tape by hand
    if (import.meta.env.DEV) Object.assign(window, { __tape: tape.current });
    return () => { tape.current?.stop(); tape.current = null; tl.kill(); sound.current?.close(); sound.current = null; };
  }, [L]);

  // the hand-off. The camera has dived into the red dot, so the screen is all red; the site is set up under it. After a breath a
  // torn hole opens in the middle of the red and widens past the edges — the camera pulling back out of the dot — while the page
  // underneath settles from a little too close, and only then does the site bring its own parts in, one after another
  useEffect(() => {
    if (phase !== 'leaving') return;
    tape.current?.stop();
    sound.current?.spool(1);
    sound.current?.fade();
    gsap.set(root.current!.querySelector('.li-red'), { autoAlpha: 1 });
    root.current!.classList.add('is-leaving');
    if (lang !== address) navigate(pathFor(lang), { replace: true });
  }, [phase]);
  // the hole opens once the site under the red is in the picked language
  const opening = phase === 'leaving' && lang === address;
  useEffect(() => {
    if (!opening) return;
    const red = root.current!.querySelector<HTMLElement>('.li-red')!, sheet = red.firstElementChild as HTMLElement;
    onReveal(HOLD);
    const W = innerWidth, H = innerHeight, cx = W / 2, cy = H * 0.45;
    const far = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.12, edge = jag(23, 56, 1), s = { r: 0, turn: 0 };
    const draw = () => {
      const hole = edge.map((j, i) => {
        const a = (i / edge.length) * Math.PI * 2 + s.turn, r = s.r * (1 + j * 0.045);
        return `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
      });
      sheet.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${hole.join(' L')}Z")`;
    };
    draw();
    const tl = gsap.timeline({ onComplete: onDone })
      .call(() => sound.current?.play('whoosh', true, 0.8, 0.55), [], HOLD)
      .call(() => sfx('rip', 0.6, 0.85), [], HOLD)
      .to(s, { r: far, turn: 0.35, duration: OPEN * POSE, ease: stepped('power2.inOut', OPEN), onUpdate: draw }, HOLD);
    return () => { tl.kill(); };
  }, [opening, onReveal, onDone]);

  // the sound is made while the gate is up, once its own entrance has played, so the tap only has to switch it on
  const makeSound = () => {
    if (sound.current) return;
    try { sound.current = new TapeSound(); } catch { sound.current = null; }
    if (tape.current) tape.current.sound = sound.current;
  };
  useEffect(() => {
    const wait = setTimeout(() => { if ('requestIdleCallback' in window) requestIdleCallback(makeSound, { timeout: 400 }); else makeSound(); }, 1300);
    return () => clearTimeout(wait);
  }, []);
  // the language is chosen on the gate; the tap that chooses it is also the one that lets the browser play sound
  const chosen = (pick: Lang) => {
    makeSound();
    void sound.current?.resume();
    if (sfxOff()) { sound.current?.muted(true); setMuted(true); }
    // a different language than the address re-renders the world in it: done in slices, so the gate keeps tearing smoothly meanwhile
    if (pick !== lang) startTransition(() => setPicked(pick));
  };
  // the tape starts as the kept half of the gate lies down, so the camera is already moving when the paper becomes the floor
  const start = () => {
    tape.current?.play(true);
    setPlaying(true);
    setPhase('running');
  };
  const toggle = () => { const on = !playing; tape.current?.play(on); setPlaying(on); };
  const skip = () => setPhase('leaving');
  const mute = () => { const on = !muted; sound.current?.muted(on); setMuted(on); };

  // keys: space plays and pauses, the arrows are rewind and forward while held, Escape skips
  useEffect(() => {
    if (phase !== 'running') return;
    const down = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); if (!e.repeat) toggle(); }
      if (e.key === 'ArrowLeft') tape.current?.hold(-1);
      if (e.key === 'ArrowRight') tape.current?.hold(1);
      if (e.key === 'Escape') skip();
    };
    const up = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') tape.current?.hold(0); };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); };
  });

  // dragging the film itself: to the right is forward, in either language, like every player
  const drag = useRef<{ x: number } | null>(null);
  const grab = (e: ReactPointerEvent) => { if (phase !== 'running') return; drag.current = { x: e.clientX }; e.currentTarget.setPointerCapture(e.pointerId); };
  const pull = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    tape.current?.scrubBy(((e.clientX - drag.current.x) / innerWidth) * 6);
    drag.current.x = e.clientX;
  };
  const drop = () => { drag.current = null; };

  // the strip: a ruler with the red playhead, dragged to any moment
  const seek = (e: ReactPointerEvent) => {
    if (!tape.current || (e.type === 'pointermove' && !e.buttons)) return;
    const r = e.currentTarget.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    tape.current.scrubTo(f * tape.current.duration);
  };
  const press = (dir: -1 | 1) => ({
    onPointerDown: (e: ReactPointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); tape.current?.hold(dir); },
    onPointerUp: () => tape.current?.hold(0),
    onPointerCancel: () => tape.current?.hold(0),
  });

  const fx = useRef<HTMLSpanElement>(null);
  // the board and its words fade at their own distances: close enough that they stand solid while the camera looks at them, far
  // enough that it does not walk through a ghost of them on its way to the next station (on a phone it stops just short of them)
  const near = L.portrait ? { board: 800, words: 800, play: 250 } : { board: 500, words: 150, play: 500 };
  const tiles = useMemo(() => {
    const out: { x: number; z: number }[] = [];
    const [from, to] = L.portrait ? [-1600, 1600] : [-2400, 2400];
    for (let x = from; x < to; x += 1600) for (let z = FLOOR_END; z < 1600; z += 1600) out.push({ x, z });
    return out;
  }, [L]);

  // the world is rendered once per language and left alone after that. Re-rendering it means every sticker title again, seven
  // layers each, and that is what froze the gate in the middle of its tear when the tap, the tape starting and the gate going away
  // each re-rendered the whole intro
  const world = useMemo(() => (
    <>
        {L.portrait && <canvas className="li-ground" ref={ground} aria-hidden="true" />}
        <div className="li-stage" ref={stage} style={{ width: L.width, height: L.height, perspective: PERSPECTIVE }}>
          <div className="li-cam" ref={camEl}>
            {!L.portrait && tiles.map((t) => <i key={`${t.x},${t.z}`} className="li-floor" style={{ transform: `translate3d(${t.x}px, 0, ${t.z}px) rotateX(90deg)` }} />)}
            {!L.portrait && (
              <div className="li-route">
                {L.route.slice(1).map((p, i) => { const s = segment(p, L.route[i]!); return <i key={i} style={{ height: s.length, transform: s.transform }}><b /></i>; })}
              </div>
            )}

            {/* 1 — «سلام. … من کامیار هستم.» */}
            <Stand at={L.hi} rise="hi" box={[1500, 440]} shade={L.portrait ? undefined : 900}><Solid text={c.hi} size={L.portrait ? 300 : 280} rtl={rtl} depth={L.portrait ? 3 : 7} /></Stand>
            <Stand at={L.name} rise="name" box={[1500, 440]} shade={L.portrait ? undefined : 820}><Solid text={c.name} size={L.portrait ? 290 : 250} rtl={rtl} depth={L.portrait ? 3 : 7} /></Stand>
            <Stand at={L.me} rise="me" box={[405, 651]} shade={L.portrait ? undefined : 360}><img className="li-print" src="/live/me.webp" alt="" style={{ width: 405, left: -202, top: -651 }} /></Stand>
            <Stand at={L.hiNote} rise="hiNote" box={[700, 40]}><span className="li-note">{c.hiNote}</span></Stand>

            {/* 2 — «ادیتور، فرانت‌اند دولوپر و موشن دیزاینر.» */}
            {/* side by side they are read in the language's direction, so in Persian the first role stands on the right */}
            {L.roles.map((_, i) => L.roles[rtl && !L.portrait ? L.roles.length - 1 - i : i]!).map((r, i) => (
              <Fragment key={i}>
                <Stand at={r} rise={`role${i}`} box={[1300, 340]} shade={L.portrait ? undefined : 640}><Solid text={c.roles[i]!.word} size={L.portrait ? 210 : rtl ? 170 : 118} rtl={rtl} depth={L.portrait ? 3 : 7} /></Stand>
                {r.print && <Stand at={r.print} rise={`print${i}`} box={[300, 220]}><img className="li-print" src={c.roles[i]!.print} alt="" style={{ width: 300, left: -150, top: -220 }} /></Stand>}
                <Stand at={r.note} rise={`rnote${i}`} box={[600, 40]}><span className="li-note">{c.roles[i]!.note}</span></Stand>
              </Fragment>
            ))}

            {/* 3 — «این پورتفولیوی منه…»: his real work stands up, print by print */}
            <Stand at={L.portfolio} rise="portfolio" box={[1300, 170]}><Plain text={c.portfolio} size={L.portrait ? 130 : 110} rtl={rtl} /></Stand>
            <Stand at={L.portfolioNote} rise="portfolioNote" box={[600, 40]}><span className="li-note">{c.portfolioNote}</span></Stand>
            {WORKS.map((w, i) => (
              <Stand key={w} at={L.works[i]!} rise={`work${i}`} box={[320, 560]} shade={L.portrait ? undefined : 300}><span className="li-work"><img src={`/work/${w}.webp`} alt="" /></span></Stand>
            ))}

            {/* 4 — «حالا راحت می‌تونی وارد وب‌سایت بشی. امیدوارم که ازش خوشت بیاد.» */}
            <div className="li-at" data-z={L.mat.z} data-near="700" style={{ transform: place(L.mat, ' rotateX(90deg)') }}>
              <div className="li-mat" lang={lang}><span>{c.welcome}</span></div>
            </div>
            <Stand at={L.heart} rise="heart" box={[160, 150]}><svg className="li-heart" viewBox="0 0 100 92" width="160" height="150" style={{ left: -80, top: -150 }} aria-hidden="true"><path d="M50 88 C20 66 4 48 4 28 C4 13 15 4 28 4 C38 4 46 10 50 18 C54 10 62 4 72 4 C85 4 96 13 96 28 C96 48 80 66 50 88Z" fill="#ce261e" stroke="#181614" strokeWidth="5" strokeLinejoin="round" /></svg></Stand>
            <Stand at={L.matNote} rise="matNote" box={[600, 40]}><span className="li-note">{c.welcomeNote}</span></Stand>

            {/* 5 — «آه، راستی! … این یه تایم‌لاین زنده‌ست. برای همین می‌تونی یکم باهاش بازی کنی.» */}
            <Stand at={L.board} rise="board" near={near.board} box={[BOARD.w, BOARD.h]} shade={L.portrait ? undefined : 1300}><Board refs={board} /></Stand>
            <Stand at={L.liveNote} rise="liveNote" near={near.words} box={[700, 40]}><span className="li-note">{c.liveNote}</span></Stand>
            <Stand at={L.live} rise="live" near={near.words} box={[1400, 420]} shade={L.portrait ? undefined : 800}><Solid text={c.live} size={L.portrait ? 240 : 220} rtl={rtl} depth={L.portrait ? 3 : 7} /></Stand>
            <Stand at={L.rec} rise="rec" near={near.words} box={[220, 90]}><span className="li-rec"><i />REC</span></Stand>
            <Stand at={L.play} rise="play" near={near.play} box={[1300, 160]}><Plain text={c.play} size={L.portrait ? 80 : 96} rtl={rtl} /></Stand>

            {/* 6 — «چیزای جالبی این تو هست.» */}
            <Stand at={L.more} rise="more" box={[1500, 170]}><Plain text={c.more} size={L.portrait ? 110 : 100} rtl={rtl} /></Stand>
            <Stand at={L.ask} rise="ask" box={[400, 420]} shade={L.portrait ? undefined : 300}><Solid text={rtl ? '؟' : '?'} size={L.portrait ? 300 : 340} rtl={rtl} depth={L.portrait ? 3 : 7} /></Stand>
            <Stand at={L.moreNote} rise="moreNote" box={[600, 40]}><span className="li-note">{c.moreNote}</span></Stand>

            {/* and in: «بفرما», and the dot the camera walks into */}
            <Stand at={L.come} rise="come" box={[1300, 420]} shade={L.portrait ? undefined : 760}><Solid text={c.come} size={L.portrait ? 290 : 270} rtl={rtl} depth={L.portrait ? 3 : 7} /></Stand>
            {L.dots.map((d, i) => <Stand key={i} at={d} rise={`dot${i}`} box={[DOT * 2, DOT * 2]} keep><i className="li-dot" style={{ width: DOT * 2, height: DOT * 2, left: -DOT, top: -DOT * 2 }} /></Stand>)}
          </div>
        </div>
    </>
  ), [L, lang]);

  return (
    <div className={`li is-${phase}`} ref={root} lang={lang} dir={rtl ? 'rtl' : 'ltr'} role="region" aria-label={c.hi}
      onWheel={(e) => { e.stopPropagation(); if (phase === 'running') tape.current?.scrubBy(e.deltaY * 0.004); }}>
      <div className="li-view" onPointerDown={grab} onPointerMove={pull} onPointerUp={drop} onPointerCancel={drop}>
        {world}
      </div>
      <i className="li-grain" aria-hidden="true" />
      <span className="li-fx" aria-hidden="true"><i /><i /><i /><span className="li-fx__stamp" ref={fx} /></span>
      <i className="li-frame" aria-hidden="true" />

      <span className="li-hud" ref={hud} aria-hidden="true" />
      <button type="button" className="li-skip" onClick={skip}>{c.skip} {rtl ? '←' : '→'}</button>

      <div className="li-deck" ref={deck}>
        <button type="button" className="li-key" aria-label={c.rewind} {...press(-1)}>◀◀</button>
        <button type="button" className="li-key li-key--play" aria-label={playing ? c.pause : c.resume} onClick={toggle}>{playing ? '❚❚' : '▶'}</button>
        <button type="button" className="li-key" aria-label={c.forward} {...press(1)}>▶▶</button>
        <div className="li-strip" role="slider" aria-label={c.scrub} aria-valuemin={0} aria-valuemax={100} tabIndex={0}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seek(e); }} onPointerMove={seek}>
          <i className="li-strip__head" />
        </div>
        <button type="button" className="li-key li-key--sound" aria-pressed={muted} onClick={mute}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button>
      </div>

      {gateUp && <LanguageGate onPress={chosen} onLie={start} onGone={() => setGateUp(false)} />}
      <div className="li-red" aria-hidden="true"><i className="li-red__sheet" /></div>
    </div>
  );
}
