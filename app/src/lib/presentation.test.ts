import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatDisplayDate,
  isPlaceholderUrl,
  toYouTubeEmbedUrl,
} from './presentation';

test('formats dates for the selected language', () => {
  assert.equal(formatDisplayDate('2026-01-04', 'en'), '4 Jan 2026');
  assert.equal(formatDisplayDate('2026-01-04', 'ko'), '2026년 1월 4일');
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
