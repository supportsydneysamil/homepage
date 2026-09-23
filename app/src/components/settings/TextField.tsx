const TextField = ({
  label,
  value,
  onChange,
  hint,
  placeholder,
  full,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  placeholder?: string;
  full?: boolean;
}) => (
  <label className={full ? 'settings-field settings-field--full' : 'settings-field'}>
    <span className="settings-field__label">{label}</span>
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
    {hint ? <span className="settings-field__hint">{hint}</span> : null}
  </label>
);

export default TextField;
