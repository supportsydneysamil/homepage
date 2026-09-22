import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PAST_EVENT_PAGE_SIZE,
  eventDetailHref,
  eventDetailPath,
  eventGallerySwipeDelta,
  eventImageIdFromUrl,
  eventImageIdsFromUrls,
  slugFromTitle,
  splitUpcomingAndPast,
  stepEventGalleryIndex,
  takePage,
  visibleEventImages,
  withoutPendingImages,
} from './events';

test('builds a static-export safe detail path from a slug', () => {
  assert.equal(eventDetailPath('youth-retreat-2025'), '/events/detail?slug=youth-retreat-2025');
});

test('encodes a slug in the detail href query', () => {
  assert.deepEqual(eventDetailHref('christmas-service-2025'), {
    pathname: '/events/detail',
    query: { slug: 'christmas-service-2025' },
  });
});

test('splits upcoming and past events on the given calendar day', () => {
  const { upcoming, past } = splitUpcomingAndPast(
    [
      { slug: 'past', date: '2026-09-18', title: 'Yesterday' },
      { slug: 'today', date: '2026-09-19', title: 'Today' },
      { slug: 'later', date: '2026-12-25', title: 'Christmas' },
    ],
    '2026-09-19'
  );
  assert.deepEqual(
    upcoming.map((item) => item.slug),
    ['today', 'later']
  );
  assert.deepEqual(
    past.map((item) => item.slug),
    ['past']
  );
});

test('orders upcoming soonest first and past newest first', () => {
  const { upcoming, past } = splitUpcomingAndPast(
    [
      { slug: 'dec', date: '2026-12-01', title: 'D' },
      { slug: 'oct', date: '2026-10-01', title: 'O' },
      { slug: 'aug', date: '2026-08-01', title: 'A' },
      { slug: 'jul', date: '2026-07-01', title: 'J' },
    ],
    '2026-09-19'
  );
  assert.deepEqual(
    upcoming.map((item) => item.slug),
    ['oct', 'dec']
  );
  assert.deepEqual(
    past.map((item) => item.slug),
    ['aug', 'jul']
  );
});

test('suggests a latin slug from a title', () => {
  assert.equal(slugFromTitle('Youth Summer Retreat', '2025-08-15'), 'youth-summer-retreat');
});

test('falls back to a dated slug when the title has no latin letters', () => {
  assert.equal(slugFromTitle('청년 수련회', '2025-08-15'), 'event-2025-08-15');
});

test('reads the photo id back out of a download url', () => {
  assert.equal(eventImageIdFromUrl('/api/files/download/img-1'), 'img-1');
});

test('has no photo id for anything but a download url', () => {
  assert.equal(eventImageIdFromUrl('https://example.com/a.jpg'), '');
  assert.equal(eventImageIdFromUrl(''), '');
});

test('the past-events page is small enough to scan', () => {
  assert.equal(PAST_EVENT_PAGE_SIZE, 8);
});

test('takes the first page and reports how many are left', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.deepEqual(takePage(items, 8), { items: [1, 2, 3, 4, 5, 6, 7, 8], remaining: 2 });
});

test('a short list needs no second page', () => {
  assert.deepEqual(takePage(['a', 'b'], 8), { items: ['a', 'b'], remaining: 0 });
});

test('hides photos staged for removal until save', () => {
  const images = ['/api/files/download/a', '/api/files/download/b', '/api/files/download/c'];
  assert.deepEqual(withoutPendingImages(images, ['/api/files/download/b']), [
    '/api/files/download/a',
    '/api/files/download/c',
  ]);
});

test('keeps the original gallery when nothing is staged for removal', () => {
  const images = ['/api/files/download/a'];
  assert.deepEqual(withoutPendingImages(images, []), images);
  assert.deepEqual(withoutPendingImages(undefined, ['/api/files/download/a']), []);
});

test('reads ids for every staged photo url', () => {
  assert.deepEqual(
    eventImageIdsFromUrls(['/api/files/download/a', 'https://example.com/x.jpg', '/api/files/download/b']),
    ['a', 'b']
  );
});

test('keeps only real image urls for galleries', () => {
  assert.deepEqual(
    visibleEventImages(['/api/files/download/a', '', 'https://example.com/x.jpg']),
    ['/api/files/download/a']
  );
});

test('steps an event gallery index and stops at the ends', () => {
  assert.equal(stepEventGalleryIndex(1, 1, 3), 2);
  assert.equal(stepEventGalleryIndex(1, -1, 3), 0);
  assert.equal(stepEventGalleryIndex(0, -1, 3), 0);
  assert.equal(stepEventGalleryIndex(2, 1, 3), 2);
  assert.equal(stepEventGalleryIndex(0, 1, 1), 0);
  assert.equal(stepEventGalleryIndex(0, -1, 1), 0);
  assert.equal(stepEventGalleryIndex(4, 1, 0), 0);
});

test('reads a horizontal swipe as a gallery step', () => {
  assert.equal(eventGallerySwipeDelta(-50, 5), 1);
  assert.equal(eventGallerySwipeDelta(50, 5), -1);
  assert.equal(eventGallerySwipeDelta(-20, 0), 0);
  assert.equal(eventGallerySwipeDelta(-80, 90), 0);
});
