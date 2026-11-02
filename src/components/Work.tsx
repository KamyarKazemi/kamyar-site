import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../lib/language';
import { SectionHead } from './Sections';

/** The work as prints on the wall. Any print opens the viewer; arrows, Escape and the on-screen buttons all work. */
export function Work() {
  const { lang, t } = useLanguage();
  const items = t.work.items;
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = index === null ? null : items[index];

  useEffect(() => {
    if (index === null) dialog.current?.close();
    else if (!dialog.current?.open) dialog.current?.showModal();
  }, [index]);

  const step = (by: number) => setIndex((i) => (i === null ? i : (i + by + items.length) % items.length));
  // "forward" follows the reading direction
  const forward = lang === 'fa' ? 'ArrowLeft' : 'ArrowRight', back = lang === 'fa' ? 'ArrowRight' : 'ArrowLeft';
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === forward) step(1);
    if (e.key === back) step(-1);
  };

  return (
    <section className="sec" id="work">
      <SectionHead note={t.work.note} title={t.work.title} />
      <ul className="prints">
        {items.map((item, i) => (
          <li className="rise" key={item.id}>
            <button type="button" className="print" onClick={() => setIndex(i)} aria-label={`${item.title}, ${item.kind}`}>
              <span className="print__img">
                <img src={`/work/${item.id}-ink.webp`} alt={item.alt} loading="lazy" decoding="async" width="480" height="853" />
                <img className="print__colour" src={item.image} alt="" loading="lazy" decoding="async" width="720" height="1280" />
              </span>
            </button>
            <p className="print__title">{item.title}</p>
            <p className="print__kind">{item.kind}</p>
          </li>
        ))}
      </ul>

      <dialog className="viewer" ref={dialog} onClose={() => setIndex(null)} onKeyDown={onKey} aria-label={current?.title ?? ''}>
        {current && (
          <>
            <div className="viewer__media">
              {current.video
                ? <video key={current.id} src={current.video} poster={current.image} muted loop autoPlay playsInline />
                : <img key={current.id} src={current.image} alt={current.alt} />}
            </div>
            <div className="viewer__bar">
              <div><strong>{current.title}</strong><span>{current.kind}</span></div>
              <div className="viewer__btns">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => step(-1)}>{t.viewer.prev}</button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => step(1)}>{t.viewer.next}</button>
                <button type="button" className="btn btn--sm" onClick={() => setIndex(null)}>{t.viewer.close}</button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
