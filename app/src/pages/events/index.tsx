import { useState } from 'react';
import Link from 'next/link';
import type { NextPage } from 'next';
import EmptyState from '../../components/EmptyState';
import PageHero from '../../components/PageHero';
import { useLanguage } from '../../lib/LanguageContext';
import { formatListIndex } from '../../lib/presentation';
import {
  PAST_EVENT_PAGE_SIZE,
  eventDetailHref,
  formatEventWhen,
  splitUpcomingAndPast,
  takePage,
  todayStamp,
} from '../../lib/events';
import { fetchEvents, useContent, type ApiEvent } from '../../lib/contentApi';

const EventRows = ({
  events,
  lang,
  isKo,
}: {
  events: ApiEvent[];
  lang: 'ko' | 'en';
  isKo: boolean;
}) => (
  <section className="content-list">
    {events.map((event, index) => (
      <article className="content-row" key={event.slug}>
        <div className="content-row__index">{formatListIndex(index)}</div>
        <time dateTime={event.date}>{formatEventWhen(event.date, event.startTime, lang)}</time>
        <div className="content-row__body">
          <h2>{event.title}</h2>
          {event.location || event.description ? (
            <p>{[event.location, event.description].filter(Boolean).join(' · ')}</p>
          ) : null}
        </div>
        <Link href={eventDetailHref(event.slug)} className="site-text-link">
          {isKo ? '자세히 보기' : 'View details'} <span aria-hidden="true">→</span>
        </Link>
      </article>
    ))}
  </section>
);

const EventsPage: NextPage & {
  meta?: { title?: string; description?: string };
} = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: events, isLoading } = useContent<ApiEvent>(fetchEvents);
  const published = events.filter((event) => event.published);
  const { upcoming, past } = splitUpcomingAndPast(published, todayStamp());
  const [pastVisible, setPastVisible] = useState(PAST_EVENT_PAGE_SIZE);
  const { items: visiblePast, remaining: remainingPast } = takePage(past, pastVisible);

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

      {!isLoading && upcoming.length ? (
        <>
          <h2 className="event-section-title">{isKo ? '다가올 행사' : 'Upcoming'}</h2>
          <EventRows events={upcoming} lang={lang} isKo={isKo} />
        </>
      ) : null}

      {!isLoading && past.length ? (
        <>
          <h2 className="event-section-title">{isKo ? '지난 행사' : 'Past gatherings'}</h2>
          <EventRows events={visiblePast} lang={lang} isKo={isKo} />
          {remainingPast > 0 ? (
            <div className="sermon-more">
              <button
                type="button"
                className="manage-button manage-button--ghost"
                onClick={() => setPastVisible((count) => count + PAST_EVENT_PAGE_SIZE)}
              >
                {isKo ? `지난 행사 더 보기 (${remainingPast}건)` : `Show earlier gatherings (${remainingPast})`}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {!isLoading && !upcoming.length && !past.length ? (
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
