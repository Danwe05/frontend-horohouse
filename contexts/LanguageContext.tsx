'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, defaultLanguage, getLanguageDirection, getTranslations, TranslationKeys, languages } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
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
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<TranslationKeys>(getTranslations(defaultLanguage));
  const [isAutoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [currency, setCurrencyState] = useState<string>('XAF');

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem('language') as Language | null;
    const savedAutoTranslate = localStorage.getItem('autoTranslate');
    
    if (savedLanguage && savedLanguage in languages) {
      setLanguageState(savedLanguage);
      setTranslations(getTranslations(savedLanguage));
      
      // Set document direction
      document.documentElement.dir = getLanguageDirection(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }

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

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations,
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
