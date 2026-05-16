import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProviderWrapper } from '@/contexts/ChatProviderWrapper';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'sonner';
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/next";
import ConditionalFooter from "@/components/ConditionalFooter";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.horohouse.com";

const TITLE = "HoroHouse — Find Your Perfect Home in Africa";
const DESCRIPTION =
  "HoroHouse is Africa's leading real estate platform — starting in Cameroon and expanding across the continent. Browse thousands of verified homes, apartments, land, and student housing to buy or rent. Get AI-powered recommendations, connect directly with trusted agents, and find your perfect place from Douala to Lagos, Nairobi to Johannesburg.";

import { headers } from 'next/headers';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const headersList = await headers();
  const normalizedPath = headersList.get('x-pathname') || '/';
  const pathSuffix = normalizedPath === '/' ? '' : normalizedPath;

  return {
    metadataBase: new URL("https://www.horohouse.com"),

    title: {
      default: TITLE,
      template: "%s | HoroHouse",
    },

    description: DESCRIPTION,

    keywords: [
      // Brand
      "HoroHouse",
      "Horo House real estate",
      "HoroHouse Cameroon",
      "HoroHouse Africa",

      // Cameroon — seed market
      "real estate Cameroon",
      "property for sale Cameroon",
      "apartment for rent Cameroon",
      "houses for rent Douala",
      "property Yaoundé",
      "buy land Cameroon",
      "student housing Cameroon",
      "immobilier Cameroun",
      "maison à louer Douala",
      "appartement Yaoundé",

      // West Africa
      "real estate Nigeria",
      "property for sale Lagos",
      "apartments Abuja",
      "houses for rent Accra",
      "property Ghana",
      "real estate Ivory Coast",
      "immobilier Côte d'Ivoire",
      "property Senegal",
      "houses Dakar",

      // East Africa
      "real estate Kenya",
      "property Nairobi",
      "apartments for rent Mombasa",
      "real estate Tanzania",
      "property Uganda",

      // Central Africa
      "real estate DRC",
      "property Kinshasa",
      "immobilier Congo",

      // North Africa
      "real estate Morocco",
      "property Casablanca",
      "real estate Egypt",
      "apartments Cairo",

      // Southern Africa
      "real estate South Africa",
      "property Johannesburg",
      "apartments Cape Town",
      "real estate Zimbabwe",

      // Intent-based
      "buy property Africa",
      "rent home Africa",
      "list property Africa",
      "affordable housing Africa",
      "student accommodation Africa",
      "AI real estate Africa",
      "verified property listings Africa",
      "real estate agent Africa",
      "find home Africa",
      "property investment Africa",
    ],

    authors: [{ name: "HoroHouse", url: APP_URL }],
    creator: "HoroHouse",
    publisher: "HoroHouse",

    alternates: {
      canonical: `https://www.horohouse.com/${locale}${pathSuffix}`,
      languages: {
        en: `/en${pathSuffix}`,
        fr: `/fr${pathSuffix}`,
        ar: `/ar${pathSuffix}`,
      },
    },

    category: "Real Estate",

    openGraph: {
      type: "website",
      locale: locale === 'fr' ? 'fr_FR' : locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: ["en_US", "fr_FR", "ar_SA"].filter(l => !l.startsWith(locale)),
      url: `/${locale}${pathSuffix}`,
      siteName: "HoroHouse",
      title: TITLE,
      description: DESCRIPTION,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "HoroHouse — Find Your Perfect Home in Africa",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      site: "@HoroHouse",
      creator: "@HoroHouse",
      title: TITLE,
      description: DESCRIPTION,
      images: ["/og-image.png"],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    verification: {
      google: "googlef7b1bbfb44def362",
    },
  };
}

import { StudentModeProvider } from '@/contexts/StudentModeContext';
import GoogleAnalytics from "@/components/GoogleAnalytics";

import { Language, getLanguageDirection } from '@/lib/i18n';

const fontClassNames = `${montserrat.variable} ${geistMono.variable} antialiased`;

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const lang = (locale as Language) || 'en';
  const direction = getLanguageDirection(lang);

  return (
    <html lang={lang} dir={direction} suppressHydrationWarning>
      <body className={fontClassNames} suppressHydrationWarning>
        <LanguageProvider initialLocale={lang}>

          <AuthProvider>
            <StudentModeProvider>
              <ChatProviderWrapper>
                <ConditionalNavbar />
                <GoogleAnalytics />
                {children}
                <Toaster
                  position="top-right"
                  expand={false}
                  richColors
                  closeButton
                  toastOptions={{
                    duration: 3000,
                  }}
                />
                <ConditionalFooter />
                <Analytics />
                <SpeedInsights />
              </ChatProviderWrapper>
            </StudentModeProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}