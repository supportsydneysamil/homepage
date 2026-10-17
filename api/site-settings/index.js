const { sql, getPool, ensureSchema, withSchema } = require('../shared/db');
const { requireRole, actorOf, ROLES } = require('../shared/principal');
const { deleteBlob, publicUrlFor, SITE_FOLDER } = require('../shared/blob');
const { isMicrosoftFormUrl } = require('../shared/applications');
const { socialLinksError } = require('../shared/social');
const {
  DEFAULT_SECTION_AVAILABILITY,
  normalizeSectionAvailability,
  parseStoredSectionAvailability,
  validateSectionAvailabilityInput,
} = require('../shared/sectionAvailability');

const SUPPORTED_THEMES = ['dark', 'light', 'church', 'modern-sky', 'modern-sand', 'living'];
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
SELECT TOP 1 ThemeId, HeroImagePath, PastorImagePath, LogoImagePath, ChurchInfoJson, SiteCopyJson, ImagePresentationJson, SectionAvailabilityJson, UpdatedAt, UpdatedBy
FROM dbo.SiteSettings
WHERE SettingKey = @settingKey
`);

    const row = result.recordset && result.recordset[0];
    if (row) {
      const parsedSectionAvailability = parseStoredSectionAvailability(
        row.SectionAvailabilityJson
      );
      return {
        themeId: row.ThemeId,
        heroImagePath: row.HeroImagePath || null,
        pastorImagePath: row.PastorImagePath || null,
        logoImagePath: row.LogoImagePath || null,
        imagePresentation: parseStoredJson(row.ImagePresentationJson),
        churchInfo: parseStoredJson(row.ChurchInfoJson),
        siteCopy: parseStoredJson(row.SiteCopyJson),
        sectionAvailability: parsedSectionAvailability.value,
        sectionAvailabilityMalformed: parsedSectionAvailability.malformed,
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
      imagePresentation: null,
      churchInfo: null,
      siteCopy: null,
      sectionAvailability: { ...DEFAULT_SECTION_AVAILABILITY },
      sectionAvailabilityMalformed: false,
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
    .input('imagePresentationJson', sql.NVarChar(sql.MAX), settings.imagePresentationJson)
    .input('sectionAvailabilityJson', sql.NVarChar(sql.MAX), settings.sectionAvailabilityJson)
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
    @imagePresentationJson AS ImagePresentationJson,
    @sectionAvailabilityJson AS SectionAvailabilityJson,
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
    ImagePresentationJson = src.ImagePresentationJson,
    SectionAvailabilityJson = src.SectionAvailabilityJson,
    UpdatedBy = src.UpdatedBy,
    UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (SettingKey, ThemeId, HeroImagePath, PastorImagePath, LogoImagePath, ChurchInfoJson, SiteCopyJson, ImagePresentationJson, SectionAvailabilityJson, UpdatedBy, UpdatedAt)
  VALUES (
    src.SettingKey,
    src.ThemeId,
    src.HeroImagePath,
    src.PastorImagePath,
    src.LogoImagePath,
    src.ChurchInfoJson,
    src.SiteCopyJson,
    src.ImagePresentationJson,
    src.SectionAvailabilityJson,
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

const welcomeFormUrlError = (siteCopy) => {
  const welcome = siteCopy && siteCopy.home && siteCopy.home.welcome;
  const raw = welcome ? welcome.formUrl : undefined;
  if (raw === undefined || raw === null) return null;
  const formUrl = String(raw).trim();
  if (!formUrl) return null;
  if (formUrl.length > 500 || !isMicrosoftFormUrl(formUrl)) {
    return 'Newcomer form link must be an https Microsoft Forms link.';
  }
  return null;
};

const withUrls = (settings, urlFor) => ({
  themeId: settings.themeId,
  heroImagePath: settings.heroImagePath || null,
  pastorImagePath: settings.pastorImagePath || null,
  logoImagePath: settings.logoImagePath || null,
  heroImageUrl: settings.heroImagePath ? urlFor(settings.heroImagePath) : null,
  pastorImageUrl: settings.pastorImagePath ? urlFor(settings.pastorImagePath) : null,
  logoImageUrl: settings.logoImagePath ? urlFor(settings.logoImagePath) : null,
  imagePresentation: settings.imagePresentation || null,
  churchInfo: settings.churchInfo || null,
  siteCopy: settings.siteCopy || null,
  sectionAvailability: normalizeSectionAvailability(settings.sectionAvailability),
  updatedAt: settings.updatedAt || null,
  updatedBy: settings.updatedBy || null,
});

const defaultDeps = { getCurrentSettings, saveSettings, deleteBlob, publicUrlFor };

module.exports = async function (context, req, overrides = {}) {
  const deps = { ...defaultDeps, ...overrides };
  let failedSaveCleanup = [];
  let settingsSaved = false;
  try {
    if (req.method === 'GET') {
      const settings = await deps.getCurrentSettings();
      if (settings.sectionAvailabilityMalformed) {
        context.log.error('site-settings contains malformed SectionAvailabilityJson');
      }
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
    const imagePresentation = parseContentObject(body.imagePresentation, 'imagePresentation');
    if (churchInfo.error || siteCopy.error || imagePresentation.error) {
      context.res = {
        status: 400,
        body: { error: churchInfo.error || siteCopy.error || imagePresentation.error },
      };
      return;
    }

    const welcomeError = siteCopy.omitted ? null : welcomeFormUrlError(siteCopy.value);
    if (welcomeError) {
      context.res = { status: 400, body: { error: welcomeError } };
      return;
    }

    const socialError = churchInfo.omitted ? null : socialLinksError(churchInfo.value);
    if (socialError) {
      context.res = { status: 400, body: { error: socialError } };
      return;
    }

    const sectionAvailability = validateSectionAvailabilityInput(body.sectionAvailability);
    if (sectionAvailability.error) {
      context.res = { status: 400, body: { error: sectionAvailability.error } };
      return;
    }

    const previous = await deps.getCurrentSettings();
    if (previous.sectionAvailabilityMalformed) {
      context.log.error('site-settings contains malformed SectionAvailabilityJson');
    }
    const previousPaths = new Set([
      previous.heroImagePath,
      previous.pastorImagePath,
      previous.logoImagePath,
    ]);
    failedSaveCleanup = [hero.value, pastor.value, logo.value].filter(
      (path) => path && !previousPaths.has(path) && isSiteImagePath(path)
    );
    const nextChurchInfo = churchInfo.omitted ? previous.churchInfo || null : churchInfo.value;
    const nextSiteCopy = siteCopy.omitted ? previous.siteCopy || null : siteCopy.value;
    const nextImagePresentation = imagePresentation.omitted
      ? previous.imagePresentation || null
      : imagePresentation.value;
    const nextSectionAvailability = sectionAvailability.omitted
      ? normalizeSectionAvailability(previous.sectionAvailability)
      : sectionAvailability.value;
    const saved = await deps.saveSettings(
      {
        themeId: nextThemeId,
        heroImagePath: hero.value,
        pastorImagePath: pastor.value,
        logoImagePath: logo.value,
        churchInfoJson: toJson(nextChurchInfo),
        siteCopyJson: toJson(nextSiteCopy),
        imagePresentationJson: toJson(nextImagePresentation),
        sectionAvailabilityJson: toJson(nextSectionAvailability),
      },
      actorOf(auth.principal)
    );
    settingsSaved = true;

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
    if (!settingsSaved) {
      for (const blobPath of failedSaveCleanup) {
        try {
          await deps.deleteBlob(blobPath, SITE_FOLDER);
        } catch (cleanupError) {
          context.log.error(
            'failed settings upload cleanup failed:',
            (cleanupError && cleanupError.message) || cleanupError
          );
        }
      }
    }
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
