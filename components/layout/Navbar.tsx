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
  Globe
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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 w-full h-16 flex items-center justify-between px-4 md:px-6 z-50 transition-all duration-300 ${
          scrolled
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
              className={`transition-all duration-300 ${
                isMobileMenuOpen ? 'h-10' : 'h-8'
              }`}
            />
          </Link>
        </div>

        {/* Burger menu mobile */}
        <div className="block md:hidden z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
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
                className={`px-4 py-2 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-all ${
                  activeLink === link.href ? 'text-blue-600 bg-blue-50 font-semibold' : ''
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
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            aria-label="Search properties"
          >
            <Search className="h-4 w-4 text-gray-600" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-gray-600" />
            ) : (
              <Sun className="h-4 w-4 text-gray-600" />
            )}
          </button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                aria-label="Change language"
              >
                <span className="text-lg">{languages[language].flag}</span>
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
              <div className="hidden md:block">
                <NotificationDropdown />
              </div>

              {/* Favorites Counter */}
              {favoritesCount > 0 && (
                <Link href="/dashboard/property?favorites=true">
                  <button
                    className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
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
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user?.profilePicture}
                        alt={user?.name || 'User'}
                      />
                      <AvatarFallback className="bg-gray-600 text-white font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2" align="end" forceMount>
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profilePicture} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-gray-600 text-white font-semibold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
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

                  <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer mb-2">
                    <Settings className="mr-2 h-4 w-4 text-gray-600" />
                    {t.nav.settings}
                  </DropdownMenuItem>

                  {user?.role === 'agent' && (
                    <DropdownMenuItem onClick={() => router.push('/properties/new')} className="cursor-pointer mb-2">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
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
            className="fixed inset-0 bg-black/30 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-0 w-full h-screen md:hidden bg-white px-6 py-4 z-40 pt-20 overflow-y-auto">
            {/* User info card for authenticated users */}
            {isAuthenticated && (
              <div className="mb-4 p-3 bg-blue-50 rounded-full border border-blue-200">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.profilePicture} alt={user?.name || 'User'} />
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {user?.email || user?.phoneNumber}
                    </p>
                    <Badge variant="secondary" className="w-fit text-xs mt-1">
                      {user?.role?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setActiveLink(link.href);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div
                      className={`flex items-center gap-3 text-base font-semibold px-4 py-3 rounded-lg transition-colors ${
                        activeLink === link.href
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {IconComponent && <IconComponent className="h-5 w-5" />}
                      <span>{link.label}</span>
                    </div>
                  </Link>
                );
              })}

              {/* Additional auth menu items for mobile */}
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      router.push('/settings');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 text-base font-semibold px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span>{t.nav.settings}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 text-base font-semibold px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t.nav.logout}</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Sign In Button for guests */}
            {!isAuthenticated && (
              <div className="mt-6">
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    {t.nav.signIn}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}