import test from 'node:test';
import assert from 'node:assert';
import type { ApiMokjang } from './contentApi';
import {
  audienceLabel,
  clockLabel,
  contactPrefill,
  dayLabel,
  detailMeeting,
  initialOf,
  languageLabel,
  mokjangContactHref,
  mokjangFormValues,
  mokjangName,
  mokjangPayloadFromForm,
  parseMokjangSlug,
  partOfDay,
  pickText,
  sortMokjangs,
  tileMeeting,
} from './mokjang';

const base: ApiMokjang = {
  id: 'm1',
  slug: 'chiangmai',
  nameKo: '치앙마이 목장',
  nameEn: 'Chiang Mai',
  taglineKo: '',
  taglineEn: '',
  suburb: 'Epping',
  meetingDay: 'fri',
  meetingTime: '19:00',
  audience: 'family',
  language: 'ko',
  kidsWelcome: true,
  missionKo: '',
  missionEn: '',
  storyKo: '',
  storyEn: '',
  published: true,
  coverImage: '',
  images: [],
};

test('names days in both languages', () => {
  assert.strictEqual(dayLabel('fri', 'ko'), '금');
  assert.strictEqual(dayLabel('fri', 'en'), 'Fri');
  assert.strictEqual(dayLabel('sun', 'ko', 'long'), '일요일');
  assert.strictEqual(dayLabel('sun', 'en', 'long'), 'Sunday');
  assert.strictEqual(dayLabel('someday', 'ko'), '');
});

test('splits the day at noon and five in the afternoon', () => {
  assert.strictEqual(partOfDay('11:59'), 'morning');
  assert.strictEqual(partOfDay('12:00'), 'afternoon');
  assert.strictEqual(partOfDay('16:59'), 'afternoon');
  assert.strictEqual(partOfDay('17:00'), 'evening');
  assert.strictEqual(partOfDay('7pm'), null);
});

test('shows a twelve-hour clock', () => {
  assert.strictEqual(clockLabel('19:00', 'ko'), '7:00');
  assert.strictEqual(clockLabel('19:00', 'en'), '7:00 PM');
  assert.strictEqual(clockLabel('00:30', 'en'), '12:30 AM');
  assert.strictEqual(clockLabel('12:15', 'en'), '12:15 PM');
  assert.strictEqual(clockLabel('', 'ko'), '');
});

test('tiles show suburb, short day, and part of day', () => {
  assert.strictEqual(tileMeeting(base, 'ko'), 'Epping · 금 저녁');
  assert.strictEqual(tileMeeting(base, 'en'), 'Epping · Fri evening');
  assert.strictEqual(tileMeeting({ ...base, meetingTime: '' }, 'ko'), 'Epping · 금');
});

test('detail pages show the full day and time before the suburb', () => {
  assert.strictEqual(detailMeeting(base, 'ko'), '금요일 저녁 7:00 · Epping');
  assert.strictEqual(detailMeeting(base, 'en'), 'Friday 7:00 PM · Epping');
  assert.strictEqual(
    detailMeeting({ ...base, meetingDay: 'sat', meetingTime: '10:30' }, 'ko'),
    '토요일 오전 10:30 · Epping'
  );
});

test('labels audience and language, falling back for unknown values', () => {
  assert.strictEqual(audienceLabel('young', 'ko'), '청년·싱글');
  assert.strictEqual(audienceLabel('family', 'en'), 'Couples & families');
  assert.strictEqual(audienceLabel('unknown', 'ko'), '누구나');
  assert.strictEqual(languageLabel('both', 'ko'), '한국어·영어');
  assert.strictEqual(languageLabel('en', 'en'), 'English');
  assert.strictEqual(languageLabel('jp', 'en'), 'Korean');
});

test('English falls back to Korean when the English field is empty', () => {
  assert.strictEqual(pickText('한국어', '', 'en'), '한국어');
  assert.strictEqual(pickText('한국어', 'English', 'en'), 'English');
  assert.strictEqual(pickText('한국어', 'English', 'ko'), '한국어');
  assert.strictEqual(mokjangName({ ...base, nameEn: ' ' }, 'en'), '치앙마이 목장');
});

test('sorts by Korean name in 가나다 order', () => {
  const sorted = sortMokjangs([{ nameKo: '타슈켄트 목장' }, { nameKo: '나이로비 목장' }, { nameKo: '치앙마이 목장' }]);
  assert.deepStrictEqual(
    sorted.map((item) => item.nameKo),
    ['나이로비 목장', '치앙마이 목장', '타슈켄트 목장']
  );
});

test('takes the first character of a name for the default cover', () => {
  assert.strictEqual(initialOf(' 치앙마이 목장'), '치');
  assert.strictEqual(initialOf('Lima'), 'L');
  assert.strictEqual(initialOf(''), '');
});

test('accepts only a safe address name from the query', () => {
  assert.strictEqual(parseMokjangSlug('chiangmai'), 'chiangmai');
  assert.strictEqual(parseMokjangSlug(['lima', 'other']), 'lima');
  assert.strictEqual(parseMokjangSlug('../x'), '');
  assert.strictEqual(parseMokjangSlug(undefined), '');
});

test('links the contact form to one house church', () => {
  assert.strictEqual(mokjangContactHref('chiangmai'), '/contact?topic=community&mokjang=chiangmai');
});

test('starts the message with the house church name', () => {
  assert.strictEqual(contactPrefill('치앙마이 목장', 'ko'), '관심 있는 목장: 치앙마이 목장\n\n');
  assert.strictEqual(contactPrefill('Chiang Mai', 'en'), 'House church I am interested in: Chiang Mai\n\n');
});

test('a new house church form starts with sensible choices', () => {
  assert.deepStrictEqual(mokjangFormValues(null), {
    meetingDay: 'fri',
    audience: 'all',
    language: 'ko',
    kidsWelcome: 'false',
    published: 'true',
  });
});

test('form values round-trip into the API payload', () => {
  const values = mokjangFormValues({ ...base, shepherdName: '김목자' });
  assert.strictEqual(values.kidsWelcome, 'true');
  assert.strictEqual(values.shepherdName, '김목자');
  assert.strictEqual(values.partnerName, '');
  const payload = mokjangPayloadFromForm(values, ['mokjang/a.jpg']);
  assert.strictEqual(payload.nameKo, '치앙마이 목장');
  assert.strictEqual(payload.kidsWelcome, true);
  assert.strictEqual(payload.published, true);
  assert.deepStrictEqual(payload.imageBlobPaths, ['mokjang/a.jpg']);
});

test('an empty form still sends every field', () => {
  const payload = mokjangPayloadFromForm({}, []);
  assert.strictEqual(payload.nameKo, '');
  assert.strictEqual(payload.meetingDay, 'fri');
  assert.strictEqual(payload.audience, 'all');
  assert.strictEqual(payload.language, 'ko');
  assert.strictEqual(payload.kidsWelcome, false);
  assert.strictEqual(payload.published, true);
});
