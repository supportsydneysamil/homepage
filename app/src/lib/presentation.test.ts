import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatDisplayDate,
  formatShortDate,
  isPlaceholderUrl,
  toYouTubeEmbedUrl,
  fileNameFromUrl,
} from './presentation';

test('shows the original file name for a console upload', () => {
  assert.equal(
    fileNameFromUrl(
      'https://samilchurchstorage0.blob.core.windows.net/samilmedia/media/1b4e28ba-2fa1-11d2-883f-0016d3cca427-sermon.mp3'
    ),
    'sermon.mp3'
  );
});

test('shows the blob name when there is no generated prefix', () => {
  assert.equal(
    fileNameFromUrl('https://samilchurchstorage0.blob.core.windows.net/samilmedia/sermon20260816.mp3'),
    'sermon20260816.mp3'
  );
});

test('decodes an escaped file name', () => {
  assert.equal(
    fileNameFromUrl('https://samilchurchstorage0.blob.core.windows.net/samilmedia/media/%EC%84%A4%EA%B5%90.mp3'),
    '설교.mp3'
  );
});

test('ignores a query string on the file name', () => {
  assert.equal(
    fileNameFromUrl('https://samilchurchstorage0.blob.core.windows.net/samilmedia/a.mp3?sv=2024&sig=abc'),
    'a.mp3'
  );
});

test('returns an empty string when there is no usable url', () => {
  assert.equal(fileNameFromUrl(''), '');
  assert.equal(fileNameFromUrl(undefined), '');
  assert.equal(fileNameFromUrl('not a url'), '');
});

test('formats dates for the selected language', () => {
  assert.equal(formatDisplayDate('2026-01-04', 'en'), '4 Jan 2026');
  assert.equal(formatDisplayDate('2026-01-04', 'ko'), '2026년 1월 4일');
  assert.equal(formatDisplayDate('2026-09-20', 'en'), '20 Sep 2026');
  assert.equal(formatShortDate('2026-09-20', 'en'), '20 Sep');
  assert.equal(formatShortDate('2026-09-20', 'ko'), '9월 20일');
});

test('converts standard and short YouTube URLs to embeds', () => {
  assert.equal(
    toYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123'),
    'https://www.youtube.com/embed/abc123',
  );
  assert.equal(
    toYouTubeEmbedUrl('https://youtu.be/abc123'),
    'https://www.youtube.com/embed/abc123',
  );
});

test('rejects invalid and placeholder video URLs', () => {
  assert.equal(toYouTubeEmbedUrl('https://www.youtube.com/watch?v=VIDEO_ID'), null);
  assert.equal(toYouTubeEmbedUrl('not-a-url'), null);
  assert.equal(toYouTubeEmbedUrl(), null);
});

test('detects missing and example placeholder URLs', () => {
  assert.equal(isPlaceholderUrl('https://example.com/image.jpg'), true);
  assert.equal(isPlaceholderUrl('https://www.example.com/image.jpg'), true);
  assert.equal(isPlaceholderUrl(''), true);
  assert.equal(isPlaceholderUrl('https://sydneysamil.org/file.pdf'), false);
});
