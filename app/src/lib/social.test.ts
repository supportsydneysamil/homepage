import test from 'node:test';
import assert from 'node:assert';
import { parseChurchInfo } from './churchInfo';
import { EMPTY_SOCIAL_LINKS, isSocialUrl, parseSocialLinks, socialLinkList } from './social';

test('church info has no social links by default', () => {
  assert.deepStrictEqual(parseChurchInfo(undefined).social, EMPTY_SOCIAL_LINKS);
  assert.deepStrictEqual(parseChurchInfo({}).social, EMPTY_SOCIAL_LINKS);
});

test('each channel accepts only https links on its own hosts', () => {
  assert.ok(isSocialUrl('instagram', 'https://www.instagram.com/sydneysamil'));
  assert.ok(isSocialUrl('youtube', 'https://www.youtube.com/@sydneysamil'));
  assert.ok(isSocialUrl('kakao', 'https://pf.kakao.com/_abc/chat'));
  assert.ok(isSocialUrl('facebook', 'https://m.facebook.com/sydneysamil'));
  assert.ok(!isSocialUrl('instagram', 'http://www.instagram.com/sydneysamil'));
  assert.ok(!isSocialUrl('instagram', 'https://www.youtube.com/@sydneysamil'));
  assert.ok(!isSocialUrl('kakao', 'https://open.kakao.com/o/abc'));
  assert.ok(!isSocialUrl('facebook', 'https://facebook.com.evil.example/x'));
  assert.ok(!isSocialUrl('youtube', `https://www.youtube.com/${'a'.repeat(300)}`));
  assert.ok(!isSocialUrl('youtube', 'not a url'));
});

test('parsing trims kept links and empties anything invalid', () => {
  assert.deepStrictEqual(
    parseSocialLinks({
      instagram: '  https://www.instagram.com/sydneysamil  ',
      youtube: 'https://example.com/channel',
      kakao: 42,
    }),
    {
      instagram: 'https://www.instagram.com/sydneysamil',
      youtube: '',
      kakao: '',
      facebook: '',
    }
  );
  assert.deepStrictEqual(parseChurchInfo({ social: 'nope' }).social, EMPTY_SOCIAL_LINKS);
});

test('the link list keeps channel order and skips empty channels', () => {
  const list = socialLinkList({
    ...EMPTY_SOCIAL_LINKS,
    facebook: 'https://www.facebook.com/a',
    instagram: 'https://www.instagram.com/a',
  });
  assert.deepStrictEqual(list.map((link) => link.id), ['instagram', 'facebook']);
  assert.strictEqual(list[1].url, 'https://www.facebook.com/a');
  assert.strictEqual(list[1].label.en, 'Facebook');
});
