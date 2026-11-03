import { useEffect, useRef, useState } from 'react';
import { CHAPTERS, dock, narration, type Chapter } from '../content/voice';
import { gsap, MOTION } from '../lib/gsap';
import { useLanguage } from '../lib/language';
import { perform, type Performance } from '../lib/voice';

const SEEN = 'kk-voice-note';
const remembered = () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return false; } };
const remember = () => { try { localStorage.setItem(SEEN, '1'); } catch { /* private window: the note just shows again next time */ } };

/**
 * The voice of the site. A dock at the bottom holds the listen button: as each section arrives Kamyar says a line
 * about it, and with sound on he reads the section aloud while its words ink in. On a first visit a note points at the button.
 */
export function Voice() {
  const { lang } = useLanguage();
  const words = dock[lang];
  const [chapter, setChapter] = useState<Chapter>('top');
  const [sound, setSound] = useState(false);
  const [note, setNote] = useState(false);
  const playing = useRef<Performance | null>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  // the section in the middle of the screen is the one being talked about
  useEffect(() => {
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setChapter(e.target.id as Chapter);
    }, { rootMargin: '-45% 0px -50% 0px' });
    for (const id of CHAPTERS) { const el = document.getElementById(id); if (el) seen.observe(el); }
    return () => seen.disconnect();
  }, [lang]);

  useEffect(() => {
    playing.current?.stop();
    playing.current = perform({ lang, id: chapter, section: document.getElementById(chapter), narration: narration[lang][chapter], sound });
    return () => { playing.current?.stop(); playing.current = null; };
  }, [chapter, sound, lang]);

  // a first visit is greeted with a note pointing at the button, once the opening has played
  useEffect(() => {
    if (remembered()) return;
    const timer = setTimeout(() => setNote(true), 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = noteRef.current;
    if (!note || !el || !window.matchMedia(MOTION).matches) return;
    const arrow = el.querySelector('.note__arrow path');
    gsap.timeline()
      .fromTo(el, { y: 30, rotation: -6, autoAlpha: 0 }, { y: 0, rotation: -1.5, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.8)' })
      .fromTo(arrow, { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.5, ease: 'power2.out' }, 0.35);
  }, [note]);

  const close = () => { setNote(false); remember(); };
  const flip = () => { setSound((on) => !on); close(); };

  return (
    <div className="dock" lang={lang}>
      {note && (
        <div className="note-card" ref={noteRef} role="dialog" aria-label={words.hello}>
          <div className="note-card__paper">
            <strong>{words.hello}</strong>
            <p>{words.ask}</p>
            <button type="button" className="note-card__later" onClick={close}>{words.dismiss}</button>
          </div>
          <svg className="note__arrow" viewBox="0 0 60 70" fill="none" aria-hidden="true"><path d="M48 4 C58 30 40 50 10 62 M10 62 l14 -2 M10 62 l6 -12" stroke="#181614" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset="1" /></svg>
        </div>
      )}
      <button type="button" className={`dock__listen${sound ? ' is-on' : ''}`} onClick={flip} aria-pressed={sound}>
        <span className="dock__bars" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>{sound ? words.mute : words.listen}</span>
      </button>
    </div>
  );
}
