import type { NextPage } from 'next';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import PageHero from '../components/PageHero';
import SitePhoto from '../components/SitePhoto';
import BrandMark from '../components/BrandMark';
import { THEME_OPTIONS, type ThemeId, useSiteSettings } from '../lib/ThemeContext';
import { useRequireAuth } from '../lib/swaAuth';
import { useLanguage } from '../lib/LanguageContext';
import { useRoles } from '../lib/useRoles';
import {
  DEFAULT_HERO_IMAGE,
  DEFAULT_PASTOR_IMAGE,
  nextImagePath,
  previewSrc,
} from '../lib/siteSettings';
import { uploadFile, validateFileForUpload } from '../lib/uploadFile';

const SettingsPage: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const {
    themeId,
    heroImagePath,
    pastorImagePath,
    logoImagePath,
    heroImageUrl,
    pastorImageUrl,
    logoImageUrl,
    setThemeLocal,
    saveSettings,
  } = useSiteSettings();
  const { isAdmin, isLoading: isChecking } = useRoles();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(themeId);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [pastorFile, setPastorFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);
  const [pastorPreviewUrl, setPastorPreviewUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [heroReset, setHeroReset] = useState(false);
  const [pastorReset, setPastorReset] = useState(false);
  const [logoReset, setLogoReset] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedTheme(themeId);
  }, [themeId]);

  useEffect(
    () => () => {
      if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
    },
    [heroPreviewUrl]
  );

  useEffect(
    () => () => {
      if (pastorPreviewUrl) URL.revokeObjectURL(pastorPreviewUrl);
    },
    [pastorPreviewUrl]
  );

  useEffect(
    () => () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    },
    [logoPreviewUrl]
  );

  const labels = useMemo(
    () => ({
      title: isKo ? '글로벌 설정' : 'Global Settings',
      subtitle: isKo
        ? '관리자만 홈페이지 전체 디자인 설정을 변경할 수 있습니다.'
        : 'Only administrators can update site-wide appearance settings.',
      loading: isKo ? '권한 확인 중...' : 'Checking permissions...',
      forbidden: isKo ? '관리자 권한이 필요합니다.' : 'Administrator role is required.',
      themeTitle: isKo ? '홈페이지 테마' : 'Website Theme',
      photosTitle: isKo ? '홈페이지 사진' : 'Homepage Photos',
      photosDescription: isKo
        ? '홈 첫 화면의 교회 사진과 담임목사 사진에만 적용됩니다.'
        : 'These photos appear only in the homepage hero and pastor sections.',
      logoTitle: isKo ? '교회 로고' : 'Church Logo',
      logoDescription: isKo
        ? '헤더와 푸터의 브랜드 마크에 적용됩니다. 교회 이름은 그대로 둡니다.'
        : 'Replaces the brand mark in the header and footer. Church name text stays.',
      logoHint: isKo
        ? '정사각 PNG(투명 배경) 권장'
        : 'Square PNG with a transparent background recommended',
      heroTitle: isKo ? '교회 히어로 사진' : 'Church Hero Photo',
      heroHint: isKo ? '가로형 4:3 이상 권장' : 'Landscape, 4:3 or wider recommended',
      pastorTitle: isKo ? '담임목사 사진' : 'Pastor Photo',
      pastorHint: isKo ? '세로형 4:5 권장' : 'Portrait, about 4:5 recommended',
      choose: isKo ? '사진 선택' : 'Choose Photo',
      chooseLogo: isKo ? '로고 선택' : 'Choose Logo',
      reset: isKo ? '기본 사진으로 되돌리기' : 'Restore Default',
      resetLogo: isKo ? '기본 마크로 되돌리기' : 'Restore Default Mark',
      save: isKo ? '전체 적용 저장' : 'Save and Apply Globally',
      saving: isKo ? '저장 중...' : 'Saving...',
      saveOk: isKo ? '글로벌 설정이 적용되었습니다.' : 'Global settings have been updated.',
      saveFail: isKo ? '설정 저장에 실패했습니다.' : 'Failed to save global settings.',
      emptyFile: isKo ? '빈 파일은 업로드할 수 없습니다.' : 'An empty file cannot be uploaded.',
      tooLarge: isKo ? '사진은 25MB 이하여야 합니다.' : 'The photo must be 25 MB or smaller.',
      badType: isKo
        ? 'JPEG, PNG 또는 WebP 사진을 선택해 주세요.'
        : 'Choose a JPEG, PNG, or WebP image.',
      preview: isKo ? '미리보기' : 'Preview',
    }),
    [isKo]
  );

  if (isLoading || isChecking) {
    return <p className="account-state">{labels.loading}</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <section className="site-page settings-page">
        <div className="site-empty-state settings-card">
          <h1>{labels.title}</h1>
          <p className="error-text">{labels.forbidden}</p>
        </div>
      </section>
    );
  }

  const validationMessage = (problem: string) => {
    if (problem === 'empty') return labels.emptyFile;
    if (problem === 'tooLarge') return labels.tooLarge;
    return labels.badType;
  };

  const selectPhoto = (
    event: ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void,
    setReset: (reset: boolean) => void
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    const problem = validateFileForUpload(file, 'site');
    if (problem) {
      setStatus(validationMessage(problem));
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setReset(false);
    setStatus(null);
  };

  const clearPendingPhotos = () => {
    setHeroFile(null);
    setPastorFile(null);
    setLogoFile(null);
    setHeroPreviewUrl(null);
    setPastorPreviewUrl(null);
    setLogoPreviewUrl(null);
    setHeroReset(false);
    setPastorReset(false);
    setLogoReset(false);
  };

  const onSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const uploadedHero = heroFile ? await uploadFile(heroFile, 'site') : null;
      const uploadedPastor = pastorFile ? await uploadFile(pastorFile, 'site') : null;
      const uploadedLogo = logoFile ? await uploadFile(logoFile, 'site') : null;
      const result = await saveSettings({
        themeId: selectedTheme,
        heroImagePath: nextImagePath(
          uploadedHero ? { uploadedPath: uploadedHero.blobPath } : heroReset ? 'reset' : 'keep',
          heroImagePath
        ),
        pastorImagePath: nextImagePath(
          uploadedPastor ? { uploadedPath: uploadedPastor.blobPath } : pastorReset ? 'reset' : 'keep',
          pastorImagePath
        ),
        logoImagePath: nextImagePath(
          uploadedLogo ? { uploadedPath: uploadedLogo.blobPath } : logoReset ? 'reset' : 'keep',
          logoImagePath
        ),
      });

      if (result.ok) {
        clearPendingPhotos();
        setStatus(labels.saveOk);
      } else {
        setStatus(result.message || labels.saveFail);
      }
    } catch (error) {
      setStatus(labels.saveFail);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="site-page settings-page">
      <PageHero
        eyebrow={isKo ? '관리자' : 'Administration'}
        title={labels.title}
        description={labels.subtitle}
      />

      <section className="settings-section">
        <h2>{labels.themeTitle}</h2>
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
      </section>

      <section className="settings-section settings-photo-section">
        <div className="settings-section__heading">
          <h2>{labels.logoTitle}</h2>
          <p className="muted">{labels.logoDescription}</p>
        </div>
        <article className="card settings-photo settings-logo">
          <div className="settings-photo__frame settings-photo__frame--logo">
            <BrandMark
              src={previewSrc({
                pendingFileUrl: logoPreviewUrl,
                pendingReset: logoReset,
                publishedUrl: logoImageUrl,
                fallback: '',
              })}
            />
          </div>
          <h3>{labels.logoTitle}</h3>
          <p className="muted">{labels.logoHint}</p>
          <div className="settings-photo__controls">
            <label className="button settings-photo__upload">
              {labels.chooseLogo}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => selectPhoto(event, setLogoFile, setLogoPreviewUrl, setLogoReset)}
              />
            </label>
            <button
              type="button"
              className="settings-photo__reset"
              onClick={() => {
                setLogoFile(null);
                setLogoPreviewUrl(null);
                setLogoReset(true);
                setStatus(null);
              }}
            >
              {labels.resetLogo}
            </button>
          </div>
        </article>
      </section>

      <section className="settings-section settings-photo-section">
        <div className="settings-section__heading">
          <h2>{labels.photosTitle}</h2>
          <p className="muted">{labels.photosDescription}</p>
        </div>
        <div className="settings-photos">
          <article className="card settings-photo">
            <div className="settings-photo__frame settings-photo__frame--hero">
              <SitePhoto
                src={previewSrc({
                  pendingFileUrl: heroPreviewUrl,
                  pendingReset: heroReset,
                  publishedUrl: heroImageUrl,
                  fallback: DEFAULT_HERO_IMAGE,
                })}
                fallback={DEFAULT_HERO_IMAGE}
                alt={labels.heroTitle}
              />
            </div>
            <h3>{labels.heroTitle}</h3>
            <p className="muted">{labels.heroHint}</p>
            <div className="settings-photo__controls">
              <label className="button settings-photo__upload">
                {labels.choose}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => selectPhoto(event, setHeroFile, setHeroPreviewUrl, setHeroReset)}
                />
              </label>
              <button
                type="button"
                className="settings-photo__reset"
                onClick={() => {
                  setHeroFile(null);
                  setHeroPreviewUrl(null);
                  setHeroReset(true);
                  setStatus(null);
                }}
              >
                {labels.reset}
              </button>
            </div>
          </article>

          <article className="card settings-photo">
            <div className="settings-photo__frame settings-photo__frame--pastor">
              <SitePhoto
                src={previewSrc({
                  pendingFileUrl: pastorPreviewUrl,
                  pendingReset: pastorReset,
                  publishedUrl: pastorImageUrl,
                  fallback: DEFAULT_PASTOR_IMAGE,
                })}
                fallback={DEFAULT_PASTOR_IMAGE}
                alt={labels.pastorTitle}
              />
            </div>
            <h3>{labels.pastorTitle}</h3>
            <p className="muted">{labels.pastorHint}</p>
            <div className="settings-photo__controls">
              <label className="button settings-photo__upload">
                {labels.choose}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => selectPhoto(event, setPastorFile, setPastorPreviewUrl, setPastorReset)}
                />
              </label>
              <button
                type="button"
                className="settings-photo__reset"
                onClick={() => {
                  setPastorFile(null);
                  setPastorPreviewUrl(null);
                  setPastorReset(true);
                  setStatus(null);
                }}
              >
                {labels.reset}
              </button>
            </div>
          </article>
        </div>
      </section>

      <div className="settings-actions">
        <button type="button" className="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? labels.saving : labels.save}
        </button>
        {status ? <p className={status === labels.saveOk ? 'success-text' : 'error-text'}>{status}</p> : null}
      </div>
    </article>
  );
};

SettingsPage.meta = {
  title: 'Settings',
  description: 'Global website settings for administrators.',
};

export default SettingsPage;
