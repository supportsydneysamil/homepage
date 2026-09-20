export const DEFAULT_HERO_IMAGE = '/church-bg.png';
export const DEFAULT_PASTOR_IMAGE = '/pastor.jpg';

export type SiteSettings = {
  themeId: string;
  heroImagePath: string | null;
  pastorImagePath: string | null;
  heroImageUrl: string;
  pastorImageUrl: string;
};

type PendingImage = 'keep' | 'reset' | { uploadedPath: string };

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

export const parseSiteSettings = (input: unknown): SiteSettings => {
  const data = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  return {
    themeId: typeof data.themeId === 'string' ? data.themeId : 'church',
    heroImagePath: stringOrNull(data.heroImagePath),
    pastorImagePath: stringOrNull(data.pastorImagePath),
    heroImageUrl: stringOrNull(data.heroImageUrl) || DEFAULT_HERO_IMAGE,
    pastorImageUrl: stringOrNull(data.pastorImageUrl) || DEFAULT_PASTOR_IMAGE,
  };
};

export const nextImagePath = (
  pending: PendingImage,
  publishedPath: string | null
): string | null => {
  if (pending === 'reset') return null;
  if (pending === 'keep') return publishedPath;
  return pending.uploadedPath;
};
