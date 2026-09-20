export const DEFAULT_HERO_IMAGE = '/church-bg.png';
export const DEFAULT_PASTOR_IMAGE = '/pastor.jpg';

export type SiteSettings = {
  themeId: string;
  heroImagePath: string | null;
  pastorImagePath: string | null;
  heroImageUrl: string;
  pastorImageUrl: string;
};

export type SiteSettingsPayload = {
  themeId: string;
  heroImagePath: string | null;
  pastorImagePath: string | null;
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
