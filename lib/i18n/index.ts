import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ar from '@/locales/ar.json';
import { Language, defaultLanguage } from './config';

const translations = {
  en,
  fr,
  ar,
};

export type TranslationKeys = typeof en;

export function getTranslations(lang: Language): TranslationKeys {
  return translations[lang] || translations[defaultLanguage];
}

export * from './config';
export { en, fr, ar };
