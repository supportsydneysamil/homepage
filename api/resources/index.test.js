const test = require('node:test');
const assert = require('node:assert');
const { validateResourceInput, toResourceResponse } = require('./index');

test('accepts a registered upload', () => {
  const result = validateResourceInput({
    title: 'Weekly Bulletin',
    blobPath: 'resources/abc-bulletin.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2048,
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.title, 'Weekly Bulletin');
});

test('rejects a missing title', () => {
  assert.ok(validateResourceInput({ blobPath: 'resources/a.pdf', contentType: 'application/pdf', sizeBytes: 1 }).error);
});

test('rejects a blob path outside the resources folder', () => {
  assert.ok(
    validateResourceInput({ title: 'T', blobPath: 'events/a.pdf', contentType: 'application/pdf', sizeBytes: 1 }).error
  );
});

test('rejects a blob path containing traversal', () => {
  assert.ok(
    validateResourceInput({ title: 'T', blobPath: 'resources/../secret', contentType: 'application/pdf', sizeBytes: 1 })
      .error
  );
});

test('the response never exposes a storage url', () => {
  const response = toResourceResponse({
    Id: '11111111-1111-1111-1111-111111111111',
    Title: 'Weekly Bulletin',
    BlobPath: 'resources/abc-bulletin.pdf',
    ContentType: 'application/pdf',
    SizeBytes: 2048,
  });
  assert.strictEqual(response.downloadUrl, '/api/files/download/11111111-1111-1111-1111-111111111111');
  assert.strictEqual(response.blobPath, undefined);
  assert.ok(!JSON.stringify(response).includes('blob.core.windows.net'));
});
