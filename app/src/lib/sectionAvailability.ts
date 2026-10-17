export const PUBLIC_SECTION_KEYS = [
  'about',
  'worship',
  'mokjang',
  'events',
  'sermons',
  'resources',
  'contact',
] as const;

export type PublicSection = (typeof PUBLIC_SECTION_KEYS)[number];
export type SectionAvailability = Record<PublicSection, boolean>;
export type PublicSectionRenderState = 'available' | 'loading' | 'unavailable';

const availabilityWith = (value: boolean): SectionAvailability =>
  Object.fromEntries(
    PUBLIC_SECTION_KEYS.map((section) => [section, value])
  ) as SectionAvailability;

export const DEFAULT_SECTION_AVAILABILITY = Object.freeze(availabilityWith(true));
export const CLOSED_SECTION_AVAILABILITY = Object.freeze(availabilityWith(false));

export const parseSectionAvailability = (input: unknown): SectionAvailability => {
  if (input === undefined || input === null) {
    return { ...DEFAULT_SECTION_AVAILABILITY };
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    return { ...CLOSED_SECTION_AVAILABILITY };
  }

  const value = input as Record<string, unknown>;
  if (
    PUBLIC_SECTION_KEYS.some(
      (section) =>
        Object.prototype.hasOwnProperty.call(value, section) &&
        typeof value[section] !== 'boolean'
    )
  ) {
    return { ...CLOSED_SECTION_AVAILABILITY };
  }

  return Object.fromEntries(
    PUBLIC_SECTION_KEYS.map((section) => [
      section,
      Object.prototype.hasOwnProperty.call(value, section) ? value[section] : true,
    ])
  ) as SectionAvailability;
};

export const PUBLIC_SECTION_NAV = [
  { section: 'about', href: '/about', labelEn: 'About', labelKo: '소개' },
  { section: 'worship', href: '/worship', labelEn: 'Worship', labelKo: '예배' },
  { section: 'mokjang', href: '/mokjang', labelEn: 'House Church', labelKo: '목장' },
  { section: 'events', href: '/events', labelEn: 'Events', labelKo: '이벤트' },
  { section: 'sermons', href: '/sermons', labelEn: 'Sermons', labelKo: '설교' },
  { section: 'resources', href: '/resources', labelEn: 'Resources', labelKo: '자료·신청' },
  { section: 'contact', href: '/contact', labelEn: 'Contact', labelKo: '문의' },
] as const satisfies ReadonlyArray<{
  section: PublicSection;
  href: string;
  labelEn: string;
  labelKo: string;
}>;

export const sectionForPath = (pathname: string): PublicSection | null => {
  const path = pathname.split(/[?#]/, 1)[0];
  if (!path.startsWith('/')) return null;
  if (path === '/mokjang' || path.startsWith('/mokjang/')) return 'mokjang';
  if (path === '/events' || path.startsWith('/events/')) return 'events';
  if (path === '/about') return 'about';
  if (path === '/worship') return 'worship';
  if (path === '/sermons') return 'sermons';
  if (path === '/resources') return 'resources';
  if (path === '/contact') return 'contact';
  return null;
};

export const isSectionEnabled = (
  availability: SectionAvailability,
  section: PublicSection | null | undefined
): boolean => section === null || section === undefined || availability[section];

export const isPublicHrefEnabled = (
  href: string,
  availability: SectionAvailability
): boolean => isSectionEnabled(availability, sectionForPath(href));

export const publicSectionRenderState = (
  pathname: string,
  availability: SectionAvailability,
  isLoading: boolean
): PublicSectionRenderState => {
  const section = sectionForPath(pathname);
  if (!section) return 'available';
  if (isLoading) return 'loading';
  return availability[section] ? 'available' : 'unavailable';
};
