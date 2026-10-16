import type { LocalizedText } from './churchInfo';
import type { Lang } from './language';

export const SITE_URL = 'https://sydneysamil.org';

export type PageMeta = {
  title?: LocalizedText;
  description?: LocalizedText;
};

export const SITE_NAME: LocalizedText = { ko: '시드니 삼일교회', en: 'Sydney Samil Church' };

export const HOME_DESCRIPTION: LocalizedText = {
  ko: '시드니 펜넌트힐스(Pennant Hills)에 있는 한인교회, 시드니 삼일교회입니다. 함께 예배하고, 삶을 나누며, 믿음 안에서 자랍니다.',
  en: 'Sydney Samil Church is a Korean church in Pennant Hills, Sydney, where we worship, share life, and grow in faith together.',
};

export const SHARE_IMAGE: { url: string; width: number; height: number; alt: LocalizedText } = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 628,
  alt: {
    ko: '푸른 하늘 아래 시드니 삼일교회 외관',
    en: 'Sydney Samil Church building beneath a blue sky',
  },
};

export const documentTitle = (title: LocalizedText | undefined, lang: Lang) => {
  const other: Lang = lang === 'ko' ? 'en' : 'ko';
  return title ? `${title[lang]} | ${SITE_NAME[lang]}` : `${SITE_NAME[lang]} | ${SITE_NAME[other]}`;
};

export const pageDescription = (description: LocalizedText | undefined, lang: Lang) =>
  (description ?? HOME_DESCRIPTION)[lang];

export const openGraphLocales = (lang: Lang) =>
  lang === 'ko'
    ? { locale: 'ko_KR', alternate: 'en_AU' }
    : { locale: 'en_AU', alternate: 'ko_KR' };
