import { en } from './en';
import { hi } from './hi';
import { te } from './te';
import { ta } from './ta';

export const translations = {
  EN: en,
  हिं: hi,
  తె: te,
  த: ta,
};

export const getTranslation = (languageCode) => {
  return translations[languageCode] || translations.EN;
};
