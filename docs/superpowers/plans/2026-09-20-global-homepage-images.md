# Global Homepage Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let administrators replace the homepage hero church photo and the lead pastor portrait from Global Settings, without a deploy and without turning the page into a homepage editor.

**Architecture:** Persist nullable `site/` blob paths on the existing `SiteSettings` row. Public GET returns those paths plus derived public URLs. The current theme provider loads that payload once and exposes image URLs to `HomeHero` and `PastorFeature`. Administrators upload JPEG/PNG/WebP through the existing SAS flow into a public `site` folder, then save theme and both image choices in one PUT. Built-in `/church-bg.png` and `/pastor.jpg` remain fallbacks. No cropper, focal-point control, media library, or theme-background wiring.

**Tech Stack:** Azure Functions Node 20, mssql, `@azure/storage-blob`, Next.js Pages Router, React 18, TypeScript 5, node:test / tsx.

## Global Constraints

- Church photo applies only to the arched `HomeHero` frame; pastor photo applies only to `PastorFeature`.
- Do not change the `church` theme page background, visit map fallback, theme preview artwork, or other-page title heroes.
- No focal-point or crop editing, galleries, seasonal heroes, or homepage builder UI.
- No new runtime dependency.
- JPEG, PNG, and WebP only for `site` uploads; 25 MB server-side maximum.
- Only `admin` may request `site/` upload URLs or save/reset settings.
- Reading site settings remains public.
- Korean/English copy, existing themes, authentication, and static export stay intact.
- `useTheme` remains a thin wrapper so existing theme consumers do not change.
- Persist blob paths, not complete storage URLs.

## File map

- `api/shared/db.js` — add nullable `HeroImagePath` and `PastorImagePath` idempotently.
- `api/shared/blob.js` — add public `site` folder with image-only validation.
- `api/files-upload-url/index.js` — require admin for `site`.
- `api/site-settings/index.js` — return and save image paths; derive public URLs; delete replaced `site/` blobs.
- `app/src/lib/uploadFile.ts` — accept `site` and restrict its types.
- `app/src/lib/siteSettings.ts` — defaults, parsing, payload, preview helpers.
- `app/src/lib/ThemeContext.tsx` — load full settings; keep `useTheme`.
- `app/src/components/SitePhoto.tsx` — one-shot fallback to the built-in asset on load error.
- `app/src/components/home/HomeHero.tsx` and `PastorFeature.tsx` — consume resolved URLs.
- `app/src/pages/settings.tsx` and `app/src/styles/globals.css` — compact Homepage photos block with framed previews and reset.

---

### Task 1: SiteSettings image columns

**Files:**
- Modify: `api/shared/db.js`
- Modify: `api/shared/db.test.js`

**Interfaces:**
- Produces: `SCHEMA_SQL` includes `COL_LENGTH('dbo.SiteSettings', 'HeroImagePath')` and `PastorImagePath`, each `NVARCHAR(400) NULL`.

- [ ] **Step 1: Write the failing schema tests**

Add to `api/shared/db.test.js`:

```js
test('site settings gain nullable homepage image path columns', () => {
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.SiteSettings', 'HeroImagePath')"));
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.SiteSettings', 'PastorImagePath')"));
  assert.ok(SCHEMA_SQL.includes('HeroImagePath NVARCHAR(400) NULL'));
  assert.ok(SCHEMA_SQL.includes('PastorImagePath NVARCHAR(400) NULL'));
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd api && node --test shared/db.test.js`

Expected: FAIL because those column names are absent from `SCHEMA_SQL`.

- [ ] **Step 3: Add the columns idempotently**

Append after the `SiteSettings` create block in `api/shared/db.js`:

```sql
IF COL_LENGTH('dbo.SiteSettings', 'HeroImagePath') IS NULL
  ALTER TABLE dbo.SiteSettings ADD HeroImagePath NVARCHAR(400) NULL;

IF COL_LENGTH('dbo.SiteSettings', 'PastorImagePath') IS NULL
  ALTER TABLE dbo.SiteSettings ADD PastorImagePath NVARCHAR(400) NULL;
```

- [ ] **Step 4: Re-run the test**

