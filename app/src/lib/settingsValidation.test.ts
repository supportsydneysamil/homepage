import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_CHURCH_INFO } from './churchInfo';
import { DEFAULT_SITE_COPY } from './siteCopy';
import {
  validateChurchInfoDraft,
  validateSiteCopyDraft,
} from './settingsValidation';

test('valid default settings have no validation issues', () => {
  assert.deepStrictEqual(validateChurchInfoDraft(DEFAULT_CHURCH_INFO), []);
  assert.deepStrictEqual(validateSiteCopyDraft(DEFAULT_SITE_COPY), []);
});

test('church validation catches contact and service formatting problems', () => {
  const issues = validateChurchInfoDraft({
    ...DEFAULT_CHURCH_INFO,
    email: 'not-an-email',
    phone: '12',
    services: [
      {
        ...DEFAULT_CHURCH_INFO.services[0],
        time: '9.75',
        period: 'morning',
      },
    ],
  });
  assert.deepStrictEqual(
    issues.map((issue) => [issue.path, issue.code]),
    [
      ['phone', 'phone'],
      ['email', 'email'],
      ['services[].time', 'time'],
      ['services[].period', 'period'],
    ]
  );
});

test('church validation rejects empty required text instead of restoring defaults silently', () => {
  const issues = validateChurchInfoDraft({
    ...DEFAULT_CHURCH_INFO,
    churchNameKo: '',
    services: [],
  });
  assert.ok(issues.some((issue) => issue.path === 'churchNameKo' && issue.code === 'required'));
  assert.ok(issues.some((issue) => issue.path === 'services' && issue.code === 'serviceRequired'));
});

test('site copy validation identifies the stored field path for empty localized text', () => {
  const issues = validateSiteCopyDraft({
    ...DEFAULT_SITE_COPY,
    home: {
      ...DEFAULT_SITE_COPY.home,
      hero: {
        ...DEFAULT_SITE_COPY.home.hero,
        title: { ko: '', en: DEFAULT_SITE_COPY.home.hero.title.en },
      },
    },
  });
  assert.deepStrictEqual(issues, [{ tab: 'copy', path: 'home.hero.title', code: 'required' }]);
});
