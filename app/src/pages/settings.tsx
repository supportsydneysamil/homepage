import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import PageHero from '../components/PageHero';
import { type ThemeId, useSiteSettings } from '../lib/ThemeContext';
import { useRequireAuth } from '../lib/swaAuth';
import { useLanguage } from '../lib/LanguageContext';
import { useRoles } from '../lib/useRoles';
import AppearanceFields from '../components/settings/AppearanceFields';
import ChurchInfoFields from '../components/settings/ChurchInfoFields';
import SiteCopyFields from '../components/settings/SiteCopyFields';
import { parseChurchInfo, type ChurchInfo } from '../lib/churchInfo';
import {
  DEFAULT_IMAGE_PRESENTATION,
  parseImagePresentation,
  sameImageComposition,
  type SiteImagePresentation,
} from '../lib/imagePresentation';
import { parseSiteCopy, type SiteCopy } from '../lib/siteCopy';
import {
  SETTINGS_TABS,
  buildSettingsHref,
  parseSettingsQuery,
  type SettingsTab,
} from '../lib/settingsNav';
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
  const router = useRouter();
  // Static export serves this page without query params, so wait for the
  // client-side router before choosing a tab.
  const tab = parseSettingsQuery(router.isReady ? router.query : {});
  const {
    themeId,
    heroImagePath,
    pastorImagePath,
    logoImagePath,
    heroImageUrl,
    pastorImageUrl,
    logoImageUrl,
    imagePresentation,
    churchInfo,
    siteCopy,
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
  const [draftChurchInfo, setDraftChurchInfo] = useState<ChurchInfo>(churchInfo);
  const [draftSiteCopy, setDraftSiteCopy] = useState<SiteCopy>(siteCopy);
  const [draftImagePresentation, setDraftImagePresentation] =
    useState<SiteImagePresentation>(imagePresentation);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedTheme(themeId);
  }, [themeId]);

  useEffect(() => {
    setDraftChurchInfo(parseChurchInfo(churchInfo));
  }, [churchInfo]);

  useEffect(() => {
    setDraftSiteCopy(parseSiteCopy(siteCopy));
  }, [siteCopy]);

  useEffect(() => {
    setDraftImagePresentation(parseImagePresentation(imagePresentation));
  }, [imagePresentation]);

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
        ? '테마, 사진, 교회 정보, 페이지 문구를 한 곳에서 바꾸고 사이트 전체에 적용합니다.'
        : 'Update theme, photos, church facts, and page copy, then apply them across the site.',
      tabs: {
        appearance: isKo ? '디자인' : 'Appearance',
        church: isKo ? '교회 정보' : 'Church information',
        copy: isKo ? '페이지 문구' : 'Site copy',
      } as Record<SettingsTab, string>,
      tabsLabel: isKo ? '설정 영역' : 'Settings sections',
      saveHint: isKo
        ? '세 탭의 변경 사항이 함께 저장됩니다.'
        : 'Saving applies changes from all three tabs.',
      churchTitle: isKo ? '교회 정보' : 'Church information',
      churchDescription: isKo
        ? '주소, 연락처, 예배 시간은 홈, 예배, 문의, 푸터에 함께 반영됩니다.'
        : 'Address, contact details, and service times appear on Home, Worship, Contact, and the footer.',
      copyTitle: isKo ? '페이지 문구' : 'Page copy',
      copyDescription: isKo
        ? '레이아웃은 그대로 두고 한/영 문장만 수정합니다. HTML은 입력하지 마세요.'
        : 'Edit Korean and English sentences. Layout stays fixed. Do not enter HTML.',
      loading: isKo ? '권한 확인 중...' : 'Checking permissions...',
      forbidden: isKo ? '관리자 권한이 필요합니다.' : 'Administrator role is required.',
      themeTitle: isKo ? '홈페이지 테마' : 'Website Theme',
      logoTitle: isKo ? '교회 로고' : 'Church Logo',
      logoDescription: isKo
        ? '헤더와 푸터의 브랜드 마크에 적용됩니다. 교회 이름은 그대로 둡니다.'
        : 'Replaces the brand mark in the header and footer. Church name text stays.',
      logoHint: isKo
        ? '정사각 PNG(투명 배경) 권장'
        : 'Square PNG with a transparent background recommended',
      chooseLogo: isKo ? '로고 선택' : 'Choose Logo',
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

  // Drafts live in this component, so switching tabs never discards pending edits.
  const goTo = (nextTab: SettingsTab) => {
    void router.push(buildSettingsHref(nextTab), undefined, { shallow: true });
  };

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
  ): boolean => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return false;
    const problem = validateFileForUpload(file, 'site');
    if (problem) {
      setStatus(validationMessage(problem));
      return false;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setReset(false);
    setStatus(null);
    return true;
  };

  const resetPhoto = (
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void,
    setReset: (reset: boolean) => void
  ) => {
    setFile(null);
    setPreview(null);
    setReset(true);
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
        imagePresentation: parseImagePresentation(draftImagePresentation),
        churchInfo: parseChurchInfo(draftChurchInfo),
        siteCopy: parseSiteCopy(draftSiteCopy),
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

      <nav className="settings-tabs" aria-label={labels.tabsLabel}>
        {SETTINGS_TABS.map((settingsTab) => (
          <button
            key={settingsTab}
            type="button"
            className={settingsTab === tab ? 'settings-tab settings-tab--active' : 'settings-tab'}
            aria-current={settingsTab === tab ? 'page' : undefined}
            onClick={() => goTo(settingsTab)}
          >
            {labels.tabs[settingsTab]}
          </button>
        ))}
      </nav>

      {tab === 'church' ? (
        <section className="settings-section">
          <div className="settings-section__heading">
            <h2>{labels.churchTitle}</h2>
            <p className="muted">{labels.churchDescription}</p>
          </div>
          <ChurchInfoFields value={draftChurchInfo} onChange={setDraftChurchInfo} isKo={isKo} />
        </section>
      ) : null}

      {tab === 'copy' ? (
        <section className="settings-section">
          <div className="settings-section__heading">
            <h2>{labels.copyTitle}</h2>
            <p className="muted">{labels.copyDescription}</p>
          </div>
          <SiteCopyFields
            value={draftSiteCopy}
            onChange={setDraftSiteCopy}
            isKo={isKo}
            heroPhoto={{
              previewUrl: previewSrc({
                pendingFileUrl: heroPreviewUrl,
                pendingReset: heroReset,
                publishedUrl: heroImageUrl,
                fallback: DEFAULT_HERO_IMAGE,
              }),
              status: heroReset
                ? 'reset'
                : heroPreviewUrl ||
                    !sameImageComposition(draftImagePresentation.hero, imagePresentation.hero)
                  ? 'pending'
                  : 'published',
              composition: draftImagePresentation.hero,
              onCompositionChange: (hero) =>
                setDraftImagePresentation((current) => ({ ...current, hero })),
              onSelect: (event) => {
                if (selectPhoto(event, setHeroFile, setHeroPreviewUrl, setHeroReset)) {
                  setDraftImagePresentation((current) => ({
                    ...current,
                    hero: DEFAULT_IMAGE_PRESENTATION.hero,
                  }));
                }
              },
              onReset: () => {
                resetPhoto(setHeroFile, setHeroPreviewUrl, setHeroReset);
                setDraftImagePresentation((current) => ({
                  ...current,
                  hero: DEFAULT_IMAGE_PRESENTATION.hero,
                }));
              },
            }}
            pastorPhoto={{
              previewUrl: previewSrc({
                pendingFileUrl: pastorPreviewUrl,
                pendingReset: pastorReset,
                publishedUrl: pastorImageUrl,
                fallback: DEFAULT_PASTOR_IMAGE,
              }),
              status: pastorReset
                ? 'reset'
                : pastorPreviewUrl ||
                    !sameImageComposition(draftImagePresentation.pastor, imagePresentation.pastor)
                  ? 'pending'
                  : 'published',
              composition: draftImagePresentation.pastor,
              onCompositionChange: (pastor) =>
                setDraftImagePresentation((current) => ({ ...current, pastor })),
              onSelect: (event) => {
                if (selectPhoto(event, setPastorFile, setPastorPreviewUrl, setPastorReset)) {
                  setDraftImagePresentation((current) => ({
                    ...current,
                    pastor: DEFAULT_IMAGE_PRESENTATION.pastor,
                  }));
                }
              },
              onReset: () => {
                resetPhoto(setPastorFile, setPastorPreviewUrl, setPastorReset);
                setDraftImagePresentation((current) => ({
                  ...current,
                  pastor: DEFAULT_IMAGE_PRESENTATION.pastor,
                }));
              },
            }}
          />
        </section>
      ) : null}

      {tab === 'appearance' ? (
        <AppearanceFields
          isKo={isKo}
          labels={labels}
          selectedTheme={selectedTheme}
          onSelectTheme={(nextTheme) => {
            setSelectedTheme(nextTheme);
            setThemeLocal(nextTheme);
            setStatus(null);
          }}
          logo={{
            previewUrl: previewSrc({
              pendingFileUrl: logoPreviewUrl,
              pendingReset: logoReset,
              publishedUrl: logoImageUrl,
              fallback: '',
            }),
            onSelect: (event) => selectPhoto(event, setLogoFile, setLogoPreviewUrl, setLogoReset),
            onReset: () => resetPhoto(setLogoFile, setLogoPreviewUrl, setLogoReset),
          }}
        />
      ) : null}

      <div className="settings-actions">
        <button type="button" className="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? labels.saving : labels.save}
        </button>
        <p className="muted">{labels.saveHint}</p>
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
