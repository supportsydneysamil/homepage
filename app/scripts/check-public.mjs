import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert';

const publicFile = (name) => new URL(`../public/${name}`, import.meta.url);

test('robots.txt keeps private areas out of search and points to the sitemap', () => {
  const lines = readFileSync(publicFile('robots.txt'), 'utf8').split('\n');
  for (const line of [
    'User-agent: *',
    'Disallow: /manage',
    'Disallow: /settings',
    'Disallow: /profile',
    'Disallow: /login',
    'Sitemap: https://sydneysamil.org/sitemap.xml',
  ]) {
    assert.ok(lines.includes(line), line);
  }
});

test('the sitemap lists every public page and nothing else', () => {
  const sitemap = readFileSync(publicFile('sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepStrictEqual(urls, [
    'https://sydneysamil.org/',
    'https://sydneysamil.org/about',
    'https://sydneysamil.org/worship',
    'https://sydneysamil.org/events',
    'https://sydneysamil.org/sermons',
    'https://sydneysamil.org/resources',
    'https://sydneysamil.org/contact',
  ]);
});

test('the share image and icons are committed', () => {
  for (const name of ['og-image.jpg', 'favicon.ico', 'apple-touch-icon.png']) {
    assert.ok(existsSync(publicFile(name)), name);
  }
});

test('the built-in hero is a light JPEG and the heavy PNG is gone', () => {
  assert.ok(statSync(publicFile('church-hero.jpg')).size < 600 * 1024);
  assert.ok(!existsSync(publicFile('church-bg.png')));
});
