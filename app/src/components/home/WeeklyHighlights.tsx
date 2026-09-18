import Link from 'next/link';
import {
  formatShortDate,
} from '../../lib/presentation';
import {
  getVisibleWeeklyItems,
  type Language,
  type WeeklyItem,
} from './homeContent';

type WeeklyHighlightsProps = {
  items: WeeklyItem[];
  lang: Language;
  now?: Date;
};

const WeeklyHighlights = ({
  items,
  lang,
  now = new Date(),
}: WeeklyHighlightsProps) => {
  const isKo = lang === 'ko';
  const { active } = getVisibleWeeklyItems(items, now);

  return (
    <section className="home-section home-weekly" id="this-week">
      <div className="home-section__heading">
        <p className="home-kicker">{isKo ? '이번 주 삼일' : 'This week at Samil'}</p>
        <h2>{isKo ? '이번 주, 함께해요' : 'Come be part of this week'}</h2>
        <p>
          {isKo
            ? '지금 필요한 소식만 간결하게 모았습니다.'
            : 'A simple view of what is happening in our community.'}
        </p>
      </div>

      {active.length > 0 ? (
        <div className="home-weekly__grid">
          {active.map((item, index) => (
            <article className="home-weekly__card" key={item.id}>
              <div className="home-weekly__meta">
                <span>0{index + 1}</span>
                <time dateTime={item.date}>{formatShortDate(item.date, lang)}</time>
              </div>
              <h3>{isKo ? item.titleKo : item.titleEn}</h3>
              <p>{isKo ? item.summaryKo : item.summaryEn}</p>
              <Link href={item.url}>
                {isKo ? '자세히 보기' : 'View details'}
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="weekly-empty">
          <p>
            {isKo
              ? '새로운 주간 소식을 준비하고 있습니다.'
              : 'Fresh weekly updates are on the way.'}
          </p>
          <div className="weekly-empty__links">
            <Link href="/events">{isKo ? '행사 보기' : 'Events'}</Link>
            <Link href="/sermons">{isKo ? '설교 듣기' : 'Sermons'}</Link>
            <Link href="/resources">{isKo ? '자료실' : 'Resources'}</Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default WeeklyHighlights;
