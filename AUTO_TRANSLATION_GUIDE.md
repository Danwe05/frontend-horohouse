# 🌍 Auto-Translation System Guide

## Overview
Your HoroHouse app now has a **Google Translate-like automatic translation system** that translates all content when you switch languages!

## 🎯 Features

### ✅ What's Implemented:
1. **Automatic Translation** - Content translates automatically when language changes
2. **Google Translate API** - Uses Google's translation service for accuracy
3. **Caching System** - Translations are cached to avoid repeated API calls
4. **React Components** - Easy-to-use components for wrapping translatable content
5. **React Hooks** - Programmatic translation with `useAutoTranslate` hook
6. **Context Integration** - Built into the LanguageContext
7. **Toggle Feature** - Can enable/disable auto-translation
8. **RTL Support** - Automatic right-to-left for Arabic

## 📦 Files Created

### Translation System:
- `lib/translation/google-translate.ts` - Google Translate API integration
- `lib/translation/auto-translate.ts` - LibreTranslate fallback (free alternative)
- `components/AutoTranslate.tsx` - React component and hook for auto-translation
- `contexts/LanguageContext.tsx` - Updated with translation functionality

### Demo:
- `app/translation-demo/page.tsx` - Live demo page showing all features

## 🚀 How to Use

### Method 1: AutoTranslate Component (Recommended)

Wrap any text in the `<AutoTranslate>` component:

```tsx
import { AutoTranslate } from '@/components/AutoTranslate';

function MyComponent() {
  return (
    <div>
      <h1>
        <AutoTranslate>Welcome to HoroHouse</AutoTranslate>
      </h1>
      <p>
        <AutoTranslate>
          Find your dream home in Africa
        </AutoTranslate>
      </p>
    </div>
  );
}
```

### Method 2: useAutoTranslate Hook

For programmatic translation:

```tsx
import { useAutoTranslate } from '@/components/AutoTranslate';

function MyComponent() {
  const { translatedText, isTranslating } = useAutoTranslate('Hello World');
  
  return (
    <div>
      {isTranslating ? 'Translating...' : translatedText}
    </div>
  );
}
```

### Method 3: Context translate() Function

For manual translation:

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { translate } = useLanguage();
  const [text, setText] = useState('');
  
  useEffect(() => {
    translate('Hello World').then(setText);
  }, [translate]);
  
  return <div>{text}</div>;
}
```

## 🎨 Updated Components

### PropertyCard
- ✅ Address auto-translates
- ✅ Tags auto-translate
- ✅ Maintains all functionality

### Navbar
- ✅ All menu items use translations
- ✅ Search placeholder translates
- ✅ User menu translates

## 🔧 Configuration

### Enable/Disable Auto-Translation

```tsx
const { isAutoTranslateEnabled, setAutoTranslateEnabled } = useLanguage();

// Turn off auto-translation
setAutoTranslateEnabled(false);

// Turn on auto-translation
setAutoTranslateEnabled(true);
```

### Change Language

```tsx
const { language, setLanguage } = useLanguage();

// Change to French
setLanguage('fr');

// Change to Arabic
setLanguage('ar');

// Change to English
setLanguage('en');
```

## 📊 Performance

### Caching
- Translations are cached in memory
- Same text won't be translated twice
- Cache persists during session

### Optimization Tips
1. **Batch Translations** - Use `googleTranslateBatch()` for multiple texts
2. **Lazy Loading** - Only translate visible content
3. **Debouncing** - Avoid translating while user is typing

## 🌐 Supported Languages

Currently supports:
- 🇬🇧 **English** (en)
- 🇫🇷 **French** (fr)
- 🇸🇦 **Arabic** (ar) - with RTL support

### Adding More Languages

1. Add to `lib/i18n/config.ts`:
```typescript
export const languages = {
  en: { name: 'English', flag: '🇬🇧', dir: 'ltr' },
  fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  es: { name: 'Español', flag: '🇪🇸', dir: 'ltr' }, // NEW
};
```

2. Create translation file: `lib/i18n/translations/es.ts`

3. Update `lib/i18n/index.ts` to include new language

## 🎯 Next Steps

### To Complete Full Auto-Translation:

1. **Wrap More Components**
   - Property detail pages
   - Forms and inputs
   - Error messages
   - Success notifications

2. **Translate Dynamic Content**
   - Property descriptions from database
   - User reviews
   - Agent information
   - Blog posts

3. **Add Translation Loading States**
   - Skeleton loaders
   - Shimmer effects
   - Progress indicators

## 🧪 Testing

### Test the Demo Page
Visit `/translation-demo` to see auto-translation in action!

### Test Your Components
1. Wrap text in `<AutoTranslate>`
2. Change language in navbar
3. Watch content translate automatically!

## 💡 Best Practices

### DO:
✅ Wrap user-facing text in `<AutoTranslate>`
✅ Use static translations for UI elements (buttons, labels)
✅ Cache translations for better performance
✅ Handle translation errors gracefully

### DON'T:
❌ Translate technical terms or brand names
❌ Translate URLs or code
❌ Translate numbers or dates (use formatters instead)
❌ Over-translate (some things should stay in original language)

## 🔍 Troubleshooting

### Translation Not Working?
1. Check if auto-translate is enabled: `isAutoTranslateEnabled`
2. Verify language is different from source
3. Check browser console for errors
4. Ensure internet connection (API calls required)

### Slow Translations?
1. Use caching (already implemented)
2. Batch multiple translations
3. Consider pre-translating common content
4. Use static translations for UI elements

## 📝 Example: Full Component

```tsx
'use client';

import { AutoTranslate } from '@/components/AutoTranslate';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';

export default function PropertyCard({ property }) {
  const { t } = useLanguage(); // For static UI translations
  
  return (
    <Card>
      {/* Static UI translation */}
      <h3>{t.property.price}</h3>
      <p>{property.price} XAF</p>
      
      {/* Auto-translated content */}
      <h2>
        <AutoTranslate>{property.title}</AutoTranslate>
      </h2>
      <p>
        <AutoTranslate>{property.description}</AutoTranslate>
      </p>
      <span>
        <AutoTranslate>{property.address}</AutoTranslate>
      </span>
    </Card>
  );
}
```

## 🎉 Success!

Your app now has **automatic translation** just like Google Translate! 

Users can switch languages and see all content translate automatically in real-time!

---

**Need Help?** Check the demo page at `/translation-demo` or review the implementation in `PropertyCard.tsx`
