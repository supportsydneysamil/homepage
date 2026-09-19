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

test('a member cannot write events', () => {
  assert.strictEqual(requireRole(requestFor(['member']), 'editor').error.status, 403);
});

test('an editor can write events', () => {
  assert.strictEqual(requireRole(requestFor(['editor', 'member']), 'editor').error, undefined);
});
