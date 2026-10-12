const test = require('node:test');
const assert = require('node:assert');
const { isSocialUrl, socialLinksError } = require('./social');

const ERROR = 'Social links must be https links to Instagram, YouTube, KakaoTalk Channel, or Facebook.';

test('accepts each channel on its own https hosts', () => {
  assert.ok(isSocialUrl('instagram', 'https://instagram.com/sydneysamil'));
  assert.ok(isSocialUrl('youtube', 'https://m.youtube.com/@sydneysamil'));
  assert.ok(isSocialUrl('kakao', 'https://pf.kakao.com/_abc/chat'));
  assert.ok(isSocialUrl('facebook', 'https://www.facebook.com/sydneysamil'));
});

test('rejects other hosts, http, long links, and unknown channels', () => {
  assert.ok(!isSocialUrl('instagram', 'http://instagram.com/a'));
  assert.ok(!isSocialUrl('kakao', 'https://open.kakao.com/o/abc'));
  assert.ok(!isSocialUrl('youtube', `https://youtube.com/${'a'.repeat(300)}`));
  assert.ok(!isSocialUrl('tiktok', 'https://tiktok.com/@a'));
});

test('church info without social links has no error', () => {
  assert.strictEqual(socialLinksError({}), null);
  assert.strictEqual(socialLinksError({ social: { instagram: '', youtube: '   ' } }), null);
});

test('one invalid social link is an error', () => {
  assert.strictEqual(socialLinksError({ social: { facebook: 'https://example.com/page' } }), ERROR);
});
