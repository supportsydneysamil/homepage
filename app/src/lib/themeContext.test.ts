import assert from 'node:assert/strict';
import test from 'node:test';
import { CLOSED_SECTION_AVAILABILITY } from './sectionAvailability';
import {
  resolveActiveTheme,
  settingsAfterFetchFailure,
  settingsPayloadForTheme,
  THEME_IDS,
  THEME_OPTIONS,
} from './ThemeContext';

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

test('a settings fetch failure keeps content fallbacks but closes public sections', () => {
  const settings = settingsAfterFetchFailure();
  assert.equal(settings.themeId, 'church');
  assert.ok(settings.siteCopy.home.hero.lead.en);
  assert.ok(settings.churchInfo.email);
  assert.deepEqual(settings.sectionAvailability, CLOSED_SECTION_AVAILABILITY);
});

test('a theme-only save carries the current section availability', () => {
  const settings = settingsAfterFetchFailure();
  const payload = settingsPayloadForTheme(settings, 'light');
  assert.equal(payload.themeId, 'light');
  assert.deepEqual(payload.sectionAvailability, CLOSED_SECTION_AVAILABILITY);
});
