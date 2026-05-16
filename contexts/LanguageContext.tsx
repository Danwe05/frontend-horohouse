'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Language, defaultLanguage, getLanguageDirection, getTranslations, TranslationKeys, languages } from '@/lib/i18n';
import { useCallback } from 'react';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ((key: string) => string) & TranslationKeys;
  dictionary: TranslationKeys;
  dir: 'ltr' | 'rtl';
  translate: (text: string, sourceLang?: Language) => Promise<string>;
  isAutoTranslateEnabled: boolean;
  setAutoTranslateEnabled: (enabled: boolean) => void;
  currency: string;
  setCurrency: (currency: string) => void;
}

export const CURRENCIES = [
  { value: 'XAF', label: 'XAF (FCFA)', symbol: 'FCFA' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: Language;
}

export function LanguageProvider({ children, initialLocale = defaultLanguage }: LanguageProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>(initialLocale);
  const [translations, setTranslations] = useState<TranslationKeys>(getTranslations(initialLocale));
  const [isAutoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [currency, setCurrencyState] = useState<string>('XAF');
  // Tracks whether we've hydrated — prevents server/client mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load language from localStorage if URL has no locale or different?
    // Actually, URL is now the source of truth.
    
    const savedAutoTranslate = localStorage.getItem('autoTranslate');
    if (savedAutoTranslate !== null) {
      setAutoTranslateEnabled(savedAutoTranslate === 'true');
    }

    const savedCurrency = localStorage.getItem('currency');
    if (savedCurrency) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setTranslations(getTranslations(lang));
    localStorage.setItem('language', lang);
    
    // Update document direction and language
    document.documentElement.dir = getLanguageDirection(lang);
    document.documentElement.lang = lang;

    // Redirect to localized URL
    if (pathname) {
      const segments = pathname.split('/');
      // If the first segment is a language code, replace it
      if (languages[segments[1] as Language]) {
        segments[1] = lang;
      } else {
        // Otherwise prepended
        segments.splice(1, 0, lang);
      }
      router.push(segments.join('/') || '/');
    }
  };


  // translate() is a no-op — all translations come from the JSON locale files.
  // Dynamic content (addresses etc.) is displayed as-is from the API.
  const translate = async (text: string, _sourceLang?: Language): Promise<string> => text;

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const setAutoTranslateEnabledWithStorage = (enabled: boolean) => {
    setAutoTranslateEnabled(enabled);
    localStorage.setItem('autoTranslate', enabled.toString());
  };

  const dir = getLanguageDirection(language);

  const getT = useCallback((): ((key: string) => string) & TranslationKeys => {
    const translateFn = (path: string): string => {
      const keys = path.split('.');
      let result: any = translations;
      for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key];
        } else {
          return path; // Return key path if not found
        }
      }
      return typeof result === 'string' ? result : path;
    };

    // Attach all top-level keys to the function for backward compatibility
    return Object.assign(translateFn, translations) as any;
  }, [translations]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: getT(),
    dictionary: translations,
    dir,
    translate,
    isAutoTranslateEnabled,
    setAutoTranslateEnabled: setAutoTranslateEnabledWithStorage,
    currency,
    setCurrency,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
