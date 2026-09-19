import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import EmptyState from '../../components/EmptyState';
import eventsData from '../../content/events.json';
import { useLanguage } from '../../lib/LanguageContext';
import {
  formatDisplayDate,
  isPlaceholderUrl,
  toYouTubeEmbedUrl,
} from '../../lib/presentation';
import { fetchEvents, useContent, type ApiEvent } from '../../lib/contentApi';

type Event = {
  slug: string;
  date: string;
  title: string;
  description: string;
  images: string[];
  youtubeUrl?: string;
};

type EventDetailProps = { event: Event };

const EventDetail: NextPage<EventDetailProps> & {
  meta?: { title?: string; description?: string };
} = ({ event }) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  // The build-time props keep the static route; live data keeps the content current.
  const { items: liveEvents } = useContent<ApiEvent>(fetchEvents);
  const liveEvent = liveEvents.find((item) => item.slug === event.slug) ?? event;
  const images = liveEvent.images.filter((image) => !isPlaceholderUrl(image));
  const embedUrl = toYouTubeEmbedUrl(liveEvent.youtubeUrl);

  return (
    <article className="site-page event-detail-page">
      <Head>
        <title>{liveEvent.title} | Sydney Samil Church</title>
        <meta name="description" content={liveEvent.description} />
      </Head>

      <header className="event-detail-hero">
        <Link href="/events" className="site-text-link">← {isKo ? '모든 이벤트' : 'All events'}</Link>
        <p className="site-kicker">{formatDisplayDate(liveEvent.date, lang)}</p>
        <h1>{liveEvent.title}</h1>
        <p>{liveEvent.description}</p>
      </header>

      {images.length ? (
        <section className="event-gallery">
          {images.map((image) => (
            <img src={image} alt={liveEvent.title} key={image} />
          ))}
        </section>
      ) : null}

      {embedUrl ? (
        <div className="site-video">
          <iframe
            src={embedUrl}
            title={liveEvent.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <EmptyState
          title={isKo ? '관련 미디어를 준비 중입니다' : 'Event media is coming soon'}
          description={isKo ? '사진과 영상을 정리해 곧 업데이트하겠습니다.' : 'Photos and video will be added when they are ready.'}
          href="/events"
          linkLabel={isKo ? '이벤트 목록으로' : 'Back to events'}
        />
      )}
    </article>
  );
};

EventDetail.meta = {
  title: 'Event',
  description: 'Event details from Sydney Samil Church.',
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: eventsData.map((event) => ({ params: { slug: event.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<EventDetailProps> = async ({ params }) => {
  const event = eventsData.find((item) => item.slug === params?.slug);
  return event ? { props: { event } } : { notFound: true };
};

export default EventDetail;
