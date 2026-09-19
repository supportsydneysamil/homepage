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
