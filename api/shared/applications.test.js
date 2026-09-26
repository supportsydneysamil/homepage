const test = require('node:test');
const assert = require('node:assert');
const { validateApplicationInput, isMicrosoftFormUrl } = require('./applications');

const formUrl = 'https://forms.office.com/r/church-account';

test('accepts a Microsoft Forms application', () => {
  const result = validateApplicationInput({
    title: '교회 MS 계정 신청',
    description: '교회용 계정이 필요한 분을 위한 신청입니다.',
    formUrl,
    category: 'account',
    visibility: 'member',
    opensOn: '2026-09-01',
    closesOn: '2026-12-31',
    published: true,
    highlightOnHome: true,
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.formUrl, formUrl);
  assert.strictEqual(result.value.category, 'account');
  assert.strictEqual(result.value.visibility, 'member');
  assert.strictEqual(result.value.highlightOnHome, true);
});

test('accepts forms.microsoft.com links', () => {
  assert.strictEqual(isMicrosoftFormUrl('https://forms.microsoft.com/r/abc'), true);
});

test('rejects a form that is not Microsoft Forms', () => {
  const result = validateApplicationInput({
    title: '외부 폼',
    formUrl: 'https://docs.google.com/forms/d/e/abc',
  });
  assert.ok(result.error);
});

test('rejects a form address that is not https', () => {
  assert.strictEqual(isMicrosoftFormUrl('http://forms.office.com/r/abc'), false);
});

test('requires a title', () => {
  assert.ok(validateApplicationInput({ formUrl }).error);
});

test('rejects a closing date before the opening date', () => {
  const result = validateApplicationInput({
    title: '생명의 삶',
    formUrl,
    opensOn: '2026-10-01',
    closesOn: '2026-09-01',
  });
  assert.ok(result.error);
});

test('keeps an unknown category and visibility from becoming public', () => {
  const result = validateApplicationInput({ title: '신청', formUrl, category: 'secret', visibility: 'publicized' });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.category, 'other');
  assert.strictEqual(result.value.visibility, 'member');
  assert.strictEqual(result.value.highlightOnHome, false);
});
