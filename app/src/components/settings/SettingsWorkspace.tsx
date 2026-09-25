import { useRouter } from 'next/router';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { type ThemeId, useSiteSettings } from '../../lib/ThemeContext';
import { useLanguage } from '../../lib/LanguageContext';
import AppearanceFields from './AppearanceFields';
import ChurchInfoFields from './ChurchInfoFields';
import { SettingsValidationProvider } from './SettingsValidationContext';
import SiteCopyFields from './SiteCopyFields';
import { parseChurchInfo, type ChurchInfo } from '../../lib/churchInfo';
import {
  DEFAULT_IMAGE_PRESENTATION,
  parseImagePresentation,
  sameImageComposition,
  type SiteImagePresentation,
} from '../../lib/imagePresentation';
import { parseSiteCopy, type SiteCopy } from '../../lib/siteCopy';
import { dirtySettingsTabs } from '../../lib/settingsDraft';
import {
  settingsValidationMessage,
  validateChurchInfoDraft,
  validateSiteCopyDraft,
} from '../../lib/settingsValidation';
import {
  SETTINGS_TABS,
  buildSettingsHref,
  parseSettingsQuery,
  type SettingsTab,
} from '../../lib/settingsNav';
import {
  DEFAULT_HERO_IMAGE,
  DEFAULT_PASTOR_IMAGE,
  nextImagePath,
  previewSrc,
} from '../../lib/siteSettings';
import { uploadFile, validateFileForUpload } from '../../lib/uploadFile';

