'use client';

import { AutoTranslate, useAutoTranslate } from '@/components/AutoTranslate';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TranslationDemo() {
  const { language, setLanguage, isAutoTranslateEnabled, setAutoTranslateEnabled } = useLanguage();
  
  // Example using the hook
  const { translatedText: hookTranslation, isTranslating } = useAutoTranslate(
    'This text is automatically translated using the hook!'
  );

  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            <AutoTranslate>Auto-Translation Demo</AutoTranslate>
          </h1>
          <p className="text-muted-foreground text-lg">
            <AutoTranslate>
              All content on this page is automatically translated when you change the language!
            </AutoTranslate>
          </p>
        </div>

        {/* Language Selector */}
        <Card>
          <CardHeader>
            <CardTitle>
              <AutoTranslate>Language Settings</AutoTranslate>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
              >
                🇬🇧 English
              </Button>
              <Button
                variant={language === 'fr' ? 'default' : 'outline'}
                onClick={() => setLanguage('fr')}
              >
                🇫🇷 Français
              </Button>
              <Button
                variant={language === 'ar' ? 'default' : 'outline'}
                onClick={() => setLanguage('ar')}
              >
                🇸🇦 العربية
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={isAutoTranslateEnabled ? 'default' : 'outline'}
                onClick={() => setAutoTranslateEnabled(!isAutoTranslateEnabled)}
              >
                <AutoTranslate>
                  {isAutoTranslateEnabled ? 'Auto-Translate: ON' : 'Auto-Translate: OFF'}
                </AutoTranslate>
              </Button>
              <Badge variant="secondary">
                <AutoTranslate>Current: {language.toUpperCase()}</AutoTranslate>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Example Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              <AutoTranslate>Property Listing Example</AutoTranslate>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                <AutoTranslate>Beautiful Modern Apartment in Downtown</AutoTranslate>
              </h3>
              <p className="text-muted-foreground">
                <AutoTranslate>
                  This stunning 3-bedroom apartment features modern amenities, spacious living areas, 
                  and breathtaking city views. Located in the heart of downtown, you'll have easy 
                  access to restaurants, shopping, and public transportation.
                </AutoTranslate>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AutoTranslate>Price</AutoTranslate>
                </p>
                <p className="text-2xl font-bold">500,000 XAF</p>
                <p className="text-xs text-muted-foreground">
                  <AutoTranslate>/month</AutoTranslate>
                </p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AutoTranslate>Location</AutoTranslate>
                </p>
                <p className="font-semibold">
                  <AutoTranslate>Downtown Douala</AutoTranslate>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge><AutoTranslate>3 Bedrooms</AutoTranslate></Badge>
              <Badge><AutoTranslate>2 Bathrooms</AutoTranslate></Badge>
              <Badge><AutoTranslate>Parking Available</AutoTranslate></Badge>
              <Badge><AutoTranslate>Pet Friendly</AutoTranslate></Badge>
            </div>
          </CardContent>
        </Card>

        {/* Hook Example */}
        <Card>
          <CardHeader>
            <CardTitle>
              <AutoTranslate>Using the Translation Hook</AutoTranslate>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <AutoTranslate>Translated with useAutoTranslate hook:</AutoTranslate>
              </p>
              <p className="font-semibold">
                {isTranslating ? (
                  <span className="opacity-50">Translating...</span>
                ) : (
                  hookTranslation
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>
              <AutoTranslate>How It Works</AutoTranslate>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              <AutoTranslate>
                1. Click on any language button above to change the language
              </AutoTranslate>
            </p>
            <p>
              <AutoTranslate>
                2. All text wrapped in AutoTranslate components will be automatically translated
              </AutoTranslate>
            </p>
            <p>
              <AutoTranslate>
                3. The translation is cached for better performance
              </AutoTranslate>
            </p>
            <p>
              <AutoTranslate>
                4. You can toggle auto-translation on/off using the button above
              </AutoTranslate>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
