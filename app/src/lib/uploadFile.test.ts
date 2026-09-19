import test from 'node:test';
import assert from 'node:assert';
import { validateFileForUpload, MAX_UPLOAD_BYTES, MAX_MEDIA_BYTES } from './uploadFile';

test('accepts a small pdf', () => {
  assert.strictEqual(validateFileForUpload({ size: 1024, type: 'application/pdf' }), null);
});

test('rejects a file over the limit', () => {
  assert.strictEqual(validateFileForUpload({ size: MAX_UPLOAD_BYTES + 1, type: 'application/pdf' }), 'tooLarge');
});

test('rejects an executable', () => {
  assert.strictEqual(validateFileForUpload({ size: 10, type: 'application/x-msdownload' }), 'badType');
});

test('rejects an empty file', () => {
  assert.strictEqual(validateFileForUpload({ size: 0, type: 'application/pdf' }), 'empty');
});

test('accepts a 55 MB sermon recording in the media folder', () => {
  assert.strictEqual(
    validateFileForUpload({ size: 55 * 1024 * 1024, type: 'audio/mpeg' }, 'media'),
    null
  );
});

test('rejects a recording over the media limit', () => {
  assert.strictEqual(
    validateFileForUpload({ size: MAX_MEDIA_BYTES + 1, type: 'audio/mpeg' }, 'media'),
    'tooLarge'
  );
});

test('rejects audio outside the media folder', () => {
  assert.strictEqual(validateFileForUpload({ size: 1024, type: 'audio/mpeg' }, 'resources'), 'badType');
});

test('rejects a document in the media folder', () => {
  assert.strictEqual(validateFileForUpload({ size: 1024, type: 'application/pdf' }, 'media'), 'badType');
});

test('the media limit is larger than the document limit', () => {
  assert.ok(MAX_MEDIA_BYTES > MAX_UPLOAD_BYTES);
});
