"use client"

import { usePathname } from "next/navigation";
import Footer from "./footer";

const ConditionalFooter = () => {
  const pathname = usePathname();

  // Normalize pathname by stripping the locale prefix if present (e.g. /en, /fr, /ar)
  const normalizedPath = pathname?.replace(/^\/[a-zA-Z]{2}(-[a-zA-Z]{2})?(?=\/|$)/, '') || pathname;

  const hideFooter = normalizedPath?.startsWith('/auth/login') ||
    normalizedPath?.startsWith('/auth/register') ||
    normalizedPath?.startsWith('/dashboard') ||
    normalizedPath?.startsWith('/auth/forgot-password') ||
    normalizedPath?.startsWith('/auth/reset-password') ||
    normalizedPath?.startsWith('/onboarding') ||
    normalizedPath === '/auth/login' ||
    normalizedPath === '/auth/register';

  if (hideFooter) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
