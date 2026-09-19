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
