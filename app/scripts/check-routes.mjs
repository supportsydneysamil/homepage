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

test('resources page requires the member role', () => {
  assert.deepStrictEqual(find('/resources').allowedRoles, ['member']);
});

test('manage area requires the editor role', () => {
  assert.deepStrictEqual(find('/manage/*').allowedRoles, ['editor']);
});

test('settings requires the admin role', () => {
  assert.deepStrictEqual(find('/settings').allowedRoles, ['admin']);
});

test('public content reads stay anonymous', () => {
  assert.ok(find('/api/events', 'GET').allowedRoles.includes('anonymous'));
  assert.ok(find('/api/sermons', 'GET').allowedRoles.includes('anonymous'));
});

test('content writes require the editor role', () => {
  for (const route of ['/api/events', '/api/sermons', '/api/resources']) {
    const write = routes.find(
      (entry) => entry.route === route && (entry.methods || []).includes('POST')
    );
    assert.deepStrictEqual(write.allowedRoles, ['editor'], `${route} POST must be editor-only`);
  }
});

test('resource listing and downloads require the member role', () => {
  assert.deepStrictEqual(find('/api/resources', 'GET').allowedRoles, ['member']);
  assert.deepStrictEqual(find('/api/files/download/*').allowedRoles, ['member']);
});

test('upload url issuance requires the editor role', () => {
  assert.deepStrictEqual(find('/api/files/upload-url').allowedRoles, ['editor']);
});

test('site settings writes require the admin role', () => {
  assert.deepStrictEqual(find('/api/site-settings', 'PUT').allowedRoles, ['admin']);
});

test('every role-scoped route appears before the catch-all', () => {
  const catchAllIndex = routes.findIndex((entry) => entry.route === '/api/*');
  const scoped = ['/api/events', '/api/sermons', '/api/resources', '/api/files/upload-url'];
  for (const route of scoped) {
    assert.ok(
      routes.findIndex((entry) => entry.route === route) < catchAllIndex,
      `${route} must precede /api/*`
    );
  }
});
