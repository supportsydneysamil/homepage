const { sql, getPool, ensureSchema, withSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');
const { deleteBlob, publicUrlFor, SITE_FOLDER } = require('../shared/blob');

const SUPPORTED_THEMES = ['dark', 'light', 'church', 'modern-sky', 'modern-sand'];
const DEFAULT_THEME = 'church';
const DEFAULT_SETTING_KEY = 'theme';
const MAX_CONTENT_JSON = 200000;

const parseStoredJson = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const parseContentObject = (value, field) => {
  if (value === undefined) return { omitted: true };
  if (value === null) return { value: null };
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { error: `${field} must be an object.` };
  }
  const json = JSON.stringify(value);
  if (json.length > MAX_CONTENT_JSON) return { error: `${field} is too large.` };
  return { value };
};

const toJson = (value) => (value == null ? null : JSON.stringify(value));

const getCurrentSettings = async () =>
  withSchema(async () => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('settingKey', sql.NVarChar(100), DEFAULT_SETTING_KEY)
      .query(`
SELECT TOP 1 ThemeId, HeroImagePath, PastorImagePath, LogoImagePath, ChurchInfoJson, SiteCopyJson, UpdatedAt, UpdatedBy
FROM dbo.SiteSettings
WHERE SettingKey = @settingKey
`);

    const row = result.recordset && result.recordset[0];
    if (row) {
      return {
        themeId: row.ThemeId,
        heroImagePath: row.HeroImagePath || null,
        pastorImagePath: row.PastorImagePath || null,
        logoImagePath: row.LogoImagePath || null,
        churchInfo: parseStoredJson(row.ChurchInfoJson),
        siteCopy: parseStoredJson(row.SiteCopyJson),
        updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : null,
        updatedBy: row.UpdatedBy || null,
      };
    }

    await pool
      .request()
      .input('settingKey', sql.NVarChar(100), DEFAULT_SETTING_KEY)
      .input('themeId', sql.NVarChar(50), DEFAULT_THEME)
      .query('INSERT INTO dbo.SiteSettings (SettingKey, ThemeId) VALUES (@settingKey, @themeId)');

    return {
      themeId: DEFAULT_THEME,
      heroImagePath: null,
      pastorImagePath: null,
      logoImagePath: null,
      churchInfo: null,
      siteCopy: null,
      updatedAt: null,
      updatedBy: null,
    };
  });

const saveSettings = async (settings, updatedBy) => {
  await ensureSchema();
  const pool = await getPool();
  await pool
    .request()
    .input('settingKey', sql.NVarChar(100), DEFAULT_SETTING_KEY)
    .input('themeId', sql.NVarChar(50), settings.themeId)
    .input('heroImagePath', sql.NVarChar(400), settings.heroImagePath)
    .input('pastorImagePath', sql.NVarChar(400), settings.pastorImagePath)
    .input('logoImagePath', sql.NVarChar(400), settings.logoImagePath)
    .input('churchInfoJson', sql.NVarChar(sql.MAX), settings.churchInfoJson)
    .input('siteCopyJson', sql.NVarChar(sql.MAX), settings.siteCopyJson)
    .input('updatedBy', sql.NVarChar(256), updatedBy)
    .query(`
MERGE dbo.SiteSettings AS target
USING (
  SELECT
    @settingKey AS SettingKey,
    @themeId AS ThemeId,
    @heroImagePath AS HeroImagePath,
    @pastorImagePath AS PastorImagePath,
    @logoImagePath AS LogoImagePath,
    @churchInfoJson AS ChurchInfoJson,
    @siteCopyJson AS SiteCopyJson,
    @updatedBy AS UpdatedBy
) AS src
ON target.SettingKey = src.SettingKey
WHEN MATCHED THEN
  UPDATE SET
    ThemeId = src.ThemeId,
    HeroImagePath = src.HeroImagePath,
    PastorImagePath = src.PastorImagePath,
    LogoImagePath = src.LogoImagePath,
    ChurchInfoJson = src.ChurchInfoJson,
    SiteCopyJson = src.SiteCopyJson,
    UpdatedBy = src.UpdatedBy,
    UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (SettingKey, ThemeId, HeroImagePath, PastorImagePath, LogoImagePath, ChurchInfoJson, SiteCopyJson, UpdatedBy, UpdatedAt)
  VALUES (
    src.SettingKey,
    src.ThemeId,
    src.HeroImagePath,
    src.PastorImagePath,
    src.LogoImagePath,
    src.ChurchInfoJson,
    src.SiteCopyJson,
    src.UpdatedBy,
    SYSUTCDATETIME()
  );
`);

  return getCurrentSettings();
};

