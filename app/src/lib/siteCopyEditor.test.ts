import test from 'node:test';
import assert from 'node:assert';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BilingualField from '../components/settings/BilingualField';
import { SettingsValidationProvider } from '../components/settings/SettingsValidationContext';
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

test('home photo fields expose composition controls and result previews', () => {
  const html = editorHtml();
  assert.strictEqual((html.match(/type="range"/g) || []).length, 2);
  assert.strictEqual((html.match(/settings-photo-field__focus/g) || []).length, 2);
  assert.strictEqual((html.match(/settings-photo-field__result-stage/g) || []).length, 2);
  assert.strictEqual((html.match(/aria-roledescription="2차원 초점 선택기"/g) || []).length, 2);
  assert.strictEqual((html.match(/aria-live="polite"/g) || []).length, 2);
  assert.match(html, /구도 조절/);
  assert.match(html, /실제 결과/);
  assert.match(html, /구도 초기화/);
});

test('field validation marks bilingual inputs and explains the problem', () => {
  const html = renderToStaticMarkup(
    createElement(
      SettingsValidationProvider,
      { errors: { 'home.hero.title': '필수 값을 입력해 주세요.' } },
      createElement(BilingualField, {
        fieldPath: 'home.hero.title',
        label: '큰 제목',
        value: { ko: '', en: 'Headline' },
        onChange: () => undefined,
      })
    )
  );
  assert.strictEqual((html.match(/aria-invalid="true"/g) || []).length, 2);
  assert.match(html, /필수 값을 입력해 주세요/);
});
