import type { LocalizedText } from './churchInfo';
import type { ApiMokjang } from './contentApi';
import type { PageMeta } from './pageMeta';
import type { DisplayLanguage } from './presentation';

export const MOKJANG_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const MOKJANG_AUDIENCES = ['family', 'young', 'senior', 'all'] as const;
export const MOKJANG_LANGUAGES = ['ko', 'en', 'both'] as const;

export const MOKJANG_PAGE_META: PageMeta = {
  title: { ko: '목장', en: 'House Church' },
  description: {
    ko: '시드니 삼일교회는 가정교회입니다. 가정에서 매주 모이는 목장을 소개하고, 가까운 목장을 안내합니다.',
    en: 'Sydney Samil Church is a house church. Meet the small communities that gather in homes each week, and find one near you.',
  },
};

const DAY_NAMES: Record<string, { short: LocalizedText; long: LocalizedText }> = {
  mon: { short: { ko: '월', en: 'Mon' }, long: { ko: '월요일', en: 'Monday' } },
  tue: { short: { ko: '화', en: 'Tue' }, long: { ko: '화요일', en: 'Tuesday' } },
  wed: { short: { ko: '수', en: 'Wed' }, long: { ko: '수요일', en: 'Wednesday' } },
  thu: { short: { ko: '목', en: 'Thu' }, long: { ko: '목요일', en: 'Thursday' } },
  fri: { short: { ko: '금', en: 'Fri' }, long: { ko: '금요일', en: 'Friday' } },
  sat: { short: { ko: '토', en: 'Sat' }, long: { ko: '토요일', en: 'Saturday' } },
  sun: { short: { ko: '일', en: 'Sun' }, long: { ko: '일요일', en: 'Sunday' } },
};

const AUDIENCE_NAMES: Record<string, LocalizedText> = {
  family: { ko: '부부·자녀 가정', en: 'Couples & families' },
  young: { ko: '청년·싱글', en: 'Young adults & singles' },
  senior: { ko: '시니어', en: 'Seniors' },
  all: { ko: '누구나', en: 'Everyone' },
};

const LANGUAGE_NAMES: Record<string, LocalizedText> = {
  ko: { ko: '한국어', en: 'Korean' },
  en: { ko: '영어', en: 'English' },
  both: { ko: '한국어·영어', en: 'Korean & English' },
};

type PartOfDay = 'morning' | 'afternoon' | 'evening';

