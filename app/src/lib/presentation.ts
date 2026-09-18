export type DisplayLanguage = 'ko' | 'en';

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const parseDateParts = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
};

export const formatDisplayDate = (value: string, lang: DisplayLanguage) => {
  const parts = parseDateParts(value);
  if (!parts) return value;
  return lang === 'ko'
    ? `${parts.year}년 ${parts.month}월 ${parts.day}일`
    : `${parts.day} ${EN_MONTHS[parts.month - 1]} ${parts.year}`;
};

export const formatShortDate = (value: string, lang: DisplayLanguage) => {
  const parts = parseDateParts(value);
  if (!parts) return value;
  return lang === 'ko'
    ? `${parts.month}월 ${parts.day}일`
    : `${parts.day} ${EN_MONTHS[parts.month - 1]}`;
};

export const isPlaceholderUrl = (value?: string) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (
      (url.hostname === 'example.com' || url.hostname.endsWith('.example.com')) ||
      value.includes('VIDEO_ID')
    );
  } catch {
    return true;
  }
};

export const toYouTubeEmbedUrl = (value?: string): string | null => {
  if (!value || isPlaceholderUrl(value)) return null;

  try {
    const url = new URL(value);
    let videoId = '';

    if (url.hostname === 'youtu.be') {
      videoId = url.pathname.slice(1).split('/')[0];
    } else if (
      ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)
    ) {
      videoId = url.pathname.startsWith('/embed/')
        ? url.pathname.split('/')[2]
        : url.searchParams.get('v') || '';
    }

    if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
};
