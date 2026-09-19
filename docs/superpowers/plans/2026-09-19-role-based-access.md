# Role-Based Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Sydney Samil Church site three Entra-backed roles (`member`, `editor`, `admin`) so members can download library and sermon files, editors can upload files and maintain events, and admins can change site settings.

**Architecture:** A SWA `rolesSource` Function maps Entra security-group membership to SWA roles at sign-in. Route rules in `staticwebapp.config.json` are the first defence and every write Function re-checks the role from `x-ms-client-principal`. Content moves from build-time JSON into Azure SQL, and files move into a private Blob container reached only through short-lived SAS URLs.

**Tech Stack:** Next.js 16 Pages Router with static export, React 18, TypeScript 5, Azure Static Web Apps, Azure Functions on Node 20 (CommonJS), Azure SQL via `mssql`, Azure Blob Storage via `@azure/storage-blob`, `node --test` for API tests, `tsx --test` for app tests.

## Global Constraints

- Preserve static export (`output: 'export'`), bilingual copy through `useLanguage`, all five themes, and the existing contact and profile Functions.
- Roles are cumulative: `admin` implies `editor` implies `member`.
- Role decisions match Entra group **object IDs** from app settings, never display names.
- Never return a permanent Blob URL to a browser. Every file URL is a SAS that expires in minutes.
- Entra Global Administrator is only for one-time tenant setup and must never be required by application code.
- `staticwebapp.config.json` applies the first matching route, so the `/api/*` catch-all stays last.
- Every write Function independently verifies the role even when a route rule already restricts it.
- Add no new frontend runtime dependency. `@azure/storage-blob` is the only new API dependency.
- All user-visible strings ship in Korean and English.

## Required Azure Configuration

These are performed once by a tenant administrator and are prerequisites for Task 2 onward. They are not code steps.

- Create Entra security groups `Samil-Members`, `Samil-Editors`, `Samil-Admins`; record the three object IDs.
- Grant the existing app registration the application permission `GroupMember.Read.All` with admin consent.
- Create a Storage account and a **private** container named `church-files`.
- Add SWA application settings: `SAMIL_GROUP_MEMBER_ID`, `SAMIL_GROUP_EDITOR_ID`, `SAMIL_GROUP_ADMIN_ID`, `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`, `AZURE_STORAGE_CONTAINER=church-files`.

## File Structure

| File | Responsibility |
|---|---|
| `api/shared/principal.js` | Decode `x-ms-client-principal`, expose role constants and `requireRole` |
| `api/shared/graph.js` | App-only Graph token and group-membership lookup |
| `api/shared/roleMap.js` | Pure group-ID to role-array mapping |
| `api/shared/db.js` | SQL pool and idempotent schema for content tables |
| `api/shared/blob.js` | Container client and short-lived upload/read SAS |
| `api/roles/` | SWA `rolesSource` endpoint |
| `api/events/`, `api/sermons/`, `api/resources/` | Content CRUD with per-method role checks |
| `api/files-upload-url/`, `api/files-download/` | SAS issuance guarded by role |
| `app/src/lib/useRoles.ts` | Client role state from `/.auth/me` |
| `app/src/lib/contentApi.ts` | Typed fetch helpers for content endpoints |
| `app/src/pages/manage/index.tsx` | Editor console |

---

### Task 1: Role mapping and principal guard

**Files:**
- Create: `api/shared/roleMap.js`
- Create: `api/shared/principal.js`
- Test: `api/shared/roleMap.test.js`
- Test: `api/shared/principal.test.js`
- Modify: `api/package.json`

**Interfaces:**
- Produces: `ROLES = { MEMBER: 'member', EDITOR: 'editor', ADMIN: 'admin' }`
- Produces: `resolveRoles(groupIds: string[], config: { memberGroupId, editorGroupId, adminGroupId }): string[]`
- Produces: `getClientPrincipal(req): { userId, userDetails, identityProvider, userRoles } | null`
- Produces: `requireRole(req, role): { principal } | { error: { status, body } }`

- [ ] **Step 1: Add the test script to the API package**

In `api/package.json`, add a `scripts` block above `dependencies`:

```json
  "scripts": {
    "test": "node --test"
  },
```

- [ ] **Step 2: Write the failing role-mapping test**

Create `api/shared/roleMap.test.js`:

```js
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL with `Cannot find module './roleMap'`.

- [ ] **Step 4: Implement the role map**

Create `api/shared/roleMap.js`:

```js
const ROLES = { MEMBER: 'member', EDITOR: 'editor', ADMIN: 'admin' };

const normalize = (value) => String(value || '').trim().toLowerCase();

const resolveRoles = (groupIds, config) => {
  const ids = new Set((groupIds || []).map(normalize).filter(Boolean));
  const memberId = normalize(config.memberGroupId);
  const editorId = normalize(config.editorGroupId);
  const adminId = normalize(config.adminGroupId);

  const roles = new Set();
  if (adminId && ids.has(adminId)) {
    roles.add(ROLES.ADMIN);
    roles.add(ROLES.EDITOR);
    roles.add(ROLES.MEMBER);
  }
  if (editorId && ids.has(editorId)) {
    roles.add(ROLES.EDITOR);
    roles.add(ROLES.MEMBER);
  }
  if (memberId && ids.has(memberId)) {
    roles.add(ROLES.MEMBER);
  }

  return Array.from(roles);
};

module.exports = { ROLES, resolveRoles };
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd api && npm test`
Expected: PASS, 8 tests.

- [ ] **Step 6: Write the failing principal-guard test**

Create `api/shared/principal.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { getClientPrincipal, requireRole } = require('./principal');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');

const requestFor = (roles) => ({
  headers: {
    'x-ms-client-principal': encode({
      userId: 'u1',
      userDetails: 'person@church.org',
      identityProvider: 'aad',
      userRoles: roles,
    }),
  },
});

test('decodes the client principal header', () => {
  const principal = getClientPrincipal(requestFor(['member']));
  assert.strictEqual(principal.userDetails, 'person@church.org');
});

test('returns null when the header is absent', () => {
  assert.strictEqual(getClientPrincipal({ headers: {} }), null);
});

test('returns null when the header is not valid base64 json', () => {
  assert.strictEqual(getClientPrincipal({ headers: { 'x-ms-client-principal': 'not-json' } }), null);
});

test('requireRole allows a matching role', () => {
  const result = requireRole(requestFor(['editor', 'member']), 'editor');
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.principal.userId, 'u1');
});

test('requireRole rejects a member attempting an editor action', () => {
  const result = requireRole(requestFor(['member']), 'editor');
  assert.strictEqual(result.error.status, 403);
});

test('requireRole rejects an anonymous request with 401', () => {
  const result = requireRole({ headers: {} }, 'member');
  assert.strictEqual(result.error.status, 401);
});

