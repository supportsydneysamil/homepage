const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');

const contextOf = () => ({ res: null, log: Object.assign(() => {}, { error: () => {} }) });

const deps = (groupIds) => ({
  getGraphToken: async () => ({ token: 'token' }),
  getUserGroupIds: async () => ({ groupIds }),
});

test('returns cumulative roles for an admin group member', async () => {
  process.env.SAMIL_GROUP_ADMIN_ID = 'g-admin';
  const context = contextOf();
  await handler(context, { body: { userDetails: 'a@church.org' } }, deps(['g-admin']));
  assert.deepStrictEqual(context.res.body.roles.sort(), ['admin', 'editor', 'member']);
});

test('returns an empty role list for a user in no church group', async () => {
  const context = contextOf();
  await handler(context, { body: { userDetails: 'b@church.org' } }, deps(['g-unrelated']));
  assert.deepStrictEqual(context.res.body.roles, []);
});

test('returns empty roles rather than failing when Graph is unavailable', async () => {
  const context = contextOf();
  await handler(context, { body: { userDetails: 'c@church.org' } }, {
    getGraphToken: async () => ({ error: { status: 503, detail: 'down' } }),
    getUserGroupIds: async () => ({ groupIds: [] }),
  });
  assert.strictEqual(context.res.status, 200);
  assert.deepStrictEqual(context.res.body.roles, []);
});

test('rejects a request without an identifiable user', async () => {
  const context = contextOf();
  await handler(context, { body: {} }, deps(['g-admin']));
  assert.strictEqual(context.res.status, 400);
});
