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
  <section>
    <h1>Events</h1>
    <div className="card-grid">
      {events.map((event) => (
        <div key={event.slug} className="card">
          <h3>{event.title}</h3>
          <p className="muted">{new Date(event.date).toLocaleDateString()}</p>
          <p>{event.description}</p>
          <Link href={`/events/${event.slug}`} className="button secondary">
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
