'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordPromoSection from '@/components/auth/RightSideForgotPassword';
import { authService } from '@/lib/auth';
import { Loader2, Mail, ArrowLeft, CheckCircle2, ChevronDown } from 'lucide-react';
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

export default function ForgotPassword() {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  const [showLangModal, setShowLangModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const currentLang = languages[language] ?? languages['en'];

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!authService.isValidEmail(value)) return 'Please enter a valid email address';
    return '';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched) setError(validateEmail(value));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async () => {
    setTouched(true);
    const validationError = validateEmail(email);
    if (validationError) { setError(validationError); return; }
    setIsLoading(true);
    setError('');
    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) handleSubmit();
  };

  // ── Success state ──
  if (success) {
    return (
      <div className="min-h-screen flex pt-11 relative">
        {/* Mobile floating */}
        <div className="fixed top-4 right-4 z-50 md:hidden">
          <LangButton onClick={() => setShowLangModal(true)} lang={currentLang} />
        </div>

        <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
          <div className="w-full max-w-md">
            {/* Desktop lang switcher */}
            <div className="hidden md:flex justify-end mb-6">
              <LangButton onClick={() => setShowLangModal(true)} lang={currentLang} />
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Check Your Email</h1>
              <p className="text-gray-600 text-sm mb-2">We've sent a password reset link to:</p>
              <p className="text-blue-600 font-semibold mb-6">{email}</p>
              <p className="text-gray-500 text-xs mb-8">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Back to Sign In
                </button>
                <button
                  onClick={() => { setSuccess(false); setEmail(''); setTouched(false); setError(''); }}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Send Another Email
                </button>
              </div>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <strong>Didn't receive the email?</strong> Check your spam folder or try sending another reset email.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ForgotPasswordPromoSection />
        <LanguageCurrencyModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />
      </div>
    );
  }

  // ── Form state ──
  return (
    <div className="min-h-screen flex pt-11 relative">
      {/* Mobile floating */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <LangButton onClick={() => setShowLangModal(true)} lang={currentLang} />
      </div>

      <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 bg-white mb-10">
        <div className="w-full max-w-md">
          {/* Desktop: top-right of form panel */}
          <div className="hidden md:flex justify-end mb-4">
            <LangButton onClick={() => setShowLangModal(true)} lang={currentLang} />
          </div>

          <button
            onClick={() => router.push('/auth/login')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm mb-8 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-1 -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 md:text-left text-center mb-2">Forgot Password?</h1>
            <p className="text-gray-600 md:text-left text-center text-sm">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-start gap-3" role="alert">
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  ref={emailInputRef}
                  id="email" type="email" autoComplete="email"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyPress}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched && error
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'}`}
                />
              </div>
              {touched && error && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                  <span>•</span> {error}
                </p>
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
              <p className="font-semibold mb-1">What happens next:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You'll receive an email with a reset link</li>
                <li>The link expires in 1 hour</li>
                <li>Click it to set a new password</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${!isLoading
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending Reset Link...
                </span>
              ) : 'Send Reset Link'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordPromoSection />
      <LanguageCurrencyModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />
    </div>
  );
}