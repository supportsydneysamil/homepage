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

export const PAST_EVENT_PAGE_SIZE = 8;

export const takePage = <T>(items: T[], visibleCount: number) => ({
  items: items.slice(0, visibleCount),
  remaining: Math.max(0, items.length - visibleCount),
});

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

export const eventImageIdsFromUrls = (urls: readonly string[]) =>
  urls.map(eventImageIdFromUrl).filter(Boolean);

export const withoutPendingImages = (images: string[] | undefined, pendingRemoved: readonly string[]) => {
  if (!pendingRemoved.length) return images ?? [];
  const removed = new Set(pendingRemoved);
  return (images ?? []).filter((image) => !removed.has(image));
};

export const visibleEventImages = (images: string[] | undefined) =>
  (images ?? []).filter((image) => {
    if (!image) return false;
    if (image.startsWith('/api/files/download/')) return true;
    return !isPlaceholderUrl(image);
  });

export const stepEventGalleryIndex = (index: number, delta: number, length: number) => {
  if (length <= 0) return 0;
  const next = index + delta;
  if (next < 0) return 0;
  if (next >= length) return length - 1;
  return next;
};

export const eventGallerySwipeDelta = (dx: number, dy: number, threshold = 40) => {
  if (Math.abs(dx) < threshold) return 0;
  if (Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
};
