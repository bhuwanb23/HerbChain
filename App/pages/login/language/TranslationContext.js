import React, { createContext, useContext, useState } from 'react';
import { getTranslation } from './index';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('EN');
  const [translations, setTranslations] = useState(getTranslation('EN'));

  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
    setTranslations(getTranslation(languageCode));
  };

  const value = {
    currentLanguage,
    translations,
    changeLanguage,
    t: translations, // Shorthand for translations
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
