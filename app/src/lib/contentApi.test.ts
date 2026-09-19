import test from 'node:test';
import assert from 'node:assert';
import { parseEvents, parseSermons, parseResources } from './contentApi';

test('parses an events payload', () => {
  const events = parseEvents({
    events: [
      { id: '1', slug: 'a', date: '2026-01-01', title: 'A', description: 'd', youtubeUrl: '', images: [] },
    ],
  });
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].slug, 'a');
});

test('returns an empty list for a malformed events payload', () => {
  assert.deepStrictEqual(parseEvents({}), []);
  assert.deepStrictEqual(parseEvents(null), []);
});

test('parses a sermons payload', () => {
  const sermons = parseSermons({
    sermons: [{ id: '1', date: '2026-01-04', title: 'T', speaker: 'P', youtubeUrl: '' }],
  });
  assert.strictEqual(sermons[0].speaker, 'P');
  assert.strictEqual(sermons[0].mediaUrl, '');
});

test('parses an uploaded sermon recording', () => {
  const sermons = parseSermons({
    sermons: [
      {
        id: '1',
        date: '2026-08-16',
        title: 'T',
        speaker: 'P',
        youtubeUrl: '',
        mediaUrl: 'https://samilchurchstorage0.blob.core.windows.net/samilmedia/media/a.mp3',
        mediaContentType: 'audio/mpeg',
      },
    ],
  });
  assert.strictEqual(sermons[0].mediaContentType, 'audio/mpeg');
  assert.ok(sermons[0].mediaUrl.endsWith('.mp3'));
});

test('parses a resources payload and keeps the proxied download url', () => {
  const resources = parseResources({
    resources: [
      { id: 'r1', title: 'Bulletin', contentType: 'application/pdf', sizeBytes: 10, downloadUrl: '/api/files/download/r1' },
    ],
  });
  assert.strictEqual(resources[0].downloadUrl, '/api/files/download/r1');
});

test('keeps the display file name when the API sends one', () => {
  const resources = parseResources({
    resources: [
      {
        id: 'r1',
        title: 'Bulletin',
        fileName: 'bulletin.pdf',
        contentType: 'application/pdf',
        sizeBytes: 10,
        downloadUrl: '/api/files/download/r1',
      },
    ],
  });
  assert.strictEqual(resources[0].fileName, 'bulletin.pdf');
});

test('drops resource entries that point at raw storage', () => {
  const resources = parseResources({
    resources: [
      { id: 'r1', title: 'B', contentType: 'application/pdf', sizeBytes: 1, downloadUrl: 'https://x.blob.core.windows.net/a' },
    ],
  });
  assert.deepStrictEqual(resources, []);
});
