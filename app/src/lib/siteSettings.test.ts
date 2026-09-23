import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_CHURCH_INFO } from './churchInfo';
import { DEFAULT_SITE_COPY } from './siteCopy';
import {
  DEFAULT_HERO_IMAGE,
  DEFAULT_PASTOR_IMAGE,
  nextImagePath,
  nextSrcOnError,
  parseSiteSettings,
  putSiteSettings,
} from './siteSettings';

test('null api urls become built-in paths', () => {
  const settings = parseSiteSettings({
    themeId: 'light',
    heroImagePath: null,
    pastorImagePath: null,
    logoImagePath: null,
  });
  assert.strictEqual(settings.themeId, 'light');
  assert.strictEqual(settings.heroImageUrl, DEFAULT_HERO_IMAGE);
  assert.strictEqual(settings.pastorImageUrl, DEFAULT_PASTOR_IMAGE);
  assert.strictEqual(settings.logoImagePath, null);
  assert.strictEqual(settings.logoImageUrl, '');
  assert.strictEqual(settings.churchInfo.email, 'info@sydneysamil.org');
  assert.ok(settings.siteCopy.about.values.length);
});

test('uploaded urls win over defaults', () => {
  const settings = parseSiteSettings({
    themeId: 'church',
    heroImagePath: 'site/a.jpg',
    pastorImagePath: 'site/b.jpg',
    logoImagePath: 'site/logo.png',
    heroImageUrl: 'https://example.test/site/a.jpg',
    pastorImageUrl: 'https://example.test/site/b.jpg',
    logoImageUrl: 'https://example.test/site/logo.png',
  });
  assert.strictEqual(settings.heroImageUrl, 'https://example.test/site/a.jpg');
  assert.strictEqual(settings.heroImagePath, 'site/a.jpg');
  assert.strictEqual(settings.logoImageUrl, 'https://example.test/site/logo.png');
});

test('reset sends null and keep reuses the published path', () => {
  assert.strictEqual(nextImagePath('reset', 'site/a.jpg'), null);
  assert.strictEqual(nextImagePath('keep', 'site/a.jpg'), 'site/a.jpg');
  assert.strictEqual(nextImagePath({ uploadedPath: 'site/new.jpg' }, 'site/a.jpg'), 'site/new.jpg');
});

test('a broken remote image falls back once', () => {
  assert.strictEqual(
    nextSrcOnError('https://example.test/site/a.jpg', DEFAULT_HERO_IMAGE),
    DEFAULT_HERO_IMAGE
  );
  assert.strictEqual(nextSrcOnError(DEFAULT_HERO_IMAGE, DEFAULT_HERO_IMAGE), DEFAULT_HERO_IMAGE);
});

test('putSiteSettings returns parsed settings when fetch succeeds', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        themeId: 'light',
        heroImagePath: 'site/a.jpg',
        pastorImagePath: null,
        logoImagePath: 'site/logo.png',
        heroImageUrl: 'https://example.test/site/a.jpg',
        pastorImageUrl: null,
        logoImageUrl: 'https://example.test/site/logo.png',
      }),
    }) as Response;
  try {
    const result = await putSiteSettings({
      themeId: 'light',
      heroImagePath: 'site/a.jpg',
      pastorImagePath: null,
      logoImagePath: 'site/logo.png',
      churchInfo: DEFAULT_CHURCH_INFO,
      siteCopy: DEFAULT_SITE_COPY,
    });
    assert.strictEqual(result.ok, true);
    if (result.ok) {
      assert.strictEqual(result.settings.heroImagePath, 'site/a.jpg');
      assert.strictEqual(result.settings.logoImagePath, 'site/logo.png');
      assert.ok(result.settings.churchInfo.email);
      assert.ok(result.settings.siteCopy.home.hero.lead.en);
    }
  } finally {
    globalThis.fetch = original;
  }
});
