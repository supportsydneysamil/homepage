import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_SITE_COPY, localizeOr, parseSiteCopy, visibleQuestions, visibleStudies, welcomeFormUrl } from './siteCopy';

test('missing site copy returns the current homepage and page text', () => {
  const copy = parseSiteCopy(undefined);
  assert.strictEqual(copy.home.hero.lead.en.includes('Sydney Samil Church'), true);
  assert.strictEqual(copy.about.values.length, 3);
  assert.deepStrictEqual(
    copy.home.nextSteps.items.map((item) => item.href),
    ['/mokjang', '/contact?topic=prayer', '/contact']
  );
});

test('quick strip defaults to member shortcuts', () => {
  const { quick } = parseSiteCopy(undefined).home;
  assert.strictEqual(quick.sermons.ko, '설교 다시 듣기');
  assert.strictEqual(quick.events.ko, '행사와 소식');
  assert.strictEqual(quick.resources.ko, '자료 · 신청');
  assert.strictEqual('firstVisit' in quick, false);
});

test('saved next steps match cards by link, so a retired card drops out', () => {
  const copy = parseSiteCopy({
    home: {
      nextSteps: {
        items: [
          { title: { ko: '처음 방문하시나요?', en: 'Visit?' }, href: '/contact?topic=visit' },
          { title: { ko: '목장 찾기', en: 'Find a group' }, href: '/mokjang' },
          { title: { ko: '기도', en: 'Prayer' }, href: '/contact?topic=prayer' },
        ],
      },
    },
  });
  const [community, prayer, contact] = copy.home.nextSteps.items;
  assert.strictEqual(community.title.ko, '목장 찾기');
  assert.strictEqual(community.label.ko, DEFAULT_SITE_COPY.home.nextSteps.items[0].label.ko);
  assert.strictEqual(prayer.title.ko, '기도');
  assert.deepStrictEqual(contact, DEFAULT_SITE_COPY.home.nextSteps.items[2]);
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

test('the first next step opens the house church page', () => {
  const [community] = parseSiteCopy(undefined).home.nextSteps.items;
  assert.strictEqual(community.href, '/mokjang');
  assert.strictEqual(community.label.ko, '목장 알아보기');
  assert.strictEqual(community.description.en, 'See what a house church is like and find one near you.');
});

test('copy saved under the old community link falls back to the new card', () => {
  const copy = parseSiteCopy({
    home: {
      nextSteps: {
        items: [
          {
            title: { ko: '목장 찾기', en: 'Find a group' },
            label: { ko: '연결 요청', en: 'Get connected' },
            href: '/contact?topic=community',
          },
        ],
      },
    },
  });
  assert.deepStrictEqual(copy.home.nextSteps.items[0], DEFAULT_SITE_COPY.home.nextSteps.items[0]);
});

test('house church copy defaults fill every section', () => {
  const { mokjang, footer } = parseSiteCopy({});
  assert.strictEqual(mokjang.hero.ctaConnect.ko, '목장 연결 요청');
  assert.strictEqual(mokjang.evening.steps.length, 4);
  assert.strictEqual(mokjang.evening.steps[1].title.ko, '삶 나눔');
  assert.strictEqual(mokjang.faq.items.length, 5);
  assert.strictEqual(mokjang.study.items.length, 2);
  assert.strictEqual(mokjang.cta.button.en, 'Ask to be connected');
  assert.deepStrictEqual(footer.mokjang, { ko: '목장', en: 'House Church' });
});

test('a cleared question stays cleared and drops off the page', () => {
  const items = DEFAULT_SITE_COPY.mokjang.faq.items.map((item, index) =>
    index === 1 ? { question: { ko: '', en: '' }, answer: { ko: '', en: '' } } : item
  );
  const copy = parseSiteCopy({ mokjang: { faq: { items } } });
  assert.strictEqual(copy.mokjang.faq.items[1].question.ko, '');
  assert.strictEqual(visibleQuestions(copy.mokjang.faq.items).length, 4);
});

test('a question that was never saved falls back to the default text', () => {
  const copy = parseSiteCopy({ mokjang: { faq: { items: [{ question: { ko: '새 질문', en: 'New question' } }] } } });
  assert.strictEqual(copy.mokjang.faq.items[0].question.ko, '새 질문');
  assert.strictEqual(copy.mokjang.faq.items[0].answer.ko, DEFAULT_SITE_COPY.mokjang.faq.items[0].answer.ko);
  assert.strictEqual(copy.mokjang.faq.items[1].question.ko, DEFAULT_SITE_COPY.mokjang.faq.items[1].question.ko);
});

test('a cleared life class card drops off the page', () => {
  const items = [{ title: { ko: '', en: '' }, body: { ko: '', en: '' } }, DEFAULT_SITE_COPY.mokjang.study.items[1]];
  const copy = parseSiteCopy({ mokjang: { study: { items } } });
  assert.deepStrictEqual(
    visibleStudies(copy.mokjang.study.items).map((item) => item.title.ko),
    ['그 밖의 삶공부']
  );
});

test('editing one house church field keeps the rest', () => {
  const copy = parseSiteCopy({ mokjang: { hero: { title: { ko: '새 제목', en: 'New title' } } } });
  assert.strictEqual(copy.mokjang.hero.title.ko, '새 제목');
  assert.strictEqual(copy.mokjang.hero.lead.ko, DEFAULT_SITE_COPY.mokjang.hero.lead.ko);
  assert.deepStrictEqual(copy.mokjang.evening.steps, DEFAULT_SITE_COPY.mokjang.evening.steps);
});

test('English copy falls back to Korean when left empty', () => {
  assert.strictEqual(localizeOr({ ko: '질문', en: ' ' }, 'en'), '질문');
  assert.strictEqual(localizeOr({ ko: '질문', en: 'Question' }, 'en'), 'Question');
  assert.strictEqual(localizeOr({ ko: '질문', en: 'Question' }, 'ko'), '질문');
});
