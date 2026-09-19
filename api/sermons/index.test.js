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

test('accepts an uploaded recording instead of a YouTube link', () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'samilchurchstorage0';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  const result = validateSermonInput({
    date: '2026-08-16',
    title: '8월 16일 주일예배',
    mediaUrl: 'https://samilchurchstorage0.blob.core.windows.net/samilmedia/media/abc-sermon.mp3',
    mediaContentType: 'audio/mpeg',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.mediaContentType, 'audio/mpeg');
});

test('rejects a recording url that is not in our media container', () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'samilchurchstorage0';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  assert.ok(
    validateSermonInput({
      date: '2026-08-16',
      title: 'T',
      mediaUrl: 'https://evil.test/a.mp3',
      mediaContentType: 'audio/mpeg',
    }).error
  );
});

test('rejects a recording with an unsupported media type', () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'samilchurchstorage0';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  assert.ok(
    validateSermonInput({
      date: '2026-08-16',
      title: 'T',
      mediaUrl: 'https://samilchurchstorage0.blob.core.windows.net/samilmedia/media/a.exe',
      mediaContentType: 'application/x-msdownload',
    }).error
  );
});

test('a sermon may carry both a YouTube link and a recording', () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'samilchurchstorage0';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  const result = validateSermonInput({
    date: '2026-08-16',
    title: 'T',
    youtubeUrl: 'https://youtu.be/abc',
    mediaUrl: 'https://samilchurchstorage0.blob.core.windows.net/samilmedia/media/a.mp3',
    mediaContentType: 'audio/mpeg',
  });
  assert.strictEqual(result.error, undefined);
  assert.ok(result.value.youtubeUrl);
  assert.ok(result.value.mediaUrl);
});

test('allows an omitted speaker and video', () => {
  const result = validateSermonInput({ date: '2026-01-04', title: 'T' });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.speaker, null);
  assert.strictEqual(result.value.youtubeUrl, null);
});
