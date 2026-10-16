const SOCIAL_HOSTS = {
  instagram: ['instagram.com', 'www.instagram.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
  kakao: ['pf.kakao.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
};

const MAX_SOCIAL_URL = 300;

const isSocialUrl = (channel, value) => {
  const hosts = Object.prototype.hasOwnProperty.call(SOCIAL_HOSTS, channel) ? SOCIAL_HOSTS[channel] : null;
  if (!hosts || value.length > MAX_SOCIAL_URL) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.includes(url.hostname);
  } catch (error) {
    return false;
  }
};

const socialLinksError = (churchInfo) => {
  const social = churchInfo && churchInfo.social;
  if (!social || typeof social !== 'object') return null;
  for (const channel of Object.keys(SOCIAL_HOSTS)) {
    const raw = social[channel];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value && !isSocialUrl(channel, value)) {
      return 'Social links must be https links to Instagram, YouTube, KakaoTalk Channel, or Facebook.';
    }
  }
  return null;
};

module.exports = { SOCIAL_HOSTS, isSocialUrl, socialLinksError };