Run: `cd api && node --test shared/db.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/shared/db.js api/shared/db.test.js
git commit -m "Add homepage image path columns to site settings."
```

---

### Task 2: Public `site` upload folder

**Files:**
- Modify: `api/shared/blob.js`
- Modify: `api/shared/blob.test.js`

**Interfaces:**
- Produces: `SITE_FOLDER = 'site'`; `ALLOWED_FOLDERS` includes `'site'`; `isPublicFolder('site') === true`; `containerFor('site')` uses the media container; `validateUploadRequest` accepts JPEG/PNG/WebP up to `MAX_UPLOAD_BYTES` for `site` and rejects PDF/audio there.
- Do not treat `site` as media. Keep audio/video types exclusive to `media`. Use `folder === MEDIA_FOLDER` for media type rules, not `isPublicFolder`.

- [ ] **Step 1: Write failing tests**

Add to `api/shared/blob.test.js`:

```js
test('accepts a jpeg in the public site folder', () => {
  const result = validateUploadRequest({
    folder: 'site',
    fileName: 'church.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 2048,
  });
  assert.strictEqual(result.error, undefined);
  assert.ok(result.value.blobPath.startsWith('site/'));
});

test('rejects a pdf in the site folder', () => {
  assert.ok(
    validateUploadRequest({
      folder: 'site',
      fileName: 'a.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
    }).error
  );
});

test('site uses the public media container', () => {
  process.env.AZURE_STORAGE_CONTAINER = 'church-files';
  process.env.AZURE_STORAGE_MEDIA_CONTAINER = 'samilmedia';
  assert.strictEqual(containerFor('site'), 'samilmedia');
  assert.strictEqual(isPublicFolder('site'), true);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd api && node --test shared/blob.test.js`

Expected: FAIL because `site` is not an allowed folder.

- [ ] **Step 3: Implement `site` in `blob.js`**

```js
const SITE_FOLDER = 'site';
const ALLOWED_FOLDERS = ['resources', 'sermons', 'events', MEDIA_FOLDER, SITE_FOLDER];
const ALLOWED_SITE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const isPublicFolder = (folder) => folder === MEDIA_FOLDER || folder === SITE_FOLDER;

const validateUploadRequest = (input) => {
  const request = input || {};
  const folder = String(request.folder || '').trim().toLowerCase();
  const contentType = String(request.contentType || '').trim().toLowerCase();
  const sizeBytes = Number(request.sizeBytes);

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return { error: `Folder must be one of: ${ALLOWED_FOLDERS.join(', ')}.` };
  }

  const isMedia = folder === MEDIA_FOLDER;
  const isSite = folder === SITE_FOLDER;
  const allowedTypes = isMedia
    ? ALLOWED_MEDIA_CONTENT_TYPES
    : isSite
      ? ALLOWED_SITE_CONTENT_TYPES
      : ALLOWED_CONTENT_TYPES;
  const maxBytes = isMedia ? MAX_MEDIA_BYTES : MAX_UPLOAD_BYTES;
  const typeError = isMedia
    ? 'File type is not allowed. Upload an MP3, M4A, WAV, MP4, or WebM recording.'
    : isSite
      ? 'File type is not allowed. Upload a JPEG, PNG, or WebP image.'
      : 'File type is not allowed. Upload PDF, image, Word, or PowerPoint files.';

  if (!allowedTypes.includes(contentType)) {
    return { error: typeError };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > maxBytes) {
    return { error: `File must be larger than 0 and at most ${maxBytes} bytes.` };
  }

  return {
    value: {
      folder,
      blobPath: buildBlobPath(folder, request.fileName, crypto.randomUUID()),
      contentType,
    },
  };
};
```

Export `SITE_FOLDER`. Leave `publicUrlFor` unchanged; it already encodes paths in the media container.

- [ ] **Step 4: Re-run blob tests**

Run: `cd api && node --test shared/blob.test.js`

Expected: PASS. Existing media/resources cases still pass.

- [ ] **Step 5: Commit**

```bash
git add api/shared/blob.js api/shared/blob.test.js
git commit -m "Allow public site image uploads."
```

---

