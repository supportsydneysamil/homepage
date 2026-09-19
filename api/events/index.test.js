const test = require('node:test');
const assert = require('node:assert');
const { validateEventInput } = require('./index');
const { requireRole } = require('../shared/principal');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');
const requestFor = (roles) => ({
  headers: { 'x-ms-client-principal': encode({ userId: 'u1', userDetails: 'e@church.org', userRoles: roles }) },
});

test('accepts a complete event', () => {
  const result = validateEventInput({
    slug: 'christmas-2026',
    date: '2026-12-25',
    title: 'Christmas Service',
    description: 'Christmas worship',
    youtubeUrl: 'https://www.youtube.com/watch?v=abc',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.slug, 'christmas-2026');
});

test('rejects a missing title', () => {
  assert.ok(validateEventInput({ slug: 'a', date: '2026-01-01' }).error);
});

test('rejects the reserved detail slug', () => {
  assert.ok(validateEventInput({ slug: 'detail', date: '2026-01-01', title: 'T' }).error);
});

test('rejects a slug with unsafe characters', () => {
  assert.ok(validateEventInput({ slug: '../etc', date: '2026-01-01', title: 'T' }).error);
});

test('rejects a malformed date', () => {
  assert.ok(validateEventInput({ slug: 'a', date: '25/12/2026', title: 'T' }).error);
});

test('rejects a non-YouTube video url', () => {
  assert.ok(
    validateEventInput({ slug: 'a', date: '2026-01-01', title: 'T', youtubeUrl: 'https://evil.test/x' }).error
  );
});

test('allows an empty video url', () => {
  const result = validateEventInput({ slug: 'a', date: '2026-01-01', title: 'T', youtubeUrl: '' });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.youtubeUrl, null);
});

test('accepts location, start time, draft flag, and event image paths', () => {
  const result = validateEventInput({
    slug: 'youth-retreat',
    date: '2026-08-15',
    title: 'Youth Retreat',
    location: 'Hall',
    startTime: '09:30',
    published: false,
    imageBlobPaths: ['events/photo.jpg'],
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.location, 'Hall');
  assert.strictEqual(result.value.startTime, '09:30');
  assert.strictEqual(result.value.published, false);
  assert.deepStrictEqual(result.value.imageBlobPaths, ['events/photo.jpg']);
});

test('suggests a slug from the title when none is given', () => {
  const result = validateEventInput({ date: '2026-08-15', title: 'Youth Retreat' });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.slug, 'youth-retreat');
});

test('rejects a start time that is not HH:MM', () => {
  assert.ok(validateEventInput({ slug: 'a', date: '2026-01-01', title: 'T', startTime: '9am' }).error);
});

test('rejects an image path outside the events folder', () => {
  assert.ok(
    validateEventInput({
      slug: 'a',
      date: '2026-01-01',
      title: 'T',
      imageBlobPaths: ['resources/photo.jpg'],
    }).error
  );
});

test('attaches download urls to matching events', () => {
  const { assembleEvents } = require('./index');
  const events = assembleEvents(
    [
      {
        Id: 'e1',
        Slug: 'a',
        EventDate: '2026-01-01',
        Title: 'A',
        Description: '',
        YouTubeUrl: '',
        Location: 'Hall',
        StartTime: '10:00',
        IsPublished: true,
      },
    ],
    [{ Id: 'img1', EventId: 'e1' }]
  );
  assert.deepStrictEqual(events[0].images, ['/api/files/download/img1']);
  assert.strictEqual(events[0].location, 'Hall');
});

test('a member cannot write events', () => {
  assert.strictEqual(requireRole(requestFor(['member']), 'editor').error.status, 403);
});

test('an editor can write events', () => {
  assert.strictEqual(requireRole(requestFor(['editor', 'member']), 'editor').error, undefined);
});
