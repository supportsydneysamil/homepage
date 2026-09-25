import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveActiveTheme, THEME_IDS, THEME_OPTIONS } from './ThemeContext';

test('registers Living as a selectable front-end theme', () => {
  assert.ok(THEME_IDS.includes('living'));
  assert.ok(THEME_OPTIONS.some((option) => option.id === 'living'));
});

test('a previewed theme paints over the published one', () => {
  assert.equal(resolveActiveTheme('church', 'living'), 'living');
});

test('clearing the preview restores the published theme', () => {
  assert.equal(resolveActiveTheme('church', null), 'church');
});
