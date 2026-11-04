import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { atarinaji, daily } from '../content/atarinaji';
import { links } from '../content/site';
import { gsap, MOTION, ScrollTrigger, useGSAP } from '../lib/gsap';
import { pathFor, useLanguage } from '../lib/language';
import { stepped } from '../lib/paper';
import { StickerTitle } from './StickerTitle';
import '../styles/case.css';

/** A phrase between *asterisks* in the copy is underlined in red, as on the home page. */
const marked = (text: string): ReactNode => text.split('*').map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>));

// the daily impressions as a line on a 1120 × 240 sheet, time running left to right in both languages, like every chart
const W = 1120, H = 240, TOP = Math.max(...daily);
const points = daily.map((v, i) => `${((i / (daily.length - 1)) * W).toFixed(1)} ${(H - (v / TOP) * H).toFixed(1)}`);
const LINE = `M${points.join(' L')}`, AREA = `M0 ${H} L${points.join(' L')} L${W} ${H}Z`;
// where a search position sits on the ruler from 1 to 50, from the reading start
const along = (pos: number) => `${(((pos - 1) / 49) * 100).toFixed(2)}%`;

/**
 * The Atarinaji case study, at /work/atarinaji and /en/work/atarinaji: a case file on the site's paper. The site, the deal it was built
 * on (no fee, 40% of the profit on each online sale), its real Google results, what was built and what is next.
 */