### Task 3: Admin-only `site` upload URLs

**Files:**
- Modify: `api/files-upload-url/index.js`
- Create: `api/files-upload-url/index.test.js`

**Interfaces:**
- Consumes: `validateUploadRequest`, `ROLES.ADMIN`, `ROLES.EDITOR`.
- Produces: editors may still request `events`/`resources`/`sermons`/`media` URLs; only `admin` may request `site`.

- [ ] **Step 1: Write failing handler tests**

Create `api/files-upload-url/index.test.js` using the principal encoding pattern from `api/event-images/index.test.js`. Inject `createUploadSas`.

```js
const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');
const contextOf = () => ({ res: null, log: Object.assign(() => {}, { error: () => {} }) });
const requestFor = (roles, folder) => ({
  method: 'POST',
  headers: roles
    ? { 'x-ms-client-principal': encode({ userId: 'u1', userDetails: 'e@church.org', userRoles: roles }) }
    : {},
  body: { folder, fileName: 'church.jpg', contentType: 'image/jpeg', sizeBytes: 100 },
});

test('an admin can request a site upload url', async () => {
  const context = contextOf();
  await handler(context, requestFor(['admin', 'editor', 'member'], 'site'), {
    createUploadSas: async () => 'https://example.test/upload',
  });
  assert.strictEqual(context.res.status, 200);
  assert.ok(context.res.body.blobPath.startsWith('site/'));
  assert.ok(context.res.body.publicUrl);
});

test('an editor cannot request a site upload url', async () => {
  const context = contextOf();
  await handler(context, requestFor(['editor', 'member'], 'site'), {
    createUploadSas: async () => 'https://example.test/upload',
  });
  assert.strictEqual(context.res.status, 403);
});

test('an editor can still request an events upload url', async () => {
  const context = contextOf();
  await handler(context, requestFor(['editor', 'member'], 'events'), {
    createUploadSas: async () => 'https://example.test/upload',
  });
  assert.strictEqual(context.res.status, 200);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd api && node --test files-upload-url/index.test.js`

Expected: FAIL because the handler always uses `ROLES.EDITOR` and does not accept `deps`.

- [ ] **Step 3: Gate `site` on admin and accept deps**

```js
module.exports = async function (context, req, deps = { createUploadSas }) {
  const folder = String((req.body && req.body.folder) || '').trim().toLowerCase();
  const auth = requireRole(req, folder === 'site' ? ROLES.ADMIN : ROLES.EDITOR);
  if (auth.error) {
    context.res = { status: auth.error.status, body: auth.error.body };
    return;
  }

  const parsed = validateUploadRequest(req.body);
  if (parsed.error) {
    context.res = { status: 400, body: { error: parsed.error } };
    return;
  }

  try {
    const uploadUrl = await deps.createUploadSas(
      parsed.value.blobPath,
      parsed.value.contentType,
      parsed.value.folder
    );
    context.res = {
      status: 200,
      body: {
        uploadUrl,
        blobPath: parsed.value.blobPath,
        publicUrl: isPublicFolder(parsed.value.folder) ? publicUrlFor(parsed.value.blobPath) : null,
        expiresInSeconds: UPLOAD_SAS_SECONDS,
      },
    };
  } catch (error) {
    context.log.error('files-upload-url error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to issue an upload URL.' } };
  }
};
```

- [ ] **Step 4: Re-run the tests**

Run: `cd api && node --test files-upload-url/index.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/files-upload-url/index.js api/files-upload-url/index.test.js
git commit -m "Restrict site image uploads to administrators."
```

---

### Task 4: Site settings GET/PUT with image paths

**Files:**
- Modify: `api/site-settings/index.js`
- Modify: `api/site-settings/index.test.js`

**Interfaces:**
- Consumes: `publicUrlFor`, `deleteBlob`, `SITE_FOLDER`.
- Produces:
  - `isSiteImagePath(value)` — true only for `site/...` paths with no `..`.
  - GET body: `{ themeId, heroImagePath, pastorImagePath, heroImageUrl, pastorImageUrl, updatedAt, updatedBy }`. Null paths yield null URLs.
  - PUT body: `{ themeId, heroImagePath, pastorImagePath }`. Both image fields are required. `null` resets. Non-null must pass `isSiteImagePath`.
  - After a successful PUT, if a previous path started with `site/` and changed, call `deleteBlob(previous, 'site')` best-effort.

