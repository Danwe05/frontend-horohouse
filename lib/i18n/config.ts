export const languages = {
  en: { name: 'English', flag: '🇬🇧', dir: 'ltr' },
  fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
} as const;

export type Language = keyof typeof languages;

export const defaultLanguage: Language = 'en';

export const getLanguageDirection = (lang: Language) => languages[lang].dir;
