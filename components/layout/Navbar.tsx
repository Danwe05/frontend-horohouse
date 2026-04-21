'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  User,
  Settings,
  LogOut,
  Heart,
  Home,
  Building,
  BarChart3,
  Plus,
  Search,
  Globe,
  Menu,
  X,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages, Language } from '@/lib/i18n';
import LanguageCurrencyModal from '@/components/layout/LanguageCurrencyModal';
import { useRouter } from 'next/navigation';
import { useStudentMode } from '@/contexts/StudentModeContext';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { apiClient } from '@/lib/api';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import type { Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavbarProps {
  showOnlyWhenAuthenticated?: boolean;
}

export default function Navbar({ showOnlyWhenAuthenticated = false }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, t, dir } = useLanguage();
  const _t = t as any;
  const { isStudentMode, toggleStudentMode } = useStudentMode();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLangCurrencyModalOpen, setIsLangCurrencyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen, isSearchOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const fetchFavoritesCount = async () => {
      if (isAuthenticated && authService.isLoggedIn()) {
        try {
          const favorites = await apiClient.getFavorites();
          const count = favorites?.favorites?.length || favorites?.data?.length || favorites?.length || 0;
          setFavoritesCount(count);
        } catch (error: any) {
          if (error.response?.status !== 401) {
            console.error('Failed to fetch favorites:', error.message);
          }
        }
      } else {
        setFavoritesCount(0);
      }
    };
    fetchFavoritesCount();
    const interval = setInterval(fetchFavoritesCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (showOnlyWhenAuthenticated && !mounted && !isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/properties?city=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const canAddProperty = user?.role === 'agent' || user?.role === 'host' || user?.role === 'landlord' || user?.role === 'admin';

  const handleAddProperty = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to add a new property.', {
        description: 'You need an account to list a property.',
        duration: 4000,
      });
      router.push('/auth/login');
      return;
    }
    router.push('/dashboard/propertyForm');
  };

  type NavLink = { href: string; label: string; icon: React.ComponentType<any>; };
  const getNavLinks = (): NavLink[] => {
    const buyLink: NavLink = { href: '/properties?listingType=sale', label: t.nav.buy || 'Buy', icon: Building };
    const rentLink: NavLink = { href: '/properties?listingType=rent', label: t.nav.rent || 'Rent', icon: Building };
    const staysLink: NavLink = { href: '/properties?listingType=short_term', label: _t.navbar?.stays || 'Stays', icon: Building };
    const studentsLink: NavLink = { href: '/students', label: _t.navbar?.students || 'Students', icon: Building };
    const contactLink: NavLink = { href: '/contact', label: t.nav.contact || 'Contact', icon: Globe };
    const aboutLink: NavLink = { href: '/about', label: t.nav.about || 'About Us', icon: Award };
   
    const baseLinks = [rentLink, buyLink, staysLink, studentsLink, contactLink, aboutLink];
    if (!isAuthenticated) return baseLinks;

    switch (user?.role) {
      case 'admin':
      case 'agent':
        return [rentLink, buyLink, staysLink, studentsLink, aboutLink, contactLink];
      default:
        return baseLinks;
    }
  };

  const navLinks = getNavLinks();
  const displayName = user?.name || 'User';
  const avatarUrl = user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=EBEBEB`;

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2 } },
  };

  const quickSuggestions = [
    _t.navbar?.qs1 || 'Apartments in Douala',
    _t.navbar?.qs2 || 'Villas for sale',
    _t.navbar?.qs3 || 'Studio rentals',
    _t.navbar?.qs4 || 'Commercial space'
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 w-full h-[80px] z-50 transition-all duration-300 bg-white",
          scrolled ? "border-b border-[#DDDDDD]" : ""
        )}
      >
        <div className="max-w-[1440px] mx-auto h-full px-6 flex items-center justify-between">

          {/* ── LEFT: Logo & Mobile Menu ── */}
          <div className="flex items-center gap-4 flex-1 lg:flex-none">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} className="text-[#222222]" /> : <Menu size={20} className="text-[#222222]" />}
            </button>
            <Link href="/" onClick={() => setActiveLink('/')} className="flex items-center">
              <img src="/logoHoroHouseBleueOrdinateur.png" alt="HoroHouse" className="h-10 md:h-12 object-contain" />
            </Link>
          </div>

          {/* ── CENTER: Nav Links ── */}
          <div className="hidden lg:flex flex-1 space-x-1  text-gray-700 text-sm font-medium justify-center items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setActiveLink(link.href)}
                className={cn(
                  "transition-colors duration-200",
                  activeLink === link.href
                    ? "text-[#222222] font-semibold tracking-wide"
                    : "text-[#717171] hover:text-[#222222] font-medium"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── RIGHT: Actions & User Capsule ── */}
          <div className="flex-1 lg:flex-none flex items-center justify-end gap-1">

            {/* Student Mode Toggle */}
            {user?.role === 'student' && (
              <button
                onClick={toggleStudentMode}
                className={cn(
                  "hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold transition-all border",
                  isStudentMode
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-[#222222] border-[#DDDDDD] hover:bg-[#F7F7F7]"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", isStudentMode ? "bg-white" : "bg-[#717171]")} />
                {_t.navbar?.campusHub || 'Campus Hub'}
              </button>
            )}

            {/* Add Property */}
            {canAddProperty && (
              <div className="relative group hidden md:block">
                <button
                  onClick={handleAddProperty}
                  className="flex items-center text-[14px] text-white bg-blue-600 font-semibold text-[#222222] hover:bg-blue-700 px-4 py-2.5 rounded-full transition-colors"
                >
                  <span className={cn(language === 'ar' ? 'ml-1' : 'mr-1')}>{t.nav.addProperty || 'List your property'}</span>
                  <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-[#008A05] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    {_t.navbar?.free || 'FREE'}
                  </span>
                </button>
              </div>
            )}

            {/* Language & Currency Trigger */}
            <button
              onClick={() => setIsLangCurrencyModalOpen(true)}
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors"
              aria-label="Language and Currency Preferences"
            >
              <img
                src={languages[language]?.flag || languages['en'].flag}
                alt={languages[language]?.name || 'Language'}
                className="w-5 h-5 rounded-full object-cover"
              />
            </button>

            {mounted && isAuthenticated ? (
              <div className="flex items-center gap-1 ml-1">
                {/* Notifications */}
                <div className="relative z-[9999]">
                  <NotificationDropdown />
                </div>

                {/* Favorites */}
                {favoritesCount > 0 && (
                  <Link href="/dashboard/favorite" className="hidden md:flex relative w-10 h-10 items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors">
                    <Heart className="w-5 h-5 text-[#222222] stroke-[1.5]" />
                    <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-blue-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold border border-white">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  </Link>
                )}

                {/* Airbnb User Menu Capsule */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none ml-2">
                    <div className="flex items-center gap-3 border border-[#DDDDDD] rounded-full p-1.5 pl-3.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-shadow duration-200 bg-white">
                      <Menu className="w-4 h-4 text-[#222222] stroke-[2.5]" />
                      <Avatar className="h-8 w-8 bg-[#717171]">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="text-white font-semibold text-[12px] bg-transparent">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-64 p-2 mt-2 rounded-2xl border-[#DDDDDD] shadow-[0_2px_16px_rgba(0,0,0,0.12)] bg-white"
                  >
                    <div className="px-4 py-3">
                      <p className="font-semibold text-[15px] text-[#222222] truncate">{displayName}</p>
                      <p className="text-[14px] text-[#717171] truncate">{user?.email || user?.phoneNumber}</p>
                      <Badge className="mt-2 bg-[#F7F7F7] text-[#222222] border border-[#DDDDDD] hover:bg-[#EBEBEB] text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        {user?.role?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <DropdownMenuSeparator className="bg-[#DDDDDD] mx-2" />

                    <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer py-3 px-4 text-[14px] text-[#222222] font-medium focus:bg-[#F7F7F7] rounded-xl transition-colors">
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/bookings')} className="cursor-pointer py-3 px-4 text-[14px] text-[#222222] font-medium focus:bg-[#F7F7F7] rounded-xl transition-colors">
                      My Bookings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/favorite')} className="cursor-pointer py-3 px-4 text-[14px] text-[#222222] font-medium focus:bg-[#F7F7F7] rounded-xl transition-colors">
                      My Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/settings?tab=profile')} className="cursor-pointer py-3 px-4 text-[14px] text-[#222222] font-medium focus:bg-[#F7F7F7] rounded-xl transition-colors">
                      Account
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-[#DDDDDD] mx-2" />

                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-3 px-4 text-[14px] text-[#222222] font-medium focus:bg-[#F7F7F7] rounded-xl transition-colors">
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              !isMobileMenuOpen && (
                <div className="flex items-center ml-2">
                  <Link href="/auth/login">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-[14px] font-semibold transition-colors">
                      {t.nav.signIn}
                    </button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>

      </nav>

      {/* ── Modals & Overlays ── */}
      <LanguageCurrencyModal
        isOpen={isLangCurrencyModalOpen}
        onClose={() => setIsLangCurrencyModalOpen(false)}
      />

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 left-0 right-0 md:top-6 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-3xl z-[70] px-0 md:px-4"
            >
              <div className="bg-white md:rounded-3xl shadow-2xl overflow-hidden h-screen md:h-auto flex flex-col">

                {/* Search Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#DDDDDD]">
                  <button onClick={() => setIsSearchOpen(false)} className="md:hidden p-2 -ml-2 rounded-full hover:bg-[#F7F7F7]">
                    <X className="w-5 h-5 text-[#222222]" />
                  </button>
                  <form onSubmit={handleSearch} className="flex-1 flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.search?.placeholder || 'Search destinations'}
                      className="w-full text-[16px] md:text-[18px] text-[#222222] placeholder:text-[#717171] bg-transparent focus:outline-none font-medium"
                      autoFocus
                    />
                  </form>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1.5 rounded-full bg-[#EBEBEB] hover:bg-[#DDDDDD]">
                      <X className="w-3 h-3 text-[#222222]" />
                    </button>
                  )}
                </div>

                {/* Suggestions */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                  <h3 className="text-[14px] font-semibold text-[#222222] mb-4">Suggested searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((s, i) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSearchQuery(s);
                          router.push(`/properties?search=${encodeURIComponent(s)}`);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 rounded-full border border-[#DDDDDD] bg-white hover:border-blue-600 text-[#222222] text-[14px] font-medium transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Search Button */}
                <div className="md:hidden p-4 border-t border-[#DDDDDD] bg-white">
                  <button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim()}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-[16px] disabled:opacity-50"
                  >
                    {t.search?.button || 'Search'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[70] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="p-6 flex flex-col h-full">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <span className="font-bold text-blue-600 text-xl">HoroHouse</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 -mr-2 rounded-full hover:bg-[#F7F7F7] transition-colors"
                  >
                    <X className="h-5 w-5 text-[#222222]" />
                  </button>
                </div>

                {/* Auth Block */}
                {isAuthenticated ? (
                  <div className="mb-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 bg-[#717171]">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="text-white font-semibold text-[16px] bg-transparent">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-[18px] text-[#222222] truncate">{displayName}</p>
                        <p className="text-[14px] text-[#717171] truncate mb-1">{user?.email}</p>
                        <Badge className="bg-[#F7F7F7] text-[#222222] border border-[#DDDDDD] text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {user?.role?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8">
                    <h2 className="text-[26px] font-semibold text-[#222222] mb-2 tracking-tight">{t.nav.welcome || 'Welcome'}</h2>
                    <p className="text-[15px] text-[#717171]">{t.nav.discoverProperty || 'Discover your dream property'}</p>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="flex flex-col gap-1 border-b border-[#DDDDDD] pb-6 mb-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => { setActiveLink(link.href); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "py-3 text-[16px] transition-colors",
                        activeLink === link.href ? "text-[#222222] font-semibold" : "text-[#717171] font-medium hover:text-[#222222]"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Settings / Auth Actions */}
                <div className="flex flex-col gap-1 mb-auto">
                  <button
                    onClick={() => { setIsLangCurrencyModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-between py-3 text-[#717171] hover:text-[#222222] font-medium transition-colors"
                  >
                    <span className="text-[16px]">{_t.navbar?.langAndCurrency || 'Language & Region'}</span>
                    <Globe className="w-5 h-5" />
                  </button>

                  {isAuthenticated ? (
                    <>
                      <button onClick={() => { router.push('/dashboard/settings?tab=profile'); setIsMobileMenuOpen(false); }} className="text-left py-3 text-[16px] text-[#717171] font-medium hover:text-[#222222]">
                        {t.nav.settings}
                      </button>
                      <button onClick={handleLogout} className="text-left py-3 text-[16px] text-[#717171] font-medium hover:text-[#222222]">
                        {t.nav.logout}
                      </button>
                    </>
                  ) : (
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="mt-4">
                      <button className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-[16px]">
                        {t.nav.signIn}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}