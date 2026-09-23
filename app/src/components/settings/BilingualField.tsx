import type { LocalizedText } from '../../lib/churchInfo';

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
}: {
  accessibleLabel: string;
  chip: string;
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
}) => (
  <label className={multiline ? 'settings-lang settings-lang--multiline' : 'settings-lang'}>
    <span className="settings-lang__chip" aria-hidden="true">
      {chip}
    </span>
    {multiline ? (
      <textarea
        aria-label={accessibleLabel}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    ) : (
      <input
        aria-label={accessibleLabel}
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
}: BilingualFieldProps) => (
  <div
    className={full ? 'settings-bilingual settings-bilingual--full' : 'settings-bilingual'}
    data-field-path={fieldPath}
  >
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
        onChange={(ko) => onChange({ ...value, ko })}
      />
      <LanguageInput
        accessibleLabel={`${label} (English)`}
        chip="EN"
        value={value.en}
        multiline={multiline}
        onChange={(en) => onChange({ ...value, en })}
      />
    </div>
  </div>
);

export default BilingualField;
