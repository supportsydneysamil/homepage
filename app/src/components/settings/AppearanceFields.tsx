import BrandMark from '../BrandMark';
import { PhotoControls, type PhotoSlot } from './SitePhotoField';
import { THEME_OPTIONS, type ThemeId } from '../../lib/ThemeContext';

type Labels = {
  themeTitle: string;
  preview: string;
  logoTitle: string;
  logoDescription: string;
  logoHint: string;
  chooseLogo: string;
  resetLogo: string;
};

const AppearanceFields = ({
  isKo,
  labels,
  selectedTheme,
  onSelectTheme,
  logo,
}: {
  isKo: boolean;
  labels: Labels;
  selectedTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  logo: PhotoSlot;
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
  </>
);

export default AppearanceFields;
