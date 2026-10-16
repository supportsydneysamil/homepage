import Link from 'next/link';
import type { NextPage } from 'next';
import MokjangCover from '../../components/MokjangCover';
import PageHero from '../../components/PageHero';
import { fetchMokjangs, useContent, type ApiMokjang } from '../../lib/contentApi';
import { useLanguage } from '../../lib/LanguageContext';
import {
  MOKJANG_PAGE_META,
  audienceLabel,
  mokjangDetailHref,
  mokjangName,
  sortMokjangs,
  tileMeeting,
} from '../../lib/mokjang';
import type { PageMeta } from '../../lib/pageMeta';
import { localize, localizeOr, visibleQuestions, visibleStudies } from '../../lib/siteCopy';
import { useSiteSettings } from '../../lib/ThemeContext';

const CONNECT_HREF = '/contact?topic=community';

const MokjangPage: NextPage & { meta?: PageMeta } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { siteCopy } = useSiteSettings();
  const copy = siteCopy.mokjang;
  const { items, isLoading } = useContent<ApiMokjang>(fetchMokjangs);
  const mokjangs = sortMokjangs(items.filter((item) => item.published));
  const questions = visibleQuestions(copy.faq.items);
  const studies = visibleStudies(copy.study.items);

  return (
    <article className="site-page mokjang-page">
      <PageHero
        eyebrow={localize(copy.hero.kicker, lang)}
        title={localize(copy.hero.title, lang)}
        description={localize(copy.hero.lead, lang)}
        actions={
          <>
            <Link className="site-button site-button--primary" href={CONNECT_HREF}>
              {localize(copy.hero.ctaConnect, lang)} <span aria-hidden="true">→</span>
            </Link>
            <a className="site-button site-button--quiet" href="#mokjang-list">
              {localize(copy.hero.ctaBrowse, lang)} <span aria-hidden="true">↓</span>
            </a>
          </>
        }
      />

      <section className="mokjang-section" aria-labelledby="mokjang-evening-title">
        <p className="site-kicker">{localize(copy.evening.kicker, lang)}</p>
        <h2 id="mokjang-evening-title" className="mokjang-section__title">
          {localize(copy.evening.title, lang)}
        </h2>
        <ol className="mokjang-steps">
          {copy.evening.steps.map((step, index) => (
            <li key={index}>
              <span>{localize(step.time, lang)}</span>
              <h3>{localize(step.title, lang)}</h3>
              <p>{localize(step.body, lang)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mokjang-welcome">
        <p className="site-kicker">{localize(copy.welcome.kicker, lang)}</p>
        <h2>{localize(copy.welcome.title, lang)}</h2>
        <p>{localize(copy.welcome.body, lang)}</p>
      </section>

      <section id="mokjang-list" className="mokjang-section" aria-labelledby="mokjang-list-title">
        <p className="site-kicker">{localize(copy.list.kicker, lang)}</p>
        <h2 id="mokjang-list-title" className="mokjang-section__title">
          {localize(copy.list.title, lang)}
        </h2>
        <p className="mokjang-section__intro">{localize(copy.list.intro, lang)}</p>
        {isLoading ? (
          <p className="muted">{isKo ? '불러오는 중...' : 'Loading...'}</p>
        ) : mokjangs.length ? (
          <ul className="mokjang-tiles">
            {mokjangs.map((mokjang) => {
              const name = mokjangName(mokjang, lang);
              return (
                <li key={mokjang.id}>
                  <Link href={mokjangDetailHref(mokjang.slug)} className="mokjang-tile">
                    <MokjangCover src={mokjang.coverImage} name={name} className="mokjang-tile__cover" />
                    <span className="mokjang-tile__body">
                      <strong>{name}</strong>
                      <span>{tileMeeting(mokjang, lang)}</span>
                      <span className="mokjang-chip">{audienceLabel(mokjang.audience, lang)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mokjang-empty">
            <p>{localize(copy.list.empty, lang)}</p>
            <Link href={CONNECT_HREF} className="site-text-link">
              {localize(copy.cta.button, lang)} <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </section>

      {questions.length ? (
        <section className="mokjang-section" aria-labelledby="mokjang-faq-title">
          <h2 id="mokjang-faq-title" className="site-kicker">
            {localize(copy.faq.kicker, lang)}
          </h2>
          <div className="mokjang-faq">
            {questions.map((item, index) => {
              const answer = localizeOr(item.answer, lang);
              return (
                <details key={index}>
                  <summary>{localizeOr(item.question, lang)}</summary>
                  {answer ? <p>{answer}</p> : null}
                </details>
              );
            })}
          </div>
        </section>
      ) : null}

      {studies.length ? (
        <section className="mokjang-section" aria-labelledby="mokjang-study-title">
          <p className="site-kicker">{localize(copy.study.kicker, lang)}</p>
          <h2 id="mokjang-study-title" className="mokjang-section__title">
            {localize(copy.study.title, lang)}
          </h2>
          <div className="mokjang-study">
            {studies.map((item, index) => (
              <article key={index}>
                <h3>{localizeOr(item.title, lang)}</h3>
                <p>{localizeOr(item.body, lang)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mokjang-cta">
        <p className="site-kicker">{localize(copy.cta.kicker, lang)}</p>
        <h2>{localize(copy.cta.title, lang)}</h2>
        <p>{localize(copy.cta.body, lang)}</p>
        <Link className="site-button" href={CONNECT_HREF}>
          {localize(copy.cta.button, lang)} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </article>
  );
};

MokjangPage.meta = MOKJANG_PAGE_META;

export default MokjangPage;
