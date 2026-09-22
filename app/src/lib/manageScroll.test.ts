import test from 'node:test';
import assert from 'node:assert';
import { revealOffset } from './manageScroll';

const viewport = 800;
const header = 64;

test('an editor already under the header stays where it is', () => {
  assert.strictEqual(revealOffset(200, viewport, header), null);
});

test('an editor opened above the fold is pulled down to the header', () => {
  assert.strictEqual(revealOffset(-400, viewport, header), -488);
});

test('an editor opened below the fold is pulled up to the header', () => {
  assert.strictEqual(revealOffset(1200, viewport, header), 1112);
});

test('an editor hidden behind the sticky header moves out from under it', () => {
  assert.strictEqual(revealOffset(20, viewport, header), -68);
});

test('an editor peeking at the bottom edge counts as out of sight', () => {
  assert.strictEqual(revealOffset(760, viewport, header), 672);
});

test('the move lands the editor a margin below the header', () => {
  const top = 1200;
  const offset = revealOffset(top, viewport, header);
  assert.strictEqual(top - (offset ?? 0), header + 24);
});
