const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const handler = require('./index');
const { SUPPORTED_THEMES } = handler;

const source = readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');
const contextOf = () => ({ res: null, log: Object.assign(() => {}, { error: () => {} }) });
const adminReq = (method, body) => ({
  method,
  headers: {
    'x-ms-client-principal': encode({
      userId: 'u1',
      userDetails: 'admin@church.org',
      userRoles: ['admin', 'editor', 'member'],
    }),
  },
  body,
});

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

test('public get returns null image settings by default', async () => {
  const context = contextOf();
  await handler(
    context,
    { method: 'GET', headers: {} },
    {
      getCurrentSettings: async () => ({
        themeId: 'church',
        heroImagePath: null,
        pastorImagePath: null,
        updatedAt: null,
        updatedBy: null,
      }),
      publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
    }
  );
  assert.strictEqual(context.res.status, 200);
  assert.strictEqual(context.res.body.heroImagePath, null);
  assert.strictEqual(context.res.body.heroImageUrl, null);
  assert.strictEqual(context.res.body.pastorImageUrl, null);
  assert.strictEqual(context.res.body.logoImagePath, null);
  assert.strictEqual(context.res.body.logoImageUrl, null);
});

test('an admin can save site image paths and receive public urls', async () => {
  const context = contextOf();
  const saved = [];
  await handler(
    context,
    adminReq('PUT', {
      themeId: 'light',
      heroImagePath: 'site/abc-church.jpg',
      pastorImagePath: null,
      logoImagePath: 'site/logo.png',
    }),
    {
      getCurrentSettings: async () => ({
        themeId: 'church',
        heroImagePath: null,
        pastorImagePath: null,
        updatedAt: null,
        updatedBy: null,
      }),
      saveSettings: async (next) => {
        saved.push(next);
        return { ...next, updatedAt: '2026-09-20T00:00:00.000Z', updatedBy: 'admin@church.org' };
      },
      deleteBlob: async () => {},
      publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
    }
  );
  assert.strictEqual(context.res.status, 200);
  assert.strictEqual(saved[0].heroImagePath, 'site/abc-church.jpg');
  assert.strictEqual(saved[0].pastorImagePath, null);
  assert.strictEqual(saved[0].logoImagePath, 'site/logo.png');
  assert.strictEqual(context.res.body.heroImageUrl, 'https://example.test/site/abc-church.jpg');
  assert.strictEqual(context.res.body.logoImageUrl, 'https://example.test/site/logo.png');
});

test('rejects an image path outside the site folder', async () => {
  const context = contextOf();
  await handler(
    context,
    adminReq('PUT', {
      themeId: 'church',
      heroImagePath: 'events/photo.jpg',
      pastorImagePath: null,
      logoImagePath: null,
    }),
    {
      getCurrentSettings: async () => ({}),
      saveSettings: async () => ({}),
      deleteBlob: async () => {},
    }
  );
  assert.strictEqual(context.res.status, 400);
});

test('an editor cannot save site settings', async () => {
  const context = contextOf();
  const req = adminReq('PUT', {
    themeId: 'church',
    heroImagePath: null,
    pastorImagePath: null,
    logoImagePath: null,
  });
  req.headers['x-ms-client-principal'] = encode({
    userId: 'u2',
    userDetails: 'e@church.org',
    userRoles: ['editor', 'member'],
  });
  await handler(context, req, { saveSettings: async () => ({}) });
  assert.strictEqual(context.res.status, 403);
});

test('replacing a site image deletes the old blob after saving', async () => {
  const context = contextOf();
  const deleted = [];
  await handler(
    context,
    adminReq('PUT', { themeId: 'church', heroImagePath: null, pastorImagePath: null, logoImagePath: null }),
    {
      getCurrentSettings: async () => ({
        themeId: 'church',
        heroImagePath: 'site/old-hero.jpg',
        pastorImagePath: null,
        logoImagePath: 'site/old-logo.png',
      }),
      saveSettings: async (next) => next,
      deleteBlob: async (...args) => deleted.push(args),
      publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
    }
  );
  assert.strictEqual(context.res.status, 200);
  assert.deepStrictEqual(deleted, [
    ['site/old-hero.jpg', 'site'],
    ['site/old-logo.png', 'site'],
  ]);
});

