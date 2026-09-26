const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORIES = ['account', 'discipleship', 'ministry', 'gathering', 'other'];
const VISIBILITIES = ['public', 'member'];
const FORM_HOSTS = new Set([
  'forms.office.com',
  'www.forms.office.com',
  'forms.microsoft.com',
  'www.forms.microsoft.com',
]);

const isMicrosoftFormUrl = (value) => {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' && FORM_HOSTS.has(url.hostname);
  } catch (error) {
    return false;
  }
};

const parseDate = (value, label) => {
  const date = String(value || '').trim();
  if (!date) return { value: null };
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return { error: `${label} must be YYYY-MM-DD.` };
  }
  return { value: date };
};

const parseFlag = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  return defaultValue;
};

const validateApplicationInput = (body) => {
  const input = body || {};
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const formUrl = String(input.formUrl || '').trim();

  if (!title || title.length > 200) return { error: 'Title is required and must be 200 characters or fewer.' };
  if (description.length > 500) return { error: 'Description must be 500 characters or fewer.' };
  if (!isMicrosoftFormUrl(formUrl)) return { error: 'Form URL must be an https Microsoft Forms link.' };

  const opensOn = parseDate(input.opensOn, 'Opening date');
  if (opensOn.error) return { error: opensOn.error };
  const closesOn = parseDate(input.closesOn, 'Closing date');
  if (closesOn.error) return { error: closesOn.error };
  if (opensOn.value && closesOn.value && closesOn.value < opensOn.value) {
    return { error: 'Closing date must be on or after the opening date.' };
  }

  const category = String(input.category || '').trim().toLowerCase();
  const visibility = String(input.visibility || '').trim().toLowerCase();

  return {
    value: {
      title,
      description: description || null,
      formUrl,
      category: CATEGORIES.includes(category) ? category : 'other',
      visibility: VISIBILITIES.includes(visibility) ? visibility : 'member',
      opensOn: opensOn.value,
      closesOn: closesOn.value,
      published: parseFlag(input.published, true),
      highlightOnHome: parseFlag(input.highlightOnHome, false),
    },
  };
};

module.exports = {
  CATEGORIES,
  VISIBILITIES,
  isMicrosoftFormUrl,
  validateApplicationInput,
};
