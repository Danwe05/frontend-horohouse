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
  title: "HoroHouse - Find Your Dream Home in Africa",
  description: "Discover, buy, rent, and sell properties across Africa with HoroHouse. AI-powered recommendations, verified listings, and trusted agents.",
};

// Extract only the string values — never pass font objects into JSX
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
              <Analytics />
              <SpeedInsights />
            </ChatProviderWrapper>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}