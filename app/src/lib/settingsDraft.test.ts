import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_CHURCH_INFO } from './churchInfo';
import { parseChurchInfo } from './churchInfo';
import { DEFAULT_IMAGE_PRESENTATION } from './imagePresentation';
import { DEFAULT_SITE_COPY } from './siteCopy';
import { parseSiteCopy } from './siteCopy';
import { dirtySettingsTabs, shouldDockSettingsActions } from './settingsDraft';

const baseline = {
  currentThemeId: 'church',
  selectedThemeId: 'church',
  logoChanged: false,
  currentChurchInfo: DEFAULT_CHURCH_INFO,
  draftChurchInfo: DEFAULT_CHURCH_INFO,
  currentSiteCopy: DEFAULT_SITE_COPY,
  draftSiteCopy: DEFAULT_SITE_COPY,
  photosChanged: false,
  currentImagePresentation: DEFAULT_IMAGE_PRESENTATION,
  draftImagePresentation: DEFAULT_IMAGE_PRESENTATION,
};

test('an unchanged settings draft has no dirty tabs', () => {
  assert.deepStrictEqual(dirtySettingsTabs(baseline), []);
  assert.deepStrictEqual(
    dirtySettingsTabs({
      ...baseline,
      draftChurchInfo: parseChurchInfo(DEFAULT_CHURCH_INFO),
      draftSiteCopy: parseSiteCopy(DEFAULT_SITE_COPY),
    }),
    []
  );
});

test('theme and logo changes belong to Appearance once', () => {
  assert.deepStrictEqual(
    dirtySettingsTabs({
      ...baseline,
      selectedThemeId: 'light',
      logoChanged: true,
    }),
    ['appearance']
  );
});

test('church facts and page content report their own dirty tabs', () => {
  const tabs = dirtySettingsTabs({
    ...baseline,
    draftChurchInfo: { ...DEFAULT_CHURCH_INFO, phone: '0400 000 000' },
    draftSiteCopy: {
      ...DEFAULT_SITE_COPY,
      footer: {
        ...DEFAULT_SITE_COPY.footer,
        tagline: { ko: '새 문구', en: 'New copy' },
      },
    },
  });
  assert.deepStrictEqual(tabs, ['church', 'copy']);
});

test('photo files and composition changes belong to Site copy', () => {
  assert.deepStrictEqual(
    dirtySettingsTabs({
      ...baseline,
      photosChanged: true,
      draftImagePresentation: {
        ...DEFAULT_IMAGE_PRESENTATION,
        hero: { ...DEFAULT_IMAGE_PRESENTATION.hero, zoom: 1.2 },
      },
    }),
    ['copy']
  );
});

test('the action bar docks only when the settings form end reaches the viewport', () => {
  assert.strictEqual(shouldDockSettingsActions(1200, 900), false);
  assert.strictEqual(shouldDockSettingsActions(900, 900), true);
  assert.strictEqual(shouldDockSettingsActions(760, 900), true);
});
