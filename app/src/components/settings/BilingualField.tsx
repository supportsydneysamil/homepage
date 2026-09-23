import type { LocalizedText } from '../../lib/churchInfo';

type BilingualFieldProps = {
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  multiline?: boolean;
};

const BilingualField = ({ label, value, onChange, multiline }: BilingualFieldProps) => (
  <div className="settings-bilingual">
    <p className="settings-bilingual__label">{label}</p>
    <label>
      <span>KO</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value.ko}
          onChange={(event) => onChange({ ...value, ko: event.currentTarget.value })}
        />
      ) : (
        <input
          value={value.ko}
          onChange={(event) => onChange({ ...value, ko: event.currentTarget.value })}
        />
      )}
    </label>
    <label>
      <span>EN</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value.en}
          onChange={(event) => onChange({ ...value, en: event.currentTarget.value })}
        />
      ) : (
        <input
          value={value.en}
          onChange={(event) => onChange({ ...value, en: event.currentTarget.value })}
        />
      )}
    </label>
  </div>
);

export default BilingualField;
