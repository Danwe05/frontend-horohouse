'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ForgotPasswordPromoSection from '@/components/auth/RightSideForgotPassword';
import { authService } from '@/lib/auth';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, AlertCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages } from '@/lib/i18n';
import LanguageCurrencyModal from '@/components/layout/LanguageCurrencyModal';

function LangButton({ onClick, lang }: { onClick: () => void; lang: { flag: string; name: string } }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-white text-gray-700 font-semibold rounded-xl px-3 py-2 text-xs border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm"
      aria-label="Select language"
    >
      <img src={lang.flag} alt="" className="w-5 h-5 rounded-full object-cover" loading="lazy" />
      <span>{lang.name}</span>
      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
    </button>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();

  const [showLangModal, setShowLangModal] = useState(false);
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
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  const currentLang = languages[language] ?? languages['en'];

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (!tokenParam) {
      setTokenError(t('auth.resetPassword.invalidLink'));
      setIsValidatingToken(false);
      return;
    }
    setToken(tokenParam);
    validateToken(tokenParam);
  }, [searchParams, t]);

  useEffect(() => {
    if (isTokenValid) passwordInputRef.current?.focus();
  }, [isTokenValid]);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const result = await authService.validateResetToken(tokenToValidate);
      if (result.valid) {
        setIsTokenValid(true);
        if (result.email) setEmail(result.email);
      } else {
        setTokenError(t('auth.resetPassword.invalidLink'));
      }
    } catch (err: any) {
      setTokenError(err.message || t('auth.resetPassword.invalidLink'));
    } finally {
      setIsValidatingToken(false);
    }
  };

  const validatePassword = (value: string) => {
    let errorMsg = '';
    if (!value.trim()) errorMsg = t('auth.login.requiredPassword');
    else if (value.length < 8) errorMsg = t('auth.login.shortPassword');
    setErrors(prev => ({ ...prev, password: errorMsg }));
    return errorMsg === '';
  };

  const validateConfirmPassword = (value: string) => {
    let errorMsg = '';
    if (!value.trim()) errorMsg = t('auth.login.requiredPassword');
    else if (value !== password) errorMsg = t('auth.resetPassword.pwdMismatch');
    setErrors(prev => ({ ...prev, confirmPassword: errorMsg }));
    return errorMsg === '';
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) validatePassword(value);
    if (touched.confirmPassword && confirmPassword) validateConfirmPassword(confirmPassword);
    setError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) validateConfirmPassword(value);
    setError('');
  };

  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'password') validatePassword(password);
    else validateConfirmPassword(confirmPassword);
  };

  const handleSubmit = async () => {
    setTouched({ password: true, confirmPassword: true });
    const valid = validatePassword(password) && validateConfirmPassword(confirmPassword) && password === confirmPassword;
    if (!valid) { setError(t('auth.login.fillRequired')); return; }
    setIsLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || t('auth.resetPassword.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) handleSubmit();
  };

  const langMobile = (
    <div className="fixed top-4 right-4 z-50 md:hidden">
      <LangButton onClick={() => setShowLangModal(true)} lang={currentLang} />
    </div>
  );
  const langDesktop = (
    <div className="hidden md:flex justify-end mb-4">
      <LangButton onClick={() => setShowLangModal(true)} lang={currentLang} />
    </div>
  );

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex pt-11 relative">
        {langMobile}
        <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white">
          <div className="w-full max-w-md">
            {langDesktop}
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            </div>
          </div>
        </div>
        <ForgotPasswordPromoSection />
        <LanguageCurrencyModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex pt-11 relative">
        {langMobile}
        <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
          <div className="w-full max-w-md">
            {langDesktop}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('auth.resetPassword.invalidLink')}</h1>
              <p className="text-gray-600 text-sm mb-4">{tokenError}</p>
              <div className="space-y-3">
                <button onClick={() => router.push(`/${language}/auth/forgot-password`)}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  Request New Reset Link
                </button>
              </div>
            </div>
          </div>
        </div>
        <ForgotPasswordPromoSection />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex pt-11 relative">
        {langMobile}
        <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
          <div className="w-full max-w-md">
            {langDesktop}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('auth.resetPassword.resetSuccess')}</h1>
              <button onClick={() => router.push(`/${language}/auth/login`)}
                className="mt-4 w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                {t('auth.login.signIn')}
              </button>
            </div>
          </div>
        </div>
        <ForgotPasswordPromoSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex pt-11 relative">
      {langMobile}
      <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
        <div className="w-full max-w-md">
          {langDesktop}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 md:text-left text-center mb-2">{t('auth.resetPassword.title')}</h1>
            <p className="text-gray-600 md:text-left text-center text-sm">{t('auth.resetPassword.desc')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-start gap-3" role="alert">
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.resetPassword.newPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input ref={passwordInputRef} id="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur('password')} onKeyDown={handleKeyPress}
                  placeholder="Enter new password" disabled={isLoading}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched.password && errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert"><span>•</span> {errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.resetPassword.confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password" value={confirmPassword}
                  onChange={e => handleConfirmPasswordChange(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')} onKeyDown={handleKeyPress}
                  placeholder="Confirm new password" disabled={isLoading}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched.confirmPassword && errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'}`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert"><span>•</span> {errors.confirmPassword}</p>
              )}
            </div>

            <button type="button" onClick={handleSubmit} disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${!isLoading ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />{t('auth.resetPassword.resetting')}</span>
              ) : t('auth.resetPassword.resetPasswordBtn')}
            </button>
          </div>
        </div>
      </div>

      <ForgotPasswordPromoSection />
      <LanguageCurrencyModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />
    </div>
  );
}

export default function ResetPasswordClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
