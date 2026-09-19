const test = require('node:test');
const assert = require('node:assert');
const { validateSermonInput } = require('./index');

test('accepts a complete sermon', () => {
  const result = validateSermonInput({
    date: '2026-01-04',
    title: 'Faith and Life',
    speaker: 'Senior Pastor',
    youtubeUrl: 'https://youtu.be/abc123',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.speaker, 'Senior Pastor');
});

test('rejects a missing title', () => {
  assert.ok(validateSermonInput({ date: '2026-01-04' }).error);
});

test('rejects a malformed date', () => {
  assert.ok(validateSermonInput({ date: 'Jan 4', title: 'T' }).error);
});

test('rejects a non-YouTube video url', () => {
  assert.ok(validateSermonInput({ date: '2026-01-04', title: 'T', youtubeUrl: 'https://evil.test/v' }).error);
});

test('allows an omitted speaker and video', () => {
  const result = validateSermonInput({ date: '2026-01-04', title: 'T' });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.speaker, null);
  assert.strictEqual(result.value.youtubeUrl, null);
});
