const test = require('node:test');
const assert = require('node:assert');
const {
  CATEGORIES,
  VISIBILITIES,
  DEFAULT_CATEGORY,
  DEFAULT_VISIBILITY,
  normalizeCategory,
  normalizeVisibility,
  visibleLevelsFor,
  canSee,
} = require('./library');

test('the six library categories are stable', () => {
  assert.deepStrictEqual(CATEGORIES, [
    'bulletin',
    'smallgroup',
    'worship',
    'forms',
    'minutes',
    'newsletter',
  ]);
});

test('visibility runs from public to admin', () => {
  assert.deepStrictEqual(VISIBILITIES, ['public', 'member', 'admin']);
  assert.strictEqual(DEFAULT_VISIBILITY, 'member');
  assert.strictEqual(DEFAULT_CATEGORY, 'bulletin');
});

test('an unknown category falls back to the default', () => {
  assert.strictEqual(normalizeCategory('payroll'), DEFAULT_CATEGORY);
  assert.strictEqual(normalizeCategory(''), DEFAULT_CATEGORY);
  assert.strictEqual(normalizeCategory('WORSHIP'), 'worship');
});

test('an unknown visibility falls back to member, never to public', () => {
  assert.strictEqual(normalizeVisibility('everyone'), 'member');
  assert.strictEqual(normalizeVisibility(''), 'member');
  assert.strictEqual(normalizeVisibility('PUBLIC'), 'public');
  assert.strictEqual(normalizeVisibility('admin'), 'admin');
});

test('an anonymous visitor only sees public files', () => {
  assert.deepStrictEqual(visibleLevelsFor([]), ['public']);
});

test('a member sees public and member files', () => {
  assert.deepStrictEqual(visibleLevelsFor(['authenticated', 'member']).sort(), ['member', 'public']);
});

test('an editor does not gain access to admin files', () => {
  assert.deepStrictEqual(visibleLevelsFor(['member', 'editor']).sort(), ['member', 'public']);
});

test('an admin sees every level', () => {
  assert.deepStrictEqual(visibleLevelsFor(['member', 'editor', 'admin']).sort(), [
    'admin',
    'member',
    'public',
  ]);
});

test('a signed-in user without church roles is still only anonymous-level', () => {
  assert.deepStrictEqual(visibleLevelsFor(['authenticated']), ['public']);
});

test('canSee answers the single-file question', () => {
  assert.strictEqual(canSee('public', []), true);
  assert.strictEqual(canSee('member', []), false);
  assert.strictEqual(canSee('member', ['member']), true);
  assert.strictEqual(canSee('admin', ['member', 'editor']), false);
  assert.strictEqual(canSee('admin', ['member', 'editor', 'admin']), true);
});

test('an unrecognised stored level is treated as member, not public', () => {
  assert.strictEqual(canSee('nonsense', []), false);
  assert.strictEqual(canSee('nonsense', ['member']), true);
});
