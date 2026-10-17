import test from 'node:test';
import assert from 'node:assert';
import type { WeeklyItem } from '../components/home/homeContent';
import type { ApiEvent, ApiResource, ApiSermon } from './contentApi';
import { DEFAULT_SECTION_AVAILABILITY } from './sectionAvailability';
import {
  filterWeeklyItemsByAvailability,
  weeklyItemsFromContent,
} from './weeklyHighlights';

const event = (overrides: Partial<ApiEvent>): ApiEvent => ({
  id: 'e1',
  slug: 'picnic',
  date: '2026-09-28',
  title: 'Church picnic',
  description: 'Bring a plate',
  location: 'Park',
  startTime: '11:00',
  youtubeUrl: '',
  registrationUrl: '',
  registrationLabel: '',
  registrationDeadline: '',
  published: true,
  images: [],
  ...overrides,
});

const sermon = (overrides: Partial<ApiSermon>): ApiSermon => ({
  id: 's1',
  date: '2026-09-21',
  title: 'Faith and Life',
  subtitle: 'John 1',
  speaker: 'Pastor',
  youtubeUrl: '',
  mediaUrl: '',
  mediaContentType: '',
  ...overrides,
});

const resource = (overrides: Partial<ApiResource>): ApiResource => ({
  id: 'r1',
  title: 'Weekly bulletin',
  fileName: 'bulletin.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1,
  category: 'bulletin',
  visibility: 'public',
  resourceDate: '2026-09-21',
  downloadUrl: '/api/files/download/r1',
  ...overrides,
});

test('builds weekly cards from upcoming events, recent sermons, and bulletins', () => {
  const items = weeklyItemsFromContent({
    events: [event({}), event({ id: 'e0', slug: 'old', date: '2026-09-01', published: true })],
    sermons: [sermon({})],
    resources: [resource({}), resource({ id: 'r2', category: 'forms', title: 'Form' })],
    today: '2026-09-23',
  });
  assert.deepStrictEqual(
    items.map((item) => item.type),
    ['event', 'sermon', 'bulletin']
  );
  assert.strictEqual(items[0].url, '/events/detail?slug=picnic');
  assert.strictEqual(items[0].expiresAt, '2026-09-28');
  assert.strictEqual(items[1].url, '/sermons');
  assert.strictEqual(items[2].url, '/resources');
  assert.ok(!items.some((item) => item.id === 'e0' || item.titleEn === 'Form'));
});

test('ignores unpublished events and expired sermons', () => {
  const items = weeklyItemsFromContent({
    events: [event({ published: false })],
    sermons: [sermon({ date: '2026-08-01' })],
    resources: [],
    today: '2026-09-23',
  });
  assert.deepStrictEqual(items, []);
});

test('filters weekly items by the section targeted by each URL', () => {
  const item = (
    id: string,
    type: WeeklyItem['type'],
    url: string
  ): WeeklyItem => ({
    id,
    type,
    titleEn: id,
    titleKo: id,
    summaryEn: id,
    summaryKo: id,
    date: '2026-09-23',
    url,
    expiresAt: '2026-09-30',
  });
  const items = [
    item('event', 'event', '/events/detail?slug=picnic'),
    item('sermon', 'sermon', '/sermons'),
    item('bulletin', 'bulletin', '/resources#bulletins'),
    item('external', 'sermon', 'https://example.com/watch'),
  ];

  assert.deepStrictEqual(
    filterWeeklyItemsByAvailability(
      items,
      {
        ...DEFAULT_SECTION_AVAILABILITY,
        events: false,
        resources: false,
      }
    )
      .map(({ id }) => id),
    ['sermon', 'external']
  );
});
