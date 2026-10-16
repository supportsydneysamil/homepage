import type { LocalizedText } from './churchInfo';

export type SocialChannel = 'instagram' | 'youtube' | 'kakao' | 'facebook';
export type SocialLinks = Record<SocialChannel, string>;

export const MAX_SOCIAL_URL = 300;

export const SOCIAL_CHANNELS: {
  id: SocialChannel;
  label: LocalizedText;
  hosts: string[];
  placeholder: string;
}[] = [
  {
    id: 'instagram',
    label: { ko: 'Instagram', en: 'Instagram' },
    hosts: ['instagram.com', 'www.instagram.com'],
    placeholder: 'https://www.instagram.com/…',
  },
  {
    id: 'youtube',
    label: { ko: 'YouTube', en: 'YouTube' },
    hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
    placeholder: 'https://www.youtube.com/@…',
  },
  {
    id: 'kakao',
    label: { ko: '카카오톡 채널', en: 'KakaoTalk Channel' },
    hosts: ['pf.kakao.com'],
    placeholder: 'https://pf.kakao.com/_…/chat',
  },
  {
    id: 'facebook',
    label: { ko: 'Facebook', en: 'Facebook' },
    hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
    placeholder: 'https://www.facebook.com/…',
  },
];

export const EMPTY_SOCIAL_LINKS: SocialLinks = { instagram: '', youtube: '', kakao: '', facebook: '' };

export const isSocialUrl = (channel: SocialChannel, value: string) => {
  const hosts = SOCIAL_CHANNELS.find((entry) => entry.id === channel)?.hosts ?? [];
  if (value.length > MAX_SOCIAL_URL) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.includes(url.hostname);
  } catch (error) {
    return false;
  }
};

export const parseSocialLinks = (input: unknown): SocialLinks => {
  const row =
    input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const links: SocialLinks = { ...EMPTY_SOCIAL_LINKS };
  SOCIAL_CHANNELS.forEach(({ id }) => {
    const value = typeof row[id] === 'string' ? (row[id] as string).trim() : '';
    links[id] = isSocialUrl(id, value) ? value : '';
  });
  return links;
};

export const socialLinkList = (links: SocialLinks) =>
  SOCIAL_CHANNELS.filter((channel) => links[channel.id]).map((channel) => ({
    id: channel.id,
    label: channel.label,
    url: links[channel.id],
  }));
