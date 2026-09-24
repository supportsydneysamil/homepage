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
  <div className="settings-appearance">
    <section className="settings-subsection">
      <h3>{labels.themeTitle}</h3>
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

    <section className="settings-subsection settings-photo-section">
      <div className="settings-section__heading">
        <h3>{labels.logoTitle}</h3>
        <p className="muted">{labels.logoDescription}</p>
      </div>
      <article className="card settings-photo settings-logo">
        <div className="settings-photo__frame settings-photo__frame--logo">
          <BrandMark src={logo.previewUrl} />
        </div>
        <p className="muted">{labels.logoHint}</p>
        <p className="settings-photo__status" aria-live="polite">
          <span
            className={`settings-photo-field__dot settings-photo-field__dot--${logo.status ?? 'published'}`}
            aria-hidden="true"
          />
          {logo.status === 'pending'
            ? isKo
              ? '새 로고 선택됨 · 저장 전'
              : 'New logo selected · unsaved'
            : logo.status === 'reset'
              ? isKo
                ? '기본 마크로 되돌리기 예정 · 저장 전'
                : 'Will restore default mark · unsaved'
              : isKo
                ? '현재 게시된 로고'
                : 'Currently published logo'}
        </p>
        <PhotoControls
          chooseLabel={labels.chooseLogo}
          resetLabel={labels.resetLogo}
          onSelect={logo.onSelect}
          onReset={logo.onReset}
        />
      </article>
    </section>
  </div>
);

export default AppearanceFields;