test('requireRole does not infer hierarchy from a single role', () => {
  const result = requireRole(requestFor(['admin', 'editor', 'member']), 'admin');
  assert.strictEqual(result.error, undefined);
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL with `Cannot find module './principal'`.

- [ ] **Step 8: Implement the principal guard**

Create `api/shared/principal.js`. The `rolesSource` Function already expands `admin` into `editor` and `member`, so this guard checks for exact membership in `userRoles` rather than recomputing hierarchy:

```js
const { ROLES } = require('./roleMap');

const toSingleHeader = (value) => {
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
};

const getClientPrincipal = (req) => {
  const encoded = toSingleHeader((req.headers || {})['x-ms-client-principal']);
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    if (!parsed || (!parsed.userId && !parsed.userDetails)) return null;
    return {
      userId: parsed.userId || '',
      userDetails: parsed.userDetails || '',
      identityProvider: parsed.identityProvider || '',
      userRoles: Array.isArray(parsed.userRoles) ? parsed.userRoles : [],
    };
  } catch (error) {
    return null;
  }
};

const requireRole = (req, role) => {
  const principal = getClientPrincipal(req);
  if (!principal) {
    return { error: { status: 401, body: { error: 'Sign-in required.', errorKo: '로그인이 필요합니다.' } } };
  }
  if (!principal.userRoles.includes(role)) {
    return {
      error: {
        status: 403,
        body: { error: `Role '${role}' is required.`, errorKo: `'${role}' 권한이 필요합니다.` },
      },
    };
  }
  return { principal };
};

const actorOf = (principal) => principal.userDetails || principal.userId || 'unknown';

module.exports = { ROLES, getClientPrincipal, requireRole, actorOf };
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `cd api && npm test`
Expected: PASS, 15 tests.

- [ ] **Step 10: Commit**

```bash
git add api/package.json api/shared/roleMap.js api/shared/roleMap.test.js api/shared/principal.js api/shared/principal.test.js
git commit -m "Add Entra group role mapping and API role guard"
```

---

### Task 2: rolesSource endpoint

**Files:**
- Create: `api/shared/graph.js`
- Create: `api/roles/index.js`
- Create: `api/roles/function.json`
- Test: `api/roles/index.test.js`
- Modify: `app/staticwebapp.config.json`

**Interfaces:**
- Consumes: `resolveRoles`, `ROLES` from `api/shared/roleMap.js`
- Produces: `getGraphToken(): Promise<{ token } | { error: { status, detail } }>`
- Produces: `getUserGroupIds(userKey: string, token: string): Promise<{ groupIds: string[] } | { error }>`
- Produces: `POST /api/roles` returning `{ roles: string[] }`, the shape SWA requires from a `rolesSource`

- [ ] **Step 1: Implement the Graph helper**

Create `api/shared/graph.js`. This centralises the client-credentials flow that `profile-roles` and `site-settings` currently duplicate:

```js
const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

const getEnv = (name) => process.env[name] || '';

const getGraphToken = async () => {
  const tenantId = getEnv('AZURE_TENANT_ID');
  const clientId = getEnv('AZURE_CLIENT_ID');
  const clientSecret = getEnv('AZURE_CLIENT_SECRET');

  if (!tenantId || !clientId || !clientSecret) {
    return { error: { status: 500, detail: 'Missing AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET.' } };
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: GRAPH_SCOPE,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { error: { status: res.status, detail: detail.slice(0, 200) } };
  }

  const json = await res.json();
  if (!json.access_token) {
    return { error: { status: 500, detail: 'Missing access token from client credentials.' } };
  }
  return { token: json.access_token };
};

const getUserGroupIds = async (userKey, token) => {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userKey)}/memberOf?$select=id&$top=999`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const detail = await res.text();
    return { error: { status: res.status, detail: detail.slice(0, 200) } };
  }

  const json = await res.json();
  return { groupIds: (json.value || []).map((item) => item.id).filter(Boolean) };
};

module.exports = { getGraphToken, getUserGroupIds };
```

- [ ] **Step 2: Write the failing rolesSource test**

Create `api/roles/index.test.js`. The handler takes its dependencies as an optional second argument so the test never calls Graph:

```js
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL with `Cannot find module './index'`.

- [ ] **Step 4: Implement the rolesSource Function**

Create `api/roles/index.js`. A Graph outage must not lock every user out of the public site, so it degrades to no roles rather than an error:

```js
const { resolveRoles } = require('../shared/roleMap');
const defaultGraph = require('../shared/graph');

const getEnv = (name) => process.env[name] || '';

module.exports = async function (context, req, graph = defaultGraph) {
  const body = req.body || {};
  const userKey = body.userDetails || body.userId;

  if (!userKey) {
    context.res = { status: 400, body: { error: 'Missing user identity in rolesSource request.' } };
    return;
  }

  const config = {
    memberGroupId: getEnv('SAMIL_GROUP_MEMBER_ID'),
    editorGroupId: getEnv('SAMIL_GROUP_EDITOR_ID'),
    adminGroupId: getEnv('SAMIL_GROUP_ADMIN_ID'),
  };

  const tokenResult = await graph.getGraphToken();
  if (tokenResult.error) {
    context.log.error('roles: graph token failed', tokenResult.error.detail);
    context.res = { status: 200, body: { roles: [] } };
    return;
  }

  const groupResult = await graph.getUserGroupIds(userKey, tokenResult.token);
  if (groupResult.error) {
    context.log.error('roles: group lookup failed', groupResult.error.detail);
    context.res = { status: 200, body: { roles: [] } };
    return;
  }

  context.res = { status: 200, body: { roles: resolveRoles(groupResult.groupIds, config) } };
};
```

- [ ] **Step 5: Create the Function binding**

Create `api/roles/function.json`:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"],
      "route": "roles"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

- [ ] **Step 6: Register the rolesSource in SWA auth config**

In `app/staticwebapp.config.json`, add `rolesSource` inside the `auth` block so it reads:

```json
  "auth": {
    "rolesSource": "/api/roles",
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/5a8f76db-6b60-455a-8554-083b8f1cd734/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  },
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd api && npm test`
Expected: PASS, 19 tests.

- [ ] **Step 8: Commit**

```bash
git add api/shared/graph.js api/roles app/staticwebapp.config.json
git commit -m "Add rolesSource endpoint mapping Entra groups to SWA roles"
```

---

### Task 3: Route protection

**Files:**
- Modify: `app/staticwebapp.config.json`
- Test: `app/scripts/check-routes.mjs`
- Modify: `app/package.json`

**Interfaces:**
- Consumes: the `rolesSource` added in Task 2
- Produces: route rules that later tasks rely on; `/api/roles` must stay anonymous and the `/api/*` catch-all must stay last

- [ ] **Step 1: Write the failing route-configuration test**

Create `app/scripts/check-routes.mjs`:

```js
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
```

- [ ] **Step 2: Add the route test script**

In `app/package.json`, add to `scripts`:

```json
    "test:routes": "node --test scripts/check-routes.mjs",
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd app && npm run test:routes`
Expected: FAIL on the `/resources` assertion, because no member-scoped route exists yet.

- [ ] **Step 4: Replace the routes array**

In `app/staticwebapp.config.json`, replace the entire `routes` array with the following. Order matters: SWA applies the first match.

```json
  "routes": [
    { "route": "/api/roles", "allowedRoles": ["anonymous", "authenticated"] },
    { "route": "/api/contact", "allowedRoles": ["anonymous", "authenticated"] },
    { "route": "/api/events", "methods": ["GET"], "allowedRoles": ["anonymous", "authenticated"] },
    { "route": "/api/events", "methods": ["POST", "PUT", "DELETE"], "allowedRoles": ["editor"] },
    { "route": "/api/sermons", "methods": ["GET"], "allowedRoles": ["anonymous", "authenticated"] },
    { "route": "/api/sermons", "methods": ["POST", "PUT", "DELETE"], "allowedRoles": ["editor"] },
    { "route": "/api/resources", "methods": ["GET"], "allowedRoles": ["member"] },
    { "route": "/api/resources", "methods": ["POST", "DELETE"], "allowedRoles": ["editor"] },
    { "route": "/api/files/upload-url", "allowedRoles": ["editor"] },
    { "route": "/api/files/download/*", "allowedRoles": ["member"] },
    { "route": "/api/site-settings", "methods": ["GET"], "allowedRoles": ["anonymous", "authenticated"] },
    { "route": "/api/site-settings", "methods": ["PUT"], "allowedRoles": ["admin"] },
    { "route": "/resources", "allowedRoles": ["member"] },
    { "route": "/manage/*", "allowedRoles": ["editor"] },
    { "route": "/settings", "allowedRoles": ["admin"] },
    { "route": "/profile/*", "allowedRoles": ["authenticated"] },
    { "route": "/api/*", "allowedRoles": ["authenticated"] }
  ],
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd app && npm run test:routes`
Expected: PASS, 12 tests.

- [ ] **Step 6: Commit**

```bash
git add app/staticwebapp.config.json app/package.json app/scripts/check-routes.mjs
git commit -m "Protect resource, manage, and settings routes by role"
```

---

### Task 4: Content database layer

**Files:**
- Create: `api/shared/db.js`
- Test: `api/shared/db.test.js`

**Interfaces:**
- Produces: `getPool(): Promise<ConnectionPool>`
- Produces: `ensureSchema(): Promise<void>` creating `dbo.Events`, `dbo.Sermons`, `dbo.Resources`, `dbo.EventImages`, `dbo.SermonFiles`
- Produces: `sql` re-exported from `mssql` so callers do not import it twice
- Produces: `parseSqlConnectionString(value: string): object | null`, moved out of `api/site-settings/index.js`

- [ ] **Step 1: Write the failing connection-string test**

Create `api/shared/db.test.js`. Connection parsing is the only part testable without a live database:

```js
const test = require('node:test');
const assert = require('node:assert');
const { parseSqlConnectionString, SCHEMA_SQL } = require('./db');

test('parses a standard ADO connection string', () => {
  const config = parseSqlConnectionString(
    'Server=tcp:samil.database.windows.net,1433;Initial Catalog=samil;User ID=app;Password=secret;Encrypt=True;'
  );
  assert.strictEqual(config.server, 'samil.database.windows.net');
  assert.strictEqual(config.port, 1433);
  assert.strictEqual(config.database, 'samil');
  assert.strictEqual(config.user, 'app');
  assert.strictEqual(config.options.encrypt, true);
});

test('strips surrounding quotes', () => {
  const config = parseSqlConnectionString('"Server=samil.database.windows.net;Database=samil;User=app;Password=p"');
  assert.strictEqual(config.server, 'samil.database.windows.net');
});

test('returns null for empty input', () => {
  assert.strictEqual(parseSqlConnectionString(''), null);
});

test('schema creates every content table idempotently', () => {
  for (const table of ['Events', 'Sermons', 'Resources', 'EventImages', 'SermonFiles']) {
    assert.ok(SCHEMA_SQL.includes(`dbo.${table}`), `${table} missing from schema`);
    assert.ok(
      SCHEMA_SQL.includes(`OBJECT_ID('dbo.${table}', 'U') IS NULL`),
      `${table} creation is not guarded`
    );
  }
});

test('content tables record who changed them', () => {
  assert.ok(SCHEMA_SQL.includes('CreatedBy'));
  assert.ok(SCHEMA_SQL.includes('UpdatedBy'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL with `Cannot find module './db'`.

- [ ] **Step 3: Implement the database layer**

Create `api/shared/db.js`. Copy `parseSqlConnectionString`, `getSqlConfig`, and `getPool` verbatim from `api/site-settings/index.js` lines 105-256, then add the content schema:

```js
const sql = require('mssql');

let poolPromise;
let schemaReadyPromise;

const getEnv = (name) => process.env[name] || '';

const parseBool = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return defaultValue;
};

// Moved unchanged from api/site-settings/index.js so both callers share one parser.
const parseSqlConnectionString = (connectionString) => {
  let raw = String(connectionString || '').trim();
  if (!raw) return null;
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim();
  }
  if (!raw) return null;

  if (raw.startsWith('mssql://') || raw.startsWith('sqlserver://')) {
    return {
      connectionString: raw,
      options: { encrypt: true, trustServerCertificate: false },
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    };
  }

  const map = {};
  for (const segment of raw.split(';')) {
    if (!segment.trim()) continue;
    const idx = segment.indexOf('=');
    if (idx < 0) continue;
    map[segment.slice(0, idx).trim().toLowerCase()] = segment.slice(idx + 1).trim();
  }

  let server = map.server || map['data source'] || map.addr || map.address || map['network address'] || '';
  let port;
  if (server.startsWith('tcp:')) server = server.slice(4);
  if (server.includes(',')) {
    const [host, maybePort] = server.split(',', 2);
    server = host;
    const parsed = Number.parseInt(maybePort, 10);
    if (Number.isFinite(parsed)) port = parsed;
  }
  const explicitPort = Number.parseInt(map.port || '', 10);
  if (Number.isFinite(explicitPort)) port = explicitPort;
  if (!server) return null;

  const config = {
    server,
    database: map.database || map['initial catalog'] || '',
    user: map.user || map.uid || map['user id'] || '',
    password: map.password || map.pwd || '',
    options: {
      encrypt: parseBool(map.encrypt, true),
      trustServerCertificate: parseBool(map.trustservercertificate, false),
    },
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
  };
  if (port) config.port = port;
  return config;
};

const getSqlConfig = () => {
  const connectionString = getEnv('AZURE_SQL_CONNECTION_STRING');
  if (connectionString) {
    const parsed = parseSqlConnectionString(connectionString);
    if (parsed) return parsed;
  }
  const server = getEnv('AZURE_SQL_SERVER');
  const database = getEnv('AZURE_SQL_DATABASE');
  const user = getEnv('AZURE_SQL_USER');
  const password = getEnv('AZURE_SQL_PASSWORD');
  if (!server || !database || !user || !password) return null;
  return {
    server,
    database,
    user,
    password,
    options: { encrypt: true, trustServerCertificate: false },
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
  };
};

const getPool = async () => {
  if (!poolPromise) {
    const config = getSqlConfig();
    if (!config) {
      throw new Error(
        'Missing SQL config. Set AZURE_SQL_CONNECTION_STRING or AZURE_SQL_SERVER/AZURE_SQL_DATABASE/AZURE_SQL_USER/AZURE_SQL_PASSWORD.'
      );
    }
    poolPromise = sql.connect(config);
  }
  return poolPromise;
};

const SCHEMA_SQL = `
IF OBJECT_ID('dbo.SiteSettings', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.SiteSettings (
    SettingKey NVARCHAR(100) NOT NULL PRIMARY KEY,
    ThemeId NVARCHAR(50) NOT NULL,
    UpdatedBy NVARCHAR(256) NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_SiteSettings_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('dbo.Events', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Events (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY CONSTRAINT DF_Events_Id DEFAULT NEWID(),
    Slug NVARCHAR(120) NOT NULL UNIQUE,
    EventDate DATE NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    YouTubeUrl NVARCHAR(500) NULL,
    IsPublished BIT NOT NULL CONSTRAINT DF_Events_IsPublished DEFAULT 1,
    CreatedBy NVARCHAR(256) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Events_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(256) NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Events_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('dbo.Sermons', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Sermons (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY CONSTRAINT DF_Sermons_Id DEFAULT NEWID(),
    SermonDate DATE NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Speaker NVARCHAR(120) NULL,
    YouTubeUrl NVARCHAR(500) NULL,
    IsPublished BIT NOT NULL CONSTRAINT DF_Sermons_IsPublished DEFAULT 1,
    CreatedBy NVARCHAR(256) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Sermons_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(256) NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Sermons_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('dbo.Resources', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Resources (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY CONSTRAINT DF_Resources_Id DEFAULT NEWID(),
    Title NVARCHAR(200) NOT NULL,
    BlobPath NVARCHAR(400) NOT NULL,
    ContentType NVARCHAR(150) NULL,
    SizeBytes BIGINT NULL,
    CreatedBy NVARCHAR(256) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Resources_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(256) NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Resources_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('dbo.EventImages', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.EventImages (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY CONSTRAINT DF_EventImages_Id DEFAULT NEWID(),
    EventId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Events(Id) ON DELETE CASCADE,
    BlobPath NVARCHAR(400) NOT NULL,
    SortOrder INT NOT NULL CONSTRAINT DF_EventImages_SortOrder DEFAULT 0,
    CreatedBy NVARCHAR(256) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_EventImages_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(256) NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_EventImages_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('dbo.SermonFiles', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.SermonFiles (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY CONSTRAINT DF_SermonFiles_Id DEFAULT NEWID(),
    SermonId UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Sermons(Id) ON DELETE CASCADE,
    BlobPath NVARCHAR(400) NOT NULL,
    ContentType NVARCHAR(150) NULL,
    SizeBytes BIGINT NULL,
    CreatedBy NVARCHAR(256) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_SermonFiles_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(256) NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_SermonFiles_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;
`;

const ensureSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const pool = await getPool();
      await pool.request().batch(SCHEMA_SQL);
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }
  return schemaReadyPromise;
};

module.exports = { sql, getPool, ensureSchema, parseSqlConnectionString, SCHEMA_SQL };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd api && npm test`
Expected: PASS, 24 tests.

- [ ] **Step 5: Commit**

```bash
git add api/shared/db.js api/shared/db.test.js
git commit -m "Add shared SQL layer with content tables"
```

---

### Task 5: Events API

**Files:**
- Create: `api/events/index.js`
- Create: `api/events/function.json`
- Test: `api/events/index.test.js`

**Interfaces:**
- Consumes: `requireRole`, `actorOf`, `ROLES` from `api/shared/principal.js`; `sql`, `getPool`, `ensureSchema` from `api/shared/db.js`
- Produces: `GET /api/events` → `{ events: Array<{ id, slug, date, title, description, youtubeUrl, images: string[] }> }`
- Produces: `POST /api/events` with `{ slug, date, title, description, youtubeUrl }` → `201 { event }`
- Produces: `PUT /api/events` with `{ id, ...fields }` → `200 { event }`; `DELETE /api/events?id=<guid>` → `204`
- Produces: `validateEventInput(body): { value } | { error: string }`, exported for tests

- [ ] **Step 1: Write the failing validation and authorisation test**

Create `api/events/index.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { validateEventInput } = require('./index');
const { requireRole } = require('../shared/principal');

const encode = (principal) => Buffer.from(JSON.stringify(principal), 'utf8').toString('base64');
const requestFor = (roles) => ({
  headers: { 'x-ms-client-principal': encode({ userId: 'u1', userDetails: 'e@church.org', userRoles: roles }) },
});

test('accepts a complete event', () => {
  const result = validateEventInput({
    slug: 'christmas-2026',
    date: '2026-12-25',
    title: 'Christmas Service',
    description: 'Christmas worship',
    youtubeUrl: 'https://www.youtube.com/watch?v=abc',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.slug, 'christmas-2026');
});

test('rejects a missing title', () => {
  assert.ok(validateEventInput({ slug: 'a', date: '2026-01-01' }).error);
});

test('rejects a slug with unsafe characters', () => {
  assert.ok(validateEventInput({ slug: '../etc', date: '2026-01-01', title: 'T' }).error);
});

test('rejects a malformed date', () => {
  assert.ok(validateEventInput({ slug: 'a', date: '25/12/2026', title: 'T' }).error);
});

test('rejects a non-YouTube video url', () => {
  assert.ok(
    validateEventInput({ slug: 'a', date: '2026-01-01', title: 'T', youtubeUrl: 'https://evil.test/x' }).error
  );
});

test('allows an empty video url', () => {
  const result = validateEventInput({ slug: 'a', date: '2026-01-01', title: 'T', youtubeUrl: '' });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.youtubeUrl, null);
});

test('a member cannot write events', () => {
  assert.strictEqual(requireRole(requestFor(['member']), 'editor').error.status, 403);
});

test('an editor can write events', () => {
  assert.strictEqual(requireRole(requestFor(['editor', 'member']), 'editor').error, undefined);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL with `Cannot find module './index'`.

- [ ] **Step 3: Implement the events Function**

Create `api/events/index.js`:

```js
const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YOUTUBE_HOSTS = ['www.youtube.com', 'youtube.com', 'youtu.be'];

const isYouTubeUrl = (value) => {
  try {
    return YOUTUBE_HOSTS.includes(new URL(value).hostname);
  } catch (error) {
    return false;
  }
};

const validateEventInput = (body) => {
  const input = body || {};
  const slug = String(input.slug || '').trim().toLowerCase();
  const date = String(input.date || '').trim();
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const youtubeUrl = String(input.youtubeUrl || '').trim();

  if (!SLUG_PATTERN.test(slug)) return { error: 'Slug must be lowercase words separated by hyphens.' };
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Date must be YYYY-MM-DD.' };
  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };
  if (youtubeUrl && !isYouTubeUrl(youtubeUrl)) return { error: 'Video URL must be a YouTube link.' };

  return {
    value: { slug, date, title, description: description || null, youtubeUrl: youtubeUrl || null },
  };
};

const mapRow = (row) => ({
  id: row.Id,
  slug: row.Slug,
  date: row.EventDate instanceof Date ? row.EventDate.toISOString().slice(0, 10) : row.EventDate,
  title: row.Title,
  description: row.Description || '',
  youtubeUrl: row.YouTubeUrl || '',
  images: [],
});

const listEvents = async () => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .query('SELECT Id, Slug, EventDate, Title, Description, YouTubeUrl FROM dbo.Events WHERE IsPublished = 1 ORDER BY EventDate DESC');
  return (result.recordset || []).map(mapRow);
};

const getEventById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query('SELECT Id, Slug, EventDate, Title, Description, YouTubeUrl FROM dbo.Events WHERE Id = @id');
  const row = result.recordset && result.recordset[0];
  return row ? mapRow(row) : null;
};

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      context.res = { status: 200, body: { events: await listEvents() } };
      return;
    }

    const auth = requireRole(req, ROLES.EDITOR);
    if (auth.error) {
      context.res = { status: auth.error.status, body: auth.error.body };
      return;
    }
    const actor = actorOf(auth.principal);
    await ensureSchema();
    const pool = await getPool();

    if (req.method === 'POST') {
      const parsed = validateEventInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const inserted = await pool
        .request()
        .input('slug', sql.NVarChar(120), parsed.value.slug)
        .input('eventDate', sql.Date, parsed.value.date)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('description', sql.NVarChar(sql.MAX), parsed.value.description)
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
INSERT INTO dbo.Events (Slug, EventDate, Title, Description, YouTubeUrl, CreatedBy, UpdatedBy)
OUTPUT inserted.Id
VALUES (@slug, @eventDate, @title, @description, @youTubeUrl, @actor, @actor);
`);
      const id = inserted.recordset[0].Id;
      context.res = { status: 201, body: { event: await getEventById(id) } };
      return;
    }

    if (req.method === 'PUT') {
      const id = String((req.body && req.body.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Event id is required.' } };
        return;
      }
      const parsed = validateEventInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const updated = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .input('slug', sql.NVarChar(120), parsed.value.slug)
        .input('eventDate', sql.Date, parsed.value.date)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('description', sql.NVarChar(sql.MAX), parsed.value.description)
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
UPDATE dbo.Events
SET Slug = @slug, EventDate = @eventDate, Title = @title, Description = @description,
    YouTubeUrl = @youTubeUrl, UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
WHERE Id = @id;
SELECT @@ROWCOUNT AS Affected;
`);
      if (!updated.recordset[0].Affected) {
        context.res = { status: 404, body: { error: 'Event not found.' } };
        return;
      }
      context.res = { status: 200, body: { event: await getEventById(id) } };
      return;
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Event id is required.' } };
        return;
      }
      await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM dbo.Events WHERE Id = @id');
      context.res = { status: 204 };
      return;
    }

    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error) {
    context.log.error('events error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: { error: 'Unable to process events.', detail: String((error && error.message) || error).slice(0, 220) },
    };
  }
};

module.exports.validateEventInput = validateEventInput;
```

- [ ] **Step 4: Create the Function binding**

Create `api/events/function.json`:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post", "put", "delete"],
      "route": "events"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd api && npm test`
Expected: PASS, 32 tests.

- [ ] **Step 6: Commit**

```bash
git add api/events
git commit -m "Add events API with editor-only writes"
```

---

### Task 6: Sermons API

**Files:**
- Create: `api/sermons/index.js`
- Create: `api/sermons/function.json`
- Test: `api/sermons/index.test.js`

**Interfaces:**
- Consumes: `requireRole`, `actorOf`, `ROLES`; `sql`, `getPool`, `ensureSchema`
- Produces: `GET /api/sermons` → `{ sermons: Array<{ id, date, title, speaker, youtubeUrl }> }`
- Produces: `POST`, `PUT`, `DELETE /api/sermons` guarded by `editor`
- Produces: `validateSermonInput(body): { value } | { error: string }`

- [ ] **Step 1: Write the failing test**

Create `api/sermons/index.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { validateSermonInput } = require('./index');

test('accepts a complete sermon', () => {
  const result = validateSermonInput({
    date: '2026-01-04',
    title: 'Faith and Life',
    speaker: 'Senior Pastor',
    youtubeUrl: 'https://youtu.be/abc123',
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.speaker, 'Senior Pastor');
});

test('rejects a missing title', () => {
  assert.ok(validateSermonInput({ date: '2026-01-04' }).error);
});

test('rejects a malformed date', () => {
  assert.ok(validateSermonInput({ date: 'Jan 4', title: 'T' }).error);
});

test('rejects a non-YouTube video url', () => {
  assert.ok(validateSermonInput({ date: '2026-01-04', title: 'T', youtubeUrl: 'https://evil.test/v' }).error);
});

test('allows an omitted speaker and video', () => {
  const result = validateSermonInput({ date: '2026-01-04', title: 'T' });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.speaker, null);
  assert.strictEqual(result.value.youtubeUrl, null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL with `Cannot find module './index'`.

- [ ] **Step 3: Implement the sermons Function**

Create `api/sermons/index.js`:

```js
const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YOUTUBE_HOSTS = ['www.youtube.com', 'youtube.com', 'youtu.be'];

const isYouTubeUrl = (value) => {
  try {
    return YOUTUBE_HOSTS.includes(new URL(value).hostname);
  } catch (error) {
    return false;
  }
};

const validateSermonInput = (body) => {
  const input = body || {};
  const date = String(input.date || '').trim();
  const title = String(input.title || '').trim();
  const speaker = String(input.speaker || '').trim();
  const youtubeUrl = String(input.youtubeUrl || '').trim();

  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Date must be YYYY-MM-DD.' };
  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };
  if (youtubeUrl && !isYouTubeUrl(youtubeUrl)) return { error: 'Video URL must be a YouTube link.' };

  return { value: { date, title, speaker: speaker || null, youtubeUrl: youtubeUrl || null } };
};

const mapRow = (row) => ({
  id: row.Id,
  date: row.SermonDate instanceof Date ? row.SermonDate.toISOString().slice(0, 10) : row.SermonDate,
  title: row.Title,
  speaker: row.Speaker || '',
  youtubeUrl: row.YouTubeUrl || '',
});

const listSermons = async () => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .query('SELECT Id, SermonDate, Title, Speaker, YouTubeUrl FROM dbo.Sermons WHERE IsPublished = 1 ORDER BY SermonDate DESC');
  return (result.recordset || []).map(mapRow);
};

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      context.res = { status: 200, body: { sermons: await listSermons() } };
      return;
    }

    const auth = requireRole(req, ROLES.EDITOR);
    if (auth.error) {
      context.res = { status: auth.error.status, body: auth.error.body };
      return;
    }
    const actor = actorOf(auth.principal);
    await ensureSchema();
    const pool = await getPool();

    if (req.method === 'POST') {
      const parsed = validateSermonInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const inserted = await pool
        .request()
        .input('sermonDate', sql.Date, parsed.value.date)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('speaker', sql.NVarChar(120), parsed.value.speaker)
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
INSERT INTO dbo.Sermons (SermonDate, Title, Speaker, YouTubeUrl, CreatedBy, UpdatedBy)
OUTPUT inserted.Id, inserted.SermonDate, inserted.Title, inserted.Speaker, inserted.YouTubeUrl
VALUES (@sermonDate, @title, @speaker, @youTubeUrl, @actor, @actor);
`);
      context.res = { status: 201, body: { sermon: mapRow(inserted.recordset[0]) } };
      return;
    }

    if (req.method === 'PUT') {
      const id = String((req.body && req.body.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Sermon id is required.' } };
        return;
      }
      const parsed = validateSermonInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const updated = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .input('sermonDate', sql.Date, parsed.value.date)
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('speaker', sql.NVarChar(120), parsed.value.speaker)
        .input('youTubeUrl', sql.NVarChar(500), parsed.value.youtubeUrl)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
UPDATE dbo.Sermons
SET SermonDate = @sermonDate, Title = @title, Speaker = @speaker, YouTubeUrl = @youTubeUrl,
    UpdatedBy = @actor, UpdatedAt = SYSUTCDATETIME()
OUTPUT inserted.Id, inserted.SermonDate, inserted.Title, inserted.Speaker, inserted.YouTubeUrl
WHERE Id = @id;
`);
      if (!updated.recordset.length) {
        context.res = { status: 404, body: { error: 'Sermon not found.' } };
        return;
      }
      context.res = { status: 200, body: { sermon: mapRow(updated.recordset[0]) } };
      return;
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Sermon id is required.' } };
        return;
      }
      await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM dbo.Sermons WHERE Id = @id');
      context.res = { status: 204 };
      return;
    }

    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error) {
    context.log.error('sermons error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: { error: 'Unable to process sermons.', detail: String((error && error.message) || error).slice(0, 220) },
    };
  }
};

module.exports.validateSermonInput = validateSermonInput;
```

- [ ] **Step 4: Create the Function binding**

Create `api/sermons/function.json`:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post", "put", "delete"],
      "route": "sermons"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd api && npm test`
Expected: PASS, 37 tests.

- [ ] **Step 6: Commit**

```bash
git add api/sermons
git commit -m "Add sermons API with editor-only writes"
```

---

### Task 7: Blob helper and SAS endpoints

**Files:**
- Create: `api/shared/blob.js`
- Create: `api/files-upload-url/index.js`
- Create: `api/files-upload-url/function.json`
- Create: `api/files-download/index.js`
- Create: `api/files-download/function.json`
- Test: `api/shared/blob.test.js`
- Modify: `api/package.json`

**Interfaces:**
- Produces: `MAX_UPLOAD_BYTES = 26214400` (25 MB) and `ALLOWED_CONTENT_TYPES`
- Produces: `validateUploadRequest({ folder, fileName, contentType, sizeBytes }): { value: { blobPath, contentType } } | { error }`
- Produces: `buildBlobPath(folder: string, fileName: string, id: string): string`
- Produces: `createUploadSas(blobPath, contentType): Promise<string>` and `createReadSas(blobPath): Promise<string>`
- Produces: `POST /api/files/upload-url` → `{ uploadUrl, blobPath, expiresInSeconds }`
- Produces: `GET /api/files/download/{id}` → `302` to a read SAS

- [ ] **Step 1: Add the storage dependency**

Run: `cd api && npm install @azure/storage-blob@^12.26.0`

- [ ] **Step 2: Write the failing upload-validation test**

Create `api/shared/blob.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { validateUploadRequest, buildBlobPath, MAX_UPLOAD_BYTES } = require('./blob');

test('accepts a normal pdf bulletin', () => {
  const result = validateUploadRequest({
    folder: 'resources',
    fileName: 'bulletin.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1024,
  });
  assert.strictEqual(result.error, undefined);
  assert.ok(result.value.blobPath.startsWith('resources/'));
  assert.ok(result.value.blobPath.endsWith('.pdf'));
});

test('rejects an unknown folder', () => {
  assert.ok(
    validateUploadRequest({ folder: 'secrets', fileName: 'a.pdf', contentType: 'application/pdf', sizeBytes: 1 }).error
  );
});

test('rejects a disallowed content type', () => {
  assert.ok(
    validateUploadRequest({ folder: 'resources', fileName: 'a.exe', contentType: 'application/x-msdownload', sizeBytes: 1 })
      .error
  );
});

test('rejects a file above the size limit', () => {
  assert.ok(
    validateUploadRequest({
      folder: 'resources',
      fileName: 'a.pdf',
      contentType: 'application/pdf',
      sizeBytes: MAX_UPLOAD_BYTES + 1,
    }).error
  );
});

test('strips directory traversal from the file name', () => {
  const path = buildBlobPath('resources', '../../etc/passwd.pdf', 'abc123');
  assert.ok(!path.includes('..'));
  assert.strictEqual(path, 'resources/abc123-passwd.pdf');
});

test('gives two uploads of the same name distinct paths', () => {
  assert.notStrictEqual(
    buildBlobPath('resources', 'bulletin.pdf', 'id-one'),
    buildBlobPath('resources', 'bulletin.pdf', 'id-two')
  );
});

test('replaces unsafe characters in the file name', () => {
  assert.strictEqual(buildBlobPath('sermons', 'notes 2026?.pdf', 'x1'), 'sermons/x1-notes-2026-.pdf');
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL with `Cannot find module './blob'`.

- [ ] **Step 4: Implement the blob helper**

Create `api/shared/blob.js`:

```js
const crypto = require('node:crypto');
const path = require('node:path');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require('@azure/storage-blob');

const MAX_UPLOAD_BYTES = 26214400; // 25 MB
const ALLOWED_FOLDERS = ['resources', 'sermons', 'events'];
const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const UPLOAD_SAS_SECONDS = 600;
const READ_SAS_SECONDS = 300;

const getEnv = (name) => process.env[name] || '';

const buildBlobPath = (folder, fileName, id) => {
  const base = path.basename(String(fileName || 'file'));
  const safe = base.replace(/[^A-Za-z0-9._-]/g, '-').replace(/^-+/, '') || 'file';
  return `${folder}/${id}-${safe}`;
};

const validateUploadRequest = (input) => {
  const request = input || {};
  const folder = String(request.folder || '').trim().toLowerCase();
  const contentType = String(request.contentType || '').trim().toLowerCase();
  const sizeBytes = Number(request.sizeBytes);

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return { error: `Folder must be one of: ${ALLOWED_FOLDERS.join(', ')}.` };
  }
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return { error: 'File type is not allowed. Upload PDF, image, Word, or PowerPoint files.' };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES) {
    return { error: `File must be larger than 0 and at most ${MAX_UPLOAD_BYTES} bytes.` };
  }

  return {
    value: { blobPath: buildBlobPath(folder, request.fileName, crypto.randomUUID()), contentType },
  };
};

const getCredential = () => {
  const account = getEnv('AZURE_STORAGE_ACCOUNT');
  const key = getEnv('AZURE_STORAGE_KEY');
  if (!account || !key) {
    throw new Error('Missing AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY.');
  }
  return { account, credential: new StorageSharedKeyCredential(account, key) };
};

const getContainerName = () => getEnv('AZURE_STORAGE_CONTAINER') || 'church-files';

const createSas = (blobPath, permissionString, seconds, contentType) => {
  const { account, credential } = getCredential();
  const containerName = getContainerName();
  const startsOn = new Date(Date.now() - 60 * 1000);
  const expiresOn = new Date(Date.now() + seconds * 1000);

  const query = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse(permissionString),
      startsOn,
      expiresOn,
      contentType,
    },
    credential
  ).toString();

  return `https://${account}.blob.core.windows.net/${containerName}/${encodeURI(blobPath)}?${query}`;
};

const createUploadSas = async (blobPath, contentType) => createSas(blobPath, 'cw', UPLOAD_SAS_SECONDS, contentType);

const createReadSas = async (blobPath) => createSas(blobPath, 'r', READ_SAS_SECONDS);

const deleteBlob = async (blobPath) => {
  const { account, credential } = getCredential();
  const service = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  await service.getContainerClient(getContainerName()).getBlockBlobClient(blobPath).deleteIfExists();
};

module.exports = {
  MAX_UPLOAD_BYTES,
  ALLOWED_FOLDERS,
  ALLOWED_CONTENT_TYPES,
  UPLOAD_SAS_SECONDS,
  READ_SAS_SECONDS,
  buildBlobPath,
  validateUploadRequest,
  createUploadSas,
  createReadSas,
  deleteBlob,
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd api && npm test`
Expected: PASS, 44 tests.

- [ ] **Step 6: Implement the upload-url endpoint**

Create `api/files-upload-url/index.js`:

```js
const { requireRole, ROLES } = require('../shared/principal');
const { validateUploadRequest, createUploadSas, UPLOAD_SAS_SECONDS } = require('../shared/blob');

module.exports = async function (context, req) {
  const auth = requireRole(req, ROLES.EDITOR);
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
    const uploadUrl = await createUploadSas(parsed.value.blobPath, parsed.value.contentType);
    context.res = {
      status: 200,
      body: { uploadUrl, blobPath: parsed.value.blobPath, expiresInSeconds: UPLOAD_SAS_SECONDS },
    };
  } catch (error) {
    context.log.error('files-upload-url error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to issue an upload URL.' } };
  }
};
```

Create `api/files-upload-url/function.json`:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"],
      "route": "files/upload-url"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

- [ ] **Step 7: Implement the download endpoint**

Create `api/files-download/index.js`. It resolves the record ID to a blob path in SQL so callers can never name an arbitrary blob:

```js
const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, ROLES } = require('../shared/principal');
const { createReadSas } = require('../shared/blob');

const lookupBlobPath = async (id) => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query(`
SELECT BlobPath FROM dbo.Resources WHERE Id = @id
UNION ALL
SELECT BlobPath FROM dbo.SermonFiles WHERE Id = @id
UNION ALL
SELECT BlobPath FROM dbo.EventImages WHERE Id = @id;
`);
  const row = result.recordset && result.recordset[0];
  return row ? row.BlobPath : null;
};

module.exports = async function (context, req) {
  const auth = requireRole(req, ROLES.MEMBER);
  if (auth.error) {
    context.res = { status: auth.error.status, body: auth.error.body };
    return;
  }

  const id = String((req.params && req.params.id) || '').trim();
  if (!id) {
    context.res = { status: 400, body: { error: 'File id is required.' } };
    return;
  }

  try {
    const blobPath = await lookupBlobPath(id);
    if (!blobPath) {
      context.res = { status: 404, body: { error: 'File not found.' } };
      return;
    }
    context.res = {
      status: 302,
      headers: { Location: await createReadSas(blobPath), 'Cache-Control': 'no-store' },
    };
  } catch (error) {
    context.log.error('files-download error:', (error && error.message) || error);
    context.res = { status: 500, body: { error: 'Unable to prepare the download.' } };
  }
};
```

Create `api/files-download/function.json`:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get"],
      "route": "files/download/{id}"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

- [ ] **Step 8: Run the tests to confirm nothing regressed**

Run: `cd api && npm test`
Expected: PASS, 44 tests.

- [ ] **Step 9: Commit**

```bash
git add api/package.json api/package-lock.json api/shared/blob.js api/shared/blob.test.js api/files-upload-url api/files-download
git commit -m "Add private blob storage with short-lived upload and download SAS"
```

---

### Task 8: Resources API

**Files:**
- Create: `api/resources/index.js`
- Create: `api/resources/function.json`
- Test: `api/resources/index.test.js`

**Interfaces:**
- Consumes: `requireRole`, `actorOf`, `ROLES`; `sql`, `getPool`, `ensureSchema`; `deleteBlob` from `api/shared/blob.js`
- Produces: `GET /api/resources` → `{ resources: Array<{ id, title, contentType, sizeBytes, downloadUrl }> }` where `downloadUrl` is `/api/files/download/<id>`, never a blob URL
- Produces: `POST /api/resources` with `{ title, blobPath, contentType, sizeBytes }` → `201 { resource }`
- Produces: `DELETE /api/resources?id=<guid>` → `204`, removing the blob as well
- Produces: `validateResourceInput(body): { value } | { error: string }`

- [ ] **Step 1: Write the failing test**

Create `api/resources/index.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { validateResourceInput, toResourceResponse } = require('./index');

test('accepts a registered upload', () => {
  const result = validateResourceInput({
    title: 'Weekly Bulletin',
    blobPath: 'resources/abc-bulletin.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2048,
  });
  assert.strictEqual(result.error, undefined);
  assert.strictEqual(result.value.title, 'Weekly Bulletin');
});

test('rejects a missing title', () => {
  assert.ok(validateResourceInput({ blobPath: 'resources/a.pdf', contentType: 'application/pdf', sizeBytes: 1 }).error);
});

test('rejects a blob path outside the resources folder', () => {
  assert.ok(
    validateResourceInput({ title: 'T', blobPath: 'events/a.pdf', contentType: 'application/pdf', sizeBytes: 1 }).error
  );
});

test('rejects a blob path containing traversal', () => {
  assert.ok(
    validateResourceInput({ title: 'T', blobPath: 'resources/../secret', contentType: 'application/pdf', sizeBytes: 1 })
      .error
  );
});

test('the response never exposes a storage url', () => {
  const response = toResourceResponse({
    Id: '11111111-1111-1111-1111-111111111111',
    Title: 'Weekly Bulletin',
    BlobPath: 'resources/abc-bulletin.pdf',
    ContentType: 'application/pdf',
    SizeBytes: 2048,
  });
  assert.strictEqual(response.downloadUrl, '/api/files/download/11111111-1111-1111-1111-111111111111');
  assert.strictEqual(response.blobPath, undefined);
  assert.ok(!JSON.stringify(response).includes('blob.core.windows.net'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL with `Cannot find module './index'`.

- [ ] **Step 3: Implement the resources Function**

Create `api/resources/index.js`:

```js
const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');
const { deleteBlob } = require('../shared/blob');

const validateResourceInput = (body) => {
  const input = body || {};
  const title = String(input.title || '').trim();
  const blobPath = String(input.blobPath || '').trim();
  const contentType = String(input.contentType || '').trim();
  const sizeBytes = Number(input.sizeBytes);

  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };
  if (!blobPath.startsWith('resources/') || blobPath.includes('..')) {
    return { error: 'Blob path must be an uploaded file inside the resources folder.' };
  }
  if (!contentType) return { error: 'Content type is required.' };
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { error: 'Size must be a positive number.' };

  return { value: { title, blobPath, contentType, sizeBytes } };
};

const toResourceResponse = (row) => ({
  id: row.Id,
  title: row.Title,
  contentType: row.ContentType || '',
  sizeBytes: row.SizeBytes || 0,
  downloadUrl: `/api/files/download/${row.Id}`,
});

module.exports = async function (context, req) {
  try {
    await ensureSchema();
    const pool = await getPool();

    if (req.method === 'GET') {
      const auth = requireRole(req, ROLES.MEMBER);
      if (auth.error) {
        context.res = { status: auth.error.status, body: auth.error.body };
        return;
      }
      const result = await pool
        .request()
        .query('SELECT Id, Title, ContentType, SizeBytes FROM dbo.Resources ORDER BY CreatedAt DESC');
      context.res = { status: 200, body: { resources: (result.recordset || []).map(toResourceResponse) } };
      return;
    }

    const auth = requireRole(req, ROLES.EDITOR);
    if (auth.error) {
      context.res = { status: auth.error.status, body: auth.error.body };
      return;
    }
    const actor = actorOf(auth.principal);

    if (req.method === 'POST') {
      const parsed = validateResourceInput(req.body);
      if (parsed.error) {
        context.res = { status: 400, body: { error: parsed.error } };
        return;
      }
      const inserted = await pool
        .request()
        .input('title', sql.NVarChar(200), parsed.value.title)
        .input('blobPath', sql.NVarChar(400), parsed.value.blobPath)
        .input('contentType', sql.NVarChar(150), parsed.value.contentType)
        .input('sizeBytes', sql.BigInt, parsed.value.sizeBytes)
        .input('actor', sql.NVarChar(256), actor)
        .query(`
INSERT INTO dbo.Resources (Title, BlobPath, ContentType, SizeBytes, CreatedBy, UpdatedBy)
OUTPUT inserted.Id, inserted.Title, inserted.ContentType, inserted.SizeBytes
VALUES (@title, @blobPath, @contentType, @sizeBytes, @actor, @actor);
`);
      context.res = { status: 201, body: { resource: toResourceResponse(inserted.recordset[0]) } };
      return;
    }

    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '').trim();
      if (!id) {
        context.res = { status: 400, body: { error: 'Resource id is required.' } };
        return;
      }
      const deleted = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query('DELETE FROM dbo.Resources OUTPUT deleted.BlobPath WHERE Id = @id');
      const row = deleted.recordset && deleted.recordset[0];
      if (row) {
        await deleteBlob(row.BlobPath);
      }
      context.res = { status: 204 };
      return;
    }

    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error) {
    context.log.error('resources error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: { error: 'Unable to process resources.', detail: String((error && error.message) || error).slice(0, 220) },
    };
  }
};

module.exports.validateResourceInput = validateResourceInput;
module.exports.toResourceResponse = toResourceResponse;
```

- [ ] **Step 4: Create the Function binding**

Create `api/resources/function.json`:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post", "delete"],
      "route": "resources"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd api && npm test`
Expected: PASS, 49 tests.

- [ ] **Step 6: Commit**

```bash
git add api/resources
git commit -m "Add resources API with member reads and editor writes"
```

---

### Task 9: Replace the Global Administrator check in site-settings

**Files:**
- Modify: `api/site-settings/index.js`
- Test: `api/site-settings/index.test.js`

**Interfaces:**
- Consumes: `requireRole`, `ROLES`, `actorOf`; `sql`, `getPool`, `ensureSchema` from `api/shared/db.js`
- Produces: unchanged `GET`/`PUT /api/site-settings` contract, now gated on the `admin` role instead of the Entra directory role

- [ ] **Step 1: Write the failing test**

Create `api/site-settings/index.test.js`:

```js
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
  assert.ok(source.includes("requireRole(req, ROLES.ADMIN)"));
});

test('uses the shared database module rather than its own pool', () => {
  assert.ok(source.includes("require('../shared/db')"));
  assert.ok(!source.includes('parseSqlConnectionString ='), 'connection parsing must live in shared/db.js');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd api && npm test`
Expected: FAIL, because `site-settings/index.js` still contains `hasGlobalAdminRole`.

- [ ] **Step 3: Rewrite the site-settings Function**

Replace the entire contents of `api/site-settings/index.js`:

```js
const { sql, getPool, ensureSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');

const SUPPORTED_THEMES = ['dark', 'light', 'church', 'modern-sky', 'modern-sand'];
const DEFAULT_THEME = 'church';
const DEFAULT_SETTING_KEY = 'theme';

const getCurrentTheme = async () => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .input('settingKey', sql.NVarChar(100), DEFAULT_SETTING_KEY)
    .query('SELECT TOP 1 ThemeId, UpdatedAt, UpdatedBy FROM dbo.SiteSettings WHERE SettingKey = @settingKey');

  const row = result.recordset && result.recordset[0];
  if (row) {
    return {
      themeId: row.ThemeId,
      updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : null,
      updatedBy: row.UpdatedBy || null,
    };
  }

  await pool
    .request()
    .input('settingKey', sql.NVarChar(100), DEFAULT_SETTING_KEY)
    .input('themeId', sql.NVarChar(50), DEFAULT_THEME)
    .query('INSERT INTO dbo.SiteSettings (SettingKey, ThemeId) VALUES (@settingKey, @themeId)');

  return { themeId: DEFAULT_THEME, updatedAt: null, updatedBy: null };
};

const saveTheme = async (themeId, updatedBy) => {
  await ensureSchema();
  const pool = await getPool();
  await pool
    .request()
    .input('settingKey', sql.NVarChar(100), DEFAULT_SETTING_KEY)
    .input('themeId', sql.NVarChar(50), themeId)
    .input('updatedBy', sql.NVarChar(256), updatedBy)
    .query(`
MERGE dbo.SiteSettings AS target
USING (SELECT @settingKey AS SettingKey, @themeId AS ThemeId, @updatedBy AS UpdatedBy) AS src
ON target.SettingKey = src.SettingKey
WHEN MATCHED THEN
  UPDATE SET ThemeId = src.ThemeId, UpdatedBy = src.UpdatedBy, UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (SettingKey, ThemeId, UpdatedBy, UpdatedAt)
  VALUES (src.SettingKey, src.ThemeId, src.UpdatedBy, SYSUTCDATETIME());
`);

  return getCurrentTheme();
};

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      context.res = { status: 200, body: await getCurrentTheme() };
      return;
    }

    if (req.method !== 'PUT') {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
      return;
    }

    const auth = requireRole(req, ROLES.ADMIN);
    if (auth.error) {
      context.res = { status: auth.error.status, body: auth.error.body };
      return;
    }

    const nextThemeId = req.body && req.body.themeId;
    if (!SUPPORTED_THEMES.includes(nextThemeId)) {
      context.res = { status: 400, body: { error: 'Invalid themeId.', allowed: SUPPORTED_THEMES } };
      return;
    }

    context.res = { status: 200, body: await saveTheme(nextThemeId, actorOf(auth.principal)) };
  } catch (error) {
    context.log.error('site-settings error:', (error && error.message) || error);
    context.res = {
      status: 500,
      body: {
        error: 'Unable to process site settings with Azure SQL.',
        detail: String((error && error.message) || error).slice(0, 220),
      },
    };
  }
};

module.exports.SUPPORTED_THEMES = SUPPORTED_THEMES;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd api && npm test`
Expected: PASS, 53 tests.

- [ ] **Step 5: Commit**

```bash
git add api/site-settings
git commit -m "Gate site settings on the admin role instead of Entra Global Administrator"
```

---

### Task 10: Client role state

**Files:**
- Create: `app/src/lib/useRoles.ts`
- Create: `app/src/lib/roles.test.ts`
- Modify: `app/src/lib/swaAuth.ts`
- Delete: `app/src/lib/useGlobalAdmin.ts`
- Modify: `app/src/pages/settings.tsx:1-58`
- Modify: `app/package.json`

**Interfaces:**
- Produces: `hasRole(user: ClientPrincipal | null | undefined, role: SiteRole): boolean`
- Produces: `type SiteRole = 'member' | 'editor' | 'admin'`
- Produces: `useRoles(): { isMember, isEditor, isAdmin, isLoading }`
- Consumes: `useSwaAuth` from `app/src/lib/swaAuth.ts`

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/roles.test.ts`:

```ts
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
```

- [ ] **Step 2: Add the library test script**

In `app/package.json`, add to `scripts`:

```json
    "test:lib": "tsx --test src/lib/*.test.ts",
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd app && npm run test:lib`
Expected: FAIL with a module-resolution error for `./useRoles`.

- [ ] **Step 4: Implement the roles hook**

Create `app/src/lib/useRoles.ts`. The development bypass mirrors the existing `NEXT_PUBLIC_DEV_AUTH_BYPASS` pattern so local work is unchanged:

```ts
import { useSwaAuth, type ClientPrincipal } from './swaAuth';

export type SiteRole = 'member' | 'editor' | 'admin';

export const hasRole = (user: ClientPrincipal | null | undefined, role: SiteRole): boolean =>
  Boolean(user?.userRoles?.includes(role));

export const useRoles = () => {
  const { user, isLoading } = useSwaAuth();
  const devBypass =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_ROLE_BYPASS !== '0';

  if (devBypass) {
    return { isMember: true, isEditor: true, isAdmin: true, isLoading: false };
  }

  return {
    isMember: hasRole(user, 'member'),
    isEditor: hasRole(user, 'editor'),
    isAdmin: hasRole(user, 'admin'),
    isLoading,
  };
};
```

- [ ] **Step 5: Give the development principal the three roles**

In `app/src/lib/swaAuth.ts:52`, change the bypass principal's roles so local development reflects a full-access user:

```ts
        userRoles: ['authenticated', 'member', 'editor', 'admin'],
```

- [ ] **Step 6: Switch the settings page to the admin role**

In `app/src/pages/settings.tsx`, replace the `useGlobalAdmin` import on line 7 with:

```ts
import { useRoles } from '../lib/useRoles';
```

Replace line 14 with:

```ts
  const { isAdmin, isLoading: isChecking } = useRoles();
```

Replace the `isGlobalAdmin` guard on line 49 with:

```ts
  if (!isAdmin) {
```

Update the two forbidden labels on line 30 to drop the Entra wording:

```ts
      forbidden: isKo ? '관리자 권한이 필요합니다.' : 'Administrator role is required.',
```

- [ ] **Step 7: Delete the superseded hook**

Run: `cd app && rm src/lib/useGlobalAdmin.ts`

- [ ] **Step 8: Verify the tests and type check pass**

Run: `cd app && npm run test:lib && npm run typecheck`
Expected: PASS, 4 tests, then `tsc` exits 0.

- [ ] **Step 9: Commit**

```bash
git add app/package.json app/src/lib/useRoles.ts app/src/lib/roles.test.ts app/src/lib/swaAuth.ts app/src/pages/settings.tsx
git rm app/src/lib/useGlobalAdmin.ts
git commit -m "Read SWA roles on the client and retire the Global Administrator hook"
```

---

### Task 11: Content API client and public page migration

**Files:**
- Create: `app/src/lib/contentApi.ts`
- Create: `app/src/lib/contentApi.test.ts`
- Modify: `app/src/pages/events/index.tsx`
- Modify: `app/src/pages/sermons.tsx`
- Modify: `app/src/pages/events/[slug].tsx`

**Interfaces:**
- Consumes: `GET /api/events` and `GET /api/sermons` from Tasks 5 and 6
- Produces: `type ApiEvent = { id: string; slug: string; date: string; title: string; description: string; youtubeUrl: string; images: string[] }`
- Produces: `type ApiSermon = { id: string; date: string; title: string; speaker: string; youtubeUrl: string }`
- Produces: `type ApiResource = { id: string; title: string; contentType: string; sizeBytes: number; downloadUrl: string }`
- Produces: `fetchEvents(): Promise<ApiEvent[]>`, `fetchSermons(): Promise<ApiSermon[]>`, `fetchResources(): Promise<ApiResource[]>`
- Produces: `useContent<T>(loader: () => Promise<T[]>): { items: T[]; isLoading: boolean; error: string | null }`

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/contentApi.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import { parseEvents, parseSermons, parseResources } from './contentApi';

test('parses an events payload', () => {
  const events = parseEvents({
    events: [
      { id: '1', slug: 'a', date: '2026-01-01', title: 'A', description: 'd', youtubeUrl: '', images: [] },
    ],
  });
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].slug, 'a');
});

test('returns an empty list for a malformed events payload', () => {
  assert.deepStrictEqual(parseEvents({}), []);
  assert.deepStrictEqual(parseEvents(null), []);
});

test('parses a sermons payload', () => {
  const sermons = parseSermons({
    sermons: [{ id: '1', date: '2026-01-04', title: 'T', speaker: 'P', youtubeUrl: '' }],
  });
  assert.strictEqual(sermons[0].speaker, 'P');
});

test('parses a resources payload and keeps the proxied download url', () => {
  const resources = parseResources({
    resources: [
      { id: 'r1', title: 'Bulletin', contentType: 'application/pdf', sizeBytes: 10, downloadUrl: '/api/files/download/r1' },
    ],
  });
  assert.strictEqual(resources[0].downloadUrl, '/api/files/download/r1');
});

test('drops resource entries that point at raw storage', () => {
  const resources = parseResources({
    resources: [
      { id: 'r1', title: 'B', contentType: 'application/pdf', sizeBytes: 1, downloadUrl: 'https://x.blob.core.windows.net/a' },
    ],
  });
  assert.deepStrictEqual(resources, []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app && npm run test:lib`
Expected: FAIL with a module-resolution error for `./contentApi`.

- [ ] **Step 3: Implement the content client**

Create `app/src/lib/contentApi.ts`:

```ts
import { useEffect, useState } from 'react';

export type ApiEvent = {
  id: string;
  slug: string;
  date: string;
  title: string;
  description: string;
  youtubeUrl: string;
  images: string[];
};

export type ApiSermon = {
  id: string;
  date: string;
  title: string;
  speaker: string;
  youtubeUrl: string;
};

export type ApiResource = {
  id: string;
  title: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
};

const asArray = (payload: unknown, key: string): unknown[] => {
  const value = (payload as Record<string, unknown> | null)?.[key];
  return Array.isArray(value) ? value : [];
};

export const parseEvents = (payload: unknown): ApiEvent[] =>
  asArray(payload, 'events').map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? ''),
      slug: String(row.slug ?? ''),
      date: String(row.date ?? ''),
      title: String(row.title ?? ''),
      description: String(row.description ?? ''),
      youtubeUrl: String(row.youtubeUrl ?? ''),
      images: Array.isArray(row.images) ? row.images.map(String) : [],
    };
  });

export const parseSermons = (payload: unknown): ApiSermon[] =>
  asArray(payload, 'sermons').map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? ''),
      date: String(row.date ?? ''),
      title: String(row.title ?? ''),
      speaker: String(row.speaker ?? ''),
      youtubeUrl: String(row.youtubeUrl ?? ''),
    };
  });

export const parseResources = (payload: unknown): ApiResource[] =>
  asArray(payload, 'resources')
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id ?? ''),
        title: String(row.title ?? ''),
        contentType: String(row.contentType ?? ''),
        sizeBytes: Number(row.sizeBytes ?? 0),
        downloadUrl: String(row.downloadUrl ?? ''),
      };
    })
    .filter((resource) => resource.downloadUrl.startsWith('/api/files/download/'));

const getJson = async (url: string): Promise<unknown> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
};

export const fetchEvents = async (): Promise<ApiEvent[]> => parseEvents(await getJson('/api/events'));
export const fetchSermons = async (): Promise<ApiSermon[]> => parseSermons(await getJson('/api/sermons'));
export const fetchResources = async (): Promise<ApiResource[]> => parseResources(await getJson('/api/resources'));

export const useContent = <T,>(loader: () => Promise<T[]>) => {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    loader()
      .then((result) => {
        if (isMounted) {
          setItems(result);
          setIsLoading(false);
        }
      })
      .catch((cause: Error) => {
        if (isMounted) {
          setError(cause.message);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, isLoading, error };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app && npm run test:lib`
Expected: PASS, 9 tests.

- [ ] **Step 5: Switch the events index to the API**

In `app/src/pages/events/index.tsx`, remove the `eventsData` import and `getStaticProps`, and drive the list from the API. Replace the component signature and body opening (lines 20-27) with:

```tsx
const EventsPage: NextPage & {
  meta?: { title?: string; description?: string };
} = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: events, isLoading } = useContent<ApiEvent>(fetchEvents);

  if (isLoading) {
    return <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p>;
  }

  return (
```

Add the import near the other imports:

```tsx
import { fetchEvents, useContent, type ApiEvent } from '../../lib/contentApi';
```

Delete the local `type Event`, `type EventsPageProps`, the `eventsData` import, and the `getStaticProps` export.

- [ ] **Step 6: Switch the sermons page to the API**

In `app/src/pages/sermons.tsx`, apply the same change. Add:

```tsx
import { fetchSermons, useContent, type ApiSermon } from '../lib/contentApi';
```

Replace the component signature and body opening (lines 17-22) with:

```tsx
const Sermons: NextPage & {
  meta?: { title?: string; description?: string };
} = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: sermons, isLoading } = useContent<ApiSermon>(fetchSermons);

  if (isLoading) {
    return <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p>;
  }

  return (
```

Delete the local `type Sermon`, `type SermonsPageProps`, the `sermonsData` import, and the `getStaticProps` export.

- [ ] **Step 7: Keep the event detail route buildable**

`app/src/pages/events/[slug].tsx` uses `getStaticPaths`, which static export requires. Keep it reading `events.json` for the path list only, and fetch live detail on mount. Add to the component body, before the existing render:

```tsx
  const { items: liveEvents } = useContent<ApiEvent>(fetchEvents);
  const liveEvent = liveEvents.find((item) => item.slug === event.slug) ?? event;
```

Then use `liveEvent` in place of `event` inside the returned markup. Add the same `contentApi` import used in Step 5.

- [ ] **Step 8: Verify the type check and build**

Run: `cd app && npm run typecheck && npm run build`
Expected: both exit 0 and `out/` is regenerated.

- [ ] **Step 9: Commit**

```bash
git add app/src/lib/contentApi.ts app/src/lib/contentApi.test.ts app/src/pages/events app/src/pages/sermons.tsx
git commit -m "Load events and sermons from the content API"
```

---

### Task 12: Member resource library

**Files:**
- Modify: `app/src/pages/resources.tsx`
- Modify: `app/src/styles/globals.css`

**Interfaces:**
- Consumes: `fetchResources`, `useContent`, `ApiResource` from Task 11; `useRoles` from Task 10
- Produces: a resource list whose links point only at `/api/files/download/<id>`

- [ ] **Step 1: Rewrite the resources page**

Replace the contents of `app/src/pages/resources.tsx`:

```tsx
import type { NextPage } from 'next';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { fetchResources, useContent, type ApiResource } from '../lib/contentApi';

const formatSize = (bytes: number) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const Resources: NextPage & {
  meta?: { title?: string; description?: string };
} = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: resources, isLoading, error } = useContent<ApiResource>(fetchResources);

  return (
    <article className="site-page resources-page">
      <PageHero
        eyebrow={isKo ? '이번 주 자료' : 'For your week'}
        title={isKo ? '필요한 자료를 한곳에서' : 'Helpful resources, all in one place'}
        description={
          isKo
            ? '주보와 신앙생활에 도움이 되는 자료를 편하게 확인하세요.'
            : 'Find weekly bulletins and practical resources to support your life of faith.'
        }
      />

      {isLoading ? <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p> : null}

      {error ? (
        <p className="error-text" role="alert">
          {isKo ? '자료를 불러오지 못했습니다.' : 'Resources could not be loaded.'}
        </p>
      ) : null}

      {!isLoading && !error && resources.length ? (
        <ol className="resource-list">
          {resources.map((resource, index) => (
            <li key={resource.id}>
              <span>0{index + 1}</span>
              <strong>{resource.title}</strong>
              <span className="resource-list__meta">{formatSize(resource.sizeBytes)}</span>
              <a href={resource.downloadUrl} rel="noreferrer">
                {isKo ? '다운로드' : 'Download'} <span aria-hidden="true">↓</span>
              </a>
            </li>
          ))}
        </ol>
      ) : null}

      {!isLoading && !error && !resources.length ? (
        <EmptyState
          title={isKo ? '자료를 정리하고 있습니다' : 'Resources are being prepared'}
          description={
            isKo
              ? '확인된 주보와 자료가 준비되는 대로 이곳에 추가하겠습니다.'
              : 'Verified bulletins and resources will appear here as soon as they are ready.'
          }
          href="/contact"
          linkLabel={isKo ? '자료 문의하기' : 'Ask about a resource'}
        />
      ) : null}
    </article>
  );
};

Resources.meta = {
  title: 'Resources',
  description: 'Bulletins and helpful resources from Sydney Samil Church.',
};

export default Resources;
```

- [ ] **Step 2: Style the new size column**

Append to `app/src/styles/globals.css`:

```css
.resource-list__meta {
  color: var(--muted, #6b7280);
  font-size: 0.85rem;
  white-space: nowrap;
}
```

- [ ] **Step 3: Verify the type check and build**

Run: `cd app && npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 4: Confirm no storage URL reaches the export**

Run: `cd app && ! grep -r "blob.core.windows.net" out/ && ! grep -r "example.com" out/`
Expected: exit 0, meaning neither string is present.

- [ ] **Step 5: Commit**

```bash
git add app/src/pages/resources.tsx app/src/styles/globals.css
git commit -m "Serve the resource library through authorized download links"
```

---

### Task 13: Editor console

**Files:**
- Create: `app/src/pages/manage/index.tsx`
- Create: `app/src/lib/uploadFile.ts`
- Create: `app/src/lib/uploadFile.test.ts`
- Modify: `app/src/components/Header.tsx:7-15`

**Interfaces:**
- Consumes: `useRoles` from Task 10; `fetchEvents`, `fetchSermons`, `fetchResources`, `useContent` from Task 11; `POST /api/files/upload-url` from Task 7
- Produces: `uploadFile(file: File, folder: 'resources' | 'sermons' | 'events'): Promise<{ blobPath: string; contentType: string; sizeBytes: number }>`
- Produces: `validateFileForUpload(file: { size: number; type: string }): string | null` returning an error key or `null`

- [ ] **Step 1: Write the failing upload test**

Create `app/src/lib/uploadFile.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import { validateFileForUpload, MAX_UPLOAD_BYTES } from './uploadFile';

test('accepts a small pdf', () => {
  assert.strictEqual(validateFileForUpload({ size: 1024, type: 'application/pdf' }), null);
});

test('rejects a file over the limit', () => {
  assert.strictEqual(validateFileForUpload({ size: MAX_UPLOAD_BYTES + 1, type: 'application/pdf' }), 'tooLarge');
});

test('rejects an executable', () => {
  assert.strictEqual(validateFileForUpload({ size: 10, type: 'application/x-msdownload' }), 'badType');
});

test('rejects an empty file', () => {
  assert.strictEqual(validateFileForUpload({ size: 0, type: 'application/pdf' }), 'empty');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app && npm run test:lib`
Expected: FAIL with a module-resolution error for `./uploadFile`.

- [ ] **Step 3: Implement the upload helper**

Create `app/src/lib/uploadFile.ts`. The limits mirror `api/shared/blob.js` exactly:

```ts
export const MAX_UPLOAD_BYTES = 26214400;

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export type UploadFolder = 'resources' | 'sermons' | 'events';

export const validateFileForUpload = (file: { size: number; type: string }): string | null => {
  if (!file.size) return 'empty';
  if (file.size > MAX_UPLOAD_BYTES) return 'tooLarge';
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) return 'badType';
  return null;
};

export const uploadFile = async (file: File, folder: UploadFolder) => {
  const problem = validateFileForUpload(file);
  if (problem) {
    throw new Error(problem);
  }

  const sasRes = await fetch('/api/files/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ folder, fileName: file.name, contentType: file.type, sizeBytes: file.size }),
  });

  if (!sasRes.ok) {
    throw new Error(`uploadUrlFailed:${sasRes.status}`);
  }

  const { uploadUrl, blobPath } = (await sasRes.json()) as { uploadUrl: string; blobPath: string };

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`uploadFailed:${putRes.status}`);
  }

  return { blobPath, contentType: file.type, sizeBytes: file.size };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app && npm run test:lib`
Expected: PASS, 13 tests.

- [ ] **Step 5: Build the editor console**

Create `app/src/pages/manage/index.tsx`:

```tsx
import type { NextPage } from 'next';
import { useState } from 'react';
import PageHero from '../../components/PageHero';
import { useLanguage } from '../../lib/LanguageContext';
import { useRequireAuth } from '../../lib/swaAuth';
import { useRoles } from '../../lib/useRoles';
import { fetchResources, useContent, type ApiResource } from '../../lib/contentApi';
import { uploadFile } from '../../lib/uploadFile';

const ManagePage: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { isEditor, isLoading: isRoleLoading } = useRoles();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: resources } = useContent<ApiResource>(fetchResources);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (isLoading || isRoleLoading) {
    return <p className="account-state">{isKo ? '권한 확인 중...' : 'Checking permissions...'}</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isEditor) {
    return (
      <section className="site-page settings-page">
        <div className="site-empty-state settings-card">
          <h1>{isKo ? '자료 관리' : 'Content management'}</h1>
          <p className="error-text">{isKo ? '편집 권한이 필요합니다.' : 'Editor role is required.'}</p>
        </div>
      </section>
    );
  }

  const onSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!file || !title.trim()) {
      setStatus(isKo ? '제목과 파일을 모두 입력해 주세요.' : 'Provide both a title and a file.');
      return;
    }

    setIsBusy(true);
    setStatus(null);
    try {
      const uploaded = await uploadFile(file, 'resources');
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim(), ...uploaded }),
      });
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      setStatus(isKo ? '자료가 등록되었습니다. 새로고침하면 목록에 보입니다.' : 'Resource uploaded. Refresh to see it listed.');
      setTitle('');
      setFile(null);
    } catch (error) {
      setStatus(isKo ? '업로드에 실패했습니다.' : 'Upload failed.');
    }
    setIsBusy(false);
  };

  return (
    <article className="site-page settings-page">
      <PageHero
        eyebrow={isKo ? '편집자' : 'Editors'}
        title={isKo ? '자료 관리' : 'Content management'}
        description={
          isKo
            ? '주보와 자료를 올리고 목록을 관리합니다. 파일은 최대 25MB까지 등록할 수 있습니다.'
            : 'Upload bulletins and resources. Files may be up to 25 MB.'
        }
      />

      <form className="settings-card" onSubmit={onSubmit}>
        <label htmlFor="resource-title">{isKo ? '자료 제목' : 'Resource title'}</label>
        <input
          id="resource-title"
          type="text"
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          maxLength={200}
          required
        />

        <label htmlFor="resource-file">{isKo ? '파일' : 'File'}</label>
        <input
          id="resource-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx"
          onChange={(changeEvent) => setFile(changeEvent.target.files?.[0] ?? null)}
          required
        />

        <button type="submit" disabled={isBusy}>
          {isBusy ? (isKo ? '업로드 중...' : 'Uploading...') : isKo ? '업로드' : 'Upload'}
        </button>

        {status ? (
          <p className="account-state" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}
      </form>

      <section className="settings-card">
        <h2>{isKo ? '등록된 자료' : 'Uploaded resources'}</h2>
        {resources.length ? (
          <ul>
            {resources.map((resource) => (
              <li key={resource.id}>{resource.title}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">{isKo ? '등록된 자료가 없습니다.' : 'No resources yet.'}</p>
        )}
      </section>
    </article>
  );
};

ManagePage.meta = {
  title: 'Manage',
  description: 'Content management for Sydney Samil Church editors.',
};

export default ManagePage;
```

- [ ] **Step 6: Show the manage link to editors only**

In `app/src/components/Header.tsx`, add the role hook import:

```tsx
import { useRoles } from '../lib/useRoles';
```

Inside the component, after the `useLanguage` call, add:

```tsx
  const { isEditor } = useRoles();
```

Then render the extra item after the `navItems` map inside the `<ul className="nav">`:

```tsx
          {isEditor ? (
            <li className="nav__item">
              <Link
                href="/manage"
                className={isActive('/manage') ? 'nav__link nav__link--active' : 'nav__link'}
              >
                {isKo ? '자료 관리' : 'Manage'}
              </Link>
            </li>
          ) : null}
```

- [ ] **Step 7: Verify the type check and build**

Run: `cd app && npm run typecheck && npm run build`
Expected: both exit 0 and `out/manage/index.html` exists.

- [ ] **Step 8: Commit**

```bash
git add app/src/pages/manage app/src/lib/uploadFile.ts app/src/lib/uploadFile.test.ts app/src/components/Header.tsx
git commit -m "Add editor console for resource upload"
```

---

### Task 14: Event and sermon editing in the console

**Files:**
- Create: `app/src/components/manage/ContentForm.tsx`
- Modify: `app/src/pages/manage/index.tsx`

**Interfaces:**
- Consumes: `POST`, `PUT`, `DELETE /api/events` and `/api/sermons` from Tasks 5 and 6; `fetchEvents`, `fetchSermons`, `useContent` from Task 11
- Produces: `ContentForm` with props `{ fields: FormField[]; submitLabel: string; onSubmit: (values: Record<string, string>) => Promise<void> }`
- Produces: `type FormField = { name: string; label: string; type: 'text' | 'date' | 'url' | 'textarea'; required?: boolean }`

- [ ] **Step 1: Build the shared form component**

Create `app/src/components/manage/ContentForm.tsx`. One component serves both events and sermons so the console does not repeat form wiring:

```tsx
import { useState } from 'react';

export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'date' | 'url' | 'textarea';
  required?: boolean;
};

type ContentFormProps = {
  fields: FormField[];
  submitLabel: string;
  busyLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
};

const ContentForm = ({ fields, submitLabel, busyLabel, onSubmit }: ContentFormProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    setIsBusy(true);
    setStatus(null);
    try {
      await onSubmit(values);
      setValues({});
    } catch (error) {
      setStatus((error as Error).message);
    }
    setIsBusy(false);
  };

  return (
    <form className="settings-card" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={`field-${field.name}`}>{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              id={`field-${field.name}`}
              value={values[field.name] ?? ''}
              onChange={(changeEvent) =>
                setValues((previous) => ({ ...previous, [field.name]: changeEvent.target.value }))
              }
              required={field.required}
            />
          ) : (
            <input
              id={`field-${field.name}`}
              type={field.type}
              value={values[field.name] ?? ''}
              onChange={(changeEvent) =>
                setValues((previous) => ({ ...previous, [field.name]: changeEvent.target.value }))
              }
              required={field.required}
            />
          )}
        </div>
      ))}

      <button type="submit" disabled={isBusy}>
        {isBusy ? busyLabel : submitLabel}
      </button>

      {status ? (
        <p className="error-text" role="alert">
          {status}
        </p>
      ) : null}
    </form>
  );
};

export default ContentForm;
```

- [ ] **Step 2: Add event and sermon sections to the console**

In `app/src/pages/manage/index.tsx`, add these imports:

```tsx
import ContentForm, { type FormField } from '../../components/manage/ContentForm';
import { fetchEvents, fetchSermons, type ApiEvent, type ApiSermon } from '../../lib/contentApi';
```

Add these hooks next to the existing `useContent` call:

```tsx
  const { items: events } = useContent<ApiEvent>(fetchEvents);
  const { items: sermons } = useContent<ApiSermon>(fetchSermons);
```

Add this helper above the component:

```tsx
const postContent = async (endpoint: string, values: Record<string, string>) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(values),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(detail.error || `Request failed (${res.status})`);
  }
};
```

Add these sections before the closing `</article>`:

```tsx
      <section className="settings-card">
        <h2>{isKo ? '이벤트 추가' : 'Add an event'}</h2>
        <ContentForm
          fields={
            [
              { name: 'slug', label: isKo ? '주소 슬러그' : 'URL slug', type: 'text', required: true },
              { name: 'date', label: isKo ? '날짜' : 'Date', type: 'date', required: true },
              { name: 'title', label: isKo ? '제목' : 'Title', type: 'text', required: true },
              { name: 'description', label: isKo ? '설명' : 'Description', type: 'textarea' },
              { name: 'youtubeUrl', label: isKo ? '유튜브 주소' : 'YouTube URL', type: 'url' },
            ] as FormField[]
          }
          submitLabel={isKo ? '이벤트 저장' : 'Save event'}
          busyLabel={isKo ? '저장 중...' : 'Saving...'}
          onSubmit={(values) => postContent('/api/events', values)}
        />
        <p className="muted">
          {isKo ? `등록된 이벤트 ${events.length}건` : `${events.length} events published`}
        </p>
      </section>

      <section className="settings-card">
        <h2>{isKo ? '설교 추가' : 'Add a sermon'}</h2>
        <ContentForm
          fields={
            [
              { name: 'date', label: isKo ? '날짜' : 'Date', type: 'date', required: true },
              { name: 'title', label: isKo ? '제목' : 'Title', type: 'text', required: true },
              { name: 'speaker', label: isKo ? '설교자' : 'Speaker', type: 'text' },
              { name: 'youtubeUrl', label: isKo ? '유튜브 주소' : 'YouTube URL', type: 'url' },
            ] as FormField[]
          }
          submitLabel={isKo ? '설교 저장' : 'Save sermon'}
          busyLabel={isKo ? '저장 중...' : 'Saving...'}
          onSubmit={(values) => postContent('/api/sermons', values)}
        />
        <p className="muted">
          {isKo ? `등록된 설교 ${sermons.length}건` : `${sermons.length} sermons published`}
        </p>
      </section>
```

- [ ] **Step 3: Verify the type check and build**

Run: `cd app && npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/manage app/src/pages/manage/index.tsx
git commit -m "Add event and sermon editing to the editor console"
```

---

### Task 15: Seed script, documentation, and full verification

**Files:**
- Create: `api/scripts/seed-content.js`
- Delete: `app/src/content/resources.json`
- Modify: `app/src/content/events.json`
- Modify: `README.md`
- Modify: `app/package.json`

**Interfaces:**
- Consumes: `sql`, `getPool`, `ensureSchema` from Task 4
- Produces: `node scripts/seed-content.js` which inserts any `events.json` and `sermons.json` rows missing from SQL

- [ ] **Step 1: Write the seed script**

Create `api/scripts/seed-content.js`:

```js
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { sql, getPool, ensureSchema } = require('../shared/db');

const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'app', 'src', 'content', relativePath), 'utf8'));

const seed = async () => {
  await ensureSchema();
  const pool = await getPool();

  for (const event of readJson('events.json')) {
    await pool
      .request()
      .input('slug', sql.NVarChar(120), event.slug)
      .input('eventDate', sql.Date, event.date)
      .input('title', sql.NVarChar(200), event.title)
      .input('description', sql.NVarChar(sql.MAX), event.description || null)
      .input('youTubeUrl', sql.NVarChar(500), event.youtubeUrl || null)
      .input('actor', sql.NVarChar(256), 'seed')
      .query(`
IF NOT EXISTS (SELECT 1 FROM dbo.Events WHERE Slug = @slug)
INSERT INTO dbo.Events (Slug, EventDate, Title, Description, YouTubeUrl, CreatedBy, UpdatedBy)
VALUES (@slug, @eventDate, @title, @description, @youTubeUrl, @actor, @actor);
`);
    console.log(`event: ${event.slug}`);
  }

  for (const sermon of readJson('sermons.json')) {
    await pool
      .request()
      .input('sermonDate', sql.Date, sermon.date)
      .input('title', sql.NVarChar(200), sermon.title)
      .input('speaker', sql.NVarChar(120), sermon.speaker || null)
      .input('youTubeUrl', sql.NVarChar(500), sermon.youtubeUrl || null)
      .input('actor', sql.NVarChar(256), 'seed')
      .query(`
IF NOT EXISTS (SELECT 1 FROM dbo.Sermons WHERE SermonDate = @sermonDate AND Title = @title)
INSERT INTO dbo.Sermons (SermonDate, Title, Speaker, YouTubeUrl, CreatedBy, UpdatedBy)
VALUES (@sermonDate, @title, @speaker, @youTubeUrl, @actor, @actor);
`);
    console.log(`sermon: ${sermon.title}`);
  }

  await pool.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Remove the resource JSON that leaked file URLs**

Run: `cd app && rm src/content/resources.json`

Resources now live only in SQL and Blob. Events and sermons JSON stay because `getStaticPaths` still needs the event slug list.

- [ ] **Step 3: Document the new configuration**

In `README.md`, replace the `## Entra group sync (GitHub Actions, optional)` section heading block with a new section placed before it:

```markdown
## Roles and permissions

The site uses three Entra security groups mapped to Static Web Apps roles by `/api/roles`:

| Entra group | SWA role | Capability |
| --- | --- | --- |
| Samil-Members | `member` | View and download the resource library and sermon files |
| Samil-Editors | `editor` | Everything above, plus upload files and maintain events and sermons |
| Samil-Admins | `admin` | Everything above, plus site settings at `/settings` |

Roles are cumulative and resolved from group **object IDs**, not names.

### Required application settings

| Setting | Purpose |
| --- | --- |
| `SAMIL_GROUP_MEMBER_ID` | Object ID of `Samil-Members` |
| `SAMIL_GROUP_EDITOR_ID` | Object ID of `Samil-Editors` |
| `SAMIL_GROUP_ADMIN_ID` | Object ID of `Samil-Admins` |
| `AZURE_STORAGE_ACCOUNT` | Storage account name holding church files |
| `AZURE_STORAGE_KEY` | Storage account key used to sign SAS URLs |
| `AZURE_STORAGE_CONTAINER` | Private container name, default `church-files` |

### Required Graph application permission

Add `GroupMember.Read.All` with admin consent so `/api/roles` can read group membership.

### File handling

The Blob container must be **private**. Uploads use a 10-minute single-blob SAS and downloads
use a 5-minute read SAS issued by `/api/files/download/{id}` after the role check. No permanent
storage URL is ever sent to a browser.

### Seeding existing content

```bash
cd api
node scripts/seed-content.js
```

### Local development bypass

`NEXT_PUBLIC_DEV_ROLE_BYPASS=0` disables the development role bypass, which otherwise grants
all three roles under `next dev`.
```

- [ ] **Step 4: Add an aggregate test script**

In `app/package.json`, add to `scripts`:

```json
    "test": "npm run test:lib && npm run test:routes",
```

- [ ] **Step 5: Run the full verification**

Run: `cd api && npm test && cd ../app && npm test && npm run typecheck && npm run build`
Expected: API 53 tests pass, app 13 library tests and 12 route tests pass, `tsc` exits 0, and the export succeeds.

- [ ] **Step 6: Confirm no file URL leaked into the export**

Run: `cd app && ! grep -rE "blob\.core\.windows\.net|example\.com" out/`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add api/scripts/seed-content.js README.md app/package.json
git rm app/src/content/resources.json
git commit -m "Add content seeding and document role-based access setup"
```
