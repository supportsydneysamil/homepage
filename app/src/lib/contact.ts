export const CONTACT_TOPICS = ['general', 'community', 'prayer'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];
export type PrayerShare = 'staff' | 'team';

export const parseContactTopic = (value: unknown): ContactTopic =>
  CONTACT_TOPICS.find((topic) => topic === value) ?? 'general';
