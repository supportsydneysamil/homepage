const test = require('node:test');
const assert = require('node:assert');
const { resolveRoles, ROLES } = require('./roleMap');

const config = {
  memberGroupId: 'g-member',
  editorGroupId: 'g-editor',
  adminGroupId: 'g-admin',
};

test('admin group grants admin, editor, and member', () => {
  assert.deepStrictEqual(resolveRoles(['g-admin'], config).sort(), ['admin', 'editor', 'member']);
});

test('editor group grants editor and member', () => {
  assert.deepStrictEqual(resolveRoles(['g-editor'], config).sort(), ['editor', 'member']);
});

test('member group grants member only', () => {
  assert.deepStrictEqual(resolveRoles(['g-member'], config), ['member']);
});

test('unknown groups grant nothing', () => {
  assert.deepStrictEqual(resolveRoles(['g-other'], config), []);
});

test('overlapping groups do not duplicate roles', () => {
  assert.deepStrictEqual(resolveRoles(['g-admin', 'g-member'], config).sort(), ['admin', 'editor', 'member']);
});

test('group matching ignores casing of object ids', () => {
  assert.deepStrictEqual(resolveRoles(['G-EDITOR'], config).sort(), ['editor', 'member']);
});

test('missing configuration never grants a role', () => {
  assert.deepStrictEqual(resolveRoles([''], { memberGroupId: '', editorGroupId: '', adminGroupId: '' }), []);
});

test('role constants are stable', () => {
  assert.deepStrictEqual(ROLES, { MEMBER: 'member', EDITOR: 'editor', ADMIN: 'admin' });
});
