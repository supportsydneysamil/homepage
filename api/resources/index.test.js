const test = require('node:test');
const assert = require('node:assert');
const { validateResourceInput, validateResourceUpdate, toResourceResponse } = require('./index');

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

test('accepts a title-only update', () => {
  const result = validateResourceUpdate({
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Bulletin, week 2',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.title, 'Bulletin, week 2');
});

test('rejects an update without an id', () => {
  assert.ok(validateResourceUpdate({ title: 'T' }).error);
});

test('rejects an update without a title', () => {
  assert.ok(validateResourceUpdate({ id: '11111111-1111-1111-1111-111111111111' }).error);
});

test('an update cannot repoint the stored file', () => {
  const result = validateResourceUpdate({
    id: '11111111-1111-1111-1111-111111111111',
    title: 'T',
    blobPath: 'resources/someone-elses.pdf',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.blobPath, undefined);
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
