export type Lang = 'ko' | 'en';

const isKorean = (tag: string) => /^ko(?:-|$)/i.test(tag);

export const pickInitialLanguage = (
  stored: string | null,
  browserLanguages: readonly string[] | undefined
): Lang => {
  if (stored === 'ko' || stored === 'en') return stored;
  if (!browserLanguages || !browserLanguages.length) return 'ko';
  return browserLanguages.some(isKorean) ? 'ko' : 'en';
};
