import test from 'node:test';
import assert from 'node:assert';
import { hasRole } from './useRoles';

const principal = (userRoles: string[]) => ({
  userId: 'u1',
  userDetails: 'a@church.org',
  identityProvider: 'aad',
  userRoles,
});

test('an admin principal satisfies every role', () => {
  const user = principal(['authenticated', 'admin', 'editor', 'member']);
  assert.strictEqual(hasRole(user, 'admin'), true);
  assert.strictEqual(hasRole(user, 'editor'), true);
  assert.strictEqual(hasRole(user, 'member'), true);
});

test('a member principal does not satisfy editor', () => {
  assert.strictEqual(hasRole(principal(['authenticated', 'member']), 'editor'), false);
});

test('a signed-in user with no church group satisfies nothing', () => {
  assert.strictEqual(hasRole(principal(['authenticated']), 'member'), false);
});

test('a null user satisfies nothing', () => {
  assert.strictEqual(hasRole(null, 'member'), false);
  assert.strictEqual(hasRole(undefined, 'admin'), false);
});
