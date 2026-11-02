import { Link } from 'react-router-dom';
import { pathFor, useLanguage } from '../lib/language';
import { StickerTitle } from './StickerTitle';

export function NotFound() {
  const { lang, t } = useLanguage();
  return (
    <main className="lost">
      <i className="hero__frame" aria-hidden="true" />
      <StickerTitle as="h1" size="clamp(110px, 24vw, 300px)">{t.notFound.title}</StickerTitle>
      <p className="caption lost__text">{t.notFound.text}</p>
      <Link className="btn" to={pathFor(lang)}>{t.notFound.back}</Link>
    </main>
  );
}