const PART_OF_DAY_NAMES: Record<PartOfDay, LocalizedText> = {
  morning: { ko: '오전', en: 'morning' },
  afternoon: { ko: '오후', en: 'afternoon' },
  evening: { ko: '저녁', en: 'evening' },
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type MeetingFields = Pick<ApiMokjang, 'suburb' | 'meetingDay' | 'meetingTime'>;

const joinParts = (parts: string[], separator: string) => parts.filter(Boolean).join(separator);

export const dayLabel = (day: string, lang: DisplayLanguage, form: 'short' | 'long' = 'short') =>
  DAY_NAMES[day]?.[form][lang] ?? '';

export const partOfDay = (time: string): PartOfDay | null => {
  const match = TIME_PATTERN.exec(time.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  if (hour < 12) return 'morning';
  return hour < 17 ? 'afternoon' : 'evening';
};

export const clockLabel = (time: string, lang: DisplayLanguage) => {
  const match = TIME_PATTERN.exec(time.trim());
  if (!match) return '';
  const hour = Number(match[1]);
  const clock = `${hour % 12 || 12}:${match[2]}`;
  return lang === 'ko' ? clock : `${clock} ${hour < 12 ? 'AM' : 'PM'}`;
};

const partLabel = (time: string, lang: DisplayLanguage) => {
  const part = partOfDay(time);
  return part ? PART_OF_DAY_NAMES[part][lang] : '';
};

export const tileMeeting = (mokjang: MeetingFields, lang: DisplayLanguage) =>
  joinParts(
    [mokjang.suburb, joinParts([dayLabel(mokjang.meetingDay, lang), partLabel(mokjang.meetingTime, lang)], ' ')],
    ' · '
  );

export const detailMeeting = (mokjang: MeetingFields, lang: DisplayLanguage) => {
  const day = dayLabel(mokjang.meetingDay, lang, 'long');
  const when =
    lang === 'ko'
      ? joinParts([day, partLabel(mokjang.meetingTime, 'ko'), clockLabel(mokjang.meetingTime, 'ko')], ' ')
      : joinParts([day, clockLabel(mokjang.meetingTime, 'en')], ' ');
  return joinParts([when, mokjang.suburb], ' · ');
};

export const audienceLabel = (audience: string, lang: DisplayLanguage) =>
  (AUDIENCE_NAMES[audience] ?? AUDIENCE_NAMES.all)[lang];

export const languageLabel = (language: string, lang: DisplayLanguage) =>
  (LANGUAGE_NAMES[language] ?? LANGUAGE_NAMES.ko)[lang];

export const pickText = (ko: string, en: string, lang: DisplayLanguage) => (lang === 'en' && en.trim() ? en : ko);

export const mokjangName = (mokjang: Pick<ApiMokjang, 'nameKo' | 'nameEn'>, lang: DisplayLanguage) =>
  pickText(mokjang.nameKo, mokjang.nameEn, lang);

export const sortMokjangs = <T extends { nameKo: string }>(items: T[]) =>
  [...items].sort((left, right) => left.nameKo.localeCompare(right.nameKo, 'ko'));

export const initialOf = (name: string) => Array.from(name.trim())[0] ?? '';

export const mokjangDetailHref = (slug: string) => ({ pathname: '/mokjang/detail', query: { slug } });

export const mokjangContactHref = (slug: string) =>
  `/contact?topic=community&mokjang=${encodeURIComponent(slug)}`;

export const parseMokjangSlug = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const slug = typeof raw === 'string' ? raw.trim() : '';
  return slug.length <= 80 && SLUG_PATTERN.test(slug) ? slug : '';
};

// Same rule as validateMokjangInput in api/mokjang/index.js.
export const suggestMokjangSlug = (slug: string, nameEn: string) =>
  slug.trim().toLowerCase() ||
  nameEn
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const contactPrefill = (name: string, lang: DisplayLanguage) =>
  lang === 'ko' ? `관심 있는 목장: ${name}\n\n` : `House church I am interested in: ${name}\n\n`;

export const MOKJANG_FORM_DEFAULTS: Record<string, string> = {
  meetingDay: 'fri',
  audience: 'all',
  language: 'ko',
  kidsWelcome: 'false',
  published: 'true',
};

export const mokjangFormValues = (mokjang: ApiMokjang | null): Record<string, string> =>
  mokjang
    ? {
        nameKo: mokjang.nameKo,
        nameEn: mokjang.nameEn,
        slug: mokjang.slug,
        taglineKo: mokjang.taglineKo,
        taglineEn: mokjang.taglineEn,
        suburb: mokjang.suburb,
        meetingDay: mokjang.meetingDay,
        meetingTime: mokjang.meetingTime,
        audience: mokjang.audience,
        language: mokjang.language,
        kidsWelcome: mokjang.kidsWelcome ? 'true' : 'false',
        missionKo: mokjang.missionKo,
        missionEn: mokjang.missionEn,
        storyKo: mokjang.storyKo,
        storyEn: mokjang.storyEn,
        shepherdName: mokjang.shepherdName ?? '',
        partnerName: mokjang.partnerName ?? '',
        published: mokjang.published ? 'true' : 'false',
      }
    : { ...MOKJANG_FORM_DEFAULTS };

export const mokjangPayloadFromForm = (
  values: Record<string, string>,
  imageBlobPaths: string[],
  coverImageId = ''
) => {
  const text = (key: string) => values[key] ?? '';
  return {
    nameKo: text('nameKo'),
    nameEn: text('nameEn'),
    slug: text('slug'),
    taglineKo: text('taglineKo'),
    taglineEn: text('taglineEn'),
    suburb: text('suburb'),
    meetingDay: values.meetingDay || MOKJANG_FORM_DEFAULTS.meetingDay,
    meetingTime: text('meetingTime'),
    audience: values.audience || MOKJANG_FORM_DEFAULTS.audience,
    language: values.language || MOKJANG_FORM_DEFAULTS.language,
    kidsWelcome: values.kidsWelcome === 'true',
    missionKo: text('missionKo'),
    missionEn: text('missionEn'),
    storyKo: text('storyKo'),
    storyEn: text('storyEn'),
    shepherdName: text('shepherdName'),
    partnerName: text('partnerName'),
    published: values.published !== 'false',
    imageBlobPaths,
    coverImageId,
  };
};

export const coverFirst = (images: string[], cover: string | null) =>
  cover && images.includes(cover) ? [cover, ...images.filter((image) => image !== cover)] : images;
