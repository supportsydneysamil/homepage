const test = require('node:test');
const assert = require('node:assert');
const { getClientPrincipal, requireRole } = require('./principal');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');

const requestFor = (roles) => ({
  headers: {
    'x-ms-client-principal': encode({
      userId: 'u1',
      userDetails: 'person@church.org',
      identityProvider: 'aad',
      userRoles: roles,
    }),
  },
});

test('decodes the client principal header', () => {
  const principal = getClientPrincipal(requestFor(['member']));
  assert.strictEqual(principal.userDetails, 'person@church.org');
});

test('returns null when the header is absent', () => {
  assert.strictEqual(getClientPrincipal({ headers: {} }), null);
});

test('returns null when the header is not valid base64 json', () => {
  assert.strictEqual(getClientPrincipal({ headers: { 'x-ms-client-principal': 'not-json' } }), null);
});

test('requireRole allows a matching role', () => {
  const result = requireRole(requestFor(['editor', 'member']), 'editor');
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.principal.userId, 'u1');
});

test('requireRole rejects a member attempting an editor action', () => {
  const result = requireRole(requestFor(['member']), 'editor');
  assert.strictEqual(result.error.status, 403);
});

test('requireRole rejects an anonymous request with 401', () => {
  const result = requireRole({ headers: {} }, 'member');
  assert.strictEqual(result.error.status, 401);
});

test('requireRole does not infer hierarchy from a single role', () => {
  const result = requireRole(requestFor(['admin', 'editor', 'member']), 'admin');
  assert.strictEqual(result.error, undefined);
});
