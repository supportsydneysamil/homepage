const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');

const contextOf = () => ({ res: null, log: Object.assign(() => {}, { error: () => {} }) });

const requestFor = (roles, id = '11111111-1111-1111-1111-111111111111') => ({
  method: 'DELETE',
  query: { id },
  headers: roles
    ? { 'x-ms-client-principal': encode({ userId: 'u1', userDetails: 'e@church.org', userRoles: roles }) }
    : {},
});

const depsFor = (blobPath) => {
  const removed = [];
  return {
    removed,
    deleteEventImage: async () => (blobPath ? { blobPath } : null),
    deleteBlob: async (path, folder) => removed.push([path, folder]),
  };
};

test('an editor removes an event photo and its stored file', async () => {
  const context = contextOf();
  const deps = depsFor('events/photo.jpg');
  await handler(context, requestFor(['editor', 'member']), deps);
  assert.strictEqual(context.res.status, 204);
  assert.deepStrictEqual(deps.removed, [['events/photo.jpg', 'events']]);
});

test('a member cannot remove an event photo', async () => {
  const context = contextOf();
  const deps = depsFor('events/photo.jpg');
  await handler(context, requestFor(['member']), deps);
  assert.strictEqual(context.res.status, 403);
  assert.deepStrictEqual(deps.removed, []);
});

test('an anonymous visitor cannot remove an event photo', async () => {
  const context = contextOf();
  const deps = depsFor('events/photo.jpg');
  await handler(context, requestFor(null), deps);
  assert.strictEqual(context.res.status, 401);
  assert.deepStrictEqual(deps.removed, []);
});

test('a missing photo id is a bad request', async () => {
  const context = contextOf();
  await handler(context, requestFor(['editor'], ''), depsFor('events/photo.jpg'));
  assert.strictEqual(context.res.status, 400);
});

test('an unknown photo is a 404 and deletes nothing', async () => {
  const context = contextOf();
  const deps = depsFor(null);
  await handler(context, requestFor(['editor']), deps);
  assert.strictEqual(context.res.status, 404);
  assert.deepStrictEqual(deps.removed, []);
});

test('only DELETE is allowed', async () => {
  const context = contextOf();
  const request = requestFor(['editor']);
  request.method = 'GET';
  await handler(context, request, depsFor('events/photo.jpg'));
  assert.strictEqual(context.res.status, 405);
});
