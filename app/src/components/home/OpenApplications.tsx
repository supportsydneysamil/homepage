import Link from 'next/link';
import { highlightedApplications } from '../../lib/applications';
import type { ApiApplication } from '../../lib/contentApi';
import { todayStamp } from '../../lib/events';
import { localize } from '../../lib/siteCopy';
import { useSiteSettings } from '../../lib/ThemeContext';
import type { Language } from './homeContent';

const OpenApplications = ({ items, lang }: { items: ApiApplication[]; lang: Language }) => {
  const isKo = lang === 'ko';
  const { siteCopy } = useSiteSettings();
  const copy = siteCopy.home.applications;
  const highlighted = highlightedApplications(items, todayStamp());
  if (!highlighted.length) return null;

  return (
    <section className="home-section home-next-steps" aria-labelledby="open-applications-title">
      <div className="home-section__heading home-section__heading--split">
        <div>
          <p className="home-kicker">{localize(copy.kicker, lang)}</p>
          <h2 id="open-applications-title">{localize(copy.title, lang)}</h2>
        </div>
        <p>{localize(copy.intro, lang)}</p>
      </div>

      <div className="home-next-steps__grid">
        {highlighted.map((item, index) => (
          <article className="home-next-step" key={item.id}>
            <span className="home-next-step__number">0{index + 1}</span>
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : <p>{isKo ? '온라인으로 신청할 수 있습니다.' : 'You can apply online.'}</p>}
            <a href={item.formUrl} target="_blank" rel="noopener noreferrer">
              {localize(copy.applyLabel, lang)}
              <span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>
      <p className="application-more">
        <Link href="/resources?view=apply" className="site-text-link">
          {localize(copy.viewAll, lang)}
          <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
};

export default OpenApplications;
