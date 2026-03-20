"use client"

import { usePathname } from "next/navigation";
import Footer from "./footer";

const ConditionalFooter = () => {
  const pathname = usePathname();

  const hideFooter = pathname?.startsWith('/auth/login') ||
    pathname?.startsWith('/auth/register') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/auth/forgot-password') ||
    pathname?.startsWith('/auth/reset-password') ||
    pathname?.startsWith('/onboarding') ||
    pathname === '/auth/login' ||
    pathname === '/auth/register';

  if (hideFooter) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
