import { Language } from '@/lib/i18n';

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, Map<Language, string>>();

/**
 * Auto-translate text using browser's built-in translation or fallback API
 */
export async function autoTranslate(
  text: string,
  targetLang: Language,
  sourceLang: Language = 'en'
): Promise<string> {
  // Don't translate if source and target are the same
  if (sourceLang === targetLang) {
    return text;
  }

  // Check cache first
  const cacheKey = `${sourceLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey)?.get(targetLang);
    if (cached) return cached;
  }

  try {
    // Use LibreTranslate (free, open-source translation API)
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: mapLanguageCode(sourceLang),
        target: mapLanguageCode(targetLang),
        format: 'text',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    const translatedText = data.translatedText || text;

    // Cache the result
    if (!translationCache.has(cacheKey)) {
      translationCache.set(cacheKey, new Map());
    }
    translationCache.get(cacheKey)?.set(targetLang, translatedText);

    return translatedText;
  } catch (error) {
    console.error('Auto-translation error:', error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Batch translate multiple texts
 */
export async function autoTranslateBatch(
  texts: string[],
  targetLang: Language,
  sourceLang: Language = 'en'
): Promise<string[]> {
  const promises = texts.map((text) => autoTranslate(text, targetLang, sourceLang));
  return Promise.all(promises);
}

/**
 * Map our language codes to LibreTranslate codes
 */
function mapLanguageCode(lang: Language): string {
  const mapping: Record<Language, string> = {
    en: 'en',
    fr: 'fr',
    ar: 'ar',
  };
  return mapping[lang] || 'en';
}

/**
 * Clear translation cache
 */
export function clearTranslationCache() {
  translationCache.clear();
}

/**
 * Translate HTML content while preserving structure
 */
export async function translateHTML(
  html: string,
  targetLang: Language,
  sourceLang: Language = 'en'
): Promise<string> {
  if (sourceLang === targetLang) return html;

  // Extract text nodes and translate them
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const textNodes: { node: Node; text: string }[] = [];

  // Walk through all text nodes
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text) {
      textNodes.push({ node, text });
    }
  }

  // Translate all text nodes
  const translations = await autoTranslateBatch(
    textNodes.map((n) => n.text),
    targetLang,
    sourceLang
  );

  // Replace text nodes with translations
  textNodes.forEach((item, index) => {
    if (item.node.textContent) {
      item.node.textContent = translations[index];
    }
  });

  return doc.body.innerHTML;
}
