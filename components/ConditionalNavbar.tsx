"use client"

import { usePathname } from "next/navigation";
import Navbar from "./layout/Navbar";

const ConditionalNavbar = () => {
  const pathname = usePathname();

  // Normalize pathname by stripping the locale prefix if present (e.g. /en, /fr, /ar)
  const normalizedPath = pathname?.replace(/^\/[a-zA-Z]{2}(-[a-zA-Z]{2})?(?=\/|$)/, '') || pathname;

  // Hide navbar on auth pages
  const hideNavbar = normalizedPath?.startsWith('/auth/login') ||
    normalizedPath?.startsWith('/auth/register') ||
    normalizedPath?.startsWith('/dashboard') ||
    normalizedPath?.startsWith('/auth/forgot-password') ||
    normalizedPath?.startsWith('/auth/reset-password') ||
    normalizedPath?.startsWith('/onboarding') ||
    normalizedPath === '/auth/login' ||
    normalizedPath === '/auth/register';

  if (hideNavbar) {
    return null;
  }

  return <Navbar />;
};

export default ConditionalNavbar;
