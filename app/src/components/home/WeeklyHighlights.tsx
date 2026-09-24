import Link from 'next/link';
import { formatShortDate } from '../../lib/presentation';
import { useSiteSettings } from '../../lib/ThemeContext';
import { localize } from '../../lib/siteCopy';
import { getVisibleWeeklyItems, type Language, type WeeklyItem } from './homeContent';

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
  const { siteCopy } = useSiteSettings();
  const weekly = siteCopy.home.weekly;
  const { active } = getVisibleWeeklyItems(items, now);

  return (
    <section className="home-section home-weekly" id="this-week">
      <div className="home-section__heading">
        <p className="home-kicker">{localize(weekly.kicker, lang)}</p>
        <h2>{localize(weekly.title, lang)}</h2>
        <p>{localize(weekly.intro, lang)}</p>
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
                {localize(weekly.viewDetails, lang)}
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="weekly-empty">
          <p>{localize(weekly.empty, lang)}</p>
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
