import test from 'node:test';
import assert from 'node:assert';
import {
  MANAGE_PAGE_SIZE,
  eventStatusOf,
  filterEvents,
  filterSermons,
  sermonYears,
} from './manageList';
import type { ApiEvent, ApiSermon } from './contentApi';

const sermon = (values: Partial<ApiSermon>): ApiSermon => ({
  id: '1',
  date: '2026-01-04',
  title: 'Title',
  speaker: '',
  youtubeUrl: '',
  mediaUrl: '',
  mediaContentType: '',
  ...values,
});

const event = (values: Partial<ApiEvent>): ApiEvent => ({
  id: '1',
  slug: 'a',
  date: '2026-01-01',
  title: 'Title',
  description: '',
  location: '',
  startTime: '',
  youtubeUrl: '',
  published: true,
  images: [],
  ...values,
});

test('a console page holds twenty rows', () => {
  assert.strictEqual(MANAGE_PAGE_SIZE, 20);
});

test('lists the years that have sermons, newest first', () => {
  const years = sermonYears([
    sermon({ id: '1', date: '2024-05-05' }),
    sermon({ id: '2', date: '2026-01-04' }),
    sermon({ id: '3', date: '2026-09-13' }),
  ]);
  assert.deepStrictEqual(years, ['2026', '2024']);
});

test('skips a sermon with no usable date', () => {
  assert.deepStrictEqual(sermonYears([sermon({ date: '' })]), []);
});

test('keeps only the chosen year', () => {
  const sermons = [sermon({ id: '1', date: '2026-01-04' }), sermon({ id: '2', date: '2024-05-05' })];
  assert.deepStrictEqual(
    filterSermons(sermons, '2024', '').map((item) => item.id),
    ['2']
  );
});

test('every year is kept when none is chosen', () => {
  const sermons = [sermon({ id: '1', date: '2026-01-04' }), sermon({ id: '2', date: '2024-05-05' })];
  assert.strictEqual(filterSermons(sermons, 'all', '').length, 2);
});

test('searches a sermon by title or speaker without case sensitivity', () => {
  const sermons = [
    sermon({ id: '1', title: 'Living Hope', speaker: 'Pastor Kim' }),
    sermon({ id: '2', title: '소망', speaker: '이 목사' }),
  ];
  assert.deepStrictEqual(
    filterSermons(sermons, 'all', 'living').map((item) => item.id),
    ['1']
  );
  assert.deepStrictEqual(
    filterSermons(sermons, 'all', '이 목사').map((item) => item.id),
    ['2']
  );
});

test('combines the year and the search', () => {
  const sermons = [
    sermon({ id: '1', date: '2026-01-04', title: 'Hope' }),
    sermon({ id: '2', date: '2024-05-05', title: 'Hope' }),
  ];
  assert.deepStrictEqual(
    filterSermons(sermons, '2026', 'hope').map((item) => item.id),
    ['1']
  );
});

test('an event is upcoming on its own day and past the day after', () => {
  assert.strictEqual(eventStatusOf(event({ date: '2026-09-19' }), '2026-09-19'), 'upcoming');
  assert.strictEqual(eventStatusOf(event({ date: '2026-09-18' }), '2026-09-19'), 'past');
});

test('an unpublished event is a draft whatever its date', () => {
  assert.strictEqual(eventStatusOf(event({ date: '2026-12-25', published: false }), '2026-09-19'), 'draft');
});

test('filters events by status', () => {
  const events = [
    event({ id: 'soon', date: '2026-12-25' }),
    event({ id: 'done', date: '2026-01-01' }),
    event({ id: 'draft', date: '2026-12-31', published: false }),
  ];
  assert.deepStrictEqual(
    filterEvents(events, 'upcoming', '', '2026-09-19').map((item) => item.id),
    ['soon']
  );
  assert.deepStrictEqual(
    filterEvents(events, 'past', '', '2026-09-19').map((item) => item.id),
    ['done']
  );
  assert.deepStrictEqual(
    filterEvents(events, 'draft', '', '2026-09-19').map((item) => item.id),
    ['draft']
  );
  assert.strictEqual(filterEvents(events, 'all', '', '2026-09-19').length, 3);
});

test('searches an event by title', () => {
  const events = [event({ id: '1', title: 'Youth Retreat' }), event({ id: '2', title: '성탄 예배' })];
  assert.deepStrictEqual(
    filterEvents(events, 'all', 'retreat', '2026-09-19').map((item) => item.id),
    ['1']
  );
});
