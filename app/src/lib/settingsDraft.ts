import type { ChurchInfo } from './churchInfo';
import type { SiteImagePresentation } from './imagePresentation';
import type { SiteCopy } from './siteCopy';
import type { SettingsTab } from './settingsNav';

type DirtySettingsInput = {
  currentThemeId: string;
  selectedThemeId: string;
  logoChanged: boolean;
  currentChurchInfo: ChurchInfo;
  draftChurchInfo: ChurchInfo;
  currentSiteCopy: SiteCopy;
  draftSiteCopy: SiteCopy;
  photosChanged: boolean;
  currentImagePresentation: SiteImagePresentation;
  draftImagePresentation: SiteImagePresentation;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)])
  );
};

const sameValue = (left: unknown, right: unknown) =>
  JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));

export const dirtySettingsTabs = (input: DirtySettingsInput): SettingsTab[] => {
  const tabs: SettingsTab[] = [];
  if (
    input.selectedThemeId !== input.currentThemeId ||
    input.logoChanged
  ) {
    tabs.push('appearance');
  }
  if (!sameValue(input.draftChurchInfo, input.currentChurchInfo)) {
    tabs.push('church');
  }
  if (
    input.photosChanged ||
    !sameValue(input.draftSiteCopy, input.currentSiteCopy) ||
    !sameValue(input.draftImagePresentation, input.currentImagePresentation)
  ) {
    tabs.push('copy');
  }
  return tabs;
};
