'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService, AuthTokens } from '@/lib/auth';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check for stored authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if this is a fresh OAuth login (skip verification)
        const skipVerification = localStorage.getItem('skipVerification');

        if (skipVerification === 'true') {
          console.log('🔐 OAuth callback detected - skipping token verification');
          localStorage.removeItem('skipVerification');

          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsLoading(false);
            return;
          }
        }

        const storedUser = authService.getStoredUser();
        const accessToken = authService.getAccessToken();

        if (storedUser && accessToken) {
          // Check if token is expired first (local check, no API call)
          if (authService.isTokenExpired()) {
            console.log('🔄 Token expired, attempting refresh...');
            const refreshedTokens = await authService.refreshToken();
            if (refreshedTokens) {
              setUser(refreshedTokens.user as User);
            } else {
              await authService.logout();
            }
          } else {
            // Token is valid locally, set user without API verification
            console.log('✅ Token valid, setting user');
            setUser(storedUser);

            // Optionally verify in background (non-blocking)
            authService.verifyToken().then(isValid => {
              if (!isValid) {
                console.warn('⚠️ Background verification failed');
                // Don't logout, just log warning
              }
            }).catch(err => {
              console.warn('⚠️ Background verification error:', err);
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const refreshedTokens = await authService.refreshToken();
        if (refreshedTokens) {
          setUser(refreshedTokens.user as User);
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        await logout();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = (tokens: AuthTokens) => {
    console.log('🔐 AuthContext.login called with user:', tokens.user);
    setUser(tokens.user as User);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      // First, refresh the JWT token so it carries the latest role
      const refreshedTokens = await authService.refreshToken();
      if (refreshedTokens) {
        setUser(refreshedTokens.user as User);
        return;
      }

      // Fallback: just re-fetch the profile for the UI state
      const profile = await authService.getProfile();
      if (profile) {
        setUser(profile);
        // Also update localStorage so the stored user is current
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(profile));
        }
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/auth/login'
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook for role-based access control
export function useRequireRole(requiredRoles: string[]) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && !requiredRoles.includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user, isAuthenticated, requiredRoles, router]);

  return {
    hasAccess: isAuthenticated && user && requiredRoles.includes(user.role),
    user,
    isAuthenticated,
  };
}