const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PUBLIC_SECTION_KEYS,
  DEFAULT_SECTION_AVAILABILITY,
  CLOSED_SECTION_AVAILABILITY,
  normalizeSectionAvailability,
  parseStoredSectionAvailability,
  validateSectionAvailabilityInput,
  readCurrentSectionAvailability,
  isManagementRequest,
  sectionUnavailableResponse,
  guardPublicSection,
} = require('./sectionAvailability');

const all = (value) =>
  Object.fromEntries(PUBLIC_SECTION_KEYS.map((section) => [section, value]));

const encode = (roles) =>
  Buffer.from(
    JSON.stringify({
      userId: 'u1',
      userDetails: 'person@church.org',
      userRoles: roles,
    }),
    'utf8'
  ).toString('base64');

const requestFor = (roles) => ({
  headers: roles ? { 'x-ms-client-principal': encode(roles) } : {},
});

const callGuard = (...args) => {
  assert.equal(typeof guardPublicSection, 'function');
  return guardPublicSection(...args);
};

const readerDeps = (recordset) => {
  const calls = [];
  return {
    calls,
    getPool: async () => ({
      request: () => ({
        input(name, type, value) {
          calls.push({ name, type, value });
          return this;
        },
        query: async (query) => {
          calls.push({ query });
          return { recordset };
        },
      }),
    }),
    withSchema: async (run) => run(),
  };
};

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

test('the database reader normalizes missing, valid, and malformed stored settings', async () => {
  assert.equal(typeof readCurrentSectionAvailability, 'function');

  const missing = readerDeps([]);
  assert.deepEqual(await readCurrentSectionAvailability(missing), {
    value: all(true),
    malformed: false,
  });

  const valid = readerDeps([{ SectionAvailabilityJson: '{"events":false}' }]);
  assert.deepEqual(await readCurrentSectionAvailability(valid), {
    value: { ...all(true), events: false },
    malformed: false,
  });

  const malformed = readerDeps([{ SectionAvailabilityJson: '{bad json' }]);
  assert.deepEqual(await readCurrentSectionAvailability(malformed), {
    value: all(false),
    malformed: true,
  });
  assert.match(valid.calls.find((call) => call.query).query, /SettingKey = @settingKey/);
});

test('only explicit editor and admin roles count as management access', () => {
  assert.equal(typeof isManagementRequest, 'function');
  assert.equal(isManagementRequest(requestFor(null)), false);
  assert.equal(isManagementRequest(requestFor(['authenticated'])), false);
  assert.equal(isManagementRequest(requestFor(['member'])), false);
  assert.equal(isManagementRequest(requestFor(['editor'])), true);
  assert.equal(isManagementRequest(requestFor(['admin'])), true);
});

test('an enabled section is allowed and reads the current setting for every request', async () => {
  let reads = 0;
  const options = {
    readAvailability: async () => {
      reads += 1;
      return { value: all(true), malformed: false };
    },
  };
  assert.equal(await callGuard(requestFor(null), 'events', options), null);
  assert.equal(await callGuard(requestFor(null), 'events', options), null);
  assert.equal(reads, 2);
});

test('a disabled section blocks anonymous, signed-in, and member requests', async () => {
  assert.equal(typeof sectionUnavailableResponse, 'function');
  const expected = sectionUnavailableResponse();
  assert.equal(expected.status, 404);
  assert.equal(expected.headers['Cache-Control'], 'no-store');
  assert.equal(expected.body.code, 'SECTION_UNAVAILABLE');
  assert.ok(expected.body.error);
  assert.ok(expected.body.errorKo);

  for (const roles of [null, ['authenticated'], ['authenticated', 'member']]) {
    assert.deepEqual(
      await callGuard(requestFor(roles), 'events', {
        readAvailability: async () => ({
          value: { ...all(true), events: false },
          malformed: false,
        }),
      }),
      expected
    );
  }
});

test('editors and admins bypass a disabled section without reading settings', async () => {
  for (const roles of [['editor'], ['admin']]) {
    let reads = 0;
    assert.equal(
      await callGuard(requestFor(roles), 'events', {
        readAvailability: async () => {
          reads += 1;
          return { value: all(false), malformed: false };
        },
      }),
      null
    );
    assert.equal(reads, 0);
  }
});

test('malformed stored availability logs briefly and fails closed', async () => {
  const errors = [];
  const response = await callGuard(requestFor(null), 'events', {
    readAvailability: async () => ({
      value: all(false),
      malformed: true,
    }),
    logger: { error: (...args) => errors.push(args) },
  });
  assert.equal(response.status, 404);
  assert.equal(response.body.code, 'SECTION_UNAVAILABLE');
  assert.equal(errors.length, 1);
  assert.match(String(errors[0][0]), /malformed SectionAvailabilityJson/);
});

test('availability reader failures propagate to the handler error path', async () => {
  const failure = new Error('settings unavailable');
  await assert.rejects(
    callGuard(requestFor(null), 'events', {
      readAvailability: async () => {
        throw failure;
      },
    }),
    failure
  );
});
