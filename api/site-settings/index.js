const sql = require('mssql');

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const SUPPORTED_THEMES = ['dark', 'light', 'church', 'modern-sky', 'modern-sand'];
const DEFAULT_THEME = 'church';
const DEFAULT_SETTING_KEY = 'theme';

let poolPromise;
let schemaReadyPromise;

const getEnv = (name) => process.env[name] || '';

const getClientPrincipal = (req) => {
  const encoded = req.headers['x-ms-client-principal'];
  if (!encoded) return null;
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

const getGraphToken = async (tenantId, clientId, clientSecret) => {
  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: GRAPH_SCOPE,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    return { error: { status: tokenRes.status, detail: text.slice(0, 200) } };
  }

  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    return { error: { status: 500, detail: 'Missing access token from client credentials.' } };
  }

  return { token: tokenJson.access_token };
};

const hasGlobalAdminRole = async (principal, graphToken) => {
  const userKey = encodeURIComponent(principal.userDetails || principal.userId);
  const rolesRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userKey}/memberOf?$select=id,displayName,description`,
    { headers: { Authorization: `Bearer ${graphToken}` } }
  );

  if (!rolesRes.ok) {
    const detail = await rolesRes.text();
    return { error: { status: rolesRes.status, detail: detail.slice(0, 200) } };
  }

  const rolesJson = await rolesRes.json();
  const directoryRoles =
    rolesJson.value?.filter((item) => item['@odata.type'] === '#microsoft.graph.directoryRole') ?? [];

  const isGlobalAdmin = directoryRoles.some(
    (role) => (role.displayName || '').toLowerCase() === 'global administrator'
  );

  return { isGlobalAdmin };
};

const getSqlConfig = () => {
  const connectionString = getEnv('AZURE_SQL_CONNECTION_STRING');
  if (connectionString) {
    return {
      connectionString,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
      pool: {
        max: 5,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  }

  const server = getEnv('AZURE_SQL_SERVER');
  const database = getEnv('AZURE_SQL_DATABASE');
  const user = getEnv('AZURE_SQL_USER');
  const password = getEnv('AZURE_SQL_PASSWORD');

  if (!server || !database || !user || !password) {
    return null;
  }

  return {
    server,
    database,
    user,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
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

const ensureSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const pool = await getPool();
      await pool.request().query(`
IF OBJECT_ID('dbo.SiteSettings', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.SiteSettings (
    SettingKey NVARCHAR(100) NOT NULL PRIMARY KEY,
    ThemeId NVARCHAR(50) NOT NULL,
    UpdatedBy NVARCHAR(256) NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_SiteSettings_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END
`);
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }
  return schemaReadyPromise;
};

const getCurrentTheme = async () => {
  await ensureSchema();
  const pool = await getPool();
  const result = await pool
    .request()
    .input('settingKey', sql.NVarChar(100), DEFAULT_SETTING_KEY)
    .query(
      'SELECT TOP 1 ThemeId, UpdatedAt, UpdatedBy FROM dbo.SiteSettings WHERE SettingKey = @settingKey'
    );

  const row = result.recordset?.[0];
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
    .query(`
INSERT INTO dbo.SiteSettings (SettingKey, ThemeId)
VALUES (@settingKey, @themeId)
`);

  return {
    themeId: DEFAULT_THEME,
    updatedAt: null,
    updatedBy: null,
  };
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
      const currentTheme = await getCurrentTheme();
      context.res = { status: 200, body: currentTheme };
      return;
    }

    if (req.method !== 'PUT') {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
      return;
    }

    const principal = getClientPrincipal(req);
    if (!principal?.userDetails && !principal?.userId) {
      context.res = { status: 401, body: { error: 'Missing authenticated user context.' } };
      return;
    }

    const tenantId = getEnv('AZURE_TENANT_ID');
    const clientId = getEnv('AZURE_CLIENT_ID');
    const clientSecret = getEnv('AZURE_CLIENT_SECRET');
    if (!tenantId || !clientId || !clientSecret) {
      context.res = {
        status: 500,
        body: { error: 'Missing AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET in app settings.' },
      };
      return;
    }

    const nextThemeId = req.body?.themeId;
    if (!SUPPORTED_THEMES.includes(nextThemeId)) {
      context.res = { status: 400, body: { error: 'Invalid themeId.', allowed: SUPPORTED_THEMES } };
      return;
    }

    const tokenResult = await getGraphToken(tenantId, clientId, clientSecret);
    if (tokenResult.error) {
      context.res = {
        status: tokenResult.error.status || 500,
        body: { error: 'Graph token exchange failed.', detail: tokenResult.error.detail },
      };
      return;
    }

    const accessCheck = await hasGlobalAdminRole(principal, tokenResult.token);
    if (accessCheck.error) {
      context.res = {
        status: accessCheck.error.status || 500,
        body: { error: 'Directory role lookup failed.', detail: accessCheck.error.detail },
      };
      return;
    }

    if (!accessCheck.isGlobalAdmin) {
      context.res = {
        status: 403,
        body: { error: 'Only Global Administrator can update site settings.' },
      };
      return;
    }

    const updated = await saveTheme(nextThemeId, principal.userDetails || principal.userId || 'unknown');
    context.res = { status: 200, body: updated };
  } catch (error) {
    context.log.error('site-settings error:', error?.message || error);
    context.res = {
      status: 500,
      body: {
        error: 'Unable to process site settings with Azure SQL.',
        detail: String(error?.message || error).slice(0, 220),
      },
    };
  }
};
