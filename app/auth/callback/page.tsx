'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Optimize JWT decoding - moved outside component
const decodeJWT = (token: string) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    Array.from(atob(base64))
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};

// Batch localStorage operations
const storeAuthData = (token: string, refreshToken: string, user: any) => {
  const updates = {
    accessToken: token,
    refreshToken: refreshToken,
    user: JSON.stringify(user),
    skipVerification: 'true' // CRITICAL: Skip token verification in AuthContext
  };

  Object.entries(updates).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
};

const AuthCallbackContent = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Memoize search params to avoid unnecessary re-renders
  const authParams = useMemo(() => ({
    token: searchParams.get('token'),
    refreshToken: searchParams.get('refresh'),
    error: searchParams.get('error')
  }), [searchParams]);

  useEffect(() => {
    const handleCallback = async () => {
      const { token, refreshToken, error } = authParams;

      console.log('🔐 Auth Callback - Starting authentication process...');
      console.log('📦 Received params:', {
        hasToken: !!token,
        hasRefresh: !!refreshToken,
        error
      });

      // Early returns for error cases
      if (error) {
        console.error('❌ Authentication error from server:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        setTimeout(() => router.push('/auth/login'), 4000);
        return;
      }

      if (!token || !refreshToken) {
        console.error('❌ Missing tokens:', { token: !!token, refreshToken: !!refreshToken });
        setStatus('error');
        setMessage('Missing authentication tokens');
        setTimeout(() => router.push('/auth/login'), 4000);
        return;
      }

      try {
        console.log('🔍 Decoding JWT token...');
        // Decode token
        const payload = decodeJWT(token);
        console.log('✅ Token decoded successfully:', {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          exp: payload.exp,
          expiresIn: payload.exp ? `${Math.floor((payload.exp * 1000 - Date.now()) / 1000)}s` : 'unknown'
        });

        // Create user object - streamlined
        const userFromToken = {
          id: payload.sub || payload.id || payload.userId,
          email: payload.email,
          phoneNumber: payload.phoneNumber || payload.phone,
          role: payload.role || 'user',
          name: payload.name || payload.email?.split('@')[0] || 'User',
          emailVerified: payload.emailVerified ?? false,
          phoneVerified: payload.phoneVerified ?? false,
          onboardingCompleted: payload.onboardingCompleted ?? false,
          profilePicture: payload.profilePicture || payload.picture,
        };

        console.log('👤 User object created:', userFromToken);

        // CRITICAL: Store auth data with skipVerification flag
        // This tells AuthContext to skip token expiration checks on next mount
        console.log('💾 Storing auth data in localStorage (with skipVerification flag)...');
        storeAuthData(token, refreshToken, userFromToken);
        console.log('✅ Auth data stored successfully');

        // Update auth context - this only sets user state, tokens already stored
        console.log('🔄 Calling login function from AuthContext...');
        login({
          accessToken: token,
          refreshToken: refreshToken,
          user: userFromToken
        });
        console.log('✅ Login function called');

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        console.log('🚀 Redirecting to dashboard...');
        
        // Use window.location.href for immediate redirect
        // This bypasses Next.js router and ensures clean navigation
        setTimeout(() => {
          console.log('➡️ Executing window.location.href = "/dashboard"');
          window.location.href = '/dashboard';
        }, 500);

      } catch (decodeError) {
        console.error('💥 Token decode error:', decodeError);
        setStatus('error');
        setMessage('Invalid authentication token. Please try logging in again.');
        setTimeout(() => router.push('/auth/login'), 4000);
      }
    };

    handleCallback();
  }, [authParams, router, login]);

  // Memoize icon to prevent re-renders
  const icon = useMemo(() => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  }, [status]);

  const statusColor = status === 'loading' ? 'border-blue-200 bg-blue-50' :
    status === 'success' ? 'border-green-200 bg-green-50' :
      'border-red-200 bg-red-50';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className={`w-full max-w-md ${statusColor}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            {icon}
          </div>
          <CardTitle className="text-xl">
            {status === 'loading' ? 'Processing...' : status === 'success' ? 'Success!' : 'Error'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              Please wait while we complete your authentication
            </p>
          )}

          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              You will be redirected to your dashboard shortly
            </p>
          )}

          {status === 'error' && (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                You will be redirected to the login page
              </p>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Go to login now
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Simplified fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
    <Card className="w-full max-w-md border-blue-200 bg-blue-50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <CardTitle className="text-xl">Loading...</CardTitle>
        <CardDescription>Please wait</CardDescription>
      </CardHeader>
    </Card>
  </div>
);

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}