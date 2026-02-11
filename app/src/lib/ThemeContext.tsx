import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const THEME_IDS = ['dark', 'light', 'church', 'modern-sky', 'modern-sand'] as const;
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
];

type ThemeContextValue = {
  themeId: ThemeId;
  isLoading: boolean;
  setThemeLocal: (nextThemeId: ThemeId) => void;
  saveTheme: (nextThemeId: ThemeId) => Promise<{ ok: boolean; message?: string }>;
  refreshTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isThemeId = (value: string): value is ThemeId =>
  THEME_IDS.includes(value as ThemeId);

const normalizeTheme = (value?: string | null): ThemeId =>
  value && isThemeId(value) ? value : 'church';

const applyThemeClass = (themeId: ThemeId) => {
  if (typeof document === 'undefined') return;
  document.body.classList.remove(...THEME_IDS.map((id) => `theme-${id}`));
  document.body.classList.add(`theme-${themeId}`);
};

const fetchTheme = async (): Promise<ThemeId> => {
  const res = await fetch('/api/site-settings', { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Theme fetch failed (${res.status})`);
  }
  const data = (await res.json()) as { themeId?: string };
  return normalizeTheme(data.themeId);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeId, setThemeId] = useState<ThemeId>('church');
  const [isLoading, setIsLoading] = useState(true);

  const refreshTheme = async () => {
    try {
      const latestTheme = await fetchTheme();
      setThemeId(latestTheme);
    } catch (error) {
      setThemeId('church');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshTheme();
  }, []);

  useEffect(() => {
    applyThemeClass(themeId);
  }, [themeId]);

  const setThemeLocal = (nextThemeId: ThemeId) => {
    setThemeId(normalizeTheme(nextThemeId));
  };

  const saveTheme = async (nextThemeId: ThemeId) => {
    const payload = { themeId: normalizeTheme(nextThemeId) };
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.text();
        return { ok: false, message: detail.slice(0, 180) || `Theme update failed (${res.status})` };
      }

      const data = (await res.json()) as { themeId?: string };
      setThemeId(normalizeTheme(data.themeId || payload.themeId));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: 'Unable to save theme settings.' };
    }
  };

  const value = useMemo(
    () => ({
      themeId,
      isLoading,
      setThemeLocal,
      saveTheme,
      refreshTheme,
    }),
    [themeId, isLoading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
