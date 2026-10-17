const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PUBLIC_SECTION_KEYS,
  DEFAULT_SECTION_AVAILABILITY,
  CLOSED_SECTION_AVAILABILITY,
  normalizeSectionAvailability,
  parseStoredSectionAvailability,
  validateSectionAvailabilityInput,
} = require('./sectionAvailability');

const all = (value) =>
  Object.fromEntries(PUBLIC_SECTION_KEYS.map((section) => [section, value]));

test('defines exactly the seven controlled public sections', () => {
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
});

test('normalization defaults null, absent, and missing keys to enabled', () => {
  assert.deepEqual(normalizeSectionAvailability(), all(true));
  assert.deepEqual(normalizeSectionAvailability(null), all(true));
  assert.deepEqual(normalizeSectionAvailability({}), all(true));
  assert.deepEqual(
    normalizeSectionAvailability({ events: false, ignored: true }),
    { ...all(true), events: false }
  );
});

test('normalization fails closed for malformed values', () => {
  for (const input of ['{bad json', [], 42, { events: 'false' }]) {
    assert.deepEqual(normalizeSectionAvailability(input), all(false));
  }
});

test('stored JSON reports corruption separately from migration defaults', () => {
  assert.deepEqual(parseStoredSectionAvailability(null), {
    value: all(true),
    malformed: false,
  });
  assert.deepEqual(parseStoredSectionAvailability('{"events":false,"extra":true}'), {
    value: { ...all(true), events: false },
    malformed: false,
  });
  assert.deepEqual(parseStoredSectionAvailability('{bad json'), {
    value: all(false),
    malformed: true,
  });
  assert.deepEqual(parseStoredSectionAvailability('[]'), {
    value: all(false),
    malformed: true,
  });
  assert.deepEqual(parseStoredSectionAvailability('{"events":"false"}'), {
    value: all(false),
    malformed: true,
  });
});

test('PUT validation distinguishes omission, valid input, and invalid known values', () => {
  assert.deepEqual(validateSectionAvailabilityInput(undefined), { omitted: true });
  assert.deepEqual(validateSectionAvailabilityInput({ events: false, ignored: false }), {
    value: { ...all(true), events: false },
  });
  assert.deepEqual(validateSectionAvailabilityInput({ events: 'false' }), {
    error: 'sectionAvailability.events must be a boolean.',
  });
  assert.deepEqual(validateSectionAvailabilityInput([]), {
    error: 'sectionAvailability must be an object.',
  });
});
