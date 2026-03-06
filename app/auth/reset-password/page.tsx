'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ForgotPasswordPromoSection from '@/components/auth/RightSideForgotPassword';
import { authService } from '@/lib/auth';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  // Get token from URL and validate it
  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    
    console.log('🔍 Token from URL:', tokenParam);
    
    if (!tokenParam) {
      console.error('❌ No token found in URL');
      setTokenError('Invalid reset link. Please request a new password reset.');
      setIsValidatingToken(false);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, [searchParams]);

  // Focus password input when token is valid
  useEffect(() => {
    if (isTokenValid && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [isTokenValid]);

  const validateToken = async (tokenToValidate: string) => {
    console.log('🔐 Validating token...', tokenToValidate.substring(0, 10) + '...');
    
    try {
      const result = await authService.validateResetToken(tokenToValidate);
      
      console.log('✅ Token validation result:', result);
      
      if (result.valid) {
        setIsTokenValid(true);
        if (result.email) {
          setEmail(result.email);
        }
        console.log('✅ Token is valid');
      } else {
        console.error('❌ Token is invalid');
        setTokenError('This password reset link is invalid or has expired. Please request a new one.');
        setIsTokenValid(false);
      }
    } catch (err: any) {
      console.error('❌ Token validation error:', err);
      setTokenError(err.message || 'Failed to validate reset link. Please try again.');
      setIsTokenValid(false);
    } finally {
      setIsValidatingToken(false);
    }
  };

  const validatePassword = (value: string) => {
    let errorMsg = '';
    if (!value.trim()) {
      errorMsg = 'Password is required';
    } else if (value.length < 8) {
      errorMsg = 'Password must be at least 8 characters';
    }
    setErrors(prev => ({ ...prev, password: errorMsg }));
    return errorMsg === '';
  };

  const validateConfirmPassword = (value: string) => {
    let errorMsg = '';
    if (!value.trim()) {
      errorMsg = 'Please confirm your password';
    } else if (value !== password) {
      errorMsg = 'Passwords do not match';
    }
    setErrors(prev => ({ ...prev, confirmPassword: errorMsg }));
    return errorMsg === '';
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      validatePassword(value);
    }
    if (touched.confirmPassword && confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
    setError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      validateConfirmPassword(value);
    }
    setError('');
  };

  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'password') {
      validatePassword(password);
    } else {
      validateConfirmPassword(confirmPassword);
    }
  };

  const isFormValid = () => {
    return validatePassword(password) && 
           validateConfirmPassword(confirmPassword) &&
           password === confirmPassword;
  };

  const handleSubmit = async () => {
    setTouched({
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid()) {
      setError('Please fix the errors before submitting');
      return;
    }

    setIsLoading(true);
    setError('');

    console.log('🔄 Submitting password reset...');

    try {
      const result = await authService.resetPassword(token, password);
      console.log('✅ Password reset successful:', result);
      setSuccess(true);
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex pt-11 relative">
        <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
        <ForgotPasswordPromoSection />
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex pt-11 relative">
        <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
          <div className="w-full max-w-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Invalid Reset Link
              </h1>
              
              <p className="text-gray-600 text-sm mb-4">
                {tokenError || 'This password reset link is invalid or has expired.'}
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-3 bg-gray-100 rounded text-left text-xs">
                  <p className="font-semibold mb-1">Debug Info:</p>
                  <p>Token: {token ? token.substring(0, 20) + '...' : 'None'}</p>
                  <p>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/auth/forgot-password')}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Request New Reset Link
                </button>

                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 border-1 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
        <ForgotPasswordPromoSection />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex pt-11 relative">
        <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
          <div className="w-full max-w-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Password Reset Successful!
              </h1>
              
              <p className="text-gray-600 text-sm mb-8">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>

              <button
                onClick={() => router.push('/auth/login')}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Sign In Now
              </button>
            </div>
          </div>
        </div>
        <ForgotPasswordPromoSection />
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex pt-11 relative">
      <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
        <div className="w-full max-w-md">
          <button
            onClick={() => router.push('/auth/login')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm mb-8 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-1 -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 md:text-left text-center mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600 md:text-left text-center text-sm">
              {email ? `For ${email}` : 'Enter your new password below'}
            </p>
          </div>

          {error && (
            <div 
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-start gap-3"
              role="alert"
            >
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  ref={passwordInputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  className={`w-full pl-10 pr-12 py-3 border-1 rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched.password && errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                  <span>•</span> {errors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => handleConfirmPasswordChange(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  onKeyDown={handleKeyPress}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  className={`w-full pl-10 pr-12 py-3 border-1 rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched.confirmPassword && errors.confirmPassword
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                  <span>•</span> {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
              <p className="font-semibold mb-1">Password must:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Be at least 8 characters long</li>
                <li>Match in both fields</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${!isLoading
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-md active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </div>
      </div>

      <ForgotPasswordPromoSection />
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}