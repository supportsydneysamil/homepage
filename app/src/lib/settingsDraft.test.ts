import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_CHURCH_INFO } from './churchInfo';
import { parseChurchInfo } from './churchInfo';
import { DEFAULT_IMAGE_PRESENTATION } from './imagePresentation';
import {
  DEFAULT_SECTION_AVAILABILITY,
  parseSectionAvailability,
} from './sectionAvailability';
import { DEFAULT_SITE_COPY } from './siteCopy';
import { parseSiteCopy } from './siteCopy';
import { dirtySettingsTabs } from './settingsDraft';

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
  currentSectionAvailability: DEFAULT_SECTION_AVAILABILITY,
  draftSectionAvailability: DEFAULT_SECTION_AVAILABILITY,
};

test('an unchanged settings draft has no dirty tabs', () => {
  assert.deepStrictEqual(dirtySettingsTabs(baseline), []);
  assert.deepStrictEqual(
    dirtySettingsTabs({
      ...baseline,
      draftChurchInfo: parseChurchInfo(DEFAULT_CHURCH_INFO),
      draftSiteCopy: parseSiteCopy(DEFAULT_SITE_COPY),
      draftSectionAvailability: parseSectionAvailability(
        DEFAULT_SECTION_AVAILABILITY
      ),
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

test('all changed settings report dirty tabs in tab order', () => {
  const tabs = dirtySettingsTabs({
    ...baseline,
    selectedThemeId: 'light',
    draftChurchInfo: { ...DEFAULT_CHURCH_INFO, phone: '0400 000 000' },
    draftSiteCopy: {
      ...DEFAULT_SITE_COPY,
      footer: {
        ...DEFAULT_SITE_COPY.footer,
        tagline: { ko: '새 문구', en: 'New copy' },
      },
    },
    draftSectionAvailability: {
      ...DEFAULT_SECTION_AVAILABILITY,
      sermons: false,
    },
  });
  assert.deepStrictEqual(tabs, ['appearance', 'church', 'copy', 'sections']);
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

test('one disabled public section belongs to Menu visibility', () => {
  assert.deepStrictEqual(
    dirtySettingsTabs({
      ...baseline,
      draftSectionAvailability: {
        ...DEFAULT_SECTION_AVAILABILITY,
        contact: false,
      },
    }),
    ['sections']
  );
});
