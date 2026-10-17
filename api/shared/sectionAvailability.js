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

module.exports = {
  PUBLIC_SECTION_KEYS,
  DEFAULT_SECTION_AVAILABILITY,
  CLOSED_SECTION_AVAILABILITY,
  normalizeSectionAvailability,
  parseStoredSectionAvailability,
  validateSectionAvailabilityInput,
};
