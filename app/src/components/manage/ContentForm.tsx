import { useEffect, useState } from 'react';

export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'date' | 'url' | 'textarea';
  required?: boolean;
  readOnly?: boolean;
};

type ContentFormProps = {
  fields: FormField[];
  initialValues?: Record<string, string>;
  submitLabel: string;
  busyLabel: string;
  cancelLabel?: string;
  onCancel?: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
};

const ContentForm = ({
  fields,
  initialValues,
  submitLabel,
  busyLabel,
  cancelLabel,
  onCancel,
  onSubmit,
}: ContentFormProps) => {
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const initialKey = JSON.stringify(initialValues ?? {});
  useEffect(() => {
    setValues(initialValues ?? {});
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    setIsBusy(true);
    setStatus(null);
    try {
      await onSubmit(values);
      if (!initialValues) {
        setValues({});
      }
    } catch (error) {
      setStatus((error as Error).message);
    }
    setIsBusy(false);
  };

  return (
    <form className="manage-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div className="manage-form__field" key={field.name}>
          <label htmlFor={`field-${field.name}`}>{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              id={`field-${field.name}`}
              value={values[field.name] ?? ''}
              onChange={(changeEvent) =>
                setValues((previous) => ({ ...previous, [field.name]: changeEvent.target.value }))
              }
              required={field.required}
              readOnly={field.readOnly}
              rows={3}
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
              readOnly={field.readOnly}
            />
          )}
        </div>
      ))}

      <div className="manage-form__actions">
        <button type="submit" className="manage-button" disabled={isBusy}>
          {isBusy ? busyLabel : submitLabel}
        </button>
        {onCancel && cancelLabel ? (
          <button type="button" className="manage-button manage-button--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
        ) : null}
      </div>

      {status ? (
        <p className="error-text" role="alert">
          {status}
        </p>
      ) : null}
    </form>
  );
};

export default ContentForm;
