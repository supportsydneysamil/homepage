import assert from 'node:assert/strict';
import test from 'node:test';
import {
  eventDetailHref,
  eventDetailPath,
  eventImageIdFromUrl,
  slugFromTitle,
  splitUpcomingAndPast,
  visibleEventImages,
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

test('keeps only real image urls for galleries', () => {
  assert.deepEqual(
    visibleEventImages(['/api/files/download/a', '', 'https://example.com/x.jpg']),
    ['/api/files/download/a']
  );
});
