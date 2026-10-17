import test from 'node:test';
import assert from 'node:assert';
import { SETTINGS_TABS, buildSettingsHref, parseSettingsQuery } from './settingsNav';

test('exposes the four settings tabs', () => {
  assert.deepStrictEqual(SETTINGS_TABS, ['appearance', 'church', 'copy', 'sections']);
});

test('defaults to appearance when no tab is requested', () => {
  assert.strictEqual(parseSettingsQuery({}), 'appearance');
});

test('falls back to appearance for an unknown tab', () => {
  assert.strictEqual(parseSettingsQuery({ tab: 'payroll' }), 'appearance');
});

test('takes the first value when the tab parameter repeats', () => {
  assert.strictEqual(parseSettingsQuery({ tab: ['copy', 'church'] }), 'copy');
});

test('reads a known tab', () => {
  assert.strictEqual(parseSettingsQuery({ tab: 'sections' }), 'sections');
});

test('builds a deep link into the site settings page', () => {
  assert.strictEqual(buildSettingsHref('sections'), '/manage/settings?tab=sections');
});
