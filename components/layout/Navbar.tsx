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
  X
} from 'lucide-react';
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

  // Don't show navbar if user is not authenticated and showOnlyWhenAuthenticated is true
  if (showOnlyWhenAuthenticated && !isAuthenticated) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Fetch favorites count using the updated API client
  useEffect(() => {
    const fetchFavoritesCount = async () => {
      if (isAuthenticated && authService.isLoggedIn()) {
        try {
          console.log('🔍 [Navbar] Fetching favorites count...');
          const favorites = await apiClient.getFavorites();
          console.log('✅ [Navbar] Favorites response:', favorites);

          // Handle different response structures
          const count = favorites?.favorites?.length || favorites?.data?.length || favorites?.length || 0;
          setFavoritesCount(count);
        } catch (error: any) {
          console.error('❌ [Navbar] Error fetching favorites count:', error);

          // Don't show error for 401 as the API client will handle token refresh
          if (error.response?.status !== 401) {
            console.error('Failed to fetch favorites:', error.message);
          }
        }
      } else {
        setFavoritesCount(0);
      }
    };

    fetchFavoritesCount();

    // Refresh favorites count every minute
    const interval = setInterval(fetchFavoritesCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Load theme from localStorage
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
      router.push(`/properties?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const getNavLinks = () => {
    // Beta menu with Buy, Rent, Sell options
    const buyLink = { href: '/properties?listingType=sale', label: 'Buy', icon: Building };
    const rentLink = { href: '/properties?listingType=rent', label: 'Rent', icon: Building };
    const sellLink = { href: '/dashboard/propertyForm', label: 'Sell', icon: Building };

    // Base links for all users
    const baseLinks = [
      buyLink,
      rentLink,
    ];

    if (!isAuthenticated) {
      // For non-authenticated users: Buy, Rent, Sell
      return [...baseLinks, sellLink];
    }

    switch (user?.role) {
      case 'admin':
        // For admin: Buy, Rent, Sell + Dashboard
        return [
          ...baseLinks,
          sellLink,
          { href: '/dashboard', label: t.nav.dashboard, icon: BarChart3 },
        ];

      case 'agent':
        // For agents: Buy, Rent, Sell + Dashboard
        return [
          ...baseLinks,
          sellLink,
          { href: '/dashboard', label: t.nav.dashboard, icon: BarChart3 },
        ];

      default: // registered_user
        // For regular users: Buy, Rent, Sell
        return [...baseLinks, sellLink];
    }
  };

  const navLinks = getNavLinks();

  // Get user display info
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || user?.phoneNumber || '';
  const userRole = user?.role || 'user';
  const avatarUrl = user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffdfbf`;


  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 w-full h-16 flex items-center justify-between px-4 md:px-6 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/80 backdrop-blur-lg border-b border-gray-200'
          : 'bg-white/80 backdrop-blur-lg'
          }`}
      >
        {/* Logo mobile - centered */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 block md:hidden z-50">
          <Link href="/" onClick={() => setActiveLink('/')}>
            <img
              src={
                isMobileMenuOpen
                  ? '/logoHoroHouseBleueOrdinateur.png'
                  : '/logoHoroHouseBleueOrdinateur.png'
              }
              alt="HoroHouse"
              className={`transition-all duration-300 ${isMobileMenuOpen ? 'h-10' : 'h-8'
                }`}
            />
          </Link>
        </div>

        {/* Burger menu mobile */}
        <div className="block md:hidden z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors "
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <HiX size={22} className="text-blue-600" />
            ) : (
              <HiMenu size={22} className="text-blue-600" />
            )}
          </button>
        </div>

        {/* Logo desktop */}
        <div className="hidden md:flex items-center">
          <Link href="/" onClick={() => setActiveLink('/')}>
            <img
              src="/logoHoroHouseBleueOrdinateur.png"
              alt="HoroHouse"
              className="h-10"
            />
          </Link>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-1 text-gray-700 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setActiveLink(link.href)}>
              <div
                className={`px-4 py-2 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-all ${activeLink === link.href ? 'text-blue-600 bg-blue-50 font-semibold' : ''
                  }`}
              >
                {link.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Right Side - Auth Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-gray-100 hover:cursor hover:border-blue-500 hover:bg-blue-50 transition-colors"
            aria-label="Search properties"
          >
            <Search className="h-4 w-4 text-blue-600" />
          </button>

          {/* Theme Toggle */}
          {/* <button
            onClick={toggleTheme}
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-gray-100 hover:cursor hover:border-blue-500 hover:bg-blue-50 transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-blue-600" />
            ) : (
              <Sun className="h-4 w-4 text-blue-600" />
            )}
          </button> */}

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-gray-100 hover:cursor hover:border-blue-500 hover:bg-blue-50 transition-colors"
                aria-label="Change language"
              >
                <span className="text-lg text-blue-600">{languages[language].flag}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(languages).map(([key, lang]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => changeLanguage(key as Language)}
                  className={language === key ? 'bg-blue-50 font-semibold' : ''}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="hiddend md:block">
                <NotificationDropdown />
              </div>

              {/* Favorites Counter */}
              {favoritesCount > 0 && (
                <Link href="/dashboard/property?favorites=true">
                  <button
                    className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors "
                    aria-label={`${favoritesCount} favorite properties`}
                  >
                    <Heart className="h-4 w-4 text-red-600 fill-red-600" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  </button>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-blue-200 hover:ring-blue-300 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={avatarUrl}
                        alt={user?.name || 'User'}
                      />
                      <AvatarFallback className="bg-gray-600 text-white font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2" align="end" forceMount>
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg mb-2 ">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-gray-600 text-white font-semibold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user?.email || user?.phoneNumber}
                      </p>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {user?.role?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer mb-2">
                    <BarChart3 className="mr-2 h-4 w-4 text-gray-600" />
                    {t.nav.dashboard}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings?tab=profile')} className="cursor-pointer mb-2">
                    <Settings className="mr-2 h-4 w-4 text-gray-600" />
                    {t.nav.settings}
                  </DropdownMenuItem>

                  {user?.role === 'agent' && (
                    <DropdownMenuItem onClick={() => router.push('/dashboard/propertyForm')} className="cursor-pointer mb-2">
                      <Plus className="mr-2 h-4 w-4 text-gray-600" />
                      {t.nav.addProperty}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            !isMobileMenuOpen && (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
                    {t.nav.signIn}
                  </button>
                </Link>
              </div>
            )
          )}
        </div>
      </nav>

      {/* Search Modal */}
      {isSearchOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search.placeholder}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 hover:cursor rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  autoFocus
                  aria-label={t.search.placeholder}
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
                  disabled={!searchQuery.trim()}
                >
                  {t.search.button}
                </Button>
              </form>
              <div className="mt-3 text-sm text-gray-500">
                <p>{t.search.suggestions}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile menu fullscreen */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 transition-all duration-500 ease-out"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm md:hidden bg-gradient-to-br from-gray-50 to-white z-40 overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-500 ease-out">
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:rotate-90 z-50"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {/* Header Section */}
            <div className="relative px-6 pt-8 pb-3">
              {isAuthenticated ? (
                <div className="mt-9">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-blue-500/20 shadow-lg">
                        <AvatarImage src={avatarUrl} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xl">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 pt-1">
                      <p className="font-bold text-xl text-gray-900 truncate mb-1">{user?.name}</p>
                      <p className="text-sm text-gray-500 truncate mb-2">
                        {user?.email || user?.phoneNumber}
                      </p>
                      <Badge className="w-fit text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-medium">
                        {user?.role?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                    <Menu className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
                  <p className="text-gray-500 text-sm">Discover your dream property</p>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="px-4 pb-4">
              <div className="">
                <div className="space-y-1">
                  {navLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => {
                        setActiveLink(link.href);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{ animationDelay: `${index * 60}ms` }}
                      className="block animate-in fade-in slide-in-from-left-3 duration-400"
                    >
                      <div
                        className={`px-5 py-3 rounded-xl transition-all duration-300 ${activeLink === link.href
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md shadow-blue-500/30 '
                            : 'text-gray-700 hover:bg-gray-50 font-medium'
                          }`}
                      >
                        <span className="text-[15px]">{link.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Additional auth menu items for mobile */}
              {isAuthenticated && (
                <div className="mt-4 ">
                  <button
                    onClick={() => {
                      router.push('/settings');
                      setIsMobileMenuOpen(false);
                    }}
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

            {/* Mobile Sign In Button for guests */}
            {!isAuthenticated && (
              <div className="px-6 pb-6">
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/40 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/50 group">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {t.nav.signIn}
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </Link>
              </div>
            )}

            {/* Bottom Decoration */}
            <div className="h-20 bg-gradient-to-t from-gray-100/50 to-transparent pointer-events-none" />
          </div>
        </>
      )}
    </>
  );
}