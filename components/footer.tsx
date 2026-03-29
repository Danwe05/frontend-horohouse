'use client';

import React, { useState } from 'react';
import { FaInstagram, FaYoutube, FaLinkedin, FaFacebook } from "react-icons/fa6";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import apiClient from '@/lib/api';

const socialLinks = [
  { icon: FaFacebook, href: "https://facebook.com/horohouse", label: "Facebook" },
  { icon: FaInstagram, href: "https://instagram.com/horohouse", label: "Instagram" },
  { icon: FaYoutube, href: "https://youtube.com/horohouse", label: "YouTube" },
  { icon: FaLinkedin, href: "https://linkedin.com/company/horohouse", label: "LinkedIn" },
];

type AlertState = {
  open: boolean;
  title: string;
  description: string;
  isError: boolean;
};

export default function Footer() {
  const { t, language } = useLanguage();
  const _t = t as any;

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    title: '',
    description: '',
    isError: false,
  });

  const showAlert = (title: string, description: string, isError = false) => {
    setAlert({ open: true, title, description, isError });
  };

  const handleSubscribe = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showAlert('Invalid email', 'Please enter a valid email address.', true);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.subscribeNewsletter(email);
      showAlert('Subscribed!', data.message || 'You are now subscribed to our newsletter.');
      setEmail('');
    } catch (err: any) {
      showAlert(
        'Subscription failed',
        err?.response?.data?.message || 'Something went wrong. Please try again.',
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  const footerSections = [
    {
      title: _t.footer?.sections?.realEstate?.title || "Real Estate",
      links: [
        { text: _t.footer?.sections?.realEstate?.browseAll || "Browse all homes", href: "/properties" },
        { text: _t.footer?.sections?.realEstate?.cameroon || "Cameroon real estate", href: "/properties?country=Cameroon" },
        { text: _t.footer?.sections?.realEstate?.nigeria || "Nigeria real estate", href: "/properties?country=Nigeria" },
        { text: _t.footer?.sections?.realEstate?.ghana || "Ghana real estate", href: "/properties?country=Ghana" },
        { text: _t.footer?.sections?.realEstate?.zambia || "Zambia real estate", href: "/properties?country=Zambia" },
        { text: _t.footer?.sections?.realEstate?.kenya || "Kenya real estate", href: "/properties?country=Kenya" },
        { text: _t.footer?.sections?.realEstate?.southAfrica || "South Africa real estate", href: "/properties?country=South%20Africa" },
      ],
    },
    {
      title: _t.footer?.sections?.rentals?.title || "Rentals",
      links: [
        { text: _t.footer?.sections?.rentals?.buildings || "Rental buildings", href: "/properties?listingType=rent" },
        { text: _t.footer?.sections?.rentals?.garoua || "Garoua for rent", href: "/properties?listingType=rent&city=Garoua" },
        { text: _t.footer?.sections?.rentals?.kribi || "Kribi for rent", href: "/properties?listingType=rent&city=Kribi" },
        { text: _t.footer?.sections?.rentals?.maroua || "Maroua for rent", href: "/properties?listingType=rent&city=Maroua" },
        { text: _t.footer?.sections?.rentals?.lagos || "Lagos for rent", href: "/properties?listingType=rent&city=Lagos" },
        { text: _t.footer?.sections?.rentals?.abuja || "Abuja for rent", href: "/properties?listingType=rent&city=Abuja" },
        { text: _t.footer?.sections?.rentals?.douala || "Douala for rent", href: "/properties?listingType=rent&city=Douala" },
      ],
    },
    {
      title: _t.footer?.sections?.company?.title || "Company",
      links: [
        { text: _t.footer?.sections?.company?.about || "About", href: "/about" },
        { text: _t.footer?.sections?.company?.properties || "Properties", href: "/properties" },
        { text: _t.footer?.sections?.company?.community || "Community", href: "/community" },
        { text: _t.footer?.sections?.company?.blog || "Blog", href: "/blog" },
        { text: _t.footer?.sections?.company?.support || "Customer support", href: "/support" },
        { text: _t.footer?.sections?.company?.terms || "Terms and conditions", href: "/terms" },
        { text: _t.footer?.sections?.company?.privacy || "Privacy policy", href: "/privacy" },
      ],
    },
  ];

  return (
    <div className="py-10 px-6 md:px-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* AlertDialog for subscription feedback */}
      <AlertDialog open={alert.open} onOpenChange={(open) => setAlert((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${alert.isError ? 'text-destructive' : 'text-green-600'}`}>
              {alert.isError
                ? <XCircle className="w-5 h-5 shrink-0" />
                : <CheckCircle2 className="w-5 h-5 shrink-0" />
              }
              {alert.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{alert.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlert((prev) => ({ ...prev, open: false }))}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="bg-blue-900 text-white rounded-3xl shadow-2xl overflow-hidden relative">

        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-800/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-12 md:py-10">

          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

            {/* Logo & Social */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <motion.img
                transition={{ duration: 0.3 }}
                src="/logoHoroHouseWhite.png"
                alt="HoroHouse Logo"
                width={180}
                height={180}
                className="mb-6 brightness-110"
              />
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                {_t.footer?.description || "Your trusted partner for premium real estate across Africa. Building dreams, one property at a time."}
              </p>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href={social.href}
                      aria-label={social.label}
                      whileTap={{ scale: 0.95 }}
                      className="w-11 h-11 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full hover:bg-white hover:text-blue-600 transition-all duration-300"
                    >
                      <Icon className="text-xl" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>

            {/* Footer link sections */}
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (sectionIndex + 1) * 0.1 }}
              >
                <h3 className="font-bold text-lg mb-5 relative inline-block">
                  {section.title}
                  <span className={`absolute -bottom-2 ${language === 'ar' ? 'right-0' : 'left-0'} w-12 h-1 bg-white/50 rounded-full`}></span>
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <motion.li
                      key={linkIndex}
                      whileHover={{ x: language === 'ar' ? -5 : 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <a  
                        href={link.href}
                        className="text-blue-100 hover:text-white text-sm transition-colors duration-300 flex items-center group"
                      >
                        <span className={`w-0 group-hover:w-2 h-0.5 bg-white ${language === 'ar' ? 'ml-0 group-hover:ml-2' : 'mr-0 group-hover:mr-2'} transition-all duration-300 rounded-full`}></span>
                        {link.text}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="border-t border-white/20 pt-10 mb-10"
          >
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-3">
                {_t.footer?.stayUpdated || "Stay Updated"}
              </h3>
              <p className="text-blue-100 mb-6 text-sm">
                {_t.footer?.subscribeDesc || "Subscribe to our newsletter for the latest property listings and exclusive deals."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  placeholder={_t.footer?.enterEmail || "Enter your email"}
                  disabled={isLoading}
                  className="flex-1 px-5 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-start disabled:opacity-60"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="px-8 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 disabled:opacity-60 min-w-[110px] flex items-center justify-center"
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : (_t.footer?.subscribe || 'Subscribe')
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <p className="text-blue-100 text-sm text-center md:text-start" dir="ltr">
              © 2025 - {new Date().getFullYear()} HoroHouse. {_t.footer?.allRightsReserved || "All rights reserved."}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="/privacy" className="text-blue-100 hover:text-white transition-colors">
                {_t.footer?.privacyPolicy || "Privacy Policy"}
              </a>
              <span className="text-blue-300">•</span>
              <a href="/terms" className="text-blue-100 hover:text-white transition-colors">
                {_t.footer?.termsOfService || "Terms of Service"}
              </a>
              <span className="text-blue-300">•</span>
              <a href="/cookies" className="text-blue-100 hover:text-white transition-colors">
                {_t.footer?.cookiePolicy || "Cookie Policy"}
              </a>
            </div>
          </motion.div>

        </div>
      </footer>
    </div>
  );
}