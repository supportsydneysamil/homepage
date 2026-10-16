const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');
const {
  validateMokjangInput,
  mapMokjang,
  canSeeMembers,
  isMokjangVisible,
  lookupFromQuery,
  isDuplicateKeyError,
} = handler;
const { requireRole } = require('../shared/principal');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');
const requestFor = (roles) => ({
  headers: { 'x-ms-client-principal': encode({ userId: 'u1', userDetails: 'e@church.org', userRoles: roles }) },
});

const complete = {
  nameKo: '치앙마이 목장',
  nameEn: 'Chiang Mai',
  slug: 'chiangmai',
  taglineKo: '아이들 웃음소리가 끊이지 않는 목장',
  suburb: 'Epping',
  meetingDay: 'fri',
  meetingTime: '19:00',
  audience: 'family',
  language: 'ko',
  kidsWelcome: true,
  missionKo: '태국 치앙마이',
  shepherdName: '김목자',
  partnerName: '이목녀',
  published: true,
  imageBlobPaths: ['mokjang/abc-dinner.jpg'],
};

test('accepts a complete house church', () => {
  const result = validateMokjangInput(complete);
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.slug, 'chiangmai');
  assert.strictEqual(result.value.meetingDay, 'fri');
  assert.strictEqual(result.value.kidsWelcome, true);
  assert.strictEqual(result.value.taglineEn, null);
  assert.deepStrictEqual(result.value.imageBlobPaths, ['mokjang/abc-dinner.jpg']);
});

test('keeps no address or phone even when one is sent', () => {
  const result = validateMokjangInput({ ...complete, address: '1 Home St', phone: '0400 000 000' });
  assert.strictEqual('address' in result.value, false);
  assert.strictEqual('phone' in result.value, false);
});

test('builds the address name from the English name', () => {
  assert.strictEqual(validateMokjangInput({ ...complete, slug: '' }).value.slug, 'chiang-mai');
});

test('asks for an address name when there is no English name', () => {
  const result = validateMokjangInput({ ...complete, slug: '', nameEn: '' });
  assert.strictEqual(result.errorKo, '주소 이름을 영어 소문자로 입력해 주세요.');
});

test('rejects an address name with unsafe characters', () => {
  assert.ok(validateMokjangInput({ ...complete, slug: '../etc' }).error);
  assert.ok(validateMokjangInput({ ...complete, slug: '치앙마이' }).error);
});

test('requires the Korean name and the suburb', () => {
  assert.ok(validateMokjangInput({ ...complete, nameKo: ' ' }).error);
  assert.ok(validateMokjangInput({ ...complete, suburb: '' }).error);
});

test('rejects an unknown day or a time that is not HH:MM', () => {
  assert.ok(validateMokjangInput({ ...complete, meetingDay: 'friday' }).error);
  assert.ok(validateMokjangInput({ ...complete, meetingTime: '7pm' }).error);
});

test('defaults audience and language when empty and rejects unknown values', () => {
  const result = validateMokjangInput({ ...complete, audience: '', language: '' });
  assert.strictEqual(result.value.audience, 'all');
  assert.strictEqual(result.value.language, 'ko');
  assert.ok(validateMokjangInput({ ...complete, audience: 'teens' }).error);
  assert.ok(validateMokjangInput({ ...complete, language: 'jp' }).error);
});

test('treats only true as children welcome', () => {
  assert.strictEqual(validateMokjangInput({ ...complete, kidsWelcome: 'true' }).value.kidsWelcome, true);
  assert.strictEqual(validateMokjangInput({ ...complete, kidsWelcome: 'yes' }).value.kidsWelcome, false);
  assert.strictEqual(validateMokjangInput({ ...complete, kidsWelcome: undefined }).value.kidsWelcome, false);
});

test('rejects text over its limit', () => {
  assert.ok(validateMokjangInput({ ...complete, taglineKo: '가'.repeat(121) }).error);
  assert.ok(validateMokjangInput({ ...complete, storyEn: 'a'.repeat(2001) }).error);
  assert.ok(validateMokjangInput({ ...complete, shepherdName: 'a'.repeat(61) }).error);
});

test('rejects a photo outside the mokjang folder', () => {
  assert.ok(validateMokjangInput({ ...complete, imageBlobPaths: ['events/a.jpg'] }).error);
  assert.ok(validateMokjangInput({ ...complete, imageBlobPaths: ['mokjang/../site/a.jpg'] }).error);
});

test('reads a draft flag', () => {
  assert.strictEqual(validateMokjangInput({ ...complete, published: false }).value.published, false);
});

const row = {
  Id: 'm1',
  Slug: 'chiangmai',
  NameKo: '치앙마이 목장',
  NameEn: null,
  TaglineKo: '소개',
  TaglineEn: null,
  Suburb: 'Epping',
  MeetingDay: 'fri',
  MeetingTime: '19:00',
  Audience: 'family',
  MeetingLanguage: 'ko',
  KidsWelcome: true,
  MissionKo: null,
  MissionEn: null,
  StoryKo: null,
  StoryEn: null,
  ShepherdName: '김목자',
  PartnerName: null,
  IsPublished: true,
};

