import { useId, type HTMLInputTypeAttribute, type InputHTMLAttributes } from 'react';
import { useSettingsFieldError } from './SettingsValidationContext';

type TextFieldProps = {
  fieldPath?: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  placeholder?: string;
  full?: boolean;
  type?: HTMLInputTypeAttribute;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
};

const TextField = ({
  fieldPath,
  label,
  value,
  onChange,
  hint,
  placeholder,
  full,
  type = 'text',
  inputMode,
  maxLength = 200,
}: TextFieldProps) => {
  const error = useSettingsFieldError(fieldPath);
  const errorId = useId();
  const classes = [
    'settings-field',
    full ? 'settings-field--full' : '',
    error ? 'settings-field--invalid' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <label className={classes} data-field-path={fieldPath}>
      <span className="settings-field__label">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      {hint ? <span className="settings-field__hint">{hint}</span> : null}
      {error ? (
        <span className="settings-field__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
};

export default TextField;
