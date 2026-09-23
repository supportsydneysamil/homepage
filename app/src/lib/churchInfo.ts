export type LocalizedText = {
  en: string;
  ko: string;
};

export type ChurchService = {
  id: string;
  time: string;
  period: string;
  label: LocalizedText;
  note: LocalizedText;
};

export type ChurchGathering = {
  id: string;
  badge: string;
  title: LocalizedText;
  detail: LocalizedText;
};

export type ChurchInfo = {
  churchNameEn: string;
  churchNameKo: string;
  brandTitle: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  mapsQuery: string;
  pastorNameKo: string;
  pastorNameEn: string;
  services: ChurchService[];
  gatherings: ChurchGathering[];
};

const MAX_SERVICES = 4;
const MAX_GATHERINGS = 6;
const MAX_TEXT = 200;
const MAX_DETAIL = 400;

export const DEFAULT_CHURCH_INFO: ChurchInfo = {
  churchNameEn: 'Sydney Samil Church',
  churchNameKo: '시드니 삼일교회',
  brandTitle: 'Sydney Samil',
  phone: '0433 576 500',
  email: 'info@sydneysamil.org',
  addressLine1: 'Corner Bellamy St & Boundary Rd',
  addressLine2: 'Pennant Hills NSW 2120',
  suburb: 'Pennant Hills, NSW',
  mapsQuery: 'Corner Bellamy St & Boundary Rd Pennant Hills NSW 2120',
  pastorNameKo: '안상헌 담임목사',
  pastorNameEn: 'Lead Pastor Sangheon Ahn',
  services: [
    {
      id: 'first',
      time: '9:30',
      period: 'AM',
      label: { ko: '1부', en: '1st' },
      note: { ko: '어린이 예배', en: 'KIDS' },
    },
    {
      id: 'second',
      time: '11:00',
      period: 'AM',
      label: { ko: '2부', en: '2nd' },
      note: { ko: '메인 예배', en: 'MAIN' },
    },
  ],
  gatherings: [
    {
      id: 'wed-prayer',
      badge: 'WED',
      title: { ko: '수요 기도회', en: 'Wednesday prayer' },
      detail: { ko: '수요일 저녁 8:00 · 온라인', en: 'Wednesday 8:00 PM · Online' },
    },
    {
      id: 'life-study',
      badge: 'SUN',
      title: { ko: '생명의 삶 공부', en: 'Life Bible study' },
      detail: { ko: '주일 오후 2:30', en: 'Sunday 2:30 PM' },
    },
  ],
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const clipped = (value: unknown, fallback: string, max = MAX_TEXT) => {
  if (typeof value !== 'string') return fallback;
  const next = value.trim();
  return next ? next.slice(0, max) : fallback;
};

export const parseLocalized = (value: unknown, fallback: LocalizedText): LocalizedText => {
  const row = asRecord(value);
  return {
    en: clipped(row?.en, fallback.en, MAX_DETAIL),
    ko: clipped(row?.ko, fallback.ko, MAX_DETAIL),
  };
};

const parseService = (value: unknown, fallback: ChurchService, index: number): ChurchService | null => {
  const row = asRecord(value);
  if (!row) return null;
  const time = clipped(row.time, '');
  if (!time) return null;
  return {
    id: clipped(row.id, fallback.id || `service-${index + 1}`, 40),
    time,
    period: clipped(row.period, fallback.period, 12),
    label: parseLocalized(row.label, fallback.label),
    note: parseLocalized(row.note, fallback.note),
  };
};

const parseGathering = (value: unknown, fallback: ChurchGathering, index: number): ChurchGathering | null => {
  const row = asRecord(value);
  if (!row) return null;
  const badge = clipped(row.badge, '');
  if (!badge) return null;
  return {
    id: clipped(row.id, fallback.id || `gathering-${index + 1}`, 40),
    badge: badge.slice(0, 12),
    title: parseLocalized(row.title, fallback.title),
    detail: parseLocalized(row.detail, fallback.detail),
  };
};

export const parseChurchInfo = (input: unknown): ChurchInfo => {
  const row = asRecord(input);
  if (!row) return DEFAULT_CHURCH_INFO;

  const fallbackServices = DEFAULT_CHURCH_INFO.services;
  const services = Array.isArray(row.services)
    ? row.services
        .slice(0, MAX_SERVICES)
        .map((item, index) => parseService(item, fallbackServices[index] || fallbackServices[0], index))
        .filter((item): item is ChurchService => Boolean(item))
    : fallbackServices;

  const gatherings = Array.isArray(row.gatherings)
    ? row.gatherings
        .slice(0, MAX_GATHERINGS)
        .map((item, index) =>
          parseGathering(item, DEFAULT_CHURCH_INFO.gatherings[index] || DEFAULT_CHURCH_INFO.gatherings[0], index)
        )
        .filter((item): item is ChurchGathering => Boolean(item))
    : DEFAULT_CHURCH_INFO.gatherings;

  return {
    churchNameEn: clipped(row.churchNameEn, DEFAULT_CHURCH_INFO.churchNameEn),
    churchNameKo: clipped(row.churchNameKo, DEFAULT_CHURCH_INFO.churchNameKo),
    brandTitle: clipped(row.brandTitle, DEFAULT_CHURCH_INFO.brandTitle),
    phone: clipped(row.phone, DEFAULT_CHURCH_INFO.phone, 40),
    email: clipped(row.email, DEFAULT_CHURCH_INFO.email, 120),
    addressLine1: clipped(row.addressLine1, DEFAULT_CHURCH_INFO.addressLine1),
    addressLine2: clipped(row.addressLine2, DEFAULT_CHURCH_INFO.addressLine2),
    suburb: clipped(row.suburb, DEFAULT_CHURCH_INFO.suburb),
    mapsQuery: clipped(row.mapsQuery, DEFAULT_CHURCH_INFO.mapsQuery, 300),
    pastorNameKo: clipped(row.pastorNameKo, DEFAULT_CHURCH_INFO.pastorNameKo),
    pastorNameEn: clipped(row.pastorNameEn, DEFAULT_CHURCH_INFO.pastorNameEn),
    services: services.length ? services : fallbackServices,
    gatherings,
  };
};

export const phoneHref = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return `tel:${digits}`;
  if (digits.startsWith('0') && digits.length >= 9) return `tel:+61${digits.slice(1)}`;
  return `tel:${digits}`;
};

export const directionsUrl = (mapsQuery: string) =>
  `https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`;

export const mapsEmbedUrl = (mapsQuery: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`;

export const formatFullAddress = (info: ChurchInfo) =>
  [info.addressLine1, info.addressLine2].filter(Boolean).join(', ');

export const formatServiceTimesShort = (services: ChurchService[]) => {
  if (!services.length) return '';
  const times = services.map((service) => service.time).join(' · ');
  const period = services[0].period;
  return period ? `${times} ${period}` : times;
};

export const formatServiceTimesQuick = (services: ChurchService[]) =>
  services.map((service) => [service.time, service.period].filter(Boolean).join(' ')).join(' · ');

export const formatSundayServices = (services: ChurchService[], lang: 'ko' | 'en') =>
  services
    .map((service) => {
      const label = lang === 'ko' ? service.label.ko : service.label.en;
      const note = lang === 'ko' ? service.note.ko : service.note.en;
      const extra = [label, note].filter(Boolean).join(' · ');
      return extra ? `${service.time} (${extra})` : service.time;
    })
    .join(' · ');
