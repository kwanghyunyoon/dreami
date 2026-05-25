import React, { createContext, useContext, useState, useEffect } from 'react';
import * as storage from './utils/storage';
import { translations, LANGUAGES } from './i18n';

const LANGUAGE_ORDER = ['en', 'ko', 'es', 'hi'];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en'); // default English

  useEffect(() => {
    storage.getItem('language').then(saved => {
      if (saved) setLang(saved);
    });
  }, []);

  const setLanguage = async (code) => {
    setLang(code);
    await storage.setItem('language', code);
  };

  // backward-compat alias: cycles en→ko→es→hi→en
  const toggleLanguage = async () => {
    const currentIndex = LANGUAGE_ORDER.indexOf(lang);
    const nextIndex = (currentIndex + 1) % LANGUAGE_ORDER.length;
    await setLanguage(LANGUAGE_ORDER[nextIndex]);
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        t: translations[lang],
        setLanguage,
        toggleLanguage,
        languages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
