import test from 'node:test';
import assert from 'node:assert';
import {
  HOME_DESCRIPTION,
  SHARE_IMAGE,
  documentTitle,
  openGraphLocales,
  pageDescription,
} from './pageMeta';

test('the home title carries both church names, led by the active language', () => {
  assert.strictEqual(documentTitle(undefined, 'ko'), '시드니 삼일교회 | Sydney Samil Church');
  assert.strictEqual(documentTitle(undefined, 'en'), 'Sydney Samil Church | 시드니 삼일교회');
});

test('other page titles end with the church name in the active language', () => {
  const title = { ko: '설교', en: 'Sermons' };
  assert.strictEqual(documentTitle(title, 'ko'), '설교 | 시드니 삼일교회');
  assert.strictEqual(documentTitle(title, 'en'), 'Sermons | Sydney Samil Church');
});

test('pages without a description use the home description', () => {
  assert.strictEqual(pageDescription(undefined, 'ko'), HOME_DESCRIPTION.ko);
  assert.strictEqual(pageDescription({ ko: '설교 안내', en: 'Sermons' }, 'en'), 'Sermons');
});

test('the Korean home description carries local search words', () => {
  assert.ok(HOME_DESCRIPTION.ko.includes('펜넌트힐스'));
  assert.ok(HOME_DESCRIPTION.ko.includes('한인교회'));
});

test('the share image is the absolute 1200 by 628 church photo', () => {
  assert.strictEqual(SHARE_IMAGE.url, 'https://sydneysamil.org/og-image.jpg');
  assert.strictEqual(SHARE_IMAGE.width, 1200);
  assert.strictEqual(SHARE_IMAGE.height, 628);
});

test('open graph locale follows the active language', () => {
  assert.deepStrictEqual(openGraphLocales('ko'), { locale: 'ko_KR', alternate: 'en_AU' });
  assert.deepStrictEqual(openGraphLocales('en'), { locale: 'en_AU', alternate: 'ko_KR' });
});
