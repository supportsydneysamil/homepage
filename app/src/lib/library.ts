import type { ApiResource } from './contentApi';
import type { DisplayLanguage } from './presentation';

type Labelled<T extends string> = { id: T; ko: string; en: string };

export type ResourceCategory =
  | 'bulletin'
  | 'smallgroup'
  | 'worship'
  | 'forms'
  | 'minutes'
  | 'newsletter';

export type ResourceVisibility = 'public' | 'member' | 'admin';

export const RESOURCE_CATEGORIES: Labelled<ResourceCategory>[] = [
  { id: 'bulletin', ko: '주보', en: 'Bulletins' },
  { id: 'smallgroup', ko: '소그룹 · 양육', en: 'Small groups' },
  { id: 'worship', ko: '악보 · 콘티', en: 'Worship music' },
  { id: 'forms', ko: '교회 서식', en: 'Forms' },
  { id: 'minutes', ko: '회의록', en: 'Minutes' },
  { id: 'newsletter', ko: '소식지', en: 'Newsletters' },
];

export const RESOURCE_VISIBILITIES: Labelled<ResourceVisibility>[] = [
  { id: 'public', ko: '전체 공개', en: 'Everyone' },
  { id: 'member', ko: '로그인 회원', en: 'Signed-in members' },
  { id: 'admin', ko: '관리자만', en: 'Administrators only' },
];

const labelFrom = <T extends string>(entries: Labelled<T>[], id: string, lang: DisplayLanguage) => {
  const match = entries.find((entry) => entry.id === id);
  if (!match) return id;
  return lang === 'ko' ? match.ko : match.en;
};

export const categoryLabel = (id: string, lang: DisplayLanguage) =>
  labelFrom(RESOURCE_CATEGORIES, id, lang);

export const visibilityLabel = (id: string, lang: DisplayLanguage) =>
  labelFrom(RESOURCE_VISIBILITIES, id, lang);

const FILE_TYPES: Record<string, { ko: string; en: string }> = {
  'application/pdf': { ko: 'PDF', en: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ko: 'DOCX',
    en: 'DOCX',
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    ko: 'PPTX',
    en: 'PPTX',
  },
  'image/jpeg': { ko: '이미지', en: 'Image' },
  'image/png': { ko: '이미지', en: 'Image' },
  'image/webp': { ko: '이미지', en: 'Image' },
};

export const fileTypeLabel = (contentType: string, lang: DisplayLanguage) => {
  const match = FILE_TYPES[contentType.trim().toLowerCase()];
  if (!match) return '';
  return lang === 'ko' ? match.ko : match.en;
};

export const filterResources = (
  resources: ApiResource[],
  category: ResourceCategory | 'all',
  search: string
) => {
  const needle = search.trim().toLowerCase();
  return resources.filter((resource) => {
    if (category !== 'all' && resource.category !== category) return false;
    if (!needle) return true;
    return resource.title.toLowerCase().includes(needle);
  });
};
