import type { ChangeEvent } from 'react';
import SitePhoto from '../SitePhoto';

export type PhotoSlot = {
  previewUrl: string;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
};

export const PhotoControls = ({
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

const SitePhotoField = ({
  label,
  hint,
  alt,
  fallback,
  variant,
  chooseLabel,
  resetLabel,
  slot,
}: {
  label: string;
  hint: string;
  alt: string;
  fallback: string;
  variant: 'hero' | 'pastor';
  chooseLabel: string;
  resetLabel: string;
  slot: PhotoSlot;
}) => (
  <section className="settings-field-group">
    <h4>{label}</h4>
    <div className="settings-photo-field">
      <div className={`settings-photo__frame settings-photo__frame--${variant}`}>
        <SitePhoto src={slot.previewUrl} fallback={fallback} alt={alt} />
      </div>
      <div className="settings-photo-field__body">
        <p className="settings-photo-field__hint">{hint}</p>
        <PhotoControls
          chooseLabel={chooseLabel}
          resetLabel={resetLabel}
          onSelect={slot.onSelect}
          onReset={slot.onReset}
        />
      </div>
    </div>
  </section>
);

export default SitePhotoField;
