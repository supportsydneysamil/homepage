const { sql, getPool, withSchema } = require('./db');
const { getClientPrincipal, ROLES } = require('./principal');

const PUBLIC_SECTION_KEYS = Object.freeze([
  'about',
  'worship',
  'mokjang',
  'events',
  'sermons',
  'resources',
  'contact',
]);

const availabilityWith = (value) =>
  Object.freeze(Object.fromEntries(PUBLIC_SECTION_KEYS.map((section) => [section, value])));

const DEFAULT_SECTION_AVAILABILITY = availabilityWith(true);
const CLOSED_SECTION_AVAILABILITY = availabilityWith(false);

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const hasInvalidControlledValue = (value) =>
  PUBLIC_SECTION_KEYS.some(
    (section) =>
      Object.prototype.hasOwnProperty.call(value, section) &&
      typeof value[section] !== 'boolean'
  );

const normalizeSectionAvailability = (input) => {
  if (input === undefined || input === null) return { ...DEFAULT_SECTION_AVAILABILITY };
  if (!isObject(input) || hasInvalidControlledValue(input)) {
    return { ...CLOSED_SECTION_AVAILABILITY };
  }
  return Object.fromEntries(
    PUBLIC_SECTION_KEYS.map((section) => [
      section,
      Object.prototype.hasOwnProperty.call(input, section) ? input[section] : true,
    ])
  );
};

const parseStoredSectionAvailability = (raw) => {
  if (raw === undefined || raw === null) {
    return { value: { ...DEFAULT_SECTION_AVAILABILITY }, malformed: false };
  }

  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { value: { ...CLOSED_SECTION_AVAILABILITY }, malformed: true };
    }
  }

  if (!isObject(parsed) || hasInvalidControlledValue(parsed)) {
    return { value: { ...CLOSED_SECTION_AVAILABILITY }, malformed: true };
  }
  return { value: normalizeSectionAvailability(parsed), malformed: false };
};

const validateSectionAvailabilityInput = (input) => {
  if (input === undefined) return { omitted: true };
  if (!isObject(input)) {
    return { error: 'sectionAvailability must be an object.' };
  }
  for (const section of PUBLIC_SECTION_KEYS) {
    if (
      Object.prototype.hasOwnProperty.call(input, section) &&
      typeof input[section] !== 'boolean'
    ) {
      return { error: `sectionAvailability.${section} must be a boolean.` };
    }
  }
  return { value: normalizeSectionAvailability(input) };
};

const readCurrentSectionAvailability = async (overrides = {}) => {
  const poolFor = overrides.getPool || getPool;
  const runWithSchema = overrides.withSchema || withSchema;
  return runWithSchema(async () => {
    const pool = await poolFor();
    const result = await pool
      .request()
      .input('settingKey', sql.NVarChar(100), 'theme')
      .query(`
SELECT TOP 1 SectionAvailabilityJson
FROM dbo.SiteSettings
WHERE SettingKey = @settingKey
`);
    const row = result.recordset && result.recordset[0];
    return parseStoredSectionAvailability(row ? row.SectionAvailabilityJson : null);
  });
};

const isManagementRequest = (req) => {
  const principal = getClientPrincipal(req);
  return Boolean(
    principal &&
      (principal.userRoles.includes(ROLES.EDITOR) ||
        principal.userRoles.includes(ROLES.ADMIN))
  );
};

const sectionUnavailableResponse = () => ({
  status: 404,
  headers: { 'Cache-Control': 'no-store' },
  body: {
    code: 'SECTION_UNAVAILABLE',
    error: 'This section is unavailable.',
    errorKo: '현재 이 메뉴를 이용할 수 없습니다.',
  },
});

const guardPublicSection = async (req, section, options = {}) => {
  if (isManagementRequest(req)) return null;

  const readAvailability =
    options.readAvailability || readCurrentSectionAvailability;
  const current = await readAvailability();
  if (current.malformed) {
    const logger = options.logger || console;
    logger.error('malformed SectionAvailabilityJson');
  }
  return current.value[section] === false ? sectionUnavailableResponse() : null;
};

module.exports = {
  PUBLIC_SECTION_KEYS,
  DEFAULT_SECTION_AVAILABILITY,
  CLOSED_SECTION_AVAILABILITY,
  normalizeSectionAvailability,
  parseStoredSectionAvailability,
  validateSectionAvailabilityInput,
  readCurrentSectionAvailability,
  isManagementRequest,
  sectionUnavailableResponse,
  guardPublicSection,
};
