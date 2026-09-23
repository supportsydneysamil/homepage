import test from 'node:test';
import assert from 'node:assert';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BilingualField from '../components/settings/BilingualField';
import SiteCopyFields from '../components/settings/SiteCopyFields';
import { DEFAULT_SITE_COPY } from './siteCopy';

const localizedPaths = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  if (typeof row.ko === 'string' && typeof row.en === 'string') return [prefix];
  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap((item) => localizedPaths(item, `${prefix}[]`))));
  }
  return Object.entries(row).flatMap(([key, child]) =>
    localizedPaths(child, prefix ? `${prefix}.${key}` : key)
  );
};

const pathsFromHtml = (html: string) =>
  Array.from(html.matchAll(/data-field-path="([^"]+)"/g), (match) => match[1]);

const photoSlot = {
  previewUrl: '',
  onSelect: () => undefined,
  onReset: () => undefined,
};

const editorHtml = () =>
  renderToStaticMarkup(
    createElement(SiteCopyFields, {
      value: DEFAULT_SITE_COPY,
      onChange: () => undefined,
      isKo: true,
      heroPhoto: photoSlot,
      pastorPhoto: photoSlot,
    })
  );

test('bilingual fields identify their content path and language', () => {
  const html = renderToStaticMarkup(
    createElement(BilingualField, {
      fieldPath: 'home.hero.title',
      label: '큰 제목',
      value: { ko: '환영합니다', en: 'Welcome' },
      onChange: () => undefined,
    })
  );

  assert.match(html, /data-field-path="home\.hero\.title"/);
  assert.match(html, /aria-label="큰 제목 \(한국어\)"/);
  assert.match(html, /aria-label="큰 제목 \(English\)"/);
});

test('home editor exposes every localized homepage setting', () => {
  const rendered = pathsFromHtml(editorHtml()).filter((path) => path.startsWith('home.'));
  const expected = localizedPaths(DEFAULT_SITE_COPY).filter((path) => path.startsWith('home.'));

  assert.deepStrictEqual(Array.from(new Set(rendered)).sort(), Array.from(new Set(expected)).sort());
});

test('site copy editor exposes every localized setting', () => {
  assert.deepStrictEqual(
    Array.from(new Set(pathsFromHtml(editorHtml()))).sort(),
    Array.from(new Set(localizedPaths(DEFAULT_SITE_COPY))).sort()
  );
});