- [ ] **Step 1: Write failing API tests**

Replace source-sniff-only coverage with injected-handler tests, keeping the supported-theme export check. Pattern:

```js
const handler = require('./index');
const { SUPPORTED_THEMES } = handler;

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

test('public get returns derived image urls and null paths by default', async () => {
  const context = contextOf();
  await handler(context, { method: 'GET', headers: {} }, {
    getCurrentSettings: async () => ({
      themeId: 'church',
      heroImagePath: null,
      pastorImagePath: null,
      updatedAt: null,
      updatedBy: null,
    }),
  });
  assert.strictEqual(context.res.status, 200);
  assert.strictEqual(context.res.body.heroImagePath, null);
  assert.strictEqual(context.res.body.heroImageUrl, null);
  assert.strictEqual(context.res.body.pastorImageUrl, null);
});

test('an admin can save site image paths', async () => {
  const context = contextOf();
  const saved = [];
  await handler(
    context,
    adminReq('PUT', {
      themeId: 'light',
      heroImagePath: 'site/abc-church.jpg',
      pastorImagePath: null,
    }),
    {
      getCurrentSettings: async () => ({
        themeId: 'church',
        heroImagePath: null,
        pastorImagePath: 'site/old-pastor.jpg',
        updatedAt: null,
        updatedBy: null,
      }),
      saveSettings: async (next) => {
        saved.push(next);
        return { ...next, updatedAt: '2026-09-20T00:00:00.000Z', updatedBy: 'admin@church.org' };
      },
      deleteBlob: async () => {},
      publicUrlFor: (path) => `https://example.test/${path}`,
    }
  );
  assert.strictEqual(context.res.status, 200);
  assert.strictEqual(saved[0].heroImagePath, 'site/abc-church.jpg');
  assert.strictEqual(saved[0].pastorImagePath, null);
  assert.strictEqual(context.res.body.heroImageUrl, 'https://example.test/site/abc-church.jpg');
});

test('rejects an events path as a homepage image', async () => {
  const context = contextOf();
  await handler(
    context,
    adminReq('PUT', { themeId: 'church', heroImagePath: 'events/photo.jpg', pastorImagePath: null }),
    { saveSettings: async () => ({}), deleteBlob: async () => {} }
  );
  assert.strictEqual(context.res.status, 400);
});

test('an editor cannot save site settings', async () => {
  const context = contextOf();
  const req = adminReq('PUT', { themeId: 'church', heroImagePath: null, pastorImagePath: null });
  req.headers['x-ms-client-principal'] = encode({
    userId: 'u2',
    userDetails: 'e@church.org',
    userRoles: ['editor', 'member'],
  });
  await handler(context, req, { saveSettings: async () => ({}) });
  assert.strictEqual(context.res.status, 403);
});
```

Also assert that replacing `site/old-pastor.jpg` with `null` attempts `deleteBlob('site/old-pastor.jpg', 'site')`, and that a `deleteBlob` throw still returns 200.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd api && node --test site-settings/index.test.js`

Expected: FAIL because GET/PUT only handle `themeId`.

- [ ] **Step 3: Implement settings read/write**

```js
const isSiteImagePath = (value) => {
  const path = String(value || '');
  return path.startsWith('site/') && !path.includes('..');
};

const parseImagePath = (value) => {
  if (value === null) return { value: null };
  if (typeof value !== 'string' || !isSiteImagePath(value)) {
    return { error: 'Image path must be an uploaded file inside the site folder.' };
  }
  return { value };
};

const withUrls = (row, publicUrlFor) => ({
  themeId: row.themeId,
  heroImagePath: row.heroImagePath || null,
  pastorImagePath: row.pastorImagePath || null,
  heroImageUrl: row.heroImagePath ? publicUrlFor(row.heroImagePath) : null,
  pastorImageUrl: row.pastorImagePath ? publicUrlFor(row.pastorImagePath) : null,
  updatedAt: row.updatedAt,
  updatedBy: row.updatedBy,
});
```

