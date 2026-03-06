import { Language } from '@/lib/i18n';

// Translation cache
const cache = new Map<string, string>();

/**
 * Translate using Google Translate (client-side)
 * This uses the unofficial Google Translate API
 */
export async function googleTranslate(
  text: string,
  targetLang: Language,
  sourceLang: Language = 'en'
): Promise<string> {
  if (sourceLang === targetLang || !text.trim()) {
    return text;
  }

  const cacheKey = `${sourceLang}-${targetLang}-${text}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    // Using Google Translate's public endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Parse the response
    let translatedText = '';
    if (data && data[0]) {
      translatedText = data[0].map((item: any) => item[0]).join('');
    }
    
    if (translatedText) {
      cache.set(cacheKey, translatedText);
      return translatedText;
    }
    
    return text;
  } catch (error) {
    console.error('Google Translate error:', error);
    return text;
  }
}

/**
 * Batch translate multiple texts
 */
export async function googleTranslateBatch(
  texts: string[],
  targetLang: Language,
  sourceLang: Language = 'en'
): Promise<string[]> {
  const promises = texts.map((text) => googleTranslate(text, targetLang, sourceLang));
  return Promise.all(promises);
}

/**
 * Clear cache
 */
export function clearGoogleTranslateCache() {
  cache.clear();
}
