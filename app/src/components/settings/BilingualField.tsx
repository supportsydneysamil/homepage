import { useId } from 'react';
import type { LocalizedText } from '../../lib/churchInfo';
import { useSettingsFieldError } from './SettingsValidationContext';

type BilingualFieldProps = {
  fieldPath?: string;
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  hint?: string;
  multiline?: boolean;
  full?: boolean;
};

const LanguageInput = ({
  accessibleLabel,
  chip,
  value,
  onChange,
  multiline,
  invalid,
  errorId,
}: {
  accessibleLabel: string;
  chip: string;
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  invalid?: boolean;
  errorId?: string;
}) => (
  <label className={multiline ? 'settings-lang settings-lang--multiline' : 'settings-lang'}>
    <span className="settings-lang__chip" aria-hidden="true">
      {chip}
    </span>
    {multiline ? (
      <textarea
        aria-label={accessibleLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        maxLength={400}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    ) : (
      <input
        aria-label={accessibleLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        maxLength={400}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    )}
  </label>
);

const BilingualField = ({
  fieldPath,
  label,
  value,
  onChange,
  hint,
  multiline,
  full,
}: BilingualFieldProps) => {
  const error = useSettingsFieldError(fieldPath);
  const errorId = useId();
  const classes = [
    'settings-bilingual',
    full ? 'settings-bilingual--full' : '',
    error ? 'settings-bilingual--invalid' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} data-field-path={fieldPath}>
      <p className="settings-bilingual__label">
        {label}
        {hint ? <span>{hint}</span> : null}
      </p>
      <div className="settings-bilingual__pair">
        <LanguageInput
          accessibleLabel={`${label} (한국어)`}
          chip="KO"
          value={value.ko}
          multiline={multiline}
          invalid={Boolean(error)}
          errorId={errorId}
          onChange={(ko) => onChange({ ...value, ko })}
        />
        <LanguageInput
          accessibleLabel={`${label} (English)`}
          chip="EN"
          value={value.en}
          multiline={multiline}
          invalid={Boolean(error)}
          errorId={errorId}
          onChange={(en) => onChange({ ...value, en })}
        />
      </div>
      {error ? (
        <p className="settings-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default BilingualField;
