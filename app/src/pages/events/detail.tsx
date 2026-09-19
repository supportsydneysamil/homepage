import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import EmptyState from '../../components/EmptyState';
import { useLanguage } from '../../lib/LanguageContext';
import { toYouTubeEmbedUrl } from '../../lib/presentation';
import { formatEventWhen, visibleEventImages } from '../../lib/events';
import { fetchEvents, useContent, type ApiEvent } from '../../lib/contentApi';

const EventDetailPage: NextPage & {
  meta?: { title?: string; description?: string };
} = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { items: events, isLoading } = useContent<ApiEvent>(() => fetchEvents({ slug }), Boolean(slug));
  const event = events[0];
  const images = event ? visibleEventImages(event.images) : [];
  const embedUrl = event ? toYouTubeEmbedUrl(event.youtubeUrl) : null;

  if (!router.isReady || isLoading) {
    return <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p>;
  }

  if (!slug || !event) {
    return (
      <article className="site-page event-detail-page">
        <EmptyState
          title={isKo ? '이벤트를 찾을 수 없습니다' : 'This event is not available'}
          description={
            isKo
              ? '주소가 바뀌었거나 아직 공개되지 않은 행사일 수 있습니다.'
              : 'The link may be out of date, or the gathering is not published yet.'
          }
          href="/events"
          linkLabel={isKo ? '이벤트 목록으로' : 'Back to events'}
        />
      </article>
    );
  }

  return (
    <article className="site-page event-detail-page">
      <Head>
        <title>{event.title} | Sydney Samil Church</title>
        <meta name="description" content={event.description || event.title} />
      </Head>

      <header className="event-detail-hero">
        <Link href="/events" className="site-text-link">
          ← {isKo ? '모든 이벤트' : 'All events'}
        </Link>
        <p className="site-kicker">{formatEventWhen(event.date, event.startTime, lang)}</p>
        <h1>{event.title}</h1>
        {event.location ? <p className="event-detail-location">{event.location}</p> : null}
        {event.description ? <p>{event.description}</p> : null}
      </header>

      {images.length ? (
        <section className="event-gallery">
          {images.map((image) => (
            <img src={image} alt={event.title} key={image} />
          ))}
        </section>
      ) : null}

      {embedUrl ? (
        <div className="site-video">
          <iframe
            src={embedUrl}
            title={event.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
    </article>
  );
};

EventDetailPage.meta = {
  title: 'Event',
  description: 'Event details from Sydney Samil Church.',
};

export default EventDetailPage;
