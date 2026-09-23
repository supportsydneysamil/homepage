import type { ApiEvent, ApiResource, ApiSermon } from './contentApi';
import type { WeeklyItem } from '../components/home/homeContent';
import { eventDetailPath } from './events';

const addDays = (stamp: string, days: number) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stamp);
  if (!match) return stamp;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return date.toISOString().slice(0, 10);
};

const stillCurrent = (expiresAt: string, today: string) => expiresAt >= today;

export const weeklyItemsFromContent = ({
  events,
  sermons,
  resources,
  today,
}: {
  events: ApiEvent[];
  sermons: ApiSermon[];
  resources: ApiResource[];
  today: string;
}): WeeklyItem[] => {
  const upcomingEvent = events
    .filter((item) => item.published && item.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title))[0];

  const recentSermon = sermons
    .filter((item) => stillCurrent(addDays(item.date, 14), today))
    .sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title))[0];

  const bulletin = resources
    .filter((item) => item.category === 'bulletin')
    .filter((item) => stillCurrent(addDays(item.resourceDate || today, 7), today))
    .sort((left, right) =>
      String(right.resourceDate || '').localeCompare(String(left.resourceDate || ''))
    )[0];

  const items: WeeklyItem[] = [];
  if (upcomingEvent) {
    items.push({
      id: upcomingEvent.id,
      type: 'event',
      titleEn: upcomingEvent.title,
      titleKo: upcomingEvent.title,
      summaryEn: upcomingEvent.description || upcomingEvent.location,
      summaryKo: upcomingEvent.description || upcomingEvent.location,
      date: upcomingEvent.date,
      url: eventDetailPath(upcomingEvent.slug),
      expiresAt: upcomingEvent.date,
    });
  }
  if (recentSermon) {
    items.push({
      id: recentSermon.id,
      type: 'sermon',
      titleEn: recentSermon.title,
      titleKo: recentSermon.title,
      summaryEn: recentSermon.subtitle || recentSermon.speaker,
      summaryKo: recentSermon.subtitle || recentSermon.speaker,
      date: recentSermon.date,
      url: '/sermons',
      expiresAt: addDays(recentSermon.date, 14),
    });
  }
  if (bulletin) {
    items.push({
      id: bulletin.id,
      type: 'bulletin',
      titleEn: bulletin.title,
      titleKo: bulletin.title,
      summaryEn: bulletin.fileName,
      summaryKo: bulletin.fileName,
      date: bulletin.resourceDate || today,
      url: '/resources',
      expiresAt: addDays(bulletin.resourceDate || today, 7),
    });
  }
  return items;
};
