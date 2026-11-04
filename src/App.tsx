import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { About, Contact, Hero, RouteLink, Services, Terms } from './components/Sections';
import { Work } from './components/Work';
import { links } from './content/site';
import { gsap, MOTION, ScrollTrigger, useGSAP } from './lib/gsap';
import { pathFor, useLanguage } from './lib/language';
import { smooth, startSmoothScroll } from './lib/smooth';
import { introTimeline } from './timelines/intro';
import { scrollTimelines } from './timelines/scroll';
import { pointerSounds } from './timelines/sounds';
import { stampButtons } from './timelines/stamp';
import { storyTimelines } from './timelines/story';

// the gate and the live greeting are only for a first visit, so they are a separate download a returning visitor never makes
const LiveIntro = lazy(() => import('./intro/LiveIntro').then((m) => ({ default: m.LiveIntro })));
const LanguageGate = lazy(() => import('./intro/LanguageGate').then((m) => ({ default: m.LanguageGate })));

const SEEN = 'kk-seen';
const seen = () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return false; } };
const remember = () => { try { localStorage.setItem(SEEN, '1'); } catch { /* private window: the gate shows again next time */ } };

export function App() {
  const root = useRef<HTMLDivElement>(null);
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  // the first visit starts with the language gate and the live intro, which hands over to the site when it ends; after that the
  // site opens straight away. /intro (and /en/intro) replays it
  const { pathname } = useLocation();
  const [live, setLive] = useState(() => pathname.replace(/\/$/, '').endsWith('/intro') || !seen());
  const motion = window.matchMedia(MOTION).matches;
  const opening = useRef<((after: number) => void) | null>(null);
  // while the intro covers the screen the site under it is not drawn at all: a desktop graphics card holding the site, the intro's
  // 3D world and the gate's paper sheets at once ran out of memory and flashed the site through the intro for single frames
  const [covered, setCovered] = useState(() => live && motion);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const stopScroll = startSmoothScroll();
      // behind the live intro the page waits, still. When the intro hands over, the page comes up from slightly too close as the red
      // opens over it, and its own opening starts once there is room to see it
      if (live && motion) {
        smooth.stop();
        opening.current = (after) => {
          scrollTo(0, 0);
          smooth.start();
          gsap.fromTo(root.current, { scale: 1.08, transformOrigin: `50% ${innerHeight * 0.45}px` }, { scale: 1, duration: 1.9, delay: after, ease: 'expo.out', clearProps: 'transform,transformOrigin' });
          introTimeline('live').delay(after + 0.5);
        };
      } else introTimeline();
      scrollTimelines();
      const stopStamps = stampButtons();
      const stopStory = storyTimelines();
      return () => { stopStory(); stopStamps(); stopScroll(); };
    });
  }, { scope: root });

  useEffect(() => pointerSounds(), []);
  // arriving with a section in the address (back from a case study, a shared link): start there, under the header
  useEffect(() => {
    const id = location.hash.slice(1), at = id ? document.getElementById(id) : null;
    if (!at || live) return;
    const head = document.querySelector<HTMLElement>('.head')?.offsetHeight ?? 0;
    requestAnimationFrame(() => scrollTo({ top: at.getBoundingClientRect().top + scrollY - head, behavior: 'instant' }));
  }, []);

  // the two languages lay out differently, so scroll positions are measured again after a switch
  useGSAP(() => { ScrollTrigger.refresh(); }, { dependencies: [lang], revertOnUpdate: false });

  const reveal = useCallback((after: number) => { setCovered(false); opening.current?.(after); opening.current = null; }, []);
  const done = useCallback(() => { remember(); setLive(false); navigate(pathFor(lang), { replace: true }); }, [lang, navigate]);
  // with reduced motion there is no film: the gate asks for the language and the site opens in it
  const choose = useCallback((pick: 'fa' | 'en') => { navigate(pathFor(pick), { replace: true }); }, [navigate]);
  const enter = useCallback(() => { remember(); setLive(false); }, []);

  return (
    <div ref={root} className={covered ? 'is-covered' : undefined}>
      {/* while that download arrives, plain paper covers the site so it is never seen before the gate */}
      {live && <Suspense fallback={<i className="li-wait" aria-hidden="true" />}>{motion ? <LiveIntro onReveal={reveal} onDone={done} /> : <LanguageGate solid onPress={choose} onGone={enter} />}</Suspense>}
      <a className="skip" href="#about">{t.skip}</a>
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <RouteLink id="route-a" />
        <Work />
        <RouteLink id="route-b" />
        <Terms />
        <Contact />
      </main>
      <footer className="foot">
        <span>{t.fullName}</span>
        <a className="typed" href={links.instagram} target="_blank" rel="noreferrer">{links.handle}</a>
      </footer>
    </div>
  );
}
