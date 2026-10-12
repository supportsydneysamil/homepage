import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert';

const read = (name) => readFileSync(new URL(`../out/${name}`, import.meta.url), 'utf8');
const home = read('index.html');

test('the exported homepage is Korean', () => {
  assert.ok(home.includes('<html lang="ko">'));
  assert.ok(home.includes('처음 오셔도'));
});

test('the exported homepage links the icons and the light hero photo', () => {
  assert.ok(home.includes('rel="icon" href="/favicon.ico"'));
  assert.ok(home.includes('rel="apple-touch-icon" href="/apple-touch-icon.png"'));
  assert.ok(home.includes('/church-hero.jpg'));
  assert.ok(!home.includes('/church-bg.png'));
});
