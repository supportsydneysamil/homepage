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

test('the exported homepage has a Korean title and share preview tags', () => {
  assert.match(home, /<title[^>]*>시드니 삼일교회 \| Sydney Samil Church<\/title>/);
  for (const tag of [
    'property="og:title" content="시드니 삼일교회 | Sydney Samil Church"',
    'property="og:image" content="https://sydneysamil.org/og-image.jpg"',
    'property="og:image:width" content="1200"',
    'property="og:locale" content="ko_KR"',
    'name="twitter:card" content="summary_large_image"',
  ]) {
    assert.ok(home.includes(tag), tag);
  }
  assert.ok(!home.includes('og:url'));
  assert.ok(!home.includes('rel="canonical"'));
});

test('other pages export their own Korean titles', () => {
  assert.match(read('sermons.html'), /<title[^>]*>설교 \| 시드니 삼일교회<\/title>/);
  assert.match(read('contact.html'), /<title[^>]*>문의 \| 시드니 삼일교회<\/title>/);
});

test('the exported homepage describes the church for search engines', () => {
  const match = home.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
  assert.ok(match, 'structured data script');
  const data = JSON.parse(match[1]);
  assert.strictEqual(data['@type'], 'Church');
  assert.strictEqual(data.name, '시드니 삼일교회');
});

test('the analytics beacon appears only when a token was set at build time', () => {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  assert.strictEqual(home.includes('static.cloudflareinsights.com/beacon.min.js'), Boolean(token));
  if (token) assert.ok(home.includes(`data-cf-beacon="{&quot;token&quot;:&quot;${token}&quot;}"`));
});

test('controlled house church exports wait for the client availability check', () => {
  const page = read('mokjang.html');
  assert.match(page, /<title[^>]*>목장 \| 시드니 삼일교회<\/title>/);
  assert.ok(page.includes('페이지 공개 여부를 확인하는 중...'));
  assert.ok(!page.includes('집에서 만나는 작은 교회'));
  assert.ok(!page.includes('id="mokjang-list"'));

  const detail = read('mokjang/detail.html');
  assert.match(detail, /<title[^>]*>목장 \| 시드니 삼일교회<\/title>/);
  assert.ok(detail.includes('페이지 공개 여부를 확인하는 중...'));
});
