import test from 'node:test';
import assert from 'node:assert';
import { SETTINGS_TABS, buildSettingsHref, parseSettingsQuery } from './settingsNav';

test('exposes the three settings tabs', () => {
  assert.deepStrictEqual(SETTINGS_TABS, ['appearance', 'church', 'copy']);
});

test('defaults to appearance when no tab is requested', () => {
  assert.strictEqual(parseSettingsQuery({}), 'appearance');
});

test('reads a known tab', () => {
  assert.strictEqual(parseSettingsQuery({ tab: 'church' }), 'church');
});

test('falls back to appearance for an unknown tab', () => {
  assert.strictEqual(parseSettingsQuery({ tab: 'payroll' }), 'appearance');
});

test('takes the first value when the tab parameter repeats', () => {
  assert.strictEqual(parseSettingsQuery({ tab: ['copy', 'church'] }), 'copy');
});

test('builds a deep link to a tab', () => {
  assert.strictEqual(buildSettingsHref('copy'), '/settings?tab=copy');
});
