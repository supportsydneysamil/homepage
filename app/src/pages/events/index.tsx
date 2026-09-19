import Link from 'next/link';
import type { NextPage } from 'next';
import EmptyState from '../../components/EmptyState';
import PageHero from '../../components/PageHero';
import { useLanguage } from '../../lib/LanguageContext';
import { formatDisplayDate, formatListIndex } from '../../lib/presentation';
import { fetchEvents, useContent, type ApiEvent } from '../../lib/contentApi';
import { useRoles } from '../../lib/useRoles';
import { buildManageHref } from '../../lib/manageNav';

const EventsPage: NextPage & {
  meta?: { title?: string; description?: string };
} = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: events, isLoading } = useContent<ApiEvent>(fetchEvents);
  const { isEditor } = useRoles();

  return (
    <article className="site-page events-page">
      <PageHero
        eyebrow={isKo ? '함께하는 시간' : 'Life together'}
        title={isKo ? '함께 모이고, 자라고, 섬겨요' : 'Gather, grow, and serve together'}
        description={
          isKo
            ? '예배 밖에서도 관계를 맺고, 함께 배우고, 이웃을 섬기는 자리에 초대합니다.'
            : 'Discover gatherings where you can build relationships, grow in faith, and serve our neighbours.'
        }
      />

      {isLoading ? <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p> : null}

      {!isLoading && events.length ? (
        <section className="content-list">
          {events.map((event, index) => (
            <article className="content-row" key={event.slug}>
              <div className="content-row__index">{formatListIndex(index)}</div>
              <time dateTime={event.date}>{formatDisplayDate(event.date, lang)}</time>
              <div className="content-row__body">
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                {isEditor ? (
                  <a className="manage-edit-link" href={buildManageHref('events', event.id)}>
                    {isKo ? '편집' : 'Edit'}
                  </a>
                ) : null}
              </div>
              <Link href={`/events/${event.slug}`} className="site-text-link">
                {isKo ? '자세히 보기' : 'View details'} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </section>
      ) : null}

      {!isLoading && !events.length ? (
        <EmptyState
          title={isKo ? '새로운 행사를 준비 중입니다' : 'New gatherings are on the way'}
          description={isKo ? '곧 새로운 소식으로 찾아뵙겠습니다.' : 'Please check back soon for updates.'}
        />
      ) : null}
    </article>
  );
};

EventsPage.meta = {
  title: 'Events',
  description: 'Events and gatherings at Sydney Samil Church.',
};

export default EventsPage;
