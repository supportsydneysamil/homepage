import type { ChurchInfo, LocalizedText } from './churchInfo';
import type { SiteCopy } from './siteCopy';

export type SettingsValidationCode =
  | 'required'
  | 'email'
  | 'phone'
  | 'time'
  | 'period'
  | 'tooLong'
  | 'serviceRequired';

export type SettingsValidationIssue = {
  tab: 'church' | 'copy';
  path: string;
  code: SettingsValidationCode;
};

const required = (value: string) => !value.trim();
const tooLong = (value: string, maximum: number) => value.trim().length > maximum;

const addTextIssue = (
  issues: SettingsValidationIssue[],
  tab: 'church' | 'copy',
  path: string,
  value: string,
  maximum: number
) => {
  if (required(value)) issues.push({ tab, path, code: 'required' });
  else if (tooLong(value, maximum)) issues.push({ tab, path, code: 'tooLong' });
};

const addLocalizedIssue = (
  issues: SettingsValidationIssue[],
  tab: 'church' | 'copy',
  path: string,
  value: LocalizedText
) => {
  if (required(value.ko) || required(value.en)) {
    issues.push({ tab, path, code: 'required' });
  } else if (tooLong(value.ko, 400) || tooLong(value.en, 400)) {
    issues.push({ tab, path, code: 'tooLong' });
  }
};

export const validateChurchInfoDraft = (
  value: ChurchInfo
): SettingsValidationIssue[] => {
  const issues: SettingsValidationIssue[] = [];
  for (const [path, field, maximum] of [
    ['churchNameKo', value.churchNameKo, 200],
    ['churchNameEn', value.churchNameEn, 200],
    ['brandTitle', value.brandTitle, 200],
    ['phone', value.phone, 40],
    ['email', value.email, 120],
    ['addressLine1', value.addressLine1, 200],
    ['suburb', value.suburb, 200],
    ['mapsQuery', value.mapsQuery, 300],
    ['pastorNameKo', value.pastorNameKo, 200],
    ['pastorNameEn', value.pastorNameEn, 200],
  ] as const) {
    addTextIssue(issues, 'church', path, field, maximum);
  }
  if (value.addressLine2 && tooLong(value.addressLine2, 200)) {
    issues.push({ tab: 'church', path: 'addressLine2', code: 'tooLong' });
  }

  if (!required(value.phone) && value.phone.replace(/\D/g, '').length < 8) {
    issues.push({ tab: 'church', path: 'phone', code: 'phone' });
  }
  if (
    !required(value.email) &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())
  ) {
    issues.push({ tab: 'church', path: 'email', code: 'email' });
  }

  if (!value.services.length) {
    issues.push({ tab: 'church', path: 'services', code: 'serviceRequired' });
  }
  value.services.forEach((service) => {
    if (!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(service.time.trim())) {
      issues.push({ tab: 'church', path: 'services[].time', code: 'time' });
    }
    if (!/^(?:AM|PM)$/i.test(service.period.trim())) {
      issues.push({ tab: 'church', path: 'services[].period', code: 'period' });
    }
    addLocalizedIssue(issues, 'church', 'services[].label', service.label);
    addLocalizedIssue(issues, 'church', 'services[].note', service.note);
  });

  value.gatherings.forEach((gathering) => {
    addTextIssue(issues, 'church', 'gatherings[].badge', gathering.badge, 12);
    addLocalizedIssue(issues, 'church', 'gatherings[].title', gathering.title);
    addLocalizedIssue(issues, 'church', 'gatherings[].detail', gathering.detail);
  });
  return Array.from(
    new Map(issues.map((issue) => [`${issue.path}:${issue.code}`, issue])).values()
  );
};

const collectLocalizedIssues = (
  input: unknown,
  path: string,
  issues: SettingsValidationIssue[]
) => {
  if (!input || typeof input !== 'object') return;
  const row = input as Record<string, unknown>;
  if (typeof row.ko === 'string' && typeof row.en === 'string') {
    addLocalizedIssue(
      issues,
      'copy',
      path,
      { ko: row.ko, en: row.en }
    );
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((item) => collectLocalizedIssues(item, `${path}[]`, issues));
    return;
  }
  Object.entries(row).forEach(([key, child]) =>
    collectLocalizedIssues(child, path ? `${path}.${key}` : key, issues)
  );
};

export const validateSiteCopyDraft = (
  value: SiteCopy
): SettingsValidationIssue[] => {
  const issues: SettingsValidationIssue[] = [];
  collectLocalizedIssues(value, '', issues);
  return Array.from(
    new Map(issues.map((issue) => [`${issue.path}:${issue.code}`, issue])).values()
  );
};

export const settingsValidationMessage = (
  issue: SettingsValidationIssue,
  isKo: boolean
) => {
  const messages: Record<SettingsValidationCode, { ko: string; en: string }> = {
    required: { ko: '필수 값을 입력해 주세요.', en: 'Enter a required value.' },
    email: { ko: '올바른 이메일 주소를 입력해 주세요.', en: 'Enter a valid email address.' },
    phone: { ko: '올바른 전화번호를 입력해 주세요.', en: 'Enter a valid phone number.' },
    time: { ko: '시간을 9:30 형식으로 입력해 주세요.', en: 'Enter time in the format 9:30.' },
    period: { ko: 'AM 또는 PM을 선택해 주세요.', en: 'Choose AM or PM.' },
    tooLong: { ko: '입력 가능한 글자 수를 초과했습니다.', en: 'This value is too long.' },
    serviceRequired: { ko: '예배 시간을 하나 이상 남겨 주세요.', en: 'Keep at least one service.' },
  };
  return isKo ? messages[issue.code].ko : messages[issue.code].en;
};
