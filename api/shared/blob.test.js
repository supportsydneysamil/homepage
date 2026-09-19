const test = require('node:test');
const assert = require('node:assert');
const {
  validateUploadRequest,
  buildBlobPath,
  containerFor,
  isPublicFolder,
  publicUrlFor,
  isMediaUrl,
  MAX_UPLOAD_BYTES,
  MAX_MEDIA_BYTES,
} = require('./blob');

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

test('accepts a sermon recording up to the media limit', () => {
  const result = validateUploadRequest({
    folder: 'media',
    fileName: 'sermon20260816.mp3',
    contentType: 'audio/mpeg',
    sizeBytes: 55 * 1024 * 1024,
  });
  assert.strictEqual(result.error, undefined);
  assert.ok(result.value.blobPath.startsWith('media/'));
});

test('rejects a recording above the media limit', () => {
  assert.ok(
    validateUploadRequest({
      folder: 'media',
      fileName: 'a.mp3',
      contentType: 'audio/mpeg',
      sizeBytes: MAX_MEDIA_BYTES + 1,
    }).error
  );
});

test('the document limit still applies outside the media folder', () => {
  assert.ok(
    validateUploadRequest({
      folder: 'resources',
      fileName: 'a.pdf',
      contentType: 'application/pdf',
      sizeBytes: MAX_UPLOAD_BYTES + 1,
    }).error
  );
});

test('audio and video types are only allowed in the media folder', () => {
  assert.ok(
    validateUploadRequest({ folder: 'resources', fileName: 'a.mp3', contentType: 'audio/mpeg', sizeBytes: 10 }).error
  );
  assert.strictEqual(
    validateUploadRequest({ folder: 'media', fileName: 'a.mp4', contentType: 'video/mp4', sizeBytes: 10 }).error,
    undefined
  );
});

test('a pdf cannot be hidden in the public media folder', () => {
  assert.ok(
    validateUploadRequest({ folder: 'media', fileName: 'a.pdf', contentType: 'application/pdf', sizeBytes: 10 }).error
  );
});

test('media uses the public container and everything else the private one', () => {
  process.env.AZURE_STORAGE_CONTAINER = 'church-files';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  assert.strictEqual(containerFor('media'), 'samilmedia');
  assert.strictEqual(containerFor('resources'), 'church-files');
  assert.strictEqual(isPublicFolder('media'), true);
  assert.strictEqual(isPublicFolder('resources'), false);
});

test('builds a plain public url for media', () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'samilchurchstorage0';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  assert.strictEqual(
    publicUrlFor('media/abc-sermon.mp3'),
    'https://samilchurchstorage0.blob.core.windows.net/samilmedia/media/abc-sermon.mp3'
  );
});

test('recognises a url that belongs to the media container', () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'samilchurchstorage0';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  assert.strictEqual(
    isMediaUrl('https://samilchurchstorage0.blob.core.windows.net/samilmedia/media/a.mp3'),
    true
  );
});

test('rejects a url from another host or container', () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'samilchurchstorage0';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  assert.strictEqual(isMediaUrl('https://evil.test/samilmedia/media/a.mp3'), false);
  assert.strictEqual(
    isMediaUrl('https://samilchurchstorage0.blob.core.windows.net/church-files/resources/a.pdf'),
    false
  );
  assert.strictEqual(isMediaUrl(''), false);
});