const SettingsWorkspace = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const router = useRouter();
  // Static export serves this page without query params, so wait for the
  // client-side router before choosing a section.
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
    saveSettings,
    setPreviewTheme,
  } = useSiteSettings();
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
  const [status, setStatus] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  useEffect(() => {
    setSelectedTheme(themeId);
  }, [themeId]);

  // Leaving the page without saving drops the preview and restores the
  // published theme.
  useEffect(() => () => setPreviewTheme(null), []);

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

  const dirtyTabs = useMemo(
    () =>
      dirtySettingsTabs({
        currentThemeId: themeId,
        selectedThemeId: selectedTheme,
        logoChanged: Boolean(logoFile || (logoReset && logoImagePath)),
        currentChurchInfo: churchInfo,
        draftChurchInfo,
        currentSiteCopy: siteCopy,
        draftSiteCopy,
        photosChanged: Boolean(
          heroFile ||
            pastorFile ||
            (heroReset && heroImagePath) ||
            (pastorReset && pastorImagePath)
        ),
        currentImagePresentation: imagePresentation,
        draftImagePresentation,
      }),
    [
      themeId,
      selectedTheme,
      logoFile,
      logoReset,
      logoImagePath,
      churchInfo,
      draftChurchInfo,
      siteCopy,
      draftSiteCopy,
      heroFile,
      pastorFile,
      heroReset,
      pastorReset,
      heroImagePath,
      pastorImagePath,
      imagePresentation,
      draftImagePresentation,
    ]
  );
  const isDirty = dirtyTabs.length > 0;
  const validationIssues = useMemo(
    () => [
      ...validateChurchInfoDraft(draftChurchInfo),
      ...validateSiteCopyDraft(draftSiteCopy),
    ],
    [draftChurchInfo, draftSiteCopy]
  );
  const fieldErrors = useMemo(
    () =>
      showValidation
        ? Object.fromEntries(
            validationIssues.map((issue) => [
              issue.path,
              settingsValidationMessage(issue, isKo),
            ])
          )
        : {},
    [showValidation, validationIssues, isKo]
  );

  useEffect(() => {
    if (!showValidation) return;
    const issue = validationIssues.find((item) => item.tab === tab);
    if (!issue) return;
    const frame = window.requestAnimationFrame(() => {
      const field = Array.from(
        document.querySelectorAll<HTMLElement>('[data-field-path]')
      ).find((element) => element.dataset.fieldPath === issue.path);
      let disclosure = field?.closest('details');
      while (disclosure) {
        disclosure.open = true;
        disclosure = disclosure.parentElement?.closest('details') ?? null;
      }
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.querySelector<HTMLElement>('input, textarea, select, button')?.focus({
        preventScroll: true,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [showValidation, validationIssues, tab]);

  useEffect(() => {
    if (!isDirty) setIsConfirmingDiscard(false);
  }, [isDirty]);

  const labels = useMemo(
    () => ({
      tabs: {
        appearance: isKo ? '디자인' : 'Appearance',
        church: isKo ? '교회 정보' : 'Church information',
        copy: isKo ? '페이지 문구' : 'Site copy',
      } as Record<SettingsTab, string>,
      tabsLabel: isKo ? '설정 영역' : 'Settings sections',
      saveHint: isKo
        ? '세 탭의 변경 사항이 함께 저장됩니다.'
        : 'Saving applies changes from all three tabs.',
      noChanges: isKo ? '저장할 변경 사항이 없습니다.' : 'No unsaved changes.',
      unsavedChanges: isKo ? '저장 전 변경' : 'Unsaved changes',
      discard: isKo ? '전체 편집 취소' : 'Discard All Changes',
      discardPrompt: isKo
        ? '저장 전 변경 사항을 모두 취소할까요?'
        : 'Discard all unsaved changes?',
      keepEditing: isKo ? '계속 편집' : 'Keep Editing',
      discardAll: isKo ? '모두 되돌리기' : 'Discard Everything',
      discarded: isKo
        ? '편집 내용이 취소되었습니다.'
        : 'Unsaved changes were discarded.',
      churchTitle: isKo ? '교회 정보' : 'Church information',
      churchDescription: isKo
        ? '주소, 연락처, 예배 시간은 홈, 예배, 문의, 푸터에 함께 반영됩니다.'
        : 'Address, contact details, and service times appear on Home, Worship, Contact, and the footer.',
      copyTitle: isKo ? '페이지 문구' : 'Page copy',
      copyDescription: isKo
        ? '레이아웃은 그대로 두고 한/영 문장만 수정합니다. HTML은 입력하지 마세요.'
        : 'Edit Korean and English sentences. Layout stays fixed. Do not enter HTML.',
      themeTitle: isKo ? '홈페이지 테마' : 'Website Theme',
      appearanceTitle: isKo ? '디자인' : 'Appearance',
      appearanceDescription: isKo
        ? '사이트 전체 테마와 헤더·푸터 로고를 관리합니다.'
        : 'Manage the site-wide theme and the logo used in the header and footer.',
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
      validationFail: isKo
        ? '입력 내용을 확인해 주세요.'
        : 'Review the highlighted settings.',
      emptyFile: isKo ? '빈 파일은 업로드할 수 없습니다.' : 'An empty file cannot be uploaded.',
      tooLarge: isKo ? '사진은 25MB 이하여야 합니다.' : 'The photo must be 25 MB or smaller.',
      badType: isKo
        ? 'JPEG, PNG 또는 WebP 사진을 선택해 주세요.'
        : 'Choose a JPEG, PNG, or WebP image.',
      preview: isKo ? '미리보기' : 'Preview',
    }),
    [isKo]
  );

  // Drafts live in this component, so switching tabs never discards pending edits.
  const goTo = (nextTab: SettingsTab) => {
    void router.push(buildSettingsHref(nextTab), undefined, { shallow: true, scroll: false });
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
      setStatus({ kind: 'error', message: validationMessage(problem) });
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

  const discardAllChanges = () => {
    setSelectedTheme(themeId);
    setPreviewTheme(null);
    setDraftChurchInfo(parseChurchInfo(churchInfo));
    setDraftSiteCopy(parseSiteCopy(siteCopy));
    setDraftImagePresentation(parseImagePresentation(imagePresentation));
    clearPendingPhotos();
    setShowValidation(false);
    setIsConfirmingDiscard(false);
    setStatus({ kind: 'success', message: labels.discarded });
  };

  const onSave = async () => {
    if (!isDirty || isSaving) return;
    if (validationIssues.length) {
      setShowValidation(true);
      setStatus({
        kind: 'error',
        message: `${labels.validationFail} (${validationIssues.length})`,
      });
      goTo(validationIssues[0].tab);
      return;
    }
    setShowValidation(false);
    setIsConfirmingDiscard(false);
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
        setStatus({ kind: 'success', message: labels.saveOk });
      } else {
        setStatus({ kind: 'error', message: result.message || labels.saveFail });
      }
    } catch (error) {
      setStatus({ kind: 'error', message: labels.saveFail });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <nav className="settings-tabs" aria-label={labels.tabsLabel}>
        {SETTINGS_TABS.map((settingsTab) => (
          <button
            key={settingsTab}
            type="button"
            className={settingsTab === tab ? 'settings-tab settings-tab--active' : 'settings-tab'}
            aria-current={settingsTab === tab ? 'page' : undefined}
            aria-label={
              dirtyTabs.includes(settingsTab)
                ? `${labels.tabs[settingsTab]} · ${labels.unsavedChanges}`
                : labels.tabs[settingsTab]
            }
            onClick={() => goTo(settingsTab)}
          >
            {labels.tabs[settingsTab]}
            {dirtyTabs.includes(settingsTab) ? (
              <span className="settings-tab__dirty" aria-hidden="true" />
            ) : null}
          </button>
        ))}
      </nav>

      {tab === 'church' ? (
        <section className="settings-section">
          <div className="settings-section__heading">
            <h2>{labels.churchTitle}</h2>
            <p className="muted">{labels.churchDescription}</p>
          </div>
          <SettingsValidationProvider errors={fieldErrors}>
            <ChurchInfoFields
              value={draftChurchInfo}
              onChange={(next) => {
                setDraftChurchInfo(next);
                setStatus(null);
              }}
              isKo={isKo}
            />
          </SettingsValidationProvider>
        </section>
      ) : null}

      {tab === 'copy' ? (
        <section className="settings-section">
          <div className="settings-section__heading">
            <h2>{labels.copyTitle}</h2>
            <p className="muted">{labels.copyDescription}</p>
          </div>
          <SettingsValidationProvider errors={fieldErrors}>
            <SiteCopyFields
              value={draftSiteCopy}
              onChange={(next) => {
                setDraftSiteCopy(next);
                setStatus(null);
              }}
              isKo={isKo}
              heroPhoto={{
              previewUrl: previewSrc({
                pendingFileUrl: heroPreviewUrl,
                pendingReset: heroReset,
                publishedUrl: heroImageUrl,
                fallback: DEFAULT_HERO_IMAGE,
              }),
              status: heroReset && heroImagePath
                ? 'reset'
                : heroPreviewUrl ||
                    !sameImageComposition(draftImagePresentation.hero, imagePresentation.hero)
                  ? 'pending'
                  : 'published',
              composition: draftImagePresentation.hero,
              onCompositionChange: (hero) => {
                setDraftImagePresentation((current) => ({ ...current, hero }));
                setStatus(null);
              },
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
              status: pastorReset && pastorImagePath
                ? 'reset'
                : pastorPreviewUrl ||
                    !sameImageComposition(draftImagePresentation.pastor, imagePresentation.pastor)
                  ? 'pending'
                  : 'published',
              composition: draftImagePresentation.pastor,
              onCompositionChange: (pastor) => {
                setDraftImagePresentation((current) => ({ ...current, pastor }));
                setStatus(null);
              },
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
          </SettingsValidationProvider>
        </section>
      ) : null}

      {tab === 'appearance' ? (
        <section className="settings-section">
          <div className="settings-section__heading">
            <h2>{labels.appearanceTitle}</h2>
            <p className="muted">{labels.appearanceDescription}</p>
          </div>
          <AppearanceFields
            isKo={isKo}
            labels={labels}
            selectedTheme={selectedTheme}
            onSelectTheme={(nextTheme) => {
              setSelectedTheme(nextTheme);
              setPreviewTheme(nextTheme);
              setStatus(null);
            }}
            logo={{
              previewUrl: previewSrc({
                pendingFileUrl: logoPreviewUrl,
                pendingReset: logoReset,
                publishedUrl: logoImageUrl,
                fallback: '',
              }),
              status:
                logoReset && logoImagePath
                  ? 'reset'
                  : logoPreviewUrl
                    ? 'pending'
                    : 'published',
              onSelect: (event) =>
                selectPhoto(event, setLogoFile, setLogoPreviewUrl, setLogoReset),
              onReset: () => resetPhoto(setLogoFile, setLogoPreviewUrl, setLogoReset),
            }}
          />
        </section>
      ) : null}

      <div className="settings-actions">
        <div className="settings-actions__summary">
          <strong>
            {isConfirmingDiscard
              ? labels.discardPrompt
              : isDirty
                ? `${labels.unsavedChanges}: ${dirtyTabs.map((item) => labels.tabs[item]).join(' · ')}`
                : labels.noChanges}
          </strong>
          {!isConfirmingDiscard ? (
            <span className="settings-actions__hint">{labels.saveHint}</span>
          ) : null}
          {status && !isConfirmingDiscard ? (
            <span
              className={status.kind === 'success' ? 'success-text' : 'error-text'}
              role={status.kind === 'error' ? 'alert' : undefined}
              aria-live={status.kind === 'success' ? 'polite' : undefined}
            >
              {status.message}
            </span>
          ) : null}
        </div>
        <div className="settings-actions__buttons">
          {isConfirmingDiscard ? (
            <>
              <button
                type="button"
                className="settings-actions__secondary"
                onClick={() => setIsConfirmingDiscard(false)}
              >
                {labels.keepEditing}
              </button>
              <button
                type="button"
                className="settings-actions__danger"
                onClick={discardAllChanges}
              >
                {labels.discardAll}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="settings-actions__secondary"
                onClick={() => setIsConfirmingDiscard(true)}
                disabled={isSaving || !isDirty}
              >
                {labels.discard}
              </button>
              <button
                type="button"
                className="button"
                onClick={onSave}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? labels.saving : labels.save}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsWorkspace;
