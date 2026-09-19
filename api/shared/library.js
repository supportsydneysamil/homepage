const { ROLES } = require('./roleMap');

const CATEGORIES = ['bulletin', 'smallgroup', 'worship', 'forms', 'minutes', 'newsletter'];
const VISIBILITIES = ['public', 'member', 'admin'];

const DEFAULT_CATEGORY = 'bulletin';
// Anything unrecognised falls back to member rather than public, so a typo
// never widens access.
const DEFAULT_VISIBILITY = 'member';

const normalize = (value) => String(value || '').trim().toLowerCase();

const normalizeCategory = (value) => {
  const candidate = normalize(value);
  return CATEGORIES.includes(candidate) ? candidate : DEFAULT_CATEGORY;
};

const normalizeVisibility = (value) => {
  const candidate = normalize(value);
  return VISIBILITIES.includes(candidate) ? candidate : DEFAULT_VISIBILITY;
};

// Roles are cumulative, but `editor` is about writing, not about reading
// restricted material, so only `admin` unlocks the admin level.
const visibleLevelsFor = (userRoles) => {
  const roles = new Set(Array.isArray(userRoles) ? userRoles : []);
  const levels = ['public'];
  if (roles.has(ROLES.MEMBER)) levels.push('member');
  if (roles.has(ROLES.ADMIN)) levels.push('admin');
  return levels;
};

const canSee = (visibility, userRoles) =>
  visibleLevelsFor(userRoles).includes(normalizeVisibility(visibility));

module.exports = {
  CATEGORIES,
  VISIBILITIES,
  DEFAULT_CATEGORY,
  DEFAULT_VISIBILITY,
  normalizeCategory,
  normalizeVisibility,
  visibleLevelsFor,
  canSee,
};
