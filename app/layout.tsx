import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'sonner';
import ConditionalNavbar from "@/components/ConditionalNavbar";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${geistMono.variable} antialiased`}
      >
         <LanguageProvider>
           <AuthProvider>
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
          </AuthProvider>
         </LanguageProvider>
      </body>
    </html>
  );
}
