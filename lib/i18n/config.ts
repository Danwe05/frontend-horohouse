export const languages = {
  en: { name: 'English', flag: '/Flags/uk.jpg', dir: 'ltr' },
  fr: { name: 'Français', flag: '/Flags/fr.jpg', dir: 'ltr' },
  ar: { name: 'العربية', flag: '/Flags/ar.jpg', dir: 'rtl' },
} as const;

export type Language = keyof typeof languages;

export const defaultLanguage: Language = 'en';

export const getLanguageDirection = (lang: Language) => languages[lang].dir;

export const getLocalizedHref = (href: string, lang: Language) => {
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return href;
  const cleanHref = href.startsWith('/') ? href : `/${href}`;
  if (cleanHref === '/') return `/${lang}`;
  // Prevent double prefixing
  for (const l of Object.keys(languages)) {
    if (cleanHref.startsWith(`/${l}/`) || cleanHref === `/${l}`) {
      return cleanHref;
    }
  }
  return `/${lang}${cleanHref}`;
};
