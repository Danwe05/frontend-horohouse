import { en } from './translations/en';
import { fr } from './translations/fr';
import { ar } from './translations/ar';
import { Language, defaultLanguage } from './config';

const translations = {
  en,
  fr,
  ar,
};

export function getTranslations(lang: Language) {
  return translations[lang] || translations[defaultLanguage];
}

export * from './config';
export { en, fr, ar };
