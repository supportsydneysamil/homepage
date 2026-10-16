import { formatFullAddress, type ChurchInfo } from './churchInfo';
import { SITE_URL } from './pageMeta';
import { socialLinkList } from './social';

const isAbsoluteHttps = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch (error) {
    return false;
  }
};

export const churchJsonLd = (info: ChurchInfo, logoImageUrl: string) => {
  const sameAs = socialLinkList(info.social).map((link) => link.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: info.churchNameKo,
    alternateName: info.churchNameEn,
    url: SITE_URL,
    telephone: info.phone,
    email: info.email,
    address: formatFullAddress(info),
    ...(isAbsoluteHttps(logoImageUrl) ? { logo: logoImageUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
};

export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
