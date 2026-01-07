import Link from 'next/link';
import type { GetStaticProps, NextPage } from 'next';
import eventsData from '../../content/events.json';

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

const EventsPage: NextPage<EventsPageProps> & { meta?: { title?: string; description?: string } } = ({ events }) => (
  <section className="section">
    <div className="section__header">
      <p className="pill">What&apos;s happening</p>
      <h1>Events</h1>
      <p className="muted">Gatherings that help you connect, grow, and serve together.</p>
    </div>
    <div className="card-grid">
      {events.map((event) => (
        <div key={event.slug} className="card">
          <div className="card__eyebrow">{new Date(event.date).toLocaleDateString()}</div>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <Link href={`/events/${event.slug}`} className="button text">
            View Details
          </Link>
        </div>
      ))}
    </div>
  </section>
);

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
