const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { SUPPORTED_THEMES } = require('./index');

const source = readFileSync(path.join(__dirname, 'index.js'), 'utf8');

test('exports the supported theme list', () => {
  assert.deepStrictEqual(SUPPORTED_THEMES, ['dark', 'light', 'church', 'modern-sky', 'modern-sand']);
});

test('no longer checks the Entra Global Administrator directory role', () => {
  assert.ok(!source.includes('global administrator'), 'Global Administrator check must be removed');
  assert.ok(!source.includes('hasGlobalAdminRole'), 'hasGlobalAdminRole must be removed');
});

test('uses the shared admin role guard', () => {
  assert.ok(source.includes('requireRole(req, ROLES.ADMIN)'));
});

test('uses the shared database module rather than its own pool', () => {
  assert.ok(source.includes("require('../shared/db')"));
  assert.ok(!source.includes('parseSqlConnectionString ='), 'connection parsing must live in shared/db.js');
});
