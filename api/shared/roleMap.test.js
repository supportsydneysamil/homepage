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

test('unknown groups grant nothing when a member group is configured', () => {
  assert.deepStrictEqual(resolveRoles(['g-other'], config), []);
});

test('every signed-in user is a member when no member group is configured', () => {
  const openConfig = { memberGroupId: '', editorGroupId: 'g-editor', adminGroupId: 'g-admin' };
  assert.deepStrictEqual(resolveRoles(['g-other'], openConfig), ['member']);
  assert.deepStrictEqual(resolveRoles([], openConfig), ['member']);
});

test('an editor still outranks the open member default', () => {
  const openConfig = { memberGroupId: '', editorGroupId: 'g-editor', adminGroupId: 'g-admin' };
  assert.deepStrictEqual(resolveRoles(['g-editor'], openConfig).sort(), ['editor', 'member']);
});

test('overlapping groups do not duplicate roles', () => {
  assert.deepStrictEqual(resolveRoles(['g-admin', 'g-member'], config).sort(), ['admin', 'editor', 'member']);
});

test('group matching ignores casing of object ids', () => {
  assert.deepStrictEqual(resolveRoles(['G-EDITOR'], config).sort(), ['editor', 'member']);
});

test('with nothing configured a signed-in user is only a member', () => {
  assert.deepStrictEqual(resolveRoles([''], { memberGroupId: '', editorGroupId: '', adminGroupId: '' }), [
    'member',
  ]);
});

test('role constants are stable', () => {
  assert.deepStrictEqual(ROLES, { MEMBER: 'member', EDITOR: 'editor', ADMIN: 'admin' });
});
