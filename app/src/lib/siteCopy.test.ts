import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_SITE_COPY, parseSiteCopy } from './siteCopy';

test('missing site copy returns the current homepage and page text', () => {
  const copy = parseSiteCopy(undefined);
  assert.strictEqual(copy.home.hero.lead.en.includes('Sydney Samil Church'), true);
  assert.strictEqual(copy.about.values.length, 3);
  assert.strictEqual(copy.home.nextSteps.items[0].href, '/contact?topic=visit');
});

test('a single edited field does not wipe the rest of the page copy', () => {
  const copy = parseSiteCopy({
    home: { hero: { lead: { ko: '새 소개', en: 'New lead' } } },
  });
  assert.strictEqual(copy.home.hero.lead.ko, '새 소개');
  assert.strictEqual(copy.home.hero.title.en, DEFAULT_SITE_COPY.home.hero.title.en);
  assert.strictEqual(copy.worship.timesTitle.ko, DEFAULT_SITE_COPY.worship.timesTitle.ko);
});
