import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Heart, 
  Bookmark, 
  User, 
  Bell,
  Menu,
  X 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

const Navigation = () => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [newMatchesCount, setNewMatchesCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch saved searches statistics to show badge
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedSearchesStats();
      
      // Poll every 5 minutes for new matches
      const interval = setInterval(fetchSavedSearchesStats, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchSavedSearchesStats = async () => {
    try {
      const stats = await apiClient.getSavedSearchStatistics();
      setNewMatchesCount(stats.totalNewMatches || 0);
    } catch (error) {
      // Silently fail - not critical
      console.error('Failed to fetch saved searches stats:', error);
    }
  };

  const navigationItems = [
    { 
      href: '/', 
      label: 'Home', 
      icon: Home,
      public: true 
    },
    { 
      href: '/properties', 
      label: 'Search', 
      icon: Search,
      public: true 
    },
    { 
      href: '/favorites', 
      label: 'Favorites', 
      icon: Heart,
      public: false,
      badge: null
    },
    { 
      href: '/saved-searches', 
      label: 'Saved Searches', 
      icon: Bookmark,
      public: false,
      badge: newMatchesCount > 0 ? newMatchesCount : null
    },
  ];

  const filteredItems = navigationItems.filter(item => 
    item.public || isAuthenticated
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              
              {item.badge && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="fixed right-0 top-0 h-full w-64 bg-white shadow-2xl p-6 animate-in slide-in-from-right duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-gray-900">Menu</h3>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-2">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      
                      {item.badge && (
                        <span className="ml-auto flex items-center justify-center px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User Section in Mobile Menu */}
              {isAuthenticated && user && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around px-4 py-2">
          {filteredItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
                
                {item.badge && (
                  <span className="absolute top-0 right-2 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {item.badge > 9 ? '9' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navigation;