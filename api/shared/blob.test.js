const test = require('node:test');
const assert = require('node:assert');
const { validateUploadRequest, buildBlobPath, MAX_UPLOAD_BYTES } = require('./blob');

test('accepts a normal pdf bulletin', () => {
  const result = validateUploadRequest({
    folder: 'resources',
    fileName: 'bulletin.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1024,
  });
  assert.strictEqual(result.error, undefined);
  assert.ok(result.value.blobPath.startsWith('resources/'));
  assert.ok(result.value.blobPath.endsWith('.pdf'));
});

test('rejects an unknown folder', () => {
  assert.ok(
    validateUploadRequest({ folder: 'secrets', fileName: 'a.pdf', contentType: 'application/pdf', sizeBytes: 1 }).error
  );
});

test('rejects a disallowed content type', () => {
  assert.ok(
    validateUploadRequest({ folder: 'resources', fileName: 'a.exe', contentType: 'application/x-msdownload', sizeBytes: 1 })
      .error
  );
});

test('rejects a file above the size limit', () => {
  assert.ok(
    validateUploadRequest({
      folder: 'resources',
      fileName: 'a.pdf',
      contentType: 'application/pdf',
      sizeBytes: MAX_UPLOAD_BYTES + 1,
    }).error
  );
});

test('strips directory traversal from the file name', () => {
  const path = buildBlobPath('resources', '../../etc/passwd.pdf', 'abc123');
  assert.ok(!path.includes('..'));
  assert.strictEqual(path, 'resources/abc123-passwd.pdf');
});

test('gives two uploads of the same name distinct paths', () => {
  assert.notStrictEqual(
    buildBlobPath('resources', 'bulletin.pdf', 'id-one'),
    buildBlobPath('resources', 'bulletin.pdf', 'id-two')
  );
});

test('replaces unsafe characters in the file name', () => {
  assert.strictEqual(buildBlobPath('sermons', 'notes 2026?.pdf', 'x1'), 'sermons/x1-notes-2026-.pdf');
});
