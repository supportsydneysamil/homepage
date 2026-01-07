import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import eventsData from '../../content/events.json';

type Event = {
  slug: string;
  date: string;
  title: string;
  description: string;
  images: string[];
  youtubeUrl?: string;
};

type EventDetailProps = {
  event: Event;
};

const toEmbedUrl = (url?: string) => {
  if (!url) return '';
  return url.replace('watch?v=', 'embed/');
};

const EventDetail: NextPage<EventDetailProps> & { meta?: { title?: string; description?: string } } = ({ event }) => (
  <section>
    <h1>{event.title}</h1>
    <p className="muted">{new Date(event.date).toLocaleDateString()}</p>
    <p>{event.description}</p>

    {event.images.length > 0 && (
      <div className="gallery">
        {event.images.map((image) => (
          <div key={image} className="gallery__item">
            <img src={image} alt={event.title} />
          </div>
        ))}
      </div>
    )}

    {event.youtubeUrl && (
      <div className="video-wrapper">
        <iframe
          src={toEmbedUrl(event.youtubeUrl)}
          title={event.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )}
  </section>
);

EventDetail.meta = {
  title: 'Event Detail',
  description: 'Details for a church event.',
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = eventsData.map((event) => ({
    params: { slug: event.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<EventDetailProps> = async ({ params }) => {
  const slug = params?.slug;
  const event = eventsData.find((item) => item.slug === slug);

  if (!event) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      event,
    },
  };
};

export default EventDetail;