export function CaseStudy() {
  const { lang, t, toggle } = useLanguage();
  const c = atarinaji[lang], rtl = lang === 'fa';
  const root = useRef<HTMLDivElement>(null);

  // the page's own title and description; the language provider sets the site's first, so this runs after it
  useEffect(() => {
    document.title = c.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.meta.description);
  }, [c]);
  useEffect(() => { scrollTo(0, 0); }, []);

  // the same stop-motion as the home page: things rise in as they come into view, the chart's line draws itself
  useGSAP(() => {
    gsap.matchMedia().add(MOTION, () => {
      const items = gsap.utils.toArray<HTMLElement>('.cs-rise');
      gsap.set(items, { autoAlpha: 0, y: 22 });
      ScrollTrigger.batch(items, {
        start: 'top 92%',
        once: true,
        onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: stepped('power3.out', 6), overwrite: true }),
      });
      const pen = root.current?.querySelector<SVGPathElement>('.cs-chart__line');
      if (pen) gsap.fromTo(pen, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: pen, start: 'top 80%', once: true } });
      gsap.from('.cs-pin', { y: -14, autoAlpha: 0, duration: 0.4, stagger: 0.08, ease: stepped('back.out(2)', 5), scrollTrigger: { trigger: '.cs-ruler', start: 'top 80%', once: true } });
    });
  }, { scope: root, dependencies: [lang], revertOnUpdate: true });

  const home = pathFor(lang);
  return (
    <div className="cs" ref={root}>
      <header className="cs-top">
        <Link className="cs-top__back" to={{ pathname: home, hash: '#work' }}>{rtl ? '→' : '←'} {c.back}</Link>
        <span className="note cs-top__kicker">{c.kicker}</span>
        <button type="button" className="cs-top__lang" onClick={toggle} aria-label={t.otherLangName}>{t.otherLang}</button>
        <a className="btn btn--sm" href={links.dm} target="_blank" rel="noreferrer">{t.reach}</a>
      </header>

      <main className="cs-main">
        <section className="cs-hero">
          <p className="note cs-red">01 — ATARINAJI.IR</p>
          <StickerTitle as="h1" size="clamp(76px, 12vw, 168px)">{c.title}</StickerTitle>
          <p className="cs-lead cs-rise">{c.lead}</p>
          <dl className="cs-facts cs-rise">
            {c.facts.map((f) => (
              <div key={f.key}><dt className="note">{f.key}</dt><dd>{f.href ? <a href={f.href} target="_blank" rel="noreferrer" dir="ltr">{f.value}</a> : f.value}</dd></div>
            ))}
          </dl>
        </section>

        <figure className="cs-shots cs-rise">
          <div className="cs-browser">
            <div className="cs-browser__bar" aria-hidden="true"><i /><i /><i /><span>https://atarinaji.ir</span></div>
            <img src="/work/atarinaji/home.webp" alt={c.shotAlt.desktop} width="1600" height="1000" loading="lazy" decoding="async" />
          </div>
          <div className="cs-phone"><img src="/work/atarinaji/home-phone.webp" alt={c.shotAlt.phone} width="600" height="1298" loading="lazy" decoding="async" /></div>
        </figure>

        <section className="cs-deal">
          <div className="cs-deal__text cs-rise">
            <p className="note">{c.deal.note}</p>
            <h2 className="cs-h2">{c.deal.title}</h2>
            <p className="cs-body">{marked(c.deal.body)}</p>
          </div>
          <div className="cs-deal__nums cs-rise">
            {[c.deal.zero, c.deal.share].map((f, i) => (
              <div key={f.label} className={i ? 'is-red' : ''}>
                <strong>{f.big}{i ? null : <small> {rtl ? 'تومان' : 'toman'}</small>}</strong>
                <span>{f.label}</span>
                <em>{f.detail}</em>
              </div>
            ))}
          </div>
          <div className="cs-sheet cs-deal__why cs-rise">
            {c.deal.why.map((w) => <div key={w.title}><h3>{w.title}</h3><p>{w.body}</p></div>)}
          </div>
        </section>

        <section className="cs-search">
          <div className="cs-search__head cs-rise">
            <div><p className="note">{c.search.note}</p><h2 className="cs-h2">{c.search.title}</h2></div>
            <p>{c.search.source}</p>
          </div>
          <dl className="cs-stats cs-rise">
            {c.search.stats.map((s, i) => <div key={s.label}><dd>{s.big}</dd><dt>{s.label}</dt><em className={i ? '' : 'cs-red'}>{s.detail}</em></div>)}
          </dl>

          <figure className="cs-sheet cs-chart cs-rise">
            <figcaption><strong>{c.search.chart.title}</strong><span>{c.search.chart.growth}</span></figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={c.search.chart.alt}>
              <path d={`M0 ${H / 4}H${W}M0 ${H / 2}H${W}M0 ${(H * 3) / 4}H${W}`} className="cs-chart__grid" />
              <path d={AREA} className="cs-chart__area" />
              <path d={LINE} className="cs-chart__line" pathLength={1} strokeDasharray="1 1" />
              <path d={`M0 ${H}H${W}`} className="cs-chart__base" />
            </svg>
            <div className="cs-chart__axis" dir="ltr"><span>{c.search.chart.from}</span><span>{c.search.chart.to}</span></div>
          </figure>

          <div className="cs-ruler cs-rise">
            <div className="cs-ruler__head"><strong>{c.search.ruler.title}</strong><span>{c.search.ruler.detail}</span></div>
            <div className="cs-ruler__track">
              <i className="cs-ruler__one" aria-hidden="true" />
              <i className="cs-ruler__line" aria-hidden="true" />
              {[1, 10, 20, 30, 40, 50].map((n) => <span key={n} className="cs-ruler__tick" style={{ insetInlineStart: along(n) }}>{n}</span>)}
              <ul>
                {c.search.ruler.queries.map((q, i) => (
                  <li key={q.q} className={`cs-pin${q.pos <= 10 ? ' is-one' : ''}${q.pos > 25 ? ' is-far' : ''}`} style={{ insetInlineStart: along(q.pos), '--row': i % 4, '--i': i } as CSSProperties}>
                    <span>{q.q} <b dir="ltr">{q.pos.toFixed(1)}</b></span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="cs-ruler__key"><i aria-hidden="true" /> {c.search.ruler.pageOne}</p>
          </div>

          <div className="cs-wins">
            {c.search.wins.map((w) => <div key={w.label} className="cs-sheet cs-rise"><strong>{w.big}</strong><h3>{w.label}</h3><p>{w.detail}</p></div>)}
          </div>
        </section>

        <section className="cs-built">
          <div className="cs-rise">
            <p className="note">{c.built.note}</p>
            <h2 className="cs-h2">{c.built.title}</h2>
            <p className="cs-body">{c.built.lead}</p>
          </div>
          <div className="cs-built__grid cs-rise">
            <dl>{c.built.counts.map((n) => <div key={n.label}><dd>{n.big}</dd><dt>{n.label}</dt></div>)}</dl>
            <ul>{c.built.list.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </section>

        <div className="cs-pages cs-rise">
          <img src="/work/atarinaji/product.webp" alt={c.shotAlt.product} width="1200" height="750" loading="lazy" decoding="async" />
          <img src="/work/atarinaji/blog.webp" alt={c.shotAlt.blog} width="1200" height="750" loading="lazy" decoding="async" />
        </div>

        <section className="cs-sheet cs-next cs-rise">
          <div><p className="note">{c.next.note}</p><h2 className="cs-h2">{c.next.title}</h2><p className="cs-body">{c.next.body}</p></div>
          <ul>{c.next.goals.map((g) => <li key={g.q}><strong>{g.q}</strong><span className="typed">{g.now} → 1–10</span></li>)}</ul>
        </section>

        <footer className="cs-end">
          <p>{c.cta}</p>
          <a className="btn" href={links.dm} target="_blank" rel="noreferrer">{c.ctaButton}</a>
        </footer>
      </main>
    </div>
  );
}
