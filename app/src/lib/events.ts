import { formatDisplayDate, isPlaceholderUrl, type DisplayLanguage } from './presentation';

export type DatedEvent = {
  slug: string;
  date: string;
  title: string;
};

export const eventDetailHref = (slug: string) => ({
  pathname: '/events/detail',
  query: { slug },
});

export const eventDetailPath = (slug: string) =>
  `/events/detail?slug=${encodeURIComponent(slug)}`;

export const slugFromTitle = (title: string, date: string) => {
  const fromTitle = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (fromTitle) return fromTitle;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : 'draft';
  return `event-${day}`;
};

export const splitUpcomingAndPast = <T extends DatedEvent>(items: T[], today: string) => {
  const upcoming = items
    .filter((item) => item.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title));
  const past = items
    .filter((item) => item.date < today)
    .sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title));
  return { upcoming, past };
};

export const todayStamp = (now = new Date()) => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatEventWhen = (date: string, startTime: string | undefined, lang: DisplayLanguage) => {
  const day = formatDisplayDate(date, lang);
  const time = String(startTime || '').trim();
  return time ? `${day} · ${time}` : day;
};

const DOWNLOAD_PREFIX = '/api/files/download/';

export const eventImageIdFromUrl = (url: string) =>
  url.startsWith(DOWNLOAD_PREFIX) ? url.slice(DOWNLOAD_PREFIX.length) : '';

export const visibleEventImages = (images: string[] | undefined) =>
  (images ?? []).filter((image) => {
    if (!image) return false;
    if (image.startsWith('/api/files/download/')) return true;
    return !isPlaceholderUrl(image);
  });
