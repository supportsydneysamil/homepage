import type { DisplayLanguage } from './presentation';
import type { ApiApplication } from './contentApi';

type Labelled<T extends string> = { id: T; ko: string; en: string };

export type ApplicationCategory = 'account' | 'discipleship' | 'ministry' | 'gathering' | 'other';
export type ApplicationStatus = 'draft' | 'scheduled' | 'open' | 'closed';

export const APPLICATION_CATEGORIES: Labelled<ApplicationCategory>[] = [
  { id: 'account', ko: '계정 · 시스템', en: 'Accounts' },
  { id: 'discipleship', ko: '양육 · 공동체', en: 'Discipleship' },
  { id: 'ministry', ko: '봉사', en: 'Serving' },
  { id: 'gathering', ko: '행사 · 모집', en: 'Gatherings' },
  { id: 'other', ko: '기타', en: 'Other' },
];

export const APPLICATION_VISIBILITIES: Labelled<'public' | 'member'>[] = [
  { id: 'member', ko: '로그인 회원', en: 'Signed-in members' },
  { id: 'public', ko: '전체 공개', en: 'Everyone' },
];

const FORM_HOSTS = new Set([
  'forms.office.com',
  'www.forms.office.com',
  'forms.microsoft.com',
  'www.forms.microsoft.com',
]);

export const isMicrosoftFormUrl = (value: string) => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && FORM_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

const labelFrom = <T extends string>(entries: Labelled<T>[], id: string, lang: DisplayLanguage) => {
  const match = entries.find((entry) => entry.id === id);
  if (!match) return id;
  return lang === 'ko' ? match.ko : match.en;
};

export const applicationCategoryLabel = (id: string, lang: DisplayLanguage) =>
  labelFrom(APPLICATION_CATEGORIES, id, lang);

export const applicationVisibilityLabel = (id: string, lang: DisplayLanguage) =>
  labelFrom(APPLICATION_VISIBILITIES, id, lang);

const STATUS_LABELS: Record<ApplicationStatus, { ko: string; en: string }> = {
  draft: { ko: '초안', en: 'Draft' },
  scheduled: { ko: '접수 예정', en: 'Opens later' },
  open: { ko: '접수 중', en: 'Open' },
  closed: { ko: '마감', en: 'Closed' },
};

export const applicationStatus = (item: ApiApplication, today: string): ApplicationStatus => {
  if (!item.published) return 'draft';
  if (item.opensOn && item.opensOn > today) return 'scheduled';
  if (item.closesOn && item.closesOn < today) return 'closed';
  return 'open';
};

export const statusLabel = (status: ApplicationStatus, lang: DisplayLanguage) =>
  lang === 'ko' ? STATUS_LABELS[status].ko : STATUS_LABELS[status].en;

export const filterApplications = (
  items: ApiApplication[],
  category: ApplicationCategory | 'all',
  search: string
) => {
  const needle = search.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!needle) return true;
    return `${item.title} ${item.description}`.toLowerCase().includes(needle);
  });
};

export const highlightedApplications = (items: ApiApplication[], today: string) =>
  items.filter((item) => item.highlightOnHome && applicationStatus(item, today) === 'open').slice(0, 3);
