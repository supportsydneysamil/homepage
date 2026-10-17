const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');

test('GET checks the resources section before reading applications and stops when blocked', async () => {
  const order = [];
  const blocked = {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
    body: { code: 'SECTION_UNAVAILABLE', error: 'Unavailable.', errorKo: '이용할 수 없습니다.' },
  };
  const context = {
    res: null,
    log: Object.assign(() => {}, { error: () => {} }),
  };

  await handler(
    context,
    { method: 'GET', query: {}, headers: {} },
    {
      guardPublicSection: async (req, section) => {
        order.push(`guard:${section}`);
        return blocked;
      },
      listApplications: async () => {
        order.push('read');
        return [];
      },
    }
  );

  assert.deepStrictEqual(order, ['guard:resources']);
  assert.deepStrictEqual(context.res, blocked);
});
