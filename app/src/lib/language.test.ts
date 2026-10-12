import test from 'node:test';
import assert from 'node:assert';
import { isCrawler, pickInitialLanguage } from './language';

test('a stored choice wins over the browser languages', () => {
  assert.strictEqual(pickInitialLanguage('en', ['ko-KR']), 'en');
  assert.strictEqual(pickInitialLanguage('ko', ['en-AU']), 'ko');
});

test('any Korean entry in the browser languages picks Korean', () => {
  assert.strictEqual(pickInitialLanguage(null, ['ko-KR', 'en-AU']), 'ko');
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'ko']), 'ko');
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'KO-kr']), 'ko');
});

test('browser languages without Korean pick English', () => {
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'en']), 'en');
  assert.strictEqual(pickInitialLanguage('fr', ['zh-CN']), 'en');
  assert.strictEqual(pickInitialLanguage(null, ['kok-IN']), 'en');
});

test('no browser language information keeps Korean', () => {
  assert.strictEqual(pickInitialLanguage(null, []), 'ko');
  assert.strictEqual(pickInitialLanguage(null, undefined), 'ko');
});

test('search engine and link preview crawlers are recognised', () => {
  const crawlers = [
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.175 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)',
    'Mozilla/5.0 (compatible; Daum/4.1; +http://cs.daum.net/faq/15/4118.html)',
    'facebookexternalhit/1.1; kakaotalk-scrap/1.0; +https://devtalk.kakao.com/t/scrap/33984',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  ];
  for (const userAgent of crawlers) {
    assert.strictEqual(isCrawler(userAgent), true, userAgent);
  }
});

test('ordinary browsers are not crawlers', () => {
  const browsers = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  ];
  for (const userAgent of browsers) {
    assert.strictEqual(isCrawler(userAgent), false, userAgent);
  }
});
