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

  const connectTimeoutSeconds = Number.parseInt(
    map['connection timeout'] || map.connecttimeout || map.timeout || '',
    10
  );
  if (Number.isFinite(connectTimeoutSeconds) && connectTimeoutSeconds > 0) {
    config.connectionTimeout = connectTimeoutSeconds * 1000;
  }

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

IF COL_LENGTH('dbo.Sermons', 'MediaUrl') IS NULL
  ALTER TABLE dbo.Sermons ADD MediaUrl NVARCHAR(600) NULL;

IF COL_LENGTH('dbo.Sermons', 'MediaContentType') IS NULL
  ALTER TABLE dbo.Sermons ADD MediaContentType NVARCHAR(150) NULL;

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