test('leaves out shepherd names for visitors who are not members', () => {
  const mokjang = mapMokjang(row);
  assert.strictEqual('shepherdName' in mokjang, false);
  assert.strictEqual('partnerName' in mokjang, false);
  assert.ok(!JSON.stringify(mokjang).includes('김목자'));
});

test('includes shepherd names for members', () => {
  const mokjang = mapMokjang(row, { includeMembers: true });
  assert.strictEqual(mokjang.shepherdName, '김목자');
  assert.strictEqual(mokjang.partnerName, '');
});

test('a list row carries one cover photo and a single lookup carries all photos', () => {
  const listed = mapMokjang({ ...row, CoverImageId: 'img1' });
  assert.strictEqual(listed.coverImage, '/api/files/download/img1');
  assert.deepStrictEqual(listed.images, []);

  const single = mapMokjang(row, { images: ['/api/files/download/a', '/api/files/download/b'] });
  assert.strictEqual(single.coverImage, '/api/files/download/a');
  assert.strictEqual(single.images.length, 2);

  assert.strictEqual(mapMokjang(row).coverImage, '');
});

test('maps empty optional text to empty strings', () => {
  const mokjang = mapMokjang(row);
  assert.strictEqual(mokjang.nameEn, '');
  assert.strictEqual(mokjang.language, 'ko');
  assert.strictEqual(mokjang.kidsWelcome, true);
  assert.strictEqual(mokjang.published, true);
});

test('only the member role unlocks shepherd names', () => {
  assert.strictEqual(canSeeMembers(null), false);
  assert.strictEqual(canSeeMembers({ userRoles: ['authenticated'] }), false);
  assert.strictEqual(canSeeMembers({ userRoles: ['authenticated', 'member'] }), true);
});

test('a public visitor cannot see a draft house church', () => {
  assert.strictEqual(isMokjangVisible({ IsPublished: 0 }, false), false);
  assert.strictEqual(isMokjangVisible({ IsPublished: 1 }, false), true);
  assert.strictEqual(isMokjangVisible({ IsPublished: 0 }, true), true);
});

test('GET looks up by id first, then slug, otherwise lists', () => {
  assert.deepStrictEqual(lookupFromQuery({ id: ' m1 ', slug: 'a' }), { id: 'm1' });
  assert.deepStrictEqual(lookupFromQuery({ slug: 'chiangmai' }), { slug: 'chiangmai' });
  assert.strictEqual(lookupFromQuery({}), null);
});

test('recognises a duplicate address name from SQL Server', () => {
  assert.strictEqual(isDuplicateKeyError({ number: 2627 }), true);
  assert.strictEqual(isDuplicateKeyError({ originalError: { info: { number: 2601 } } }), true);
  assert.strictEqual(isDuplicateKeyError({ number: 208 }), false);
  assert.strictEqual(isDuplicateKeyError(null), false);
});

test('a member cannot write house churches and an editor can', () => {
  assert.strictEqual(requireRole(requestFor(['member']), 'editor').error.status, 403);
  assert.strictEqual(requireRole(requestFor(['editor', 'member']), 'editor').error, undefined);
});

const contextOf = () => ({ res: null, log: Object.assign(() => {}, { error: () => {} }) });

const getRequest = (roles, query = {}) => ({
  method: 'GET',
  query,
  headers: roles ? requestFor(roles).headers : {},
});

const fakeReads = () => {
  const calls = { list: [], single: [] };
  return {
    calls,
    listMokjangRows: async (includeDrafts) => {
      calls.list.push({ includeDrafts });
      return [{ ...row, ShepherdName: '김목자', IsPublished: 1 }];
    },
    getReadableMokjang: async (lookup, includeDrafts, includeMembers) => {
      calls.single.push({ lookup, includeDrafts, includeMembers });
      return null;
    },
  };
};

test('a signed-out list leaves out shepherd names, hides drafts, and is not cached', async () => {
  const context = contextOf();
  const deps = fakeReads();
  await handler(context, getRequest(null), deps);
  assert.strictEqual(context.res.status, 200);
  assert.strictEqual(context.res.headers['Cache-Control'], 'private, no-store');
  const [listed] = context.res.body.mokjangs;
  assert.strictEqual('shepherdName' in listed, false);
  assert.strictEqual('partnerName' in listed, false);
  assert.deepStrictEqual(deps.calls.list, [{ includeDrafts: false }]);
});

test('a member list includes shepherd names', async () => {
  const context = contextOf();
  await handler(context, getRequest(['authenticated', 'member']), fakeReads());
  assert.strictEqual(context.res.body.mokjangs[0].shepherdName, '김목자');
});

test('an editor list includes drafts', async () => {
  const deps = fakeReads();
  await handler(contextOf(), getRequest(['authenticated', 'editor', 'member']), deps);
  assert.deepStrictEqual(deps.calls.list, [{ includeDrafts: true }]);
});

test('a signed-out slug read asks for no drafts and no shepherd names', async () => {
  const context = contextOf();
  const deps = fakeReads();
  await handler(context, getRequest(null, { slug: 'chiangmai' }), deps);
  assert.deepStrictEqual(deps.calls.single, [
    { lookup: { slug: 'chiangmai' }, includeDrafts: false, includeMembers: false },
  ]);
  assert.deepStrictEqual(context.res.body, { mokjangs: [] });
  assert.strictEqual(context.res.headers['Cache-Control'], 'private, no-store');
});