SELECT and MERGE must include `HeroImagePath` and `PastorImagePath`. Inject `getCurrentSettings`, `saveSettings`, `deleteBlob`, and `publicUrlFor` with production defaults.

On PUT, require `SUPPORTED_THEMES.includes(themeId)` and `'heroImagePath' in req.body && 'pastorImagePath' in req.body`. After `saveSettings`, try:

```js
const cleanup = async (previous, next, folder) => {
  if (previous && previous !== next && String(previous).startsWith('site/')) {
    try {
      await deps.deleteBlob(previous, folder);
    } catch (error) {
      context.log.error('site image cleanup failed:', (error && error.message) || error);
    }
  }
};
```

- [ ] **Step 4: Re-run the tests**

Run: `cd api && node --test site-settings/index.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/site-settings/index.js api/site-settings/index.test.js
git commit -m "Save homepage image paths with site settings."
```

---

### Task 5: Client helpers for site images

**Files:**
- Create: `app/src/lib/siteSettings.ts`
- Create: `app/src/lib/siteSettings.test.ts`
- Modify: `app/src/lib/uploadFile.ts`
- Modify: `app/src/lib/uploadFile.test.ts`

**Interfaces:**
- Produces:
  - `DEFAULT_HERO_IMAGE = '/church-bg.png'`
  - `DEFAULT_PASTOR_IMAGE = '/pastor.jpg'`
  - `parseSiteSettings(data)` → `{ themeId, heroImagePath, pastorImagePath, heroImageUrl, pastorImageUrl }` with defaults applied to URLs.
  - `resolveImageSrc(url, fallback)` — blank/null → fallback.
  - `nextImagePath(pending: 'keep' | 'reset' | { uploadedPath: string }, publishedPath: string | null)` → `string | null`.
  - `UploadFolder` includes `'site'`. `validateFileForUpload` for `site` accepts jpeg/png/webp and rejects pdf.

- [ ] **Step 1: Write failing helper tests**

`app/src/lib/siteSettings.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_HERO_IMAGE,
  DEFAULT_PASTOR_IMAGE,
  parseSiteSettings,
  nextImagePath,
} from './siteSettings';

test('null api urls become built-in paths', () => {
  const settings = parseSiteSettings({ themeId: 'light', heroImagePath: null, pastorImagePath: null });
  assert.strictEqual(settings.themeId, 'light');
  assert.strictEqual(settings.heroImageUrl, DEFAULT_HERO_IMAGE);
  assert.strictEqual(settings.pastorImageUrl, DEFAULT_PASTOR_IMAGE);
});

test('uploaded urls win over defaults', () => {
  const settings = parseSiteSettings({
    themeId: 'church',
    heroImagePath: 'site/a.jpg',
    pastorImagePath: 'site/b.jpg',
    heroImageUrl: 'https://example.test/site/a.jpg',
    pastorImageUrl: 'https://example.test/site/b.jpg',
  });
  assert.strictEqual(settings.heroImageUrl, 'https://example.test/site/a.jpg');
  assert.strictEqual(settings.heroImagePath, 'site/a.jpg');
});

test('reset sends null and keep reuses the published path', () => {
  assert.strictEqual(nextImagePath('reset', 'site/a.jpg'), null);
  assert.strictEqual(nextImagePath('keep', 'site/a.jpg'), 'site/a.jpg');
  assert.strictEqual(nextImagePath({ uploadedPath: 'site/new.jpg' }, 'site/a.jpg'), 'site/new.jpg');
});
```

Add to `uploadFile.test.ts`:

```ts
test('accepts a jpeg in the site folder', () => {
  assert.strictEqual(validateFileForUpload({ size: 1024, type: 'image/jpeg' }, 'site'), null);
});

test('rejects a pdf in the site folder', () => {
  assert.strictEqual(validateFileForUpload({ size: 1024, type: 'application/pdf' }, 'site'), 'badType');
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd app && npx tsx --test src/lib/siteSettings.test.ts src/lib/uploadFile.test.ts`

Expected: FAIL because `siteSettings.ts` does not exist and `UploadFolder` has no `site`.

