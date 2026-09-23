import type { ReactNode } from 'react';

const SettingsPanel = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) => (
  <section className="settings-panel">
    <header className="settings-panel__head">
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
    </header>
    <div className="settings-panel__body">{children}</div>
  </section>
);

export default SettingsPanel;
