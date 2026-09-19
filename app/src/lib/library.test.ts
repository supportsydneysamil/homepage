import test from 'node:test';
import assert from 'node:assert';
import {
  RESOURCE_CATEGORIES,
  RESOURCE_VISIBILITIES,
  categoryLabel,
  visibilityLabel,
  filterResources,
} from './library';
import type { ApiResource } from './contentApi';

const resource = (over: Partial<ApiResource>): ApiResource => ({
  id: 'r1',
  title: 'Weekly Bulletin',
  contentType: 'application/pdf',
  sizeBytes: 100,
  category: 'bulletin',
  visibility: 'member',
  resourceDate: null,
  downloadUrl: '/api/files/download/r1',
  ...over,
});

test('exposes the six categories and three visibility levels', () => {
  assert.deepStrictEqual(
    RESOURCE_CATEGORIES.map((entry) => entry.id),
    ['bulletin', 'smallgroup', 'worship', 'forms', 'minutes', 'newsletter']
  );
  assert.deepStrictEqual(
    RESOURCE_VISIBILITIES.map((entry) => entry.id),
    ['public', 'member', 'admin']
  );
});

test('labels fall back to the raw value for an unknown category', () => {
  assert.strictEqual(categoryLabel('bulletin', 'ko'), '주보');
  assert.strictEqual(categoryLabel('bulletin', 'en'), 'Bulletins');
  assert.strictEqual(categoryLabel('mystery', 'ko'), 'mystery');
  assert.strictEqual(visibilityLabel('public', 'ko'), '전체 공개');
});

test('returns everything when no filter is applied', () => {
  const items = [resource({ id: 'a' }), resource({ id: 'b', category: 'forms' })];
  assert.strictEqual(filterResources(items, 'all', '').length, 2);
});

test('filters by category', () => {
  const items = [resource({ id: 'a' }), resource({ id: 'b', category: 'forms' })];
  const filtered = filterResources(items, 'forms', '');
  assert.deepStrictEqual(
    filtered.map((item) => item.id),
    ['b']
  );
});

test('searches the title without case sensitivity', () => {
  const items = [resource({ title: 'Weekly Bulletin' }), resource({ id: 'b', title: '소그룹 교재' })];
  assert.strictEqual(filterResources(items, 'all', 'weekly').length, 1);
  assert.strictEqual(filterResources(items, 'all', '소그룹').length, 1);
  assert.strictEqual(filterResources(items, 'all', '  WEEKLY  ').length, 1);
});

test('combines category and search', () => {
  const items = [
    resource({ id: 'a', title: '9월 주보', category: 'bulletin' }),
    resource({ id: 'b', title: '9월 소식지', category: 'newsletter' }),
  ];
  const filtered = filterResources(items, 'newsletter', '9월');
  assert.deepStrictEqual(
    filtered.map((item) => item.id),
    ['b']
  );
});

test('a search that matches nothing returns an empty list', () => {
  assert.deepStrictEqual(filterResources([resource({})], 'all', 'zzz'), []);
});