- [ ] **Step 3: Implement the helpers**

Do not import `ThemeContext` from `siteSettings.ts`. Parse `themeId` as `String(data.themeId || 'church')`. The provider runs `normalizeTheme` on that value.

`uploadFile.ts`:

```ts
export type UploadFolder = 'resources' | 'sermons' | 'events' | 'media' | 'site';
const SITE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const validateFileForUpload = (file, folder = 'resources') => {
  const isMedia = folder === 'media';
  const isSite = folder === 'site';
  const allowed = isMedia
    ? ALLOWED_MEDIA_CONTENT_TYPES
    : isSite
      ? SITE_CONTENT_TYPES
      : ALLOWED_CONTENT_TYPES;
  const maxBytes = isMedia ? MAX_MEDIA_BYTES : MAX_UPLOAD_BYTES;
  // existing empty / tooLarge / badType returns
};
```

- [ ] **Step 4: Re-run the tests**

Run: `cd app && npx tsx --test src/lib/siteSettings.test.ts src/lib/uploadFile.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/siteSettings.ts app/src/lib/siteSettings.test.ts app/src/lib/uploadFile.ts app/src/lib/uploadFile.test.ts
git commit -m "Add client helpers for homepage image settings."
```

---

### Task 6: Load images through the theme provider

**Files:**
- Modify: `app/src/lib/ThemeContext.tsx`
- Modify: `app/src/lib/siteSettings.ts`
- Modify: `app/src/lib/siteSettings.test.ts`

**Interfaces:**
- Consumes: `parseSiteSettings`.
- Produces: context value `{ themeId, isLoading, heroImageUrl, pastorImageUrl, heroImagePath, pastorImagePath, setThemeLocal, saveSettings, refreshTheme }`.
- `saveSettings(payload: { themeId: ThemeId; heroImagePath: string | null; pastorImagePath: string | null })` PUTs JSON and adopts the parsed response.
- `useTheme()` still returns `{ themeId, isLoading, setThemeLocal, saveTheme, refreshTheme }` where `saveTheme(themeId)` calls `saveSettings` with the currently published image paths.

- [ ] **Step 1: Move fetch helpers into `siteSettings.ts` and add a stubbed fetch test**

```ts
export const fetchSiteSettings = async () => {
  const res = await fetch('/api/site-settings', { credentials: 'include' });
  if (!res.ok) throw new Error(`Settings fetch failed (${res.status})`);
  return parseSiteSettings(await res.json());
};

export const putSiteSettings = async (payload: {
  themeId: string;
  heroImagePath: string | null;
  pastorImagePath: string | null;
}) => {
  const res = await fetch('/api/site-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    return { ok: false as const, message: detail.slice(0, 180) || `Settings update failed (${res.status})` };
  }
  return { ok: true as const, settings: parseSiteSettings(await res.json()) };
};
```

Add:

```ts
test('putSiteSettings returns parsed settings when fetch succeeds', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        themeId: 'light',
        heroImagePath: 'site/a.jpg',
        pastorImagePath: null,
        heroImageUrl: 'https://example.test/site/a.jpg',
        pastorImageUrl: null,
      }),
    }) as Response;
  try {
    const result = await putSiteSettings({
      themeId: 'light',
      heroImagePath: 'site/a.jpg',
      pastorImagePath: null,
    });
    assert.strictEqual(result.ok, true);
    if (result.ok) assert.strictEqual(result.settings.heroImagePath, 'site/a.jpg');
  } finally {
    globalThis.fetch = original;
  }
});
```

- [ ] **Step 2: Run tests**

Run: `cd app && npx tsx --test src/lib/siteSettings.test.ts`

Expected: FAIL until `fetchSiteSettings` and `putSiteSettings` exist.

- [ ] **Step 3: Generalize `ThemeProvider`**

On load, call `fetchSiteSettings`. On failure, use `themeId: 'church'` and built-in image URLs/paths. Apply `theme-${themeId}` as today. Expose image URLs to children. Keep `_app.tsx` importing `ThemeProvider` from this file.

- [ ] **Step 4: Type-check**

