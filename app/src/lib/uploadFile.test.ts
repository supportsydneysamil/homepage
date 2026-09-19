import test from 'node:test';
import assert from 'node:assert';
import { validateFileForUpload, MAX_UPLOAD_BYTES } from './uploadFile';

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
