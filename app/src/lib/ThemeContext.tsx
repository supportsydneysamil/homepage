import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_CHURCH_INFO } from './churchInfo';
import { DEFAULT_IMAGE_PRESENTATION } from './imagePresentation';
import { DEFAULT_SITE_COPY } from './siteCopy';
import { useLivingTheme } from './useLivingTheme';
import {
  DEFAULT_HERO_IMAGE,
  DEFAULT_PASTOR_IMAGE,
  fetchSiteSettings,
  putSiteSettings,
  type SiteSettings,
  type SiteSettingsPayload,
} from './siteSettings';

export const THEME_IDS = [
  'dark',
  'light',
  'church',
  'modern-sky',
  'modern-sand',
  'living',
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

type ThemeOption = {
  id: ThemeId;
  labelEn: string;
  labelKo: string;
  descriptionEn: string;
  descriptionKo: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'church',
    labelEn: 'Church Bright',
    labelKo: '교회 브라이트',
    descriptionEn: 'Bright church-photo theme with warm glass cards.',
    descriptionKo: '교회 사진 중심의 밝고 따뜻한 글래스 테마',
  },
  {
    id: 'light',
    labelEn: 'Clean Light',
    labelKo: '클린 라이트',
    descriptionEn: 'Minimal and airy light UI for daytime readability.',
    descriptionKo: '주간 가독성이 좋은 미니멀 라이트 테마',
  },
  {
    id: 'modern-sky',
    labelEn: 'Modern Sky',
    labelKo: '모던 스카이',
    descriptionEn: 'Cool gradient with contemporary blue accents.',
    descriptionKo: '현대적인 블루 계열 그라데이션 테마',
  },
  {
    id: 'modern-sand',
    labelEn: 'Modern Sand',
    labelKo: '모던 샌드',
    descriptionEn: 'Warm neutral palette with soft contrast.',
    descriptionKo: '따뜻한 뉴트럴 톤의 부드러운 대비 테마',
  },
  {
    id: 'dark',
    labelEn: 'Classic Dark',
    labelKo: '클래식 다크',
    descriptionEn: 'Original dark theme with high contrast.',
    descriptionKo: '기존 고대비 다크 테마',
  },
  {
    id: 'living',
    labelEn: 'Living',
    labelKo: '리빙',
    descriptionEn: 'A living palette that drifts with time and changes each day.',
    descriptionKo: '시간과 날짜에 따라 천천히 흐르는 다이내믹 테마',
  },
];

type ResolvedSiteSettings = Omit<SiteSettings, 'themeId'> & { themeId: ThemeId };

type SiteSettingsContextValue = ResolvedSiteSettings & {
  themeId: ThemeId;
  // Unsaved preview. Paints the page without disturbing the published theme
  // that unsaved-change detection compares against.
  previewThemeId: ThemeId | null;
  activeThemeId: ThemeId;
  isLoading: boolean;
  setPreviewTheme: (nextThemeId: ThemeId | null) => void;
  saveTheme: (nextThemeId: ThemeId) => Promise<{ ok: boolean; message?: string }>;
  saveSettings: (
    payload: SiteSettingsPayload
  ) => Promise<
    { ok: true; settings: ResolvedSiteSettings } | { ok: false; message: string }
  >;
  refreshTheme: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(undefined);

const isThemeId = (value: string): value is ThemeId =>
  THEME_IDS.includes(value as ThemeId);

const normalizeTheme = (value?: string | null): ThemeId =>
  value && isThemeId(value) ? value : 'church';

export const resolveActiveTheme = (
  publishedThemeId: ThemeId,
  previewThemeId: ThemeId | null
): ThemeId => previewThemeId ?? publishedThemeId;

const normalizeSettings = (settings: SiteSettings): ResolvedSiteSettings => ({
  ...settings,
  themeId: normalizeTheme(settings.themeId),
});

const DEFAULT_SETTINGS: ResolvedSiteSettings = {
  themeId: 'church',
  heroImagePath: null,
  pastorImagePath: null,
  logoImagePath: null,
  heroImageUrl: DEFAULT_HERO_IMAGE,
  pastorImageUrl: DEFAULT_PASTOR_IMAGE,
  logoImageUrl: '',
  imagePresentation: DEFAULT_IMAGE_PRESENTATION,
  churchInfo: DEFAULT_CHURCH_INFO,
  siteCopy: DEFAULT_SITE_COPY,
};

const applyThemeClass = (themeId: ThemeId) => {
  if (typeof document === 'undefined') return;
  document.body.classList.remove(...THEME_IDS.map((id) => `theme-${id}`));
  document.body.classList.add(`theme-${themeId}`);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ResolvedSiteSettings>(DEFAULT_SETTINGS);
  const [previewThemeId, setPreviewThemeId] = useState<ThemeId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeThemeId = resolveActiveTheme(settings.themeId, previewThemeId);
  useLivingTheme(activeThemeId === 'living');

  const refreshTheme = async () => {
    try {
      setSettings(normalizeSettings(await fetchSiteSettings()));
    } catch (error) {
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshTheme();
  }, []);

  useEffect(() => {
    applyThemeClass(activeThemeId);
  }, [activeThemeId]);

  const setPreviewTheme = (nextThemeId: ThemeId | null) => {
    setPreviewThemeId(nextThemeId === null ? null : normalizeTheme(nextThemeId));
  };

  const saveSettings: SiteSettingsContextValue['saveSettings'] = async (payload) => {
    const result = await putSiteSettings(payload);
    if (!result.ok) return result;
    const next = normalizeSettings(result.settings);
    setSettings(next);
    setPreviewThemeId(null);
    return { ok: true, settings: next };
  };

  const saveTheme = async (nextThemeId: ThemeId) => {
    const result = await saveSettings({
      themeId: normalizeTheme(nextThemeId),
      heroImagePath: settings.heroImagePath,
      pastorImagePath: settings.pastorImagePath,
      logoImagePath: settings.logoImagePath,
      imagePresentation: settings.imagePresentation,
      churchInfo: settings.churchInfo,
      siteCopy: settings.siteCopy,
    });
    if (!result.ok) {
      return { ok: false, message: result.message };
    }
    return { ok: true };
  };

  const value = useMemo(
    () => ({
      ...settings,
      previewThemeId,
      activeThemeId,
      isLoading,
      setPreviewTheme,
      saveTheme,
      saveSettings,
      refreshTheme,
    }),
    [settings, previewThemeId, activeThemeId, isLoading]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within ThemeProvider');
  }
  return context;
};

export const useTheme = () => {
  const {
    themeId,
    activeThemeId,
    isLoading,
    setPreviewTheme,
    saveTheme,
    refreshTheme,
  } = useSiteSettings();
  return { themeId, activeThemeId, isLoading, setPreviewTheme, saveTheme, refreshTheme };
};
