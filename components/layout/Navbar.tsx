'use client';

import Link from 'next/link';
import { HiMenu, HiX } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import {
  User,
  Settings,
  LogOut,
  Bell,
  Heart,
  Home,
  Building,
  BarChart3,
  Plus,
  Search,
  Moon,
  Sun,
  Globe,
  Menu,
  X,
  Building2,
  Hotel,
  Warehouse,
  Store,
  TreePine,
  MapPin,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
import { useRouter } from 'next/navigation';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { apiClient } from '@/lib/api';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import type { Variants } from 'framer-motion';

interface NavbarProps {
  showOnlyWhenAuthenticated?: boolean;
}

export default function Navbar({ showOnlyWhenAuthenticated = false }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t, dir } = useLanguage();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<string | null>(null);

  if (showOnlyWhenAuthenticated && !isAuthenticated) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

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
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

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

  const canAddProperty = !isAuthenticated || user?.role === 'agent' || user?.role === 'admin';

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

  const changeLanguage = (lang: Language) => setLanguage(lang);

  type NavLink = {
    href: string;
    label: string;
    icon: React.ComponentType<any>;
  };

  const getNavLinks = (): NavLink[] => {
    const buyLink: NavLink = { href: '/properties?listingType=sale', label: 'Buy', icon: Building };
    const rentLink: NavLink = { href: '/properties?listingType=rent', label: 'Rent', icon: Building };
    const staysLink: NavLink = { href: '/properties?listingType=short_term', label: 'Stays', icon: Building };
    const agentLink: NavLink = { href: '/agents', label: 'Find an agent', icon: Building };
    const contactLink: NavLink = { href: '/contact', label: 'Contact', icon: Globe };
    const aboutLink: NavLink = { href: '/about', label: 'About Us', icon: Award };
    const homeLink: NavLink = { href: '/', label: 'Home', icon: Home };

    const baseLinks = [homeLink, rentLink, buyLink, staysLink, agentLink, contactLink, aboutLink];

    if (!isAuthenticated) return baseLinks;

    switch (user?.role) {
      case 'admin':
      case 'agent':
        return [homeLink, rentLink, buyLink, staysLink, agentLink, aboutLink, contactLink];
      default:
        return baseLinks;
    }
  };

  const navLinks = getNavLinks();

  const displayName = user?.name || 'User';
  const avatarUrl = user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffdfbf`;

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' as const } },
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, y: -28, scale: 0.97 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0, y: -16, scale: 0.97,
      transition: { duration: 0.2, ease: 'easeIn' as const },
    },
  };

  const suggestionVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.15 + i * 0.06, duration: 0.3, ease: 'easeOut' as const },
    }),
  };

  const quickSuggestions = ['Apartments in Douala', 'Villas for sale', 'Studio rentals', 'Commercial space'];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 w-full flex justify-between h-16 items-center px-4 md:px-6 z-50 transition-all duration-300 ${scrolled ? 'bg-white border-b border-gray-200' : 'bg-white/80 backdrop-blur-lg'
          }`}
      >
        {/* LEFT: Burger (mobile) / Logo (desktop) */}
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-blue-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen
              ? <HiX size={22} className="text-gray-600" />
              : <HiMenu size={22} className="text-gray-600" />
            }
          </button>
          <Link href="/" onClick={() => setActiveLink('/')} className="hidden md:flex">
            <img src="/logoHoroHouseBleueOrdinateur.png" alt="HoroHouse" className="h-10" />
          </Link>
        </div>

        {/* CENTER: Logo (mobile) / Nav links (desktop) */}
        <div className="flex items-center justify-center">
          <Link href="/" onClick={() => setActiveLink('/')} className="md:hidden">
            <img src="/logoHoroHouseBleueOrdinateur.png" alt="HoroHouse" className="h-10 transition-all duration-300" />
          </Link>
          <div className="hidden md:flex items-center space-x-1 text-gray-700 text-sm font-medium">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setActiveLink(link.href)}>
                <div className={`px-4 py-2 rounded-lg hover:text-blue-600 transition-all ${activeLink === link.href ? 'text-blue-600 font-semibold' : ''
                  }`}>
                  {link.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center justify-end gap-2">
          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-gray-100 hover:bg-blue-50 transition-colors"
                aria-label="Change language"
              >
                <img
                  src={languages[language].flag}
                  alt={languages[language].name}
                  className="w-6 h-6 rounded-full object-cover shadow-sm"
                  loading="lazy"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(languages).map(([key, lang]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => changeLanguage(key as Language)}
                  className={language === key ? 'bg-blue-50 font-semibold' : ''}
                >
                  <img src={lang.flag} alt={lang.name} className="mr-2 w-5 h-5 rounded-full object-cover shadow-sm" loading="lazy" />
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Property */}
          {canAddProperty && (
            <div className="relative group">
              <button
                onClick={handleAddProperty}
                className="flex relative items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 md:px-4 py-2 rounded-full transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Property</span>
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                  FREE
                </span>
              </button>
              <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                List your property for free
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>
          )}

          {isAuthenticated ? (
            <>
              {/*
                FIX: Wrap NotificationDropdown in a div with `static` positioning
                and a very high z-index on its own layer. The dropdown panel inside
                NotificationDropdown uses `fixed` positioning so it escapes the
                navbar's stacking context entirely and renders above everything.
              */}
              <div className="relative z-[9999]">
                <NotificationDropdown />
              </div>

              {favoritesCount > 0 && (
                <Link href="/dashboard/favorite">
                  <button className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors">
                    <Heart className="h-4 w-4 text-red-600 fill-red-600" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  </button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-blue-200 hover:ring-blue-300 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-gray-600 text-white font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2" align="end" forceMount>
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg mb-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-gray-600 text-white font-semibold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email || user?.phoneNumber}</p>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {user?.role?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer mb-2">
                    <BarChart3 className="mr-2 h-4 w-4 text-gray-600" /> {t.nav.dashboard}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings?tab=profile')} className="cursor-pointer mb-2">
                    <Settings className="mr-2 h-4 w-4 text-gray-600" /> {t.nav.settings}
                  </DropdownMenuItem>
                  {user?.role === 'agent' && (
                    <DropdownMenuItem onClick={() => router.push('/dashboard/propertyForm')} className="cursor-pointer mb-2">
                      <Plus className="mr-2 h-4 w-4 text-gray-600" /> {t.nav.addProperty}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            !isMobileMenuOpen && (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm transition-colors">
                    {t.nav.signIn}
                  </button>
                </Link>
              </div>
            )
          )}
        </div>
      </nav>

      {/* ── Search Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              key="search-backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              key="search-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl shadow-blue-100/60 border border-blue-100 overflow-hidden">
                <form onSubmit={handleSearch} className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <Search className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.search?.placeholder || 'Search properties, locations…'}
                    className="flex-1 text-base text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                    autoFocus
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    {t.search?.button || 'Search'}
                  </button>
                </form>
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick searches</p>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((s, i) => (
                      <motion.button
                        key={s}
                        custom={i}
                        variants={suggestionVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => {
                          setSearchQuery(s);
                          router.push(`/properties?search=${encodeURIComponent(s)}`);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors"
                      >
                        <Search className="h-3 w-3 opacity-60" />
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="px-5 pb-4 flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 rounded bg-gray-100 text-gray-400 text-xs font-mono">Esc</kbd>
                  <span className="text-xs text-gray-400">to close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile fullscreen menu ────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 transition-all duration-500 ease-out"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm md:hidden bg-white z-40 overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-500 ease-out">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:rotate-90 z-50"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            <div className="relative px-6 pt-8 pb-3">
              {isAuthenticated ? (
                <div className="mt-9">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-blue-500/20 shadow-lg">
                        <AvatarImage src={avatarUrl} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-xl">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 pt-1">
                      <p className="font-bold text-xl text-gray-900 truncate mb-1">{user?.name}</p>
                      <p className="text-sm text-gray-500 truncate mb-2">{user?.email || user?.phoneNumber}</p>
                      <Badge className="w-fit text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        {user?.role?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-10">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
                  <p className="text-gray-500 text-sm">Discover your dream property</p>
                </div>
              )}
            </div>

            <div className="px-4 pb-4">
              <div className="space-y-1">
                {navLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => { setActiveLink(link.href); setIsMobileMenuOpen(false); }}
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="block animate-in fade-in slide-in-from-left-3 duration-400"
                  >
                    <div className={`px-5 py-3 rounded-xl transition-all hover:text-blue-600 duration-300 ${activeLink === link.href ? 'text-blue-600 font-semibold' : 'text-gray-700 font-medium'
                      }`}>
                      <span className="text-[15px]">{link.label}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {isAuthenticated && (
                <div className="mt-4">
                  <button
                    onClick={() => { router.push('/settings'); setIsMobileMenuOpen(false); }}
                    className="w-full px-5 py-3.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 text-left font-medium"
                  >
                    <span className="text-[15px]">{t.nav.settings}</span>
                  </button>
                  <div className="h-px bg-gray-100 my-1 mx-3" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300 text-left font-medium"
                  >
                    <span className="text-[15px]">{t.nav.logout}</span>
                  </button>
                </div>
              )}
            </div>

            {!isAuthenticated && (
              <div className="px-6 pb-6">
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/50 group">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {t.nav.signIn}
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </Link>
              </div>
            )}

            <div className="h-20 bg-gray-50 pointer-events-none" />
          </div>
        </>
      )}
    </>
  );
}