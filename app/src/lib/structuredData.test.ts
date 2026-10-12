import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_CHURCH_INFO } from './churchInfo';
import { churchJsonLd, serializeJsonLd } from './structuredData';

test('church structured data names the church in both languages', () => {
  const data = churchJsonLd(DEFAULT_CHURCH_INFO, '');
  assert.strictEqual(data['@context'], 'https://schema.org');
  assert.strictEqual(data['@type'], 'Church');
  assert.strictEqual(data.name, '시드니 삼일교회');
  assert.strictEqual(data.alternateName, 'Sydney Samil Church');
  assert.strictEqual(data.url, 'https://sydneysamil.org');
  assert.strictEqual(data.telephone, '0433 576 500');
  assert.strictEqual(data.email, 'info@sydneysamil.org');
  assert.strictEqual(data.address, 'Corner Bellamy St & Boundary Rd, Pennant Hills NSW 2120');
});

test('the logo is included only for an absolute https url', () => {
  assert.strictEqual(
    churchJsonLd(DEFAULT_CHURCH_INFO, 'https://cdn.example/logo.png').logo,
    'https://cdn.example/logo.png'
  );
  for (const logo of ['', '/logo.png', 'http://cdn.example/logo.png']) {
    assert.ok(!('logo' in churchJsonLd(DEFAULT_CHURCH_INFO, logo)), logo);
  }
});

test('serialized structured data cannot close its script tag', () => {
  const value = { name: '</script><script>alert(1)</script>' };
  const serialized = serializeJsonLd(value);
  assert.ok(!serialized.includes('<'));
  assert.deepStrictEqual(JSON.parse(serialized), value);
});

test('sameAs lists only the social links that are set', () => {
  const info = {
    ...DEFAULT_CHURCH_INFO,
    social: {
      ...DEFAULT_CHURCH_INFO.social,
      instagram: 'https://www.instagram.com/a',
      kakao: 'https://pf.kakao.com/_a',
    },
  };
  assert.deepStrictEqual(churchJsonLd(info, '').sameAs, [
    'https://www.instagram.com/a',
    'https://pf.kakao.com/_a',
  ]);
  assert.ok(!('sameAs' in churchJsonLd(DEFAULT_CHURCH_INFO, '')));
});
