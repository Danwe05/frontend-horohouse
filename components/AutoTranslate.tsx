'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { autoTranslate } from '@/lib/translation/auto-translate';

interface AutoTranslateProps {
  children: ReactNode;
  text?: string;
  sourceLang?: 'en' | 'fr' | 'ar';
}

/**
 * Component that automatically translates its content
 * Usage: <AutoTranslate>Your text here</AutoTranslate>
 */
export function AutoTranslate({ children, text, sourceLang = 'en' }: AutoTranslateProps) {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);

  const contentToTranslate = text || (typeof children === 'string' ? children : '');

  useEffect(() => {
    if (!contentToTranslate) {
      setTranslatedText('');
      return;
    }

    if (language === sourceLang) {
      setTranslatedText(contentToTranslate);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);

    autoTranslate(contentToTranslate, language, sourceLang)
      .then((translated) => {
        if (isMounted) {
          setTranslatedText(translated);
          setIsTranslating(false);
        }
      })
      .catch((error) => {
        console.error('Translation error:', error);
        if (isMounted) {
          setTranslatedText(contentToTranslate);
          setIsTranslating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [contentToTranslate, language, sourceLang]);

  if (isTranslating && !translatedText) {
    return <span className="opacity-70">{contentToTranslate}</span>;
  }

  return <>{translatedText || children}</>;
}

/**
 * Hook for translating text programmatically
 */
export function useAutoTranslate(text: string, sourceLang: 'en' | 'fr' | 'ar' = 'en') {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string>(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslatedText('');
      return;
    }

    if (language === sourceLang) {
      setTranslatedText(text);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);

    autoTranslate(text, language, sourceLang)
      .then((translated) => {
        if (isMounted) {
          setTranslatedText(translated);
          setIsTranslating(false);
        }
      })
      .catch((error) => {
        console.error('Translation error:', error);
        if (isMounted) {
          setTranslatedText(text);
          setIsTranslating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [text, language, sourceLang]);

  return { translatedText, isTranslating };
}
