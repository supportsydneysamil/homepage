import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert';

const read = (name) => readFileSync(new URL(`../out/${name}`, import.meta.url), 'utf8');
const home = read('index.html');

test('the exported homepage is Korean', () => {
  assert.ok(home.includes('<html lang="ko">'));
  assert.ok(home.includes('처음 오셔도'));
});
