import type { ApiEvent, ApiSermon } from './contentApi';

export const MANAGE_PAGE_SIZE = 20;

export type EventStatus = 'upcoming' | 'past' | 'draft';

const matches = (haystack: string[], search: string) => {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((value) => value.toLowerCase().includes(needle));
};

const yearOf = (date: string) => date.slice(0, 4);

export const sermonYears = (sermons: ApiSermon[]) =>
  Array.from(new Set(sermons.map((sermon) => yearOf(sermon.date)).filter((year) => year.length === 4))).sort(
    (left, right) => right.localeCompare(left)
  );

export const filterSermons = (sermons: ApiSermon[], year: string, search: string) =>
  sermons.filter((sermon) => {
    if (year !== 'all' && yearOf(sermon.date) !== year) return false;
    return matches([sermon.title, sermon.subtitle, sermon.speaker], search);
  });

export type ManageView = { filter: string; search: string; page: number };

const pageOf = (index: number, perPage: number) => Math.floor(index / perPage) + 1;

// Editing can push a row out of the filter the editor was browsing, so work out
// the smallest change to the view that puts the saved row back on screen.
export const viewShowing = <T extends { id: string }>(
  id: string,
  all: T[],
  matched: T[],
  view: ManageView,
  perPage: number
): ManageView | null => {
  const withinFilter = matched.findIndex((item) => item.id === id);
  if (withinFilter >= 0) {
    const page = pageOf(withinFilter, perPage);
    return page === view.page ? null : { ...view, page };
  }

  const withinAll = all.findIndex((item) => item.id === id);
  if (withinAll < 0) return null;
  return { filter: 'all', search: '', page: pageOf(withinAll, perPage) };
};

export const eventStatusOf = (event: ApiEvent, today: string): EventStatus => {
  if (!event.published) return 'draft';
  return event.date >= today ? 'upcoming' : 'past';
};

export const filterEvents = (events: ApiEvent[], status: string, search: string, today: string) =>
  events.filter((event) => {
    if (status !== 'all' && eventStatusOf(event, today) !== status) return false;
    return matches([event.title, event.location], search);
  });
