import { Language } from '@/lib/i18n';

/**
 * Auto-translate is disabled — translations are served from the static
 * JSON locale files (locales/en.json, fr.json, ar.json) via LanguageContext.
 * Dynamic property text (addresses, tags) is returned as-is.
 */
export async function autoTranslate(
  text: string,
  _targetLang: Language,
  _sourceLang: Language = 'en'
): Promise<string> {
  return text;
}

export async function autoTranslateBatch(
  texts: string[],
  _targetLang: Language,
  _sourceLang: Language = 'en'
): Promise<string[]> {
  return texts;
}

export function clearTranslationCache() {
  // no-op
}
