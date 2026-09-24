import { createContext, useContext, type ReactNode } from 'react';

const SettingsValidationContext = createContext<Record<string, string>>({});

export const SettingsValidationProvider = ({
  errors,
  children,
}: {
  errors: Record<string, string>;
  children?: ReactNode;
}) => (
  <SettingsValidationContext.Provider value={errors}>
    {children}
  </SettingsValidationContext.Provider>
);

export const useSettingsFieldError = (fieldPath?: string) => {
  const errors = useContext(SettingsValidationContext);
  return fieldPath ? errors[fieldPath] : undefined;
};
