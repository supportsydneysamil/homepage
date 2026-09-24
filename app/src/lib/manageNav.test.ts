import test from 'node:test';
import assert from 'node:assert';
import { MANAGE_TABS, buildManageHref, parseManageQuery } from './manageNav';

test('defaults to the resources tab with nothing selected', () => {
  assert.deepStrictEqual(parseManageQuery({}), { tab: 'resources', editId: null });
});

test('reads a known tab and edit target', () => {
  assert.deepStrictEqual(parseManageQuery({ tab: 'sermons', edit: 'abc' }), {
    tab: 'sermons',
    editId: 'abc',
  });
});

test('falls back to resources for an unknown tab', () => {
  assert.strictEqual(parseManageQuery({ tab: 'payroll' }).tab, 'resources');
});

test('takes the first value when a query parameter repeats', () => {
  assert.deepStrictEqual(parseManageQuery({ tab: ['events', 'sermons'], edit: ['a', 'b'] }), {
    tab: 'events',
    editId: 'a',
  });
});

test('treats a blank edit value as nothing selected', () => {
  assert.strictEqual(parseManageQuery({ tab: 'events', edit: '' }).editId, null);
});

test('builds a deep link to a single item', () => {
  assert.strictEqual(buildManageHref('sermons', 'abc'), '/manage?tab=sermons&edit=abc');
});

test('builds a tab link when no item is given', () => {
  assert.strictEqual(buildManageHref('events'), '/manage?tab=events');
});

test('escapes an id that would otherwise break the query string', () => {
  assert.strictEqual(buildManageHref('events', 'a b&c'), '/manage?tab=events&edit=a%20b%26c');
});

test('exposes the three content tabs', () => {
  assert.deepStrictEqual(MANAGE_TABS, ['resources', 'sermons', 'events']);
});

test('site settings is a separate page, not a content tab', () => {
  assert.strictEqual(parseManageQuery({ tab: 'settings' }).tab, 'resources');
});
