import { useEffect, useState } from 'react';

export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'date' | 'url' | 'textarea' | 'select';
  required?: boolean;
  readOnly?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
};

export type FileField = {
  name: string;
  label: string;
  accept: string;
  hint?: string;
  currentLabel?: string;
};

type ContentFormProps = {
  fields: FormField[];
  fileField?: FileField;
  initialValues?: Record<string, string>;
  submitLabel: string;
  busyLabel: string;
  cancelLabel?: string;
  onCancel?: () => void;
  onSubmit: (values: Record<string, string>, file: File | null) => Promise<void>;
};

const ContentForm = ({
  fields,
  fileField,
  initialValues,
  submitLabel,
  busyLabel,
  cancelLabel,
  onCancel,
  onSubmit,
}: ContentFormProps) => {
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const initialKey = JSON.stringify(initialValues ?? {});
  useEffect(() => {
    setValues(initialValues ?? {});
    setFile(null);
    setFileKey((previous) => previous + 1);
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    setIsBusy(true);
    setStatus(null);
    try {
      await onSubmit(values, file);
      setFile(null);
      setFileKey((previous) => previous + 1);
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
          {field.type === 'select' ? (
            <select
              id={`field-${field.name}`}
              value={values[field.name] ?? field.options?.[0]?.value ?? ''}
              onChange={(changeEvent) =>
                setValues((previous) => ({ ...previous, [field.name]: changeEvent.target.value }))
              }
              required={field.required}
            >
              {(field.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
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
          {field.hint ? <span className="muted">{field.hint}</span> : null}
        </div>
      ))}

      {fileField ? (
        <div className="manage-form__field">
          <label htmlFor={`field-${fileField.name}`}>{fileField.label}</label>
          <input
            key={fileKey}
            id={`field-${fileField.name}`}
            type="file"
            accept={fileField.accept}
            onChange={(changeEvent) => setFile(changeEvent.target.files?.[0] ?? null)}
          />
          {fileField.currentLabel ? <span className="muted">{fileField.currentLabel}</span> : null}
          {fileField.hint ? <span className="muted">{fileField.hint}</span> : null}
        </div>
      ) : null}

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
