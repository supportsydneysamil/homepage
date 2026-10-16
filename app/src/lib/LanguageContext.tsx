import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isCrawler, pickInitialLanguage, type Lang } from './language';

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const browserLanguages = (): readonly string[] => {
  const { languages, language } = window.navigator;
  if (languages && languages.length) return languages;
  return language ? [language] : [];
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('ko');

  useEffect(() => {
    setLangState(
      pickInitialLanguage(
        window.localStorage.getItem('lang'),
        isCrawler(window.navigator.userAgent) ? [] : browserLanguages()
      )
    );
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', next);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ko' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};
