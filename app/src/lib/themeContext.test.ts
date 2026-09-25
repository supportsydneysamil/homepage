import assert from 'node:assert/strict';
import test from 'node:test';
import { THEME_IDS, THEME_OPTIONS } from './ThemeContext';

test('registers Living as a selectable front-end theme', () => {
  assert.ok(THEME_IDS.includes('living'));
  assert.ok(THEME_OPTIONS.some((option) => option.id === 'living'));
});
