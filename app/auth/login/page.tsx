'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';
import PromotionSection from '@/components/auth/RightSideSignin';
import { authService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages } from '@/lib/i18n';
import LanguageCurrencyModal from '@/components/layout/LanguageCurrencyModal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GoogleIcon = React.memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M533.5 278.4c0-17.5-1.6-34.3-4.7-50.7H272v95.8h146.9c-6.3 34-25 62.8-53.2 82v68h85.8c50.2-46.3 79-114.4 79-195.1z" fill="#4285F4" />
    <path d="M272 544.3c71.6 0 131.8-23.7 175.7-64.2l-85.8-68c-23.8 16-54.5 25.5-89.9 25.5-69.1 0-127.6-46.7-148.6-109.2H35.1v68.9C79.3 485.5 170.7 544.3 272 544.3z" fill="#34A853" />
    <path d="M123.4 321.3c-10.6-31.7-10.6-65.5 0-97.2V154.9H35.1c-43.1 85.9-43.1 187.9 0 273.8l88.3-68.4z" fill="#FBBC05" />
    <path d="M272 107.6c37 0 70.2 12.7 96.4 37.6l72.2-72.2C403.8 29 343.6 5.3 272 5.3 170.7 5.3 79.3 64.1 35.1 154.9l88.3 68.9c21-62.5 79.5-109.2 148.6-109.2z" fill="#EA4335" />
  </svg>
));
GoogleIcon.displayName = 'GoogleIcon';

// Reusable language trigger button
function LangButton({ onClick, lang, className = '' }: {
  onClick: () => void;
  lang: { flag: string; name: string };
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 bg-white text-gray-700 font-semibold rounded-xl px-3 py-2 text-xs border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm ${className}`}
      aria-label="Select language"
    >
      <img src={lang.flag} alt="" className="w-5 h-5 rounded-full object-cover" loading="lazy" />
      <span>{lang.name}</span>
      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
    </button>
  );
}

function SigninContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login } = useAuth();
  const { language } = useLanguage();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [showLangModal, setShowLangModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({ google: false, facebook: false, apple: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailData, setEmailData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  const currentLang = languages[language] ?? languages['en'];

  const validateField = useCallback((id: string, value: string) => {
    let errorMsg = '';
    if (id === 'email') {
      if (!value.trim()) errorMsg = 'Email is required';
      else if (!EMAIL_REGEX.test(value)) errorMsg = 'Please enter a valid email address';
    } else if (id === 'password') {
      if (!value.trim()) errorMsg = 'Password is required';
      else if (value.length < 8) errorMsg = 'Password must be at least 8 characters';
    }
    setErrors(prev => ({ ...prev, [id]: errorMsg }));
    return errorMsg === '';
  }, []);

  const handleEmailInputChange = useCallback((field: string, value: string) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
    if (touched[field as keyof typeof touched]) validateField(field, value);
    setError('');
  }, [touched, validateField]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, emailData[field as keyof typeof emailData] || '');
  }, [emailData, validateField]);

  const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validateField('email', emailData.email) || !validateField('password', emailData.password)) {
      setError('Please fill in all required fields correctly');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const tokens = await authService.loginWithEmail(emailData.email, emailData.password);
      if (rememberMe) localStorage.setItem('rememberedEmail', emailData.email);
      else localStorage.removeItem('rememberedEmail');
      login(tokens);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }, [emailData, rememberMe, validateField, login, router]);

  const handleSocialLogin = useCallback(async (provider: 'google' | 'facebook' | 'apple') => {
    setSocialLoading(prev => ({ ...prev, [provider]: true }));
    setError('');
    try {
      if (provider === 'google') await authService.loginWithGoogle();
      else throw new Error(`${provider} login is not yet implemented`);
    } catch (error: any) {
      setError(error.message || `${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed`);
      setSocialLoading(prev => ({ ...prev, [provider]: false }));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(searchParams?.get('redirect') || '/');
      return;
    }
    if (searchParams?.get('error') === 'oauth_failed') setError('Google authentication failed. Please try again.');
    emailInputRef.current?.focus();
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) { setEmailData(prev => ({ ...prev, email: savedEmail })); setRememberMe(true); }
  }, [isAuthenticated, router, searchParams]);

  const isAnyLoading = useMemo(() =>
    isLoading || Object.values(socialLoading).some(Boolean),
    [isLoading, socialLoading]
  );

  return (
    <div className="min-h-screen flex pt-11 relative">

      {/* ── Mobile: floating top-right pill ── */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <LangButton onClick={() => setShowLangModal(true)} lang={currentLang} />
      </div>

      {/* ── Left / form panel ── */}
      <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
        <div className="w-full max-w-md">

          {/* ── Desktop: lang switcher top-right of form panel ── */}
          <div className="hidden md:flex justify-end mb-4">
            <LangButton onClick={() => setShowLangModal(true)} lang={currentLang} />
          </div>

          {/* Logo + heading */}
          <div className="mb-8 flex justify-center content-center flex-col items-center">
            <a href="/"><img src="/horohouse.png" alt="HoroHouse" className="h-[130px] w-[130px] mb-2" loading="eager" /></a>
            <h1 className="text-3xl font-bold text-gray-900 md:text-left text-center mb-2">Welcome Back!</h1>
            <p className="text-gray-600 md:text-left text-center text-sm">Sign in to continue to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm" role="alert">{error}</div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm flex gap-3" role="alert">
              <span>✓</span><span>{success}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleEmailLogin} noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  ref={emailInputRef} id="email" type="email" autoComplete="email"
                  value={emailData.email}
                  onChange={e => handleEmailInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="john.doe@example.com" disabled={isAnyLoading}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched.email && errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'}`}
                />
              </div>
              {touched.email && errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">• {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={emailData.password}
                  onChange={e => handleEmailInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password" disabled={isAnyLoading}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched.password && errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">• {errors.password}</p>}
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  disabled={isAnyLoading} className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 font-medium select-none">Remember me</span>
              </label>
              <a href="/auth/forgot-password" className="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:underline">Forgot password?</a>
            </div>

            <button type="submit" disabled={isAnyLoading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm mt-6
                ${!isAnyLoading ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Signing In...</span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/auth/register" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">Sign up</a>
          </p>

          {/* Social */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative bg-white px-4"><p className="text-sm text-gray-500 font-medium">Or continue with</p></div>
            </div>
            <div className="grid lg:grid-cols-3 gap-3">
              {(['google', 'facebook', 'apple'] as const).map(p => (
                <button key={p} type="button" onClick={() => handleSocialLogin(p)} disabled={isAnyLoading}
                  className="flex items-center justify-center gap-2 border border-gray-200 rounded-full px-4 py-3 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold transition-all duration-200 disabled:opacity-50">
                  {socialLoading[p] ? <Loader2 className="w-5 h-5 animate-spin" /> :
                    p === 'google' ? <GoogleIcon /> :
                      p === 'facebook' ? <FaFacebook className="w-5 h-5" color="#1877F2" /> :
                        <FaApple className="w-5 h-5" color="#000" />}
                  <span className="text-sm capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PromotionSection />

      {/* Language/Currency modal */}
      <LanguageCurrencyModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />
    </div>
  );
}

export default function Signin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <SigninContent />
    </Suspense>
  );
}