import test from 'node:test';
import assert from 'node:assert';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BilingualField from '../components/settings/BilingualField';

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