const isSiteImagePath = (value) => {
  const blobPath = String(value || '');
  return blobPath.startsWith(`${SITE_FOLDER}/`) && !blobPath.includes('..');
};

const parseImagePath = (value) => {
  if (value === null) return { value: null };
  if (typeof value !== 'string' || !isSiteImagePath(value)) {
    return { error: 'Image path must be an uploaded file inside the site folder.' };
  }
  return { value };
};

const withUrls = (settings, urlFor) => ({
  themeId: settings.themeId,
  heroImagePath: settings.heroImagePath || null,
  pastorImagePath: settings.pastorImagePath || null,
  logoImagePath: settings.logoImagePath || null,
  heroImageUrl: settings.heroImagePath ? urlFor(settings.heroImagePath) : null,
  pastorImageUrl: settings.pastorImagePath ? urlFor(settings.pastorImagePath) : null,
  logoImageUrl: settings.logoImagePath ? urlFor(settings.logoImagePath) : null,
  churchInfo: settings.churchInfo || null,
  siteCopy: settings.siteCopy || null,
  updatedAt: settings.updatedAt || null,
  updatedBy: settings.updatedBy || null,
});

const defaultDeps = { getCurrentSettings, saveSettings, deleteBlob, publicUrlFor };

module.exports = async function (context, req, overrides = {}) {
  const deps = { ...defaultDeps, ...overrides };
  try {
    if (req.method === 'GET') {
      const settings = await deps.getCurrentSettings();
      context.res = { status: 200, body: withUrls(settings, deps.publicUrlFor) };
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

    const body = req.body || {};
    const nextThemeId = body.themeId;
    if (!SUPPORTED_THEMES.includes(nextThemeId)) {
      context.res = { status: 400, body: { error: 'Invalid themeId.', allowed: SUPPORTED_THEMES } };
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(body, 'heroImagePath') ||
        !Object.prototype.hasOwnProperty.call(body, 'pastorImagePath') ||
        !Object.prototype.hasOwnProperty.call(body, 'logoImagePath')) {
      context.res = { status: 400, body: { error: 'All image path fields are required.' } };
      return;
    }

    const hero = parseImagePath(body.heroImagePath);
    const pastor = parseImagePath(body.pastorImagePath);
    const logo = parseImagePath(body.logoImagePath);
    if (hero.error || pastor.error || logo.error) {
      context.res = { status: 400, body: { error: hero.error || pastor.error || logo.error } };
      return;
    }

    const churchInfo = parseContentObject(body.churchInfo, 'churchInfo');
    const siteCopy = parseContentObject(body.siteCopy, 'siteCopy');
    if (churchInfo.error || siteCopy.error) {
      context.res = { status: 400, body: { error: churchInfo.error || siteCopy.error } };
      return;
    }

    const previous = await deps.getCurrentSettings();
    const nextChurchInfo = churchInfo.omitted ? previous.churchInfo || null : churchInfo.value;
    const nextSiteCopy = siteCopy.omitted ? previous.siteCopy || null : siteCopy.value;
    const saved = await deps.saveSettings(
      {
        themeId: nextThemeId,
        heroImagePath: hero.value,
        pastorImagePath: pastor.value,
        logoImagePath: logo.value,
        churchInfoJson: toJson(nextChurchInfo),
        siteCopyJson: toJson(nextSiteCopy),
      },
      actorOf(auth.principal)
    );

    for (const [oldPath, nextPath] of [
      [previous.heroImagePath, hero.value],
      [previous.pastorImagePath, pastor.value],
      [previous.logoImagePath, logo.value],
    ]) {
      if (oldPath && oldPath !== nextPath && isSiteImagePath(oldPath)) {
        try {
          await deps.deleteBlob(oldPath, SITE_FOLDER);
        } catch (error) {
          context.log.error('site image cleanup failed:', (error && error.message) || error);
        }
      }
    }

    context.res = { status: 200, body: withUrls(saved, deps.publicUrlFor) };
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
module.exports.isSiteImagePath = isSiteImagePath;
