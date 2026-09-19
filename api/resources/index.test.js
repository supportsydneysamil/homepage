const test = require('node:test');
const assert = require('node:assert');
const { validateResourceInput, validateResourceUpdate, toResourceResponse } = require('./index');

test('defaults category and visibility when they are omitted', () => {
  const result = validateResourceInput({
    title: 'Weekly Bulletin',
    blobPath: 'resources/abc-bulletin.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2048,
  });
  assert.strictEqual(result.value.category, 'bulletin');
  assert.strictEqual(result.value.visibility, 'member');
  assert.strictEqual(result.value.resourceDate, null);
});

test('accepts a category, visibility, and date', () => {
  const result = validateResourceInput({
    title: '9월 소식지',
    blobPath: 'resources/abc-news.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2048,
    category: 'newsletter',
    visibility: 'public',
    resourceDate: '2026-09-01',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.category, 'newsletter');
  assert.strictEqual(result.value.visibility, 'public');
  assert.strictEqual(result.value.resourceDate, '2026-09-01');
});

test('an unknown visibility never becomes public', () => {
  const result = validateResourceInput({
    title: 'T',
    blobPath: 'resources/a.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1,
    visibility: 'everyone',
  });
  assert.strictEqual(result.value.visibility, 'member');
});

test('rejects a malformed resource date', () => {
  assert.ok(
    validateResourceInput({
      title: 'T',
      blobPath: 'resources/a.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1,
      resourceDate: '1 Sep 2026',
    }).error
  );
});

test('an update can move a file between categories and visibility levels', () => {
  const result = validateResourceUpdate({
    id: '11111111-1111-1111-1111-111111111111',
    title: '당회 회의록',
    category: 'minutes',
    visibility: 'admin',
    resourceDate: '2026-09-07',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.category, 'minutes');
  assert.strictEqual(result.value.visibility, 'admin');
});

test('the response carries category, visibility, and date', () => {
  const response = toResourceResponse({
    Id: '22222222-2222-2222-2222-222222222222',
    Title: '주보',
    ContentType: 'application/pdf',
    SizeBytes: 10,
    Category: 'bulletin',
    Visibility: 'public',
    ResourceDate: new Date('2026-09-06T00:00:00Z'),
  });
  assert.strictEqual(response.category, 'bulletin');
  assert.strictEqual(response.visibility, 'public');
  assert.strictEqual(response.resourceDate, '2026-09-06');
});

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

test('an update keeps the existing file when none is supplied', () => {
  const result = validateResourceUpdate({
    id: '11111111-1111-1111-1111-111111111111',
    title: 'T',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.blobPath, null);
});

test('an update may attach a newly uploaded file', () => {
  const result = validateResourceUpdate({
    id: '11111111-1111-1111-1111-111111111111',
    title: 'T',
    blobPath: 'resources/abc-주보.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2048,
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.blobPath, 'resources/abc-주보.pdf');
  assert.strictEqual(result.value.sizeBytes, 2048);
});

test('a replacement file must live in the resources folder', () => {
  assert.ok(
    validateResourceUpdate({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'T',
      blobPath: 'media/abc-sermon.mp3',
      contentType: 'audio/mpeg',
      sizeBytes: 10,
    }).error
  );
});

test('a replacement file cannot traverse out of the folder', () => {
  assert.ok(
    validateResourceUpdate({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'T',
      blobPath: 'resources/../secret.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
    }).error
  );
});

test('the response carries a readable file name without the storage path', () => {
  const response = toResourceResponse({
    Id: '33333333-3333-3333-3333-333333333333',
    Title: '주보',
    BlobPath: 'resources/1b4e28ba-2fa1-11d2-883f-0016d3cca427-bulletin.pdf',
    ContentType: 'application/pdf',
    SizeBytes: 10,
  });
  assert.strictEqual(response.fileName, 'bulletin.pdf');
  assert.strictEqual(response.blobPath, undefined);
  assert.ok(!JSON.stringify(response).includes('resources/'));
});

test('a file name survives when there is no generated prefix', () => {
  const response = toResourceResponse({
    Id: '44444444-4444-4444-4444-444444444444',
    Title: '주보',
    BlobPath: 'resources/bulletin20260906.pdf',
  });
  assert.strictEqual(response.fileName, 'bulletin20260906.pdf');
});

test('a missing blob path yields an empty file name', () => {
  assert.strictEqual(toResourceResponse({ Id: 'x', Title: 'T' }).fileName, '');
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
