import test from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_CHURCH_INFO,
  directionsUrl,
  formatServiceTimesShort,
  mapsEmbedUrl,
  parseChurchInfo,
  phoneHref,
} from './churchInfo';

test('missing church info falls back to the current published facts', () => {
  const info = parseChurchInfo(undefined);
  assert.strictEqual(info.email, 'info@sydneysamil.org');
  assert.strictEqual(info.phone, '0433 576 500');
  assert.strictEqual(info.services.length, 2);
  assert.strictEqual(info.services[0].time, '9:30');
  assert.strictEqual(info.pastorNameKo, '안상헌 담임목사');
});

test('partial church info keeps defaults for omitted fields', () => {
  const info = parseChurchInfo({ phone: '0400 000 000', services: [{ time: '10:00' }] });
  assert.strictEqual(info.phone, '0400 000 000');
  assert.strictEqual(info.email, DEFAULT_CHURCH_INFO.email);
  assert.strictEqual(info.services[0].time, '10:00');
  assert.strictEqual(info.services[0].label.ko, '1부');
  assert.strictEqual(info.services.length, 1);
});

test('the optional second address line can be cleared intentionally', () => {
  const info = parseChurchInfo({ addressLine2: '' });
  assert.strictEqual(info.addressLine2, '');
});

test('invalid services and gatherings are dropped instead of breaking the page', () => {
  const info = parseChurchInfo({ services: 'nope', gatherings: [{ badge: '' }] });
  assert.deepStrictEqual(info.services, DEFAULT_CHURCH_INFO.services);
  assert.strictEqual(info.gatherings.length, 0);
});

test('maps and phone helpers build public contact links', () => {
  const info = parseChurchInfo(null);
  assert.ok(directionsUrl(info.mapsQuery).includes(encodeURIComponent(info.mapsQuery)));
  assert.ok(mapsEmbedUrl(info.mapsQuery).includes('output=embed'));
  assert.strictEqual(phoneHref('0433 576 500'), 'tel:+61433576500');
  assert.strictEqual(formatServiceTimesShort(info.services), '9:30 · 11:00 AM');
});
