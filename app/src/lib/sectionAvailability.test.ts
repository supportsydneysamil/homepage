import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUBLIC_SECTION_KEYS,
  PUBLIC_SECTION_NAV,
  DEFAULT_SECTION_AVAILABILITY,
  CLOSED_SECTION_AVAILABILITY,
  isPublicHrefEnabled,
  isSectionEnabled,
  parseSectionAvailability,
  sectionForPath,
  type PublicSection,
  type SectionAvailability,
} from './sectionAvailability';

const all = (value: boolean): SectionAvailability =>
  Object.fromEntries(
    PUBLIC_SECTION_KEYS.map((section) => [section, value])
  ) as SectionAvailability;

test('defines the public menu contract in display order', () => {
  assert.deepEqual(PUBLIC_SECTION_KEYS, [
    'about',
    'worship',
    'mokjang',
    'events',
    'sermons',
    'resources',
    'contact',
  ]);
  assert.deepEqual(DEFAULT_SECTION_AVAILABILITY, all(true));
  assert.deepEqual(CLOSED_SECTION_AVAILABILITY, all(false));
  assert.deepEqual(
    PUBLIC_SECTION_NAV.map(({ href, labelEn, labelKo }) => ({ href, labelEn, labelKo })),
    [
      { href: '/about', labelEn: 'About', labelKo: '소개' },
      { href: '/worship', labelEn: 'Worship', labelKo: '예배' },
      { href: '/mokjang', labelEn: 'House Church', labelKo: '목장' },
      { href: '/events', labelEn: 'Events', labelKo: '이벤트' },
      { href: '/sermons', labelEn: 'Sermons', labelKo: '설교' },
      { href: '/resources', labelEn: 'Resources', labelKo: '자료·신청' },
      { href: '/contact', labelEn: 'Contact', labelKo: '문의' },
    ]
  );
});

test('parsing defaults absent and missing keys to enabled', () => {
  assert.deepEqual(parseSectionAvailability(undefined), all(true));
  assert.deepEqual(parseSectionAvailability(null), all(true));
  assert.deepEqual(parseSectionAvailability({}), all(true));
  assert.deepEqual(
    parseSectionAvailability({ events: false, ignored: true }),
    { ...all(true), events: false }
  );
});

test('parsing fails closed when the supplied value is malformed', () => {
  for (const input of ['{"events":false}', [], 42, { events: 'false' }]) {
    assert.deepEqual(parseSectionAvailability(input), all(false));
  }
});

test('maps only controlled public paths to their sections', () => {
  const expected: Array<[string, PublicSection]> = [
    ['/about', 'about'],
    ['/worship', 'worship'],
    ['/mokjang', 'mokjang'],
    ['/mokjang/north', 'mokjang'],
    ['/events', 'events'],
    ['/events/community-day', 'events'],
    ['/sermons', 'sermons'],
    ['/resources', 'resources'],
    ['/contact', 'contact'],
  ];
  for (const [pathname, section] of expected) {
    assert.equal(sectionForPath(pathname), section);
  }
  for (const pathname of [
    '/',
    '/manage',
    '/manage/settings',
    '/profile',
    '/login',
    '/settings',
    '/about/history',
    '/unknown',
  ]) {
    assert.equal(sectionForPath(pathname), null);
  }
});

test('href checks ignore query and hash and leave uncontrolled links enabled', () => {
  const availability = { ...all(true), events: false };
  assert.equal(sectionForPath('/events/community-day?from=home#details'), 'events');
  assert.equal(isSectionEnabled(availability, 'events'), false);
  assert.equal(isSectionEnabled(availability, null), true);
  assert.equal(isPublicHrefEnabled('/events?year=2026#october', availability), false);
  assert.equal(isPublicHrefEnabled('/manage/events?year=2026', availability), true);
  assert.equal(isPublicHrefEnabled('https://example.com/events', availability), true);
});
