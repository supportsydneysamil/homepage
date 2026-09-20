import test from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_HERO_IMAGE,
  DEFAULT_PASTOR_IMAGE,
  nextImagePath,
  parseSiteSettings,
} from './siteSettings';

test('null api urls become built-in paths', () => {
  const settings = parseSiteSettings({
    themeId: 'light',
    heroImagePath: null,
    pastorImagePath: null,
  });
  assert.strictEqual(settings.themeId, 'light');
  assert.strictEqual(settings.heroImageUrl, DEFAULT_HERO_IMAGE);
  assert.strictEqual(settings.pastorImageUrl, DEFAULT_PASTOR_IMAGE);
});

test('uploaded urls win over defaults', () => {
  const settings = parseSiteSettings({
    themeId: 'church',
    heroImagePath: 'site/a.jpg',
    pastorImagePath: 'site/b.jpg',
    heroImageUrl: 'https://example.test/site/a.jpg',
    pastorImageUrl: 'https://example.test/site/b.jpg',
  });
  assert.strictEqual(settings.heroImageUrl, 'https://example.test/site/a.jpg');
  assert.strictEqual(settings.heroImagePath, 'site/a.jpg');
});

test('reset sends null and keep reuses the published path', () => {
  assert.strictEqual(nextImagePath('reset', 'site/a.jpg'), null);
  assert.strictEqual(nextImagePath('keep', 'site/a.jpg'), 'site/a.jpg');
  assert.strictEqual(nextImagePath({ uploadedPath: 'site/new.jpg' }, 'site/a.jpg'), 'site/new.jpg');
});
