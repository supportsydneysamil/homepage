import { parseChurchInfo, type ChurchInfo } from './churchInfo';
import { parseSiteCopy, type SiteCopy } from './siteCopy';

export const DEFAULT_HERO_IMAGE = '/church-bg.png';
export const DEFAULT_PASTOR_IMAGE = '/pastor.jpg';

export type SiteSettings = {
  themeId: string;
  heroImagePath: string | null;
  pastorImagePath: string | null;
  logoImagePath: string | null;
  heroImageUrl: string;
  pastorImageUrl: string;
  logoImageUrl: string;
  churchInfo: ChurchInfo;
  siteCopy: SiteCopy;
};

export type SiteSettingsPayload = {
  themeId: string;
  heroImagePath: string | null;
  pastorImagePath: string | null;
  logoImagePath: string | null;
  churchInfo: ChurchInfo;
  siteCopy: SiteCopy;
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
    logoImagePath: stringOrNull(data.logoImagePath),
    heroImageUrl: stringOrNull(data.heroImageUrl) || DEFAULT_HERO_IMAGE,
    pastorImageUrl: stringOrNull(data.pastorImageUrl) || DEFAULT_PASTOR_IMAGE,
    logoImageUrl: stringOrNull(data.logoImageUrl) || '',
    churchInfo: parseChurchInfo(data.churchInfo),
    siteCopy: parseSiteCopy(data.siteCopy),
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

export const nextSrcOnError = (current: string, fallback: string): string =>
  current === fallback ? current : fallback;

export const previewSrc = ({
  pendingFileUrl,
  pendingReset,
  publishedUrl,
  fallback,
}: {
  pendingFileUrl: string | null;
  pendingReset: boolean;
  publishedUrl: string;
  fallback: string;
}): string => pendingFileUrl || (pendingReset ? fallback : publishedUrl || fallback);

export const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const res = await fetch('/api/site-settings', { credentials: 'include' });
  if (!res.ok) throw new Error(`Settings fetch failed (${res.status})`);
  return parseSiteSettings(await res.json());
};

export const putSiteSettings = async (
  payload: SiteSettingsPayload
): Promise<{ ok: true; settings: SiteSettings } | { ok: false; message: string }> => {
  try {
    const res = await fetch('/api/site-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text();
      return {
        ok: false,
        message: detail.slice(0, 180) || `Settings update failed (${res.status})`,
      };
    }
    return { ok: true, settings: parseSiteSettings(await res.json()) };
  } catch (error) {
    return { ok: false, message: 'Unable to save site settings.' };
  }
};
