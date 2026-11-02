import { useRef } from 'react';
import { Header } from './components/Header';
import { About, Contact, Hero, RouteLink, Services, Terms } from './components/Sections';
import { Work } from './components/Work';
import { links } from './content/site';
import { gsap, MOTION, ScrollTrigger, useGSAP } from './lib/gsap';
import { useLanguage } from './lib/language';
import { developPrints } from './timelines/develop';
import { introTimeline } from './timelines/intro';
import { scrollTimelines } from './timelines/scroll';
import { stampButtons } from './timelines/stamp';

export function App() {
  const root = useRef<HTMLDivElement>(null);
  const { lang, t } = useLanguage();

  useGSAP(() => {
    gsap.matchMedia().add(MOTION, () => {
      introTimeline();
      scrollTimelines();
      developPrints();
      return stampButtons();
    });
  }, { scope: root });

  // the two languages lay out differently, so scroll positions are measured again after a switch
  useGSAP(() => { ScrollTrigger.refresh(); }, { dependencies: [lang], revertOnUpdate: false });

  return (
    <div ref={root}>
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
