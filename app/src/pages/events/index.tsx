import Link from 'next/link';
import type { GetStaticProps, NextPage } from 'next';
import eventsData from '../../content/events.json';
import { useLanguage } from '../../lib/LanguageContext';

type Event = {
  slug: string;
  date: string;
  title: string;
  description: string;
  images: string[];
  youtubeUrl?: string;
};

type EventsPageProps = {
  events: Event[];
};

const EventsPage: NextPage<EventsPageProps> & { meta?: { title?: string; description?: string } } = ({ events }) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <section className="section">
      <div className="section__header">
        <p className="pill">{isKo ? '다가오는 일정' : "What's happening"}</p>
        <h1>{isKo ? '이벤트' : 'Events'}</h1>
        <p className="muted">
          {isKo ? '함께 연결되고 성장하며 섬길 수 있는 모든 모임.' : 'Gatherings that help you connect, grow, and serve together.'}
        </p>
      </div>
      <div className="card-grid">
        {events.map((event) => (
          <div key={event.slug} className="card">
            <div className="card__eyebrow">{new Date(event.date).toLocaleDateString()}</div>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <Link href={`/events/${event.slug}`} className="button text">
              {isKo ? '자세히 보기' : 'View Details'}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

EventsPage.meta = {
  title: 'Events',
  description: 'Upcoming events at Community Church.',
};

export const getStaticProps: GetStaticProps<EventsPageProps> = async () => {
  return {
    props: {
      events: eventsData,
    },
  };
};

export default EventsPage;