Run: `cd app && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/ThemeContext.tsx app/src/lib/siteSettings.ts app/src/lib/siteSettings.test.ts
git commit -m "Load homepage images with the shared site settings."
```

---

### Task 7: Homepage photos consume settings URLs

**Files:**
- Create: `app/src/components/SitePhoto.tsx`
- Create: `app/src/lib/sitePhoto.test.ts`
- Modify: `app/src/components/home/HomeHero.tsx`
- Modify: `app/src/components/home/PastorFeature.tsx`

**Interfaces:**
- Produces: `nextSrcOnError(current, fallback)` in `siteSettings.ts` — if `current !== fallback`, return `fallback`; otherwise return `current`.
- `SitePhoto` uses that helper in `onError` once.
- `HomeHero` and `PastorFeature` call `useSiteSettings()` and pass `heroImageUrl` / `pastorImageUrl` plus the matching default fallback. Do not change alt text, copy, or CSS crop.

- [ ] **Step 1: Write the failing fallback test**

```ts
test('a broken remote image falls back once', () => {
  assert.strictEqual(
    nextSrcOnError('https://example.test/site/a.jpg', DEFAULT_HERO_IMAGE),
    DEFAULT_HERO_IMAGE
  );
  assert.strictEqual(nextSrcOnError(DEFAULT_HERO_IMAGE, DEFAULT_HERO_IMAGE), DEFAULT_HERO_IMAGE);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd app && npx tsx --test src/lib/siteSettings.test.ts`

Expected: FAIL until `nextSrcOnError` exists.

- [ ] **Step 3: Implement `SitePhoto` and wire the homepage**

```tsx
const SitePhoto = ({ src, fallback, alt }: { src: string; fallback: string; alt: string }) => {
  const [current, setCurrent] = useState(src);
  useEffect(() => setCurrent(src), [src]);
  return (
    <img
      src={current}
      alt={alt}
      onError={() => setCurrent((now) => nextSrcOnError(now, fallback))}
    />
  );
};
```

Export `useSiteSettings` from `ThemeContext.tsx`. `useTheme` returns the theme subset. `HomeHero` uses `const { heroImageUrl } = useSiteSettings()`. `PastorFeature` uses `pastorImageUrl`.

Keep the static default as the initial render when settings are still loading so `scripts/check-homepage.py` still sees `/church-bg.png` in the export.

- [ ] **Step 4: Type-check**

Run: `cd app && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/SitePhoto.tsx app/src/components/home/HomeHero.tsx app/src/components/home/PastorFeature.tsx app/src/lib/siteSettings.ts app/src/lib/siteSettings.test.ts app/src/lib/ThemeContext.tsx
git commit -m "Show configured homepage photos with built-in fallbacks."
```

---

### Task 8: Global Settings Homepage photos UI

**Files:**
- Modify: `app/src/pages/settings.tsx`
- Modify: `app/src/styles/globals.css`
- Create: `app/src/lib/settingsPhotos.test.ts`

**Interfaces:**
- Consumes: `uploadFile(file, 'site')`, `nextImagePath`, `saveSettings`, published paths/URLs.
- Produces: `previewSrc({ pendingFileUrl, pendingReset, publishedUrl, fallback })`.
- UI: theme grid unchanged; a second `settings-photos` block with two slots only. No crop, drag canvas, or mock homepage.

- [ ] **Step 1: Write failing preview tests**

```ts
test('a newly selected file replaces the published preview', () => {
  assert.strictEqual(
    previewSrc({
      pendingFileUrl: 'blob:preview',
      pendingReset: false,
      publishedUrl: 'https://example.test/site/a.jpg',
      fallback: DEFAULT_HERO_IMAGE,
    }),
    'blob:preview'
  );
});

test('reset preview shows the built-in image', () => {
  assert.strictEqual(
    previewSrc({
      pendingFileUrl: null,
      pendingReset: true,
      publishedUrl: 'https://example.test/site/a.jpg',
      fallback: DEFAULT_HERO_IMAGE,
    }),
    DEFAULT_HERO_IMAGE
  );
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd app && npx tsx --test src/lib/settingsPhotos.test.ts`

