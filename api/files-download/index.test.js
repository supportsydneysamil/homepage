const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');

const contextOf = () => ({ res: null, log: Object.assign(() => {}, { error: () => {} }) });

const requestFor = (roles) => ({
  params: { id: '11111111-1111-1111-1111-111111111111' },
  headers: roles
    ? { 'x-ms-client-principal': encode({ userId: 'u1', userDetails: 'a@church.org', userRoles: roles }) }
    : {},
});

const depsFor = (visibility) => ({
  lookupFile: async () => ({ blobPath: 'resources/a.pdf', visibility }),
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
  await handler(context, requestFor(['member', 'editor', 'admin']), {
    lookupFile: async () => null,
    createReadSas: async () => 'https://example.invalid/sas',
  });
  assert.strictEqual(context.res.status, 404);
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
