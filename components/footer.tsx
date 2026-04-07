'use client';

import React, { useState } from 'react';
import { FaInstagram, FaYoutube, FaLinkedin, FaFacebook } from "react-icons/fa6";
import { Loader2, CheckCircle2, XCircle, Globe } from 'lucide-react';
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
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Alert Dialog */}
      <AlertDialog open={alert.open} onOpenChange={(open) => setAlert((prev) => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-white border-[#DDDDDD] shadow-xl rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${alert.isError ? 'text-[#C13515]' : 'text-[#008A05]'}`}>
              {alert.isError
                ? <XCircle className="w-5 h-5 shrink-0" />
                : <CheckCircle2 className="w-5 h-5 shrink-0" />
              }
              {alert.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#222222]">{alert.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setAlert((prev) => ({ ...prev, open: false }))}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Airbnb Style Footer Wrapper */}
      <footer className="bg-[#F7F7F7] text-[#222222] border-t border-[#DDDDDD]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">

          {/* Main Content Grid (4 Columns like Airbnb) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#DDDDDD]">

            {/* Standard Link Sections */}
            {footerSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h4 className="font-semibold text-sm mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="text-sm text-[#222222] hover:underline transition-all"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* 4th Column: Stay Updated & Contact (Integrated into the grid) */}
            <div>
              <h4 className="font-semibold text-sm mb-4">
                {_t.footer?.stayUpdated || "Stay Updated"}
              </h4>
              <p className="text-sm text-[#222222] mb-3">
                {_t.footer?.subscribeDesc || "Subscribe for the latest premium property listings."}
              </p>
              <div className="flex flex-col gap-2 mb-8">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  placeholder={_t.footer?.enterEmail || "Email address"}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#B0B0B0] bg-white text-sm text-[#222222] placeholder:text-[#717171] focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#155dfc] hover:bg-[#0e59fa] text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    _t.footer?.subscribe || 'Subscribe'
                  )}
                </button>
              </div>

              {/* Minimal Contact Us */}
              <h4 className="font-semibold text-sm mb-4">
                {_t.footer?.contact?.title || "Contact Us"}
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:contact@horohouse.com" className="hover:underline">
                    {_t.footer?.contact?.email || "contact@horohouse.com"}
                  </a>
                </li>
                <li>
                  <span className="text-[#222222]">
                    {_t.footer?.contact?.phone || "+237 695 451 646"}
                  </span>
                </li>
                <li>
                  <span className="text-[#222222]">
                    {_t.footer?.contact?.address || "Awae, Yaoundé, Cameroon"}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Links, Language, Socials */}
          <div className="flex flex-col-reverse lg:flex-row justify-between items-center lg:items-end pt-6 gap-6">

            {/* Left Side: Copyright and Legal Links */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-2 gap-y-1 text-sm text-[#222222]">
              <span>© {new Date().getFullYear()} HoroHouse, Inc.</span>
              <span className="hidden sm:inline">·</span>
              <a href="/terms" className="hover:underline">
                {_t.footer?.termsOfService || "Terms"}
              </a>
              <span className="hidden sm:inline">·</span>
              <a href="/sitemap" className="hover:underline">
                Sitemap
              </a>
              <span className="hidden sm:inline">·</span>
              <a href="/privacy" className="hover:underline">
                {_t.footer?.privacyPolicy || "Privacy"}
              </a>
              <span className="hidden sm:inline">·</span>
              <a href="/cookies" className="hover:underline">
                {_t.footer?.cookiePolicy || "Your Privacy Choices"}
              </a>
            </div>

            {/* Right Side: Localisation and Socials */}
            <div className="flex items-center gap-6 text-[#222222] font-semibold text-sm">
              <div className="flex items-center gap-4 cursor-pointer">
                <div className="flex items-center gap-2 hover:underline">
                  <Globe className="w-5 h-5" />
                  <span>English (US)</span>
                </div>
                <div className="hover:underline">
                  <span>$ USD</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      aria-label={social.label}
                      className="hover:text-black transition-colors"
                    >
                      <Icon className="text-[1.3rem]" />
                    </a>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}