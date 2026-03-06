export const languages = {
  en: { name: 'English', flag: '/Flags/uk.jpg', dir: 'ltr' },
  fr: { name: 'Français', flag: '/Flags/fr.jpg', dir: 'ltr' },
  ar: { name: 'العربية', flag: '/Flags/ar.jpg', dir: 'rtl' },
} as const;

export type Language = keyof typeof languages;

export const defaultLanguage: Language = 'en';

export const getLanguageDirection = (lang: Language) => languages[lang].dir;
