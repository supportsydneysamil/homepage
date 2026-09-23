import type { ChangeEvent } from 'react';
import BrandMark from '../BrandMark';
import SitePhoto from '../SitePhoto';
import { THEME_OPTIONS, type ThemeId } from '../../lib/ThemeContext';
import { DEFAULT_HERO_IMAGE, DEFAULT_PASTOR_IMAGE } from '../../lib/siteSettings';

type PhotoSlot = {
  previewUrl: string;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
};

type Labels = {
  themeTitle: string;
  preview: string;
  logoTitle: string;
  logoDescription: string;
  logoHint: string;
  chooseLogo: string;
  resetLogo: string;
  photosTitle: string;
  photosDescription: string;
  heroTitle: string;
  heroHint: string;
  pastorTitle: string;
  pastorHint: string;
  choose: string;
  reset: string;
};

const PhotoControls = ({
  chooseLabel,
  resetLabel,
  onSelect,
  onReset,
}: {
  chooseLabel: string;
  resetLabel: string;
  onSelect: PhotoSlot['onSelect'];
  onReset: PhotoSlot['onReset'];
}) => (
  <div className="settings-photo__controls">
    <label className="button settings-photo__upload">
      {chooseLabel}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onSelect} />
    </label>
    <button type="button" className="settings-photo__reset" onClick={onReset}>
      {resetLabel}
    </button>
  </div>
);

const AppearanceFields = ({
  isKo,
  labels,
  selectedTheme,
  onSelectTheme,
  logo,
  hero,
  pastor,
}: {
  isKo: boolean;
  labels: Labels;
  selectedTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  logo: PhotoSlot;
  hero: PhotoSlot;
  pastor: PhotoSlot;
}) => (
  <>
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
                onChange={() => onSelectTheme(option.id)}
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
          <BrandMark src={logo.previewUrl} />
        </div>
        <h3>{labels.logoTitle}</h3>
        <p className="muted">{labels.logoHint}</p>
        <PhotoControls
          chooseLabel={labels.chooseLogo}
          resetLabel={labels.resetLogo}
          onSelect={logo.onSelect}
          onReset={logo.onReset}
        />
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
            <SitePhoto src={hero.previewUrl} fallback={DEFAULT_HERO_IMAGE} alt={labels.heroTitle} />
          </div>
          <h3>{labels.heroTitle}</h3>
          <p className="muted">{labels.heroHint}</p>
          <PhotoControls
            chooseLabel={labels.choose}
            resetLabel={labels.reset}
            onSelect={hero.onSelect}
            onReset={hero.onReset}
          />
        </article>

        <article className="card settings-photo">
          <div className="settings-photo__frame settings-photo__frame--pastor">
            <SitePhoto src={pastor.previewUrl} fallback={DEFAULT_PASTOR_IMAGE} alt={labels.pastorTitle} />
          </div>
          <h3>{labels.pastorTitle}</h3>
          <p className="muted">{labels.pastorHint}</p>
          <PhotoControls
            chooseLabel={labels.choose}
            resetLabel={labels.reset}
            onSelect={pastor.onSelect}
            onReset={pastor.onReset}
          />
        </article>
      </div>
    </section>
  </>
);

export default AppearanceFields;
