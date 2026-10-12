const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');
const { buildContactEmail } = handler;

const base = { name: 'Kim', email: 'kim@example.com', phone: '', message: 'Hello' };

test('a general message keeps the original subject and no topic line', () => {
  const { subject, text } = buildContactEmail({ ...base, topic: 'general' });
  assert.strictEqual(subject, 'Contact form: Kim');
  assert.strictEqual(text, 'Name: Kim\nEmail: kim@example.com\n\nHello');
});

test('a community request is tagged for small-group follow-up', () => {
  const { subject, text } = buildContactEmail({ ...base, topic: 'community', share: 'team' });
  assert.strictEqual(subject, '[목장 연결] Kim');
  assert.ok(text.includes('Topic: Find a community (목장 연결)'));
  assert.ok(!text.includes('Sharing:'));
});

test('a prayer request is tagged and defaults to pastoral staff only', () => {
  const { subject, text } = buildContactEmail({ ...base, phone: '0400 000 000', topic: 'prayer' });
  assert.strictEqual(subject, '[기도 요청] Kim');
  assert.strictEqual(
    text,
    [
      'Name: Kim',
      'Email: kim@example.com',
      'Phone: 0400 000 000',
      'Topic: Prayer request (기도 요청)',
      'Sharing: Pastoral staff only (교역자만 보기)',
      '',
      'Hello',
    ].join('\n')
  );
});

test('a prayer request can allow the prayer team', () => {
  const { text } = buildContactEmail({ ...base, topic: 'prayer', share: 'team' });
  assert.ok(text.includes('Sharing: OK to share with the prayer team (중보기도팀 공유 가능)'));
});

test('unknown topic and share values fall back to the defaults', () => {
  assert.strictEqual(buildContactEmail({ ...base, topic: 'spam' }).subject, 'Contact form: Kim');
  assert.strictEqual(buildContactEmail({ ...base, topic: '__proto__' }).subject, 'Contact form: Kim');
  assert.strictEqual(buildContactEmail({ ...base }).subject, 'Contact form: Kim');
  assert.ok(
    buildContactEmail({ ...base, topic: 'prayer', share: 'everyone' }).text.includes(
      'Sharing: Pastoral staff only (교역자만 보기)'
    )
  );
});

test('the handler is still the default export', () => {
  assert.strictEqual(typeof handler, 'function');
});