Expected: FAIL because `previewSrc` does not exist. Put `previewSrc` in `app/src/lib/siteSettings.ts` or `settingsPhotos.ts` and import it from the page.

- [ ] **Step 3: Implement the compact settings block**

Each slot:

- Korean/English label: 교회 히어로 사진 / Church hero photo, 담임목사 사진 / Pastor photo
- One-line hint: landscape ~4:3 or wider; portrait ~4:5. Do not enforce dimensions.
- Framed `<img>` preview using `previewSrc`
- `<input type="file" accept="image/jpeg,image/png,image/webp">`
- Reset button that sets local `pendingReset` and revokes any object URL

Intro copy: photos appear only on the homepage. Save remains the existing button. On save:

1. `validateFileForUpload` for any selected files.
2. `uploadFile` only for selected files.
3. `saveSettings({ themeId, heroImagePath: nextImagePath(...), pastorImagePath: nextImagePath(...) })`.
4. On success, clear pending files, revoke object URLs, refresh previews from returned URLs.
5. On failure, keep pending files and show the error. Do not PUT if an upload failed.

Disable the save button while saving.

CSS: keep it small. Reuse homepage radii enough to hint at the live frames:

```css
.settings-photos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin: 2rem 0 1.5rem;
}

.settings-photo__frame--hero {
  aspect-ratio: 1.12 / 1;
  overflow: hidden;
  border-radius: 48% 48% 1rem 1rem;
}

.settings-photo__frame--pastor {
  aspect-ratio: 0.9 / 1;
  overflow: hidden;
  border-radius: 1.2rem;
}

.settings-photo__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Do not add sliders, crop handles, or object-position controls.

- [ ] **Step 4: Type-check and lib tests**

Run:

```bash
cd app && npx tsx --test src/lib/*.test.ts && npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/pages/settings.tsx app/src/styles/globals.css app/src/lib/siteSettings.ts app/src/lib/settingsPhotos.test.ts
git commit -m "Add compact homepage photo controls to global settings."
```

---

### Task 9: Verification

**Files:**
- Modify: `scripts/check-homepage.py`
- No new runtime packages.

Keep the homepage `src` default at `/church-bg.png` during loading so the existing export assertion still holds.

- [ ] **Step 1: Run API tests**

Run: `cd api && npm test`

Expected: PASS.

- [ ] **Step 2: Run app tests, typecheck, and production build**

Run:

```bash
cd app && npm test && npm run typecheck && npm run build
python3 scripts/check-homepage.py
```

Expected: PASS. Homepage export still includes `home-hero`, `home-pastor`, and `/church-bg.png`. Settings source includes `settings-photos` and does not include crop/focal-point controls.

Add to `scripts/check-homepage.py`:

```python
settings = SETTINGS_SOURCE.read_text()
require(settings, "settings-photos", "settings page")
require(settings, "settings-photo__frame--hero", "settings page")
require(settings, "settings-photo__frame--pastor", "settings page")
```

- [ ] **Step 3: Manual check**

- Desktop and mobile, Korean and English.
- Default images, uploaded images, reset, failed remote image.
- Light and dark themes: homepage photos change, theme background does not.
- Editor cannot upload `site` files; admin can.
- Save failure leaves the published homepage unchanged.

- [ ] **Step 4: Commit verification-only script changes if any**

```bash
git add scripts/check-homepage.py
git commit -m "Assert global settings exposes framed homepage photo controls."
```

---

## Spec coverage

- Hero frame only / pastor portrait only — Tasks 7–8, constraints.
- No theme background / map / preview / other heroes — Tasks 7–8, verification.
- Compact two-slot UI, framed preview, reset, single save — Task 8.
- No cropper or focal point — Task 8 CSS/UI and verification rejects.
- Nullable paths, derived URLs, `site/` validation — Task 4.
- Public `site` folder, image types, 25 MB, admin-only SAS — Tasks 2–3, 5.
- Best-effort blob delete — Task 4.
- Provider reuse and `useTheme` wrapper — Task 6.
- Fetch/upload/save failure behavior and image `onError` fallback — Tasks 4, 6–8.
- Tests listed in the spec — Tasks 1–9.
