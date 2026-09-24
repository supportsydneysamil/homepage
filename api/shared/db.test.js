const test = require('node:test');
const assert = require('node:assert');
const { parseSqlConnectionString, SCHEMA_SQL, isMissingObjectError, withSchema, POOL_IDLE_TIMEOUT_MS } = require('./db');

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

test('events gain location and start time columns on existing databases', () => {
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.Events', 'Location')"));
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.Events', 'StartTime')"));
});

test('sermons gain a subtitle column on existing databases', () => {
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.Sermons', 'Subtitle')"));
  assert.ok(SCHEMA_SQL.includes('Subtitle NVARCHAR(200) NULL'));
});

test('site settings gain nullable homepage image path columns', () => {
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.SiteSettings', 'HeroImagePath')"));
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.SiteSettings', 'PastorImagePath')"));
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.SiteSettings', 'LogoImagePath')"));
  assert.ok(SCHEMA_SQL.includes('HeroImagePath NVARCHAR(400) NULL'));
  assert.ok(SCHEMA_SQL.includes('PastorImagePath NVARCHAR(400) NULL'));
  assert.ok(SCHEMA_SQL.includes('LogoImagePath NVARCHAR(400) NULL'));
});

test('site settings gain church info and site copy json columns', () => {
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.SiteSettings', 'ChurchInfoJson')"));
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.SiteSettings', 'SiteCopyJson')"));
  assert.ok(SCHEMA_SQL.includes('ChurchInfoJson NVARCHAR(MAX) NULL'));
  assert.ok(SCHEMA_SQL.includes('SiteCopyJson NVARCHAR(MAX) NULL'));
  assert.ok(SCHEMA_SQL.includes("COL_LENGTH('dbo.SiteSettings', 'ImagePresentationJson')"));
  assert.ok(SCHEMA_SQL.includes('ImagePresentationJson NVARCHAR(MAX) NULL'));
});

test('content tables record who changed them', () => {
  assert.ok(SCHEMA_SQL.includes('CreatedBy'));
  assert.ok(SCHEMA_SQL.includes('UpdatedBy'));
});

test('a pooled connection outlives the gap between two visitors', () => {
  assert.ok(POOL_IDLE_TIMEOUT_MS >= 300000, 'idle connections should survive at least five minutes');
});

test('every connection config keeps the same idle timeout', () => {
  const fromString = parseSqlConnectionString('Server=samil.database.windows.net;Database=d;User=u;Password=p');
  const fromUrl = parseSqlConnectionString('mssql://u:p@samil.database.windows.net/d');
  assert.strictEqual(fromString.pool.idleTimeoutMillis, POOL_IDLE_TIMEOUT_MS);
  assert.strictEqual(fromUrl.pool.idleTimeoutMillis, POOL_IDLE_TIMEOUT_MS);
});

test('a missing table or column is a schema error', () => {
  assert.strictEqual(isMissingObjectError({ number: 208 }), true);
  assert.strictEqual(isMissingObjectError({ number: 207 }), true);
  assert.strictEqual(isMissingObjectError({ originalError: { info: { number: 208 } } }), true);
});

test('any other failure is not a schema error', () => {
  assert.strictEqual(isMissingObjectError({ number: 4060 }), false);
  assert.strictEqual(isMissingObjectError(new Error('connection timeout')), false);
  assert.strictEqual(isMissingObjectError(null), false);
});

test('a read that succeeds never checks the schema', async () => {
  let checked = 0;
  const value = await withSchema(async () => 'rows', async () => {
    checked += 1;
  });
  assert.strictEqual(value, 'rows');
  assert.strictEqual(checked, 0);
});

test('a read against a missing table checks the schema and retries once', async () => {
  let attempts = 0;
  let checked = 0;
  const value = await withSchema(
    async () => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error('Invalid object name'), { number: 208 });
      return 'rows';
    },
    async () => {
      checked += 1;
    }
  );
  assert.strictEqual(value, 'rows');
  assert.strictEqual(attempts, 2);
  assert.strictEqual(checked, 1);
});

test('a read that fails for any other reason is not retried', async () => {
  let attempts = 0;
  await assert.rejects(
    withSchema(
      async () => {
        attempts += 1;
        throw Object.assign(new Error('login failed'), { number: 18456 });
      },
      async () => {}
    ),
    /login failed/
  );
  assert.strictEqual(attempts, 1);
});
