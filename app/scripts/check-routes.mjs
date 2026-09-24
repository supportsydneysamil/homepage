import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert';

const config = JSON.parse(readFileSync(new URL('../staticwebapp.config.json', import.meta.url), 'utf8'));
const routes = config.routes;

const find = (route, method) =>
  routes.find((entry) => entry.route === route && (!method || (entry.methods || []).includes(method)));

test('rolesSource is configured', () => {
  assert.strictEqual(config.auth.rolesSource, '/api/roles');
});

test('the api catch-all is the last route', () => {
  assert.strictEqual(routes[routes.length - 1].route, '/api/*');
});

test('roles endpoint is reachable anonymously', () => {
  assert.ok(find('/api/roles').allowedRoles.includes('anonymous'));
});

test('the resource library is reachable anonymously so public files can be shared', () => {
  assert.ok(find('/resources').allowedRoles.includes('anonymous'));
});

test('manage area requires the editor role', () => {
  assert.deepStrictEqual(find('/manage/*').allowedRoles, ['editor']);
});

test('the manage landing page is protected, not only its children', () => {
  assert.deepStrictEqual(find('/manage').allowedRoles, ['editor']);
});

test('the profile landing page is protected, not only its children', () => {
  assert.deepStrictEqual(find('/profile').allowedRoles, ['authenticated']);
});

test('settings requires the admin role', () => {
  assert.deepStrictEqual(find('/settings').allowedRoles, ['admin']);
  assert.deepStrictEqual(find('/manage/settings').allowedRoles, ['admin']);
});

// The editor rule for the rest of the manage area would otherwise swallow the
// settings page, so the admin rule has to be matched first.
test('site settings is matched before the editor-wide manage rule', () => {
  const settingsIndex = routes.findIndex((entry) => entry.route === '/manage/settings');
  const manageIndex = routes.findIndex((entry) => entry.route === '/manage/*');
  assert.ok(settingsIndex >= 0 && settingsIndex < manageIndex);
});

test('public content reads stay anonymous', () => {
  assert.ok(find('/api/events', 'GET').allowedRoles.includes('anonymous'));
  assert.ok(find('/api/sermons', 'GET').allowedRoles.includes('anonymous'));
});

test('content writes require the editor role', () => {
  for (const route of ['/api/events', '/api/sermons', '/api/resources']) {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const write = routes.find(
        (entry) => entry.route === route && (entry.methods || []).includes(method)
      );
      assert.deepStrictEqual(
        write?.allowedRoles,
        ['editor'],
        `${route} ${method} must be editor-only`
      );
    }
  }
});

// Access is decided per file inside the Function, because one library holds
// public, member, and admin material.
test('resource listing and downloads are reachable anonymously', () => {
  assert.ok(find('/api/resources', 'GET').allowedRoles.includes('anonymous'));
  assert.ok(find('/api/files/download/*').allowedRoles.includes('anonymous'));
});

test('upload url issuance requires the editor role', () => {
  assert.deepStrictEqual(find('/api/files/upload-url').allowedRoles, ['editor']);
});

test('removing an event photo requires the editor role', () => {
  assert.deepStrictEqual(find('/api/events/images').allowedRoles, ['editor']);
});

test('site settings writes require the admin role', () => {
  assert.deepStrictEqual(find('/api/site-settings', 'PUT').allowedRoles, ['admin']);
});

test('every role-scoped route appears before the catch-all', () => {
  const catchAllIndex = routes.findIndex((entry) => entry.route === '/api/*');
  const scoped = [
    '/api/events',
    '/api/events/images',
    '/api/sermons',
    '/api/resources',
    '/api/files/upload-url',
  ];
  for (const route of scoped) {
    assert.ok(
      routes.findIndex((entry) => entry.route === route) < catchAllIndex,
      `${route} must precede /api/*`
    );
  }
});
