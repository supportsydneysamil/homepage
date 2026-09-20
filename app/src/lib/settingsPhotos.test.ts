import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_HERO_IMAGE, previewSrc } from './siteSettings';

test('a newly selected file replaces the published preview', () => {
  assert.strictEqual(
    previewSrc({
      pendingFileUrl: 'blob:preview',
      pendingReset: false,
      publishedUrl: 'https://example.test/site/a.jpg',
      fallback: DEFAULT_HERO_IMAGE,
    }),
    'blob:preview'
  );
});

test('reset preview shows the built-in image', () => {
  assert.strictEqual(
    previewSrc({
      pendingFileUrl: null,
      pendingReset: true,
      publishedUrl: 'https://example.test/site/a.jpg',
      fallback: DEFAULT_HERO_IMAGE,
    }),
    DEFAULT_HERO_IMAGE
  );
});

test('an unchanged slot keeps the published image', () => {
  assert.strictEqual(
    previewSrc({
      pendingFileUrl: null,
      pendingReset: false,
      publishedUrl: 'https://example.test/site/a.jpg',
      fallback: DEFAULT_HERO_IMAGE,
    }),
    'https://example.test/site/a.jpg'
  );
});
