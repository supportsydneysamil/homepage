const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');
const {
  guardPublicSection,
  sectionUnavailableResponse,
} = require('../shared/sectionAvailability');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');

const contextOf = () => ({ res: null, log: Object.assign(() => {}, { error: () => {} }) });

const requestFor = (roles) => ({
  params: { id: '11111111-1111-1111-1111-111111111111' },
  headers: roles
    ? { 'x-ms-client-principal': encode({ userId: 'u1', userDetails: 'a@church.org', userRoles: roles }) }
    : {},
});

const depsFor = (visibility) => ({
  lookupFile: async () => ({ blobPath: 'resources/a.pdf', visibility, section: 'resources' }),
  guardPublicSection: async () => null,
  createReadSas: async () => 'https://example.invalid/sas',
});

test('an anonymous visitor may download a public file', async () => {
  const context = contextOf();
  await handler(context, requestFor(null), depsFor('public'));
  assert.strictEqual(context.res.status, 302);
});

test('an anonymous visitor is refused a member file', async () => {
  const context = contextOf();
  await handler(context, requestFor(null), depsFor('member'));
  assert.strictEqual(context.res.status, 401);
});

test('a member may download a member file', async () => {
  const context = contextOf();
  await handler(context, requestFor(['authenticated', 'member']), depsFor('member'));
  assert.strictEqual(context.res.status, 302);
});

test('an editor is refused an admin file', async () => {
  const context = contextOf();
  await handler(context, requestFor(['member', 'editor']), depsFor('admin'));
  assert.strictEqual(context.res.status, 403);
});

test('an admin may download an admin file', async () => {
  const context = contextOf();
  await handler(context, requestFor(['member', 'editor', 'admin']), depsFor('admin'));
  assert.strictEqual(context.res.status, 302);
});

test('a missing file is a 404 regardless of role', async () => {
  const context = contextOf();
  let guardCalls = 0;
  await handler(context, requestFor(['member', 'editor', 'admin']), {
    lookupFile: async () => null,
    guardPublicSection: async () => {
      guardCalls += 1;
      return null;
    },
    createReadSas: async () => 'https://example.invalid/sas',
  });
  assert.strictEqual(context.res.status, 404);
  assert.strictEqual(guardCalls, 0);
});

test('a file with no recorded visibility is treated as member-only', async () => {
  const context = contextOf();
  await handler(context, requestFor(null), depsFor(null));
  assert.strictEqual(context.res.status, 401);
});

test('a refusal never reveals the storage location', async () => {
  const context = contextOf();
  await handler(context, requestFor(null), depsFor('admin'));
  assert.ok(!JSON.stringify(context.res).includes('resources/a.pdf'));
  assert.strictEqual(context.res.headers, undefined);
});

test('a resource download keeps the original file name on the signed url', async () => {
  const context = contextOf();
  const calls = [];
  await handler(context, requestFor(null), {
    lookupFile: async () => ({
      blobPath: 'resources/a.pdf',
      visibility: 'public',
      section: 'resources',
      contentDisposition: 'inline; filename="a.pdf"',
    }),
    guardPublicSection: async () => null,
    createReadSas: async (blobPath, options) => {
      calls.push([blobPath, options]);
      return 'https://example.invalid/sas';
    },
  });
  assert.strictEqual(context.res.status, 302);
  assert.deepStrictEqual(calls, [['resources/a.pdf', { contentDisposition: 'inline; filename="a.pdf"' }]]);
});

test('an event photo is signed without a download name', async () => {
  const context = contextOf();
  const calls = [];
  await handler(context, requestFor(null), {
    lookupFile: async () => ({ blobPath: 'events/a.jpg', visibility: 'public', section: 'events' }),
    guardPublicSection: async () => null,
    createReadSas: async (blobPath, options) => {
      calls.push([blobPath, options]);
      return 'https://example.invalid/sas';
    },
  });
  assert.deepStrictEqual(calls, [['events/a.jpg', undefined]]);
});

test('every file source is mapped to its public section', () => {
  const { FILE_LOOKUP_SQL } = require('./index');
  const arms = FILE_LOOKUP_SQL.split(/\bUNION ALL\b/);
  for (const [table, section] of [
    ['Resources', 'resources'],
    ['SermonFiles', 'sermons'],
    ['EventImages', 'events'],
    ['MokjangImages', 'mokjang'],
  ]) {
    const arm = arms.find((candidate) => candidate.includes(`dbo.${table}`));
    assert.ok(arm, `missing lookup for dbo.${table}`);
    assert.match(arm, new RegExp(`'${section}' AS Section`));
  }
});

test('a disabled file section returns the shared 404 before visibility or SAS issuance', async () => {
  const order = [];
  const context = contextOf();
  const unavailable = sectionUnavailableResponse();
  await handler(context, requestFor(null), {
    lookupFile: async () => {
      order.push('lookup');
      return {
        blobPath: 'events/private.jpg',
        visibility: 'admin',
        section: 'events',
      };
    },
    guardPublicSection: async (req, section, options) => {
      order.push(`guard:${section}`);
      return guardPublicSection(req, section, {
        ...options,
        readAvailability: async () => ({
          value: { events: false },
          malformed: false,
        }),
      });
    },
    createReadSas: async () => {
      order.push('sas');
      return 'https://example.invalid/sas';
    },
  });

  assert.deepStrictEqual(order, ['lookup', 'guard:events']);
  assert.deepStrictEqual(context.res, unavailable);
});

test('management section bypass still obeys each file visibility rule', async () => {
  for (const [roles, expectedStatus, expectedSasCalls] of [
    [['member', 'editor'], 403, 0],
    [['member', 'editor', 'admin'], 302, 1],
  ]) {
    let guardCalls = 0;
    let sasCalls = 0;
    const context = contextOf();
    await handler(context, requestFor(roles), {
      lookupFile: async () => ({
        blobPath: 'resources/admin.pdf',
        visibility: 'admin',
        section: 'resources',
      }),
      guardPublicSection: async (req, section, options) => {
        guardCalls += 1;
        return guardPublicSection(req, section, {
          ...options,
          readAvailability: async () => {
            throw new Error('management bypass must not read availability');
          },
        });
      },
      createReadSas: async () => {
        sasCalls += 1;
        return 'https://example.invalid/sas';
      },
    });

    assert.strictEqual(guardCalls, 1);
    assert.strictEqual(context.res.status, expectedStatus);
    assert.strictEqual(sasCalls, expectedSasCalls);
  }
});

test('a file availability lookup failure uses the existing safe 500 and creates no SAS', async () => {
  let sasCalls = 0;
  const context = contextOf();
  await handler(context, requestFor(null), {
    lookupFile: async () => ({
      blobPath: 'resources/a.pdf',
      visibility: 'public',
      section: 'resources',
    }),
    guardPublicSection: async () => {
      throw new Error('settings unavailable');
    },
    createReadSas: async () => {
      sasCalls += 1;
      return 'https://example.invalid/sas';
    },
  });

  assert.deepStrictEqual(context.res, {
    status: 500,
    body: { error: 'Unable to prepare the download.' },
  });
  assert.strictEqual(sasCalls, 0);
});
