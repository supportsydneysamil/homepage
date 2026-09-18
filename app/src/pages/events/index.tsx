import Link from 'next/link';
import type { GetStaticProps, NextPage } from 'next';
import EmptyState from '../../components/EmptyState';
import PageHero from '../../components/PageHero';
import eventsData from '../../content/events.json';
import { useLanguage } from '../../lib/LanguageContext';
import { formatDisplayDate } from '../../lib/presentation';

type Event = {
  slug: string;
  date: string;
  title: string;
  description: string;
  images: string[];
  youtubeUrl?: string;
};

type EventsPageProps = { events: Event[] };

const EventsPage: NextPage<EventsPageProps> & {
  meta?: { title?: string; description?: string };
} = ({ events }) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

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

      {events.length ? (
        <section className="content-list">
          {events.map((event, index) => (
            <article className="content-row" key={event.slug}>
              <div className="content-row__index">0{index + 1}</div>
              <time dateTime={event.date}>{formatDisplayDate(event.date, lang)}</time>
              <div className="content-row__body">
                <h2>{event.title}</h2>
                <p>{event.description}</p>
              </div>
              <Link href={`/events/${event.slug}`} className="site-text-link">
                {isKo ? '자세히 보기' : 'View details'} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title={isKo ? '새로운 행사를 준비 중입니다' : 'New gatherings are on the way'}
          description={isKo ? '곧 새로운 소식으로 찾아뵙겠습니다.' : 'Please check back soon for updates.'}
        />
      )}
    </article>
  );
};

EventsPage.meta = {
  title: 'Events',
  description: 'Events and gatherings at Sydney Samil Church.',
};

export const getStaticProps: GetStaticProps<EventsPageProps> = async () => ({
  props: { events: eventsData },
});

export default EventsPage;
