import { useState } from 'react';
import { links, stack } from '../content/site';
import { Read } from './Read';
import { useLanguage } from '../lib/language';
import { StickerTitle } from './StickerTitle';

const HEAD = 'clamp(52px, 7.6vw, 112px)';

export function SectionHead({ note, title }: { note: string; title: string }) {
  return (
    <div className="sec__head">
      <p className="note rise">{note}</p>
      <StickerTitle size={HEAD}>{title}</StickerTitle>
    </div>
  );
}

const FPS_NOTE = 'kk-fps-note';
const noteRead = () => { try { return localStorage.getItem(FPS_NOTE) === '1'; } catch { return false; } };

export function Hero() {
  const { t } = useLanguage();
  // the first thing on the page: the stop-motion is on purpose. Once closed it stays closed
  const [note, setNote] = useState(() => !noteRead());
  const close = () => { setNote(false); try { localStorage.setItem(FPS_NOTE, '1'); } catch { /* private window: it shows again next time */ } };
  return (
    <section className="hero" id="top">
      <i className="hero__frame" aria-hidden="true" />
      {note && (
        <aside className="fps-note" role="note">
          <span className="note">{t.fpsNote.note}</span>
          <p>{t.fpsNote.text}</p>
          <button type="button" className="fps-note__close" onClick={close}>{t.fpsNote.close}</button>
        </aside>
      )}
      <div className="hero__copy">
        <StickerTitle as="h1" size={t.hero.size} className="hero__title">{t.hero.title}</StickerTitle>
      </div>
      <div className="hero__floor">
        <p className="caption hero__roles">{t.hero.roles}</p>
        <div className="hero__actions">
          <a className="btn" href="#work">{t.hero.primary}</a>
          <a className="btn btn--ghost" href={links.dm} target="_blank" rel="noreferrer">{t.cta}</a>
        </div>
      </div>
    </section>
  );
}

export function About() {
  const { t } = useLanguage();
  return (
    <section className="sec about" id="about">
      {/* laid out for reading: the title and the stack stay in the margin while the text runs in one column at a comfortable measure */}
      <div className="about__page">
        <div className="about__side">
          <SectionHead note={t.about.note} title={t.about.title} />
          <aside className="about__stack rise">
            <p className="note">{t.about.stackNote}</p>
            <p>{t.about.stack}</p>
            <ul>{stack.map((s) => <li key={s}>{s}</li>)}</ul>
          </aside>
        </div>
        <div className="about__text">
          <p className="about__lead rise" data-read><Read text={t.about.lead} /></p>
          {t.about.body.map((p, i) => <p className="about__body rise" data-read key={i}><Read text={p} /></p>)}
        </div>
      </div>
    </section>
  );
}

export function Services() {
  const { t } = useLanguage();
  return (
    <section className="sec sec--floor services" id="services">
      <SectionHead note={t.services.note} title={t.services.title} />
      <ul className="list">
        {/* keyed by place, not by words: the two languages share the same cards, so the dealing animation keeps hold of them */}
        {t.services.items.map((s, i) => (
          <li className="list__row" key={i}>
            <h3 data-read><Read text={s.label} /></h3>
            <p className="list__motto" data-read><Read text={s.motto} /></p>
            <p data-read><Read text={s.detail} /></p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Terms() {
  const { t } = useLanguage();
  return (
    <section className="sec sec--floor" id="terms">
      <SectionHead note={t.terms.note} title={t.terms.title} />
      {/* no price list: prices are asked for on Telegram, where he answers himself */}
      <div className="price rise">
        <div className="price__text">
          <p className="note">{t.terms.price.note}</p>
          <h3>{t.terms.price.title}</h3>
          <p data-read><Read text={t.terms.price.body} /></p>
        </div>
        <a className="btn price__btn" href={links.telegram} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M21 4 3 11.2l6.4 2.3L19 7l-7.6 8.1.4 5L14.6 15l4 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          <span>{t.terms.price.button}</span>
          <span className="typed price__handle">{links.telegramName}</span>
        </a>
      </div>
    </section>
  );
}

export function Contact() {
  const { t } = useLanguage();
  const { contact } = t;
  return (
    <section className="sec contact" id="contact">
      <p className="contact__label rise">{contact.label}</p>
      <StickerTitle size="clamp(60px, 12vw, 180px)">{contact.title}</StickerTitle>
      <svg className="contact__line rise" viewBox="0 0 600 24" fill="none" aria-hidden="true"><path d="M6 16 C160 4 430 22 594 8" stroke="#ce261e" strokeWidth="8" strokeLinecap="round" /></svg>
      <a className="btn contact__btn rise" href={links.dm} target="_blank" rel="noreferrer">{t.cta}</a>
      <p className="contact__note rise" data-read><Read text={contact.note} /></p>
      <ul className="channels rise">
        <li><span>{contact.telegram}</span><a className="typed" href={links.telegram} target="_blank" rel="noreferrer">{links.telegramName}</a></li>
        <li><span>{contact.email}</span><a className="typed" href={`mailto:${links.email}`}>{links.email}</a></li>
        <li><span>{contact.instagram}</span><a className="typed" href={links.instagram} target="_blank" rel="noreferrer">{links.handle}</a></li>
        <li><span>{contact.github}</span><a className="typed" href={links.github} target="_blank" rel="noreferrer">{links.githubName}</a></li>
      </ul>
      <span className="contact__dots rise" aria-hidden="true"><i /><i /><i /></span>
    </section>
  );
}

/** A piece of the reel's route between two sections, drawn on as you reach it. */
export function RouteLink({ id }: { id: string }) {
  return (
    <svg className="route" viewBox="0 0 60 200" fill="none" aria-hidden="true">
      <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="60" height="200"><path className="route__pen" d="M30 0 C4 60 56 130 30 200" stroke="#fff" strokeWidth="14" pathLength={1} strokeDasharray="1 1" /></mask></defs>
      <path d="M30 0 C4 60 56 130 30 200" stroke="#ce261e" strokeWidth="7" strokeDasharray="20 13" strokeLinecap="round" opacity=".85" mask={`url(#${id})`} />
    </svg>
  );
}
