'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Loader2, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AddPhoneClient() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const { t, language } = useLanguage();

  const [phone, setPhone] = useState('237');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const isTemp =
        !user.phoneNumber ||
        (user.phoneNumber as string).startsWith('google_') ||
        (user.phoneNumber as string).startsWith('temp_');
      if (!isTemp) router.replace(`/${language}/dashboard`);
    }
  }, [user, router, language]);

  const formattedPhone = '+' + phone.replace(/\D/g, '');

  const handleSave = useCallback(async () => {
    setError('');
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError(t('auth.register.invalidPhone'));
      return;
    }
    setIsLoading(true);
    try {
      await authService.updateMyProfile({ phoneNumber: formattedPhone });
      await refreshAuth();
      router.push(`/${language}/dashboard`);
    } catch (e: any) {
      setError(e.message || 'Failed to save phone number. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [phone, formattedPhone, refreshAuth, router, language, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-900/5 border border-white/60 p-8 md:p-10">
          <div className="flex justify-center mb-6">
            <a href={`/${language}`}>
              <img src="/horohouse.png" alt="HoroHouse" className="h-14 w-14" />
            </a>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('auth.addPhone.title')}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('auth.addPhone.desc')}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.register.phoneNumber')} <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              country="cm"
              value={phone}
              onChange={setPhone}
              disabled={isLoading}
              enableSearch
              searchPlaceholder="Search country..."
              inputProps={{ id: 'phone', name: 'phone', autoComplete: 'tel', autoFocus: true }}
              containerClass="w-full"
              inputStyle={{
                width: '100%',
                height: '52px',
                fontSize: '15px',
                fontWeight: '500',
                borderRadius: '12px',
                border: '1.5px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                color: '#111827',
                paddingLeft: '56px',
              }}
              buttonStyle={{
                borderRadius: '12px 0 0 12px',
                border: '1.5px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                borderRight: 'none',
                paddingLeft: '6px',
              }}
              dropdownStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                maxHeight: '220px',
                zIndex: 9999,
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <>{t('auth.addPhone.verifyBtn')} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <button
              onClick={() => router.push(`/${language}/dashboard`)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
            >
              Skip for now — I'll do this later
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          <Lock className="inline-block w-4 h-4 mr-1" /> Your phone number is encrypted and never shared.
        </p>
      </div>
    </div>
  );
}
