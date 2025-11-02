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

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => router.push('/auth/login'), 4000);
          return;
        }

        if (token && refreshToken) {
          // Store tokens
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Get user profile from backend
          const profile = await authService.getProfile();
          
          if (profile) {
            const authTokens = {
              accessToken: token,
              refreshToken: refreshToken,
              user: profile
            };
            
            // Update auth context
            login(authTokens);
            
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            setStatus('error');
            setMessage('Failed to retrieve user profile');
            setTimeout(() => router.push('/auth/login'), 4000);
          }
        } else {
          setStatus('error');
          setMessage('Invalid callback parameters');
          setTimeout(() => router.push('/auth/login'), 4000);
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication');
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
            <p className="text-sm text-muted-foreground">
              You will be redirected to the login page
            </p>
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