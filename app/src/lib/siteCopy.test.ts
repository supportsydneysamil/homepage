import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_SITE_COPY, parseSiteCopy, welcomeFormUrl } from './siteCopy';

test('missing site copy returns the current homepage and page text', () => {
  const copy = parseSiteCopy(undefined);
  assert.strictEqual(copy.home.hero.lead.en.includes('Sydney Samil Church'), true);
  assert.strictEqual(copy.about.values.length, 3);
  assert.strictEqual(copy.home.nextSteps.items[0].href, '/contact?topic=visit');
});

test('open application copy falls back and keeps an edited title', () => {
  const fallback = parseSiteCopy(undefined);
  assert.strictEqual(fallback.home.applications.kicker.ko, '지금 신청');
  assert.strictEqual(fallback.home.applications.applyLabel.en, 'Apply');
  assert.strictEqual(fallback.home.applications.viewAll.ko, '모든 신청 보기');

  const edited = parseSiteCopy({
    home: { applications: { title: { ko: '지금 접수', en: 'Apply today' } } },
  });
  assert.strictEqual(edited.home.applications.title.ko, '지금 접수');
  assert.strictEqual(edited.home.applications.kicker.ko, '지금 신청');
});

test('a single edited field does not wipe the rest of the page copy', () => {
  const copy = parseSiteCopy({
    home: { hero: { lead: { ko: '새 소개', en: 'New lead' } } },
  });
  assert.strictEqual(copy.home.hero.lead.ko, '새 소개');
  assert.strictEqual(copy.home.hero.title.en, DEFAULT_SITE_COPY.home.hero.title.en);
  assert.strictEqual(copy.worship.timesTitle.ko, DEFAULT_SITE_COPY.worship.timesTitle.ko);
});

const NEWCOMER_FORM = 'https://forms.office.com/r/samil-newcomer';

test('newcomer band defaults to off with no link', () => {
  const copy = parseSiteCopy(undefined);
  assert.strictEqual(copy.home.welcome.enabled, false);
  assert.strictEqual(copy.home.welcome.formUrl, '');
  assert.strictEqual(copy.home.welcome.kicker.ko, '새가족');
  assert.strictEqual(copy.home.welcome.buttonLabel.ko, '새가족 등록하기');
  assert.strictEqual(copy.home.welcome.buttonLabel.en, 'Register');
  assert.strictEqual(welcomeFormUrl(copy.home.welcome), null);
});

test('newcomer band keeps a Microsoft Forms link and drops anything else', () => {
  const kept = parseSiteCopy({ home: { welcome: { enabled: true, formUrl: `  ${NEWCOMER_FORM}  ` } } });
  assert.strictEqual(kept.home.welcome.formUrl, NEWCOMER_FORM);

  const tooLong = `https://forms.office.com/r/${'a'.repeat(480)}`;
  for (const formUrl of ['http://forms.office.com/r/x', 'https://example.com/form', 'not a url', 42, tooLong]) {
    const dropped = parseSiteCopy({ home: { welcome: { enabled: true, formUrl } } });
    assert.strictEqual(dropped.home.welcome.formUrl, '', String(formUrl));
  }
});

test('newcomer band is on only for boolean true', () => {
  const asText = parseSiteCopy({ home: { welcome: { enabled: 'true', formUrl: NEWCOMER_FORM } } });
  const asBoolean = parseSiteCopy({ home: { welcome: { enabled: true, formUrl: NEWCOMER_FORM } } });
  assert.strictEqual(asText.home.welcome.enabled, false);
  assert.strictEqual(asBoolean.home.welcome.enabled, true);
});

test('newcomer band renders only when on with a valid link', () => {
  const base = DEFAULT_SITE_COPY.home.welcome;
  assert.strictEqual(welcomeFormUrl({ ...base, enabled: true, formUrl: NEWCOMER_FORM }), NEWCOMER_FORM);
  assert.strictEqual(welcomeFormUrl({ ...base, enabled: false, formUrl: NEWCOMER_FORM }), null);
  assert.strictEqual(welcomeFormUrl({ ...base, enabled: true, formUrl: '' }), null);
  assert.strictEqual(welcomeFormUrl({ ...base, enabled: true, formUrl: 'https://example.com/form' }), null);
});

test('edited newcomer copy keeps the untouched defaults', () => {
  const copy = parseSiteCopy({ home: { welcome: { title: { ko: '환영합니다', en: 'Welcome' } } } });
  assert.strictEqual(copy.home.welcome.title.ko, '환영합니다');
  assert.strictEqual(copy.home.welcome.intro.en, DEFAULT_SITE_COPY.home.welcome.intro.en);
});
