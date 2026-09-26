import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_CHURCH_INFO } from './churchInfo';
import { DEFAULT_SITE_COPY } from './siteCopy';
import {
  settingsValidationMessage,
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

const withWelcome = (welcome: Partial<typeof DEFAULT_SITE_COPY.home.welcome>) => ({
  ...DEFAULT_SITE_COPY,
  home: { ...DEFAULT_SITE_COPY.home, welcome: { ...DEFAULT_SITE_COPY.home.welcome, ...welcome } },
});

const welcomeIssues = (welcome: Partial<typeof DEFAULT_SITE_COPY.home.welcome>) =>
  validateSiteCopyDraft(withWelcome(welcome)).filter((issue) => issue.path === 'home.welcome.formUrl');

const LINK_ISSUE = { tab: 'copy', path: 'home.welcome.formUrl', code: 'formUrl' };

test('newcomer link is required only while the band is on', () => {
  assert.deepStrictEqual(welcomeIssues({ enabled: true, formUrl: '' }), [LINK_ISSUE]);
  assert.deepStrictEqual(welcomeIssues({ enabled: true, formUrl: '   ' }), [LINK_ISSUE]);
  assert.deepStrictEqual(welcomeIssues({ enabled: false, formUrl: '' }), []);
  assert.deepStrictEqual(
    welcomeIssues({ enabled: true, formUrl: 'https://forms.office.com/r/samil-newcomer' }),
    []
  );
});

test('a non-Forms newcomer link is rejected even while the band is off', () => {
  assert.deepStrictEqual(welcomeIssues({ enabled: false, formUrl: 'https://example.com/form' }), [LINK_ISSUE]);
});

test('newcomer link message names Microsoft Forms', () => {
  const issue = { tab: 'copy' as const, path: 'home.welcome.formUrl', code: 'formUrl' as const };
  assert.strictEqual(settingsValidationMessage(issue, true), 'Microsoft Forms 주소를 입력해 주세요.');
  assert.strictEqual(settingsValidationMessage(issue, false), 'Enter a Microsoft Forms link.');
});