test('blob cleanup failure does not undo saved settings', async () => {
  const context = contextOf();
  await handler(
    context,
    adminReq('PUT', { themeId: 'church', heroImagePath: null, pastorImagePath: null, logoImagePath: null }),
    {
      getCurrentSettings: async () => ({
        themeId: 'church',
        heroImagePath: 'site/old-hero.jpg',
        pastorImagePath: null,
        logoImagePath: null,
      }),
      saveSettings: async (next) => next,
      deleteBlob: async () => {
        throw new Error('storage unavailable');
      },
      publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
    }
  );
  assert.strictEqual(context.res.status, 200);
});

test('public get returns stored church info and site copy', async () => {
  const context = contextOf();
  await handler(
    context,
    { method: 'GET', headers: {} },
    {
      getCurrentSettings: async () => ({
        themeId: 'church',
        heroImagePath: null,
        pastorImagePath: null,
        logoImagePath: null,
        churchInfo: { phone: '0400 111 222' },
        siteCopy: { home: { hero: { lead: { en: 'Hello', ko: '안녕' } } } },
        updatedAt: null,
        updatedBy: null,
      }),
      publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
    }
  );
  assert.strictEqual(context.res.status, 200);
  assert.strictEqual(context.res.body.churchInfo.phone, '0400 111 222');
  assert.strictEqual(context.res.body.siteCopy.home.hero.lead.en, 'Hello');
});

test('an admin can save church info without wiping existing site copy', async () => {
  const context = contextOf();
  const saved = [];
  await handler(
    context,
    adminReq('PUT', {
      themeId: 'church',
      heroImagePath: null,
      pastorImagePath: null,
      logoImagePath: null,
      churchInfo: { phone: '0400 000 000' },
    }),
    {
      getCurrentSettings: async () => ({
        themeId: 'church',
        heroImagePath: null,
        pastorImagePath: null,
        logoImagePath: null,
        churchInfo: { phone: '0433 576 500' },
        siteCopy: { footer: { tagline: { en: 'Keep me' } } },
      }),
      saveSettings: async (next) => {
        saved.push(next);
        return {
          ...next,
          churchInfo: JSON.parse(next.churchInfoJson),
          siteCopy: JSON.parse(next.siteCopyJson),
        };
      },
      deleteBlob: async () => {},
      publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
    }
  );
  assert.strictEqual(context.res.status, 200);
  assert.ok(saved[0].churchInfoJson.includes('0400 000 000'));
  assert.ok(saved[0].siteCopyJson.includes('Keep me'));
});

test('an admin can save image presentation without changing image files', async () => {
  const context = contextOf();
  const saved = [];
  const imagePresentation = {
    hero: { focusX: 32, focusY: 61, zoom: 1.2 },
    pastor: { focusX: 50, focusY: 24, zoom: 1 },
  };
  await handler(
    context,
    adminReq('PUT', {
      themeId: 'church',
      heroImagePath: 'site/hero.jpg',
      pastorImagePath: 'site/pastor.jpg',
      logoImagePath: null,
      imagePresentation,
    }),
    {
      getCurrentSettings: async () => ({
        themeId: 'church',
        heroImagePath: 'site/hero.jpg',
        pastorImagePath: 'site/pastor.jpg',
        logoImagePath: null,
      }),
      saveSettings: async (next) => {
        saved.push(next);
        return { ...next, imagePresentation: JSON.parse(next.imagePresentationJson) };
      },
      deleteBlob: async () => {},
      publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
    }
  );

  assert.strictEqual(context.res.status, 200);
  assert.deepStrictEqual(JSON.parse(saved[0].imagePresentationJson), imagePresentation);
  assert.deepStrictEqual(context.res.body.imagePresentation, imagePresentation);
});

test('rejects church info that is not an object', async () => {
  const context = contextOf();
  await handler(
    context,
    adminReq('PUT', {
      themeId: 'church',
      heroImagePath: null,
      pastorImagePath: null,
      logoImagePath: null,
      churchInfo: 'nope',
    }),
    {
      getCurrentSettings: async () => ({}),
      saveSettings: async () => ({}),
      deleteBlob: async () => {},
    }
  );
  assert.strictEqual(context.res.status, 400);
});

test('rejects a put that omits the logo path', async () => {
  const context = contextOf();
  await handler(
    context,
    adminReq('PUT', { themeId: 'church', heroImagePath: null, pastorImagePath: null }),
    {
      getCurrentSettings: async () => ({}),
      saveSettings: async () => ({}),
      deleteBlob: async () => {},
    }
  );
  assert.strictEqual(context.res.status, 400);
});
