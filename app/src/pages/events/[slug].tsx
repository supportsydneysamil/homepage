import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import eventsData from '../../content/events.json';
import { eventDetailHref } from '../../lib/events';

type EventRedirectProps = { slug: string };

const EventSlugRedirect: NextPage<EventRedirectProps> = ({ slug }) => {
  const router = useRouter();
  useEffect(() => {
    void router.replace(eventDetailHref(slug));
  }, [router, slug]);
  return <p className="account-state">Loading...</p>;
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: eventsData.map((event) => ({ params: { slug: event.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<EventRedirectProps> = async ({ params }) => {
  const event = eventsData.find((item) => item.slug === params?.slug);
  return event ? { props: { slug: event.slug } } : { notFound: true };
};

export default EventSlugRedirect;
