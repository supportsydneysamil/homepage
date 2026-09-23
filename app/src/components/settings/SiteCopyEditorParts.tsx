import type { ReactNode } from 'react';

export const PageAccordion = ({
  title,
  meta,
  count,
  open,
  children,
}: {
  title: string;
  meta: string;
  count: number;
  open?: boolean;
  children: ReactNode;
}) => (
  <details className="settings-accordion" open={open}>
    <summary>
      <span className="settings-accordion__title">{title}</span>
      <span className="settings-accordion__meta">{meta}</span>
      <span className="settings-count">{count}</span>
    </summary>
    <div className="settings-accordion__body">{children}</div>
  </details>
);

export const CopySection = ({
  title,
  description,
  count,
  open,
  children,
}: {
  title: string;
  description?: string;
  count: number;
  open?: boolean;
  children: ReactNode;
}) => (
  <details className="settings-copy-section" open={open}>
    <summary>
      <span>
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="settings-count">{count}</span>
    </summary>
    <div className="settings-copy-section__body">{children}</div>
  </details>
);

export const FieldGroup = ({
  title,
  fullWidth,
  children,
}: {
  title: string;
  fullWidth?: boolean;
  children: ReactNode;
}) => (
  <section className={fullWidth ? 'settings-field-group settings-field-group--full' : 'settings-field-group'}>
    <h4>{title}</h4>
    <div className="settings-field-group__grid">{children}</div>
  </section>
);
