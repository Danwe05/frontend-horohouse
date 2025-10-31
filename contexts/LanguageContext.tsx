'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, defaultLanguage, getLanguageDirection, getTranslations } from '@/lib/i18n';
import type { TranslationKeys } from '@/lib/i18n/translations/en';
import { googleTranslate } from '@/lib/translation/google-translate';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  dir: 'ltr' | 'rtl';
  translate: (text: string, sourceLang?: Language) => Promise<string>;
  isAutoTranslateEnabled: boolean;
  setAutoTranslateEnabled: (enabled: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<TranslationKeys>(getTranslations(defaultLanguage));
  const [isAutoTranslateEnabled, setAutoTranslateEnabled] = useState(true);

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem('language') as Language | null;
    const savedAutoTranslate = localStorage.getItem('autoTranslate');
    
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr' || savedLanguage === 'ar')) {
      setLanguageState(savedLanguage);
      setTranslations(getTranslations(savedLanguage));
      
      // Set document direction
      document.documentElement.dir = getLanguageDirection(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }

    if (savedAutoTranslate !== null) {
      setAutoTranslateEnabled(savedAutoTranslate === 'true');
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

  const translate = async (text: string, sourceLang: Language = 'en'): Promise<string> => {
    if (!isAutoTranslateEnabled || language === sourceLang) {
      return text;
    }
    return googleTranslate(text, language, sourceLang);
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
