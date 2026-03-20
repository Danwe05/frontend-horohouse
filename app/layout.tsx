import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://horohouse.com"),
  title: {
    default: "HoroHouse - Africa's #1 AI-Powered Real Estate Platform",
    template: "%s | HoroHouse",
  },
  description: "Experience the future of property hunting with HoroHouse, Africa's #1 AI-driven real estate platform. Discover, buy, rent, and sell dream homes and student housing with smart recommendations and verified listings.",
  keywords: ["real estate Africa", "buy property Africa", "rent home Africa", "HoroHouse", "African real estate", "property listings", "student housing", "AI real estate"],
  authors: [{ name: "HoroHouse" }],
  creator: "HoroHouse",
  publisher: "HoroHouse",
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      fr: "/fr",
      ar: "/ar",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["fr_FR", "ar_SA"],
    url: "/",
    title: "HoroHouse - Africa's #1 AI-Powered Real Estate Platform",
    description: "Experience the future of property hunting with HoroHouse, Africa's #1 AI-driven real estate platform. Discover, buy, rent, and sell dream homes and student housing with smart recommendations and verified listings.",
    siteName: "HoroHouse",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HoroHouse - Africa's #1 AI-Powered Real Estate Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HoroHouse - Africa's #1 AI-Powered Real Estate Platform",
    description: "Experience the future of property hunting with HoroHouse, Africa's #1 AI-driven real estate platform. Discover, buy, rent, and sell dream homes and student housing with smart recommendations and verified listings.",
    images: ["/og-image.png"],
    creator: "@HoroHouse",
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
};

import { StudentModeProvider } from '@/contexts/StudentModeContext';

const fontClassNames = `${montserrat.variable} ${geistMono.variable} antialiased`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontClassNames} suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <StudentModeProvider>
                <ChatProviderWrapper>
                  <ConditionalNavbar />
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