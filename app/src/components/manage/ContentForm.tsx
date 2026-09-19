import { useState } from 'react';

export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'date' | 'url' | 'textarea';
  required?: boolean;
};

type ContentFormProps = {
  fields: FormField[];
  submitLabel: string;
  busyLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
};

const ContentForm = ({ fields, submitLabel, busyLabel, onSubmit }: ContentFormProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    setIsBusy(true);
    setStatus(null);
    try {
      await onSubmit(values);
      setValues({});
    } catch (error) {
      setStatus((error as Error).message);
    }
    setIsBusy(false);
  };

  return (
    <form className="settings-card" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={`field-${field.name}`}>{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              id={`field-${field.name}`}
              value={values[field.name] ?? ''}
              onChange={(changeEvent) =>
                setValues((previous) => ({ ...previous, [field.name]: changeEvent.target.value }))
              }
              required={field.required}
            />
          ) : (
            <input
              id={`field-${field.name}`}
              type={field.type}
              value={values[field.name] ?? ''}
              onChange={(changeEvent) =>
                setValues((previous) => ({ ...previous, [field.name]: changeEvent.target.value }))
              }
              required={field.required}
            />
          )}
        </div>
      ))}

      <button type="submit" disabled={isBusy}>
        {isBusy ? busyLabel : submitLabel}
      </button>

      {status ? (
        <p className="error-text" role="alert">
          {status}
        </p>
      ) : null}
    </form>
  );
};

export default ContentForm;
