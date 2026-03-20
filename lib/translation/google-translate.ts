import { Language } from '@/lib/i18n';

/**
 * Google Translate is disabled — translations are served from the static
 * JSON locale files (locales/en.json, fr.json, ar.json) via LanguageContext.
 */
export async function googleTranslate(
  text: string,
  _targetLang: Language,
  _sourceLang: Language = 'en'
): Promise<string> {
  return text;
}

export async function googleTranslateBatch(
  texts: string[],
  _targetLang: Language,
  _sourceLang: Language = 'en'
): Promise<string[]> {
  return texts;
}

export function clearGoogleTranslateCache() {
  // no-op
}
