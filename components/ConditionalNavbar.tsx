"use client"

import { usePathname } from "next/navigation";
import Navbar from "./layout/Navbar";


const ConditionalNavbar = () => {
  const pathname = usePathname();
  
  // Hide navbar on auth pages
  const hideNavbar = pathname?.startsWith('/auth/login') || 
                     pathname?.startsWith('/auth/register') ||
                     pathname?.startsWith('/dashboard') ||
                     pathname === '/auth/login' ||
                     pathname === '/auth/register';
  
  if (hideNavbar) {
    return null;
  }
  
  return <Navbar />;
};

export default ConditionalNavbar;
