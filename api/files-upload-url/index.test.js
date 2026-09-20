const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');
const contextOf = () => ({ res: null, log: Object.assign(() => {}, { error: () => {} }) });
const requestFor = (roles, folder) => ({
  method: 'POST',
  headers: roles
    ? { 'x-ms-client-principal': encode({ userId: 'u1', userDetails: 'e@church.org', userRoles: roles }) }
    : {},
  body: { folder, fileName: 'church.jpg', contentType: 'image/jpeg', sizeBytes: 100 },
});

test('an admin can request a site upload url', async () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'samilchurchstorage0';
  const context = contextOf();
  await handler(context, requestFor(['admin', 'editor', 'member'], 'site'), {
    createUploadSas: async () => 'https://example.test/upload',
  });
  assert.strictEqual(context.res.status, 200);
  assert.ok(context.res.body.blobPath.startsWith('site/'));
  assert.ok(context.res.body.publicUrl);
});

test('an editor cannot request a site upload url', async () => {
  const context = contextOf();
  await handler(context, requestFor(['editor', 'member'], 'site'), {
    createUploadSas: async () => 'https://example.test/upload',
  });
  assert.strictEqual(context.res.status, 403);
});

test('an editor can still request an events upload url', async () => {
  const context = contextOf();
  await handler(context, requestFor(['editor', 'member'], 'events'), {
    createUploadSas: async () => 'https://example.test/upload',
  });
  assert.strictEqual(context.res.status, 200);
});
