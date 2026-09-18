export type DisplayLanguage = 'ko' | 'en';

export const formatDisplayDate = (value: string, lang: DisplayLanguage) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const isPlaceholderUrl = (value?: string) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.hostname === 'example.com' || value.includes('VIDEO_ID');
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
