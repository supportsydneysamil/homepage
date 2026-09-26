import Link from 'next/link';
import { highlightedApplications } from '../../lib/applications';
import type { ApiApplication } from '../../lib/contentApi';
import { todayStamp } from '../../lib/events';
import type { Language } from './homeContent';

const OpenApplications = ({ items, lang }: { items: ApiApplication[]; lang: Language }) => {
  const isKo = lang === 'ko';
  const highlighted = highlightedApplications(items, todayStamp());
  if (!highlighted.length) return null;

  return (
    <section className="home-section home-next-steps" aria-labelledby="open-applications-title">
      <div className="home-section__heading home-section__heading--split">
        <div>
          <p className="home-kicker">{isKo ? '지금 신청' : 'Open now'}</p>
          <h2 id="open-applications-title">{isKo ? '접수가 열린 신청' : 'Applications open now'}</h2>
        </div>
        <p>
          {isKo
            ? '아래에서 바로 작성하거나, 다른 신청도 함께 살펴보세요.'
            : 'Start one of these forms, or browse every open application.'}
        </p>
      </div>

      <div className="home-next-steps__grid">
        {highlighted.map((item, index) => (
          <article className="home-next-step" key={item.id}>
            <span className="home-next-step__number">0{index + 1}</span>
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : <p>{isKo ? '온라인으로 신청할 수 있습니다.' : 'You can apply online.'}</p>}
            <a href={item.formUrl} target="_blank" rel="noopener noreferrer">
              {isKo ? '신청하기' : 'Apply'}
              <span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>
      <p className="application-more">
        <Link href="/resources?view=apply" className="site-text-link">
          {isKo ? '모든 신청 보기' : 'See all applications'}
          <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
};

export default OpenApplications;
