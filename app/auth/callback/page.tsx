'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';

const AuthCallbackContent = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams?.get('token');
        const refreshToken = searchParams?.get('refresh');
        const error = searchParams?.get('error');

        console.log('Callback received:', { token: !!token, refreshToken: !!refreshToken, error });

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => router.push('/auth/login'), 4000);
          return;
        }

        if (!token || !refreshToken) {
          setStatus('error');
          setMessage('Missing authentication tokens');
          setTimeout(() => router.push('/auth/login'), 4000);
          return;
        }

        // Try to decode the JWT token first to get user info
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const payload = JSON.parse(jsonPayload);
          console.log('Decoded token payload:', payload);
          
          // Create user object from token with all required fields
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

          console.log('User from token:', userFromToken);

          // Store tokens
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(userFromToken));
          
          const authTokens = {
            accessToken: token,
            refreshToken: refreshToken,
            user: userFromToken
          };
          
          // Update auth context
          login(authTokens);
          
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => router.push('/dashboard'), 1500);

        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
          setStatus('error');
          setMessage('Invalid authentication token. Please try logging in again.');
          setTimeout(() => router.push('/auth/login'), 4000);
        }
      } catch (error: any) {
        console.error('Callback handling error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred during authentication');
        setTimeout(() => router.push('/auth/login'), 4000);
      }
    };

    handleCallback();
  }, [searchParams, router, login]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className={`w-full max-w-md ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            {getIcon()}
          </div>
          <CardTitle className="text-xl">
            {status === 'loading' && 'Processing...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
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

const AuthCallbackPage = () => {
  return (
    <Suspense
      fallback={
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
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
};

export default AuthCallbackPage;