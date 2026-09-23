export const SETTINGS_TABS = ['appearance', 'church', 'copy'] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

type QueryValue = string | string[] | undefined;

const isSettingsTab = (value: string): value is SettingsTab =>
  SETTINGS_TABS.includes(value as SettingsTab);

export const parseSettingsQuery = (query: Record<string, QueryValue>): SettingsTab => {
  const raw = query.tab;
  const tab = (Array.isArray(raw) ? raw[0] : raw) ?? '';
  return isSettingsTab(tab) ? tab : 'appearance';
};

export const buildSettingsHref = (tab: SettingsTab) => `/settings?tab=${tab}`;
