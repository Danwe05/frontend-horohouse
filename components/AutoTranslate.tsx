'use client';

import { ReactNode } from 'react';

/**
 * AutoTranslate has been simplified to a passthrough.
 * All translations now come from the static JSON locale files
 * (locales/en.json, fr.json, ar.json) via LanguageContext.t.
 *
 * Usage of <AutoTranslate> / useAutoTranslate() is no longer necessary
 * for UI text — use t.key from useLanguage() instead.
 */

interface AutoTranslateProps {
  children: ReactNode;
  text?: string;
  sourceLang?: 'en' | 'fr' | 'ar';
}

export function AutoTranslate({ children, text }: AutoTranslateProps) {
  return <>{text ?? children}</>;
}

export function useAutoTranslate(text: string, _sourceLang?: string) {
  return { translatedText: text, isTranslating: false };
}
