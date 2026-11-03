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

export function Hero() {
  const { t } = useLanguage();
  return (
    <section className="hero" id="top">
      <i className="hero__frame" aria-hidden="true" />
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
          {t.about.body.map((p) => <p className="about__body rise" data-read key={p}><Read text={p} /></p>)}
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
        {t.services.items.map((s) => (
          <li className="list__row" key={s.label}>
            <h3 data-read><Read text={s.label} /></h3>
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
      <ul className="terms">
        {t.terms.items.map((item) => (
          <li className="rise" key={item.big}>
            <strong data-read><Read text={item.big} /></strong>
            <p data-read><Read text={item.detail} /></p>
          </li>
        ))}
      </ul>
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
