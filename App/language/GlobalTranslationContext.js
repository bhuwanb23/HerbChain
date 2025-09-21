import React, { createContext, useContext, useState, useEffect } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTranslation } from './index';

const GlobalTranslationContext = createContext();

export const GlobalTranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('EN');
  const [translations, setTranslations] = useState(getTranslation('EN'));
  const [isLoading, setIsLoading] = useState(false);

  // Load saved language on app start
  // useEffect(() => {
  //   loadSavedLanguage();
  // }, []);

  // const loadSavedLanguage = async () => {
  //   try {
  //     const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
  //     if (savedLanguage) {
  //       setCurrentLanguage(savedLanguage);
  //       setTranslations(getTranslation(savedLanguage));
  //     }
  //   } catch (error) {
  //     console.log('Error loading saved language:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const changeLanguage = (languageCode) => {
    try {
      setCurrentLanguage(languageCode);
      setTranslations(getTranslation(languageCode));
      // Save language preference
      // await AsyncStorage.setItem('selectedLanguage', languageCode);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const value = {
    currentLanguage,
    translations,
    changeLanguage,
    t: translations, // Shorthand for translations
    isLoading,
  };

  return (
    <GlobalTranslationContext.Provider value={value}>
      {children}
    </GlobalTranslationContext.Provider>
  );
};

export const useGlobalTranslation = () => {
  const context = useContext(GlobalTranslationContext);
  if (!context) {
    throw new Error('useGlobalTranslation must be used within a GlobalTranslationProvider');
  }
  return context;
};
