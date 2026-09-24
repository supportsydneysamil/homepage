import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
  type SyntheticEvent,
} from 'react';
import type { ImageComposition } from '../../lib/imagePresentation';
import SitePhoto from '../SitePhoto';

export type PhotoStatus = 'published' | 'pending' | 'reset';

export type PhotoSlot = {
  previewUrl: string;
  status?: PhotoStatus;
  composition?: ImageComposition;
  onCompositionChange?: (next: ImageComposition) => void;
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

const STATUS_COPY: Record<PhotoStatus, { ko: string; en: string }> = {
  published: { ko: '현재 게시된 사진', en: 'Currently published photo' },
  pending: { ko: '변경 사항 있음 · 저장 전', en: 'Changes pending · unsaved' },
  reset: { ko: '기본 사진으로 되돌리기 예정 · 저장 전', en: 'Will restore default · unsaved' },
};

const SitePhotoField = ({
  label,
  hint,
  usage,
  alt,
  fallback,
  variant,
  chooseLabel,
  resetLabel,
  isKo,
  defaultComposition,
  slot,
}: {
  label: string;
  hint: string;
  usage: string;
  alt: string;
  fallback: string;
  variant: 'hero' | 'pastor';
  chooseLabel: string;
  resetLabel: string;
  isKo: boolean;
  defaultComposition: ImageComposition;
  slot: PhotoSlot;
}) => {
  const state = slot.status ?? 'published';
  const statusCopy = STATUS_COPY[state];
  const composition = slot.composition ?? defaultComposition;
  const [sourceSize, setSourceSize] = useState(
    variant === 'hero' ? { width: 320, ratio: 1.6 } : { width: 180, ratio: 0.75 }
  );

  const setComposition = (patch: Partial<ImageComposition>) => {
    slot.onCompositionChange?.({ ...composition, ...patch });
  };

  const updateFocus = (target: HTMLElement, clientX: number, clientY: number) => {
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    setComposition({
      focusX: Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))),
      focusY: Math.round(Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))),
    });
  };

  const handlePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.type === 'pointermove' && !(event.buttons & 1)) return;
    if (event.type === 'pointerdown') event.currentTarget.setPointerCapture(event.pointerId);
    updateFocus(event.currentTarget, event.clientX, event.clientY);
  };

  const handleFocusKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    const movement: Record<string, Partial<ImageComposition>> = {
      ArrowLeft: { focusX: Math.max(0, composition.focusX - step) },
      ArrowRight: { focusX: Math.min(100, composition.focusX + step) },
      ArrowUp: { focusY: Math.max(0, composition.focusY - step) },
      ArrowDown: { focusY: Math.min(100, composition.focusY + step) },
    };
    const patch = movement[event.key];
    if (!patch) return;
    event.preventDefault();
    setComposition(patch);
  };

  const handleSourceLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const ratio = image.naturalWidth / image.naturalHeight || 1;
    const maxWidth = 320;
    const maxHeight = 240;
    if (ratio >= maxWidth / maxHeight) {
      setSourceSize({ width: maxWidth, ratio });
    } else {
      setSourceSize({ width: Math.round(maxHeight * ratio), ratio });
    }
  };

  return (
    <div className="settings-bilingual">
      <p className="settings-bilingual__label">
        {label}
        <span>{hint}</span>
      </p>
      <div className="settings-photo-field">
        <section className="settings-photo-field__source">
          <p className="settings-photo-field__eyebrow">
            {isKo ? '원본 사진' : 'Source image'}
          </p>
          <div className="settings-photo-field__source-stage">
            <div
              className="settings-photo-field__source-image"
              style={{ width: sourceSize.width, aspectRatio: sourceSize.ratio }}
              role="group"
              aria-roledescription={isKo ? '2차원 초점 선택기' : 'two-dimensional focal-point control'}
              tabIndex={0}
              aria-label={
                isKo
                  ? `초점 X ${composition.focusX}%, Y ${composition.focusY}%. 방향키로 세밀하게 움직일 수 있습니다.`
                  : `Focal point X ${composition.focusX}%, Y ${composition.focusY}%. Use arrow keys for fine adjustment.`
              }
              onPointerDown={handlePointer}
              onPointerMove={handlePointer}
              onKeyDown={handleFocusKey}
            >
              <SitePhoto
                src={slot.previewUrl}
                fallback={fallback}
                alt={alt}
                onLoad={handleSourceLoad}
              />
              <span
                className="settings-photo-field__focus"
                style={{ left: `${composition.focusX}%`, top: `${composition.focusY}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
          <p className="settings-photo-field__source-help">
            {isKo
              ? '사진을 클릭하거나 드래그해 초점을 맞추세요'
              : 'Click or drag to place the focal point'}
          </p>
        </section>

        <section className="settings-photo-field__controls">
          <p className="settings-photo-field__eyebrow">
            {isKo ? '구도 조절' : 'Composition'}
          </p>
          <label className="settings-photo-field__range">
            <span>
              {isKo ? '확대' : 'Zoom'}
              <output>{Math.round(composition.zoom * 100)}%</output>
            </span>
            <input
              type="range"
              min="1"
              max="2"
              step="0.01"
              value={composition.zoom}
              onChange={(event) => setComposition({ zoom: Number(event.currentTarget.value) })}
            />
          </label>
          <dl className="settings-photo-field__coordinates">
            <div>
              <dt>X</dt>
              <dd>{composition.focusX}%</dd>
            </div>
            <div>
              <dt>Y</dt>
              <dd>{composition.focusY}%</dd>
            </div>
          </dl>
          <button
            type="button"
            className="settings-photo-field__composition-reset"
            onClick={() => slot.onCompositionChange?.(defaultComposition)}
          >
            {isKo ? '구도 초기화' : 'Reset composition'}
          </button>
        </section>

        <section className="settings-photo-field__result">
          <p className="settings-photo-field__eyebrow">
            {isKo ? '실제 결과' : 'Published result'}
          </p>
          <div className="settings-photo-field__result-stage">
            <div
              className={`settings-photo-field__preview settings-photo-field__preview--${variant}`}
            >
              <SitePhoto
                src={slot.previewUrl}
                fallback={fallback}
                alt={alt}
                presentation={composition}
              />
            </div>
          </div>
          <p className="settings-photo-field__result-help">
            {variant === 'hero'
              ? isKo
                ? '홈 첫 화면 프레임'
                : 'Homepage hero frame'
              : isKo
                ? '담임목사 소개 프레임'
                : 'Pastor feature frame'}
          </p>
        </section>

        <footer className="settings-photo-field__footer">
          <div className="settings-photo-field__info">
            <p className="settings-photo-field__status" aria-live="polite">
              <span
                className={`settings-photo-field__dot settings-photo-field__dot--${state}`}
                aria-hidden="true"
              />
              {isKo ? statusCopy.ko : statusCopy.en}
            </p>
            <p className="settings-photo-field__usage">{usage}</p>
          </div>
          <div className="settings-photo-field__actions">
            <label className="settings-photo-field__choose">
              {chooseLabel}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={slot.onSelect} />
            </label>
            <button type="button" className="settings-photo-field__reset" onClick={slot.onReset}>
              {resetLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SitePhotoField;
