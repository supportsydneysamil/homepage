import type { NextPage } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { THEME_OPTIONS, type ThemeId, useTheme } from '../lib/ThemeContext';
import { useRequireAuth } from '../lib/swaAuth';
import { useLanguage } from '../lib/LanguageContext';
import { useGlobalAdmin } from '../lib/useGlobalAdmin';

const SettingsPage: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { themeId, setThemeLocal, saveTheme } = useTheme();
  const { isGlobalAdmin, isChecking } = useGlobalAdmin(isAuthenticated);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(themeId);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedTheme(themeId);
  }, [themeId]);

  const labels = useMemo(
    () => ({
      title: isKo ? '글로벌 설정' : 'Global Settings',
      subtitle: isKo
        ? 'Global Administrator만 홈페이지 전체 테마를 변경할 수 있습니다.'
        : 'Only Global Administrators can update site-wide theme settings.',
      loading: isKo ? '권한 확인 중...' : 'Checking permissions...',
      forbidden: isKo ? 'Global Administrator 권한이 필요합니다.' : 'Global Administrator role is required.',
      themeTitle: isKo ? '홈페이지 테마' : 'Website Theme',
      save: isKo ? '전체 적용 저장' : 'Save and Apply Globally',
      saving: isKo ? '저장 중...' : 'Saving...',
      saveOk: isKo ? '글로벌 테마가 적용되었습니다.' : 'Global theme has been updated.',
      saveFail: isKo ? '설정 저장에 실패했습니다.' : 'Failed to save global settings.',
      preview: isKo ? '미리보기' : 'Preview',
    }),
    [isKo]
  );

  if (isLoading || isChecking) {
    return <p>{labels.loading}</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isGlobalAdmin) {
    return (
      <section className="section">
        <div className="card settings-card">
          <h1>{labels.title}</h1>
          <p className="error-text">{labels.forbidden}</p>
        </div>
      </section>
    );
  }

  const onSave = async () => {
    setIsSaving(true);
    setStatus(null);
    const result = await saveTheme(selectedTheme);
    if (result.ok) {
      setStatus(labels.saveOk);
    } else {
      setStatus(result.message || labels.saveFail);
    }
    setIsSaving(false);
  };

  return (
    <section className="section settings-page">
      <div className="section__header">
        <p className="pill">{labels.title}</p>
        <h1>{labels.title}</h1>
        <p className="muted">{labels.subtitle}</p>
      </div>

      <div className="settings-theme-grid">
        {THEME_OPTIONS.map((option) => {
          const isSelected = selectedTheme === option.id;
          return (
            <label key={option.id} className={`card theme-option ${isSelected ? 'theme-option--selected' : ''}`}>
              <input
                type="radio"
                name="theme"
                value={option.id}
                checked={isSelected}
                onChange={() => {
                  setSelectedTheme(option.id);
                  setThemeLocal(option.id);
                  setStatus(null);
                }}
              />
              <div className={`theme-preview theme-preview--${option.id}`} aria-hidden="true" />
              <h3>{isKo ? option.labelKo : option.labelEn}</h3>
              <p className="muted">{isKo ? option.descriptionKo : option.descriptionEn}</p>
              <p className="card__eyebrow">{labels.preview}</p>
            </label>
          );
        })}
      </div>

      <div className="settings-actions">
        <button type="button" className="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? labels.saving : labels.save}
        </button>
        {status ? <p className={status === labels.saveOk ? 'success-text' : 'error-text'}>{status}</p> : null}
      </div>
    </section>
  );
};

SettingsPage.meta = {
  title: 'Settings',
  description: 'Global website settings for administrators.',
};

export default SettingsPage;
