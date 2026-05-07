'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Loader2, ArrowRight, ShieldCheck, ChevronLeft, CheckCircle, Lock } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'phone' | 'otp' | 'done';

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    disabled: boolean;
}) {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const digits = value.padEnd(6, '').split('').slice(0, 6);

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const next = digits.map((d, idx) => (idx === i ? '' : d));
            onChange(next.join(''));
            if (i > 0) inputs.current[i - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && i > 0) {
            inputs.current[i - 1]?.focus();
        } else if (e.key === 'ArrowRight' && i < 5) {
            inputs.current[i + 1]?.focus();
        }
    };

    const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        if (!raw) return;
        // Allow pasting full code
        if (raw.length > 1) {
            const pasted = raw.slice(0, 6).padEnd(6, '');
            onChange(pasted);
            inputs.current[Math.min(raw.length - 1, 5)]?.focus();
            return;
        }
        const next = digits.map((d, idx) => (idx === i ? raw[0] : d));
        onChange(next.join(''));
        if (i < 5) inputs.current[i + 1]?.focus();
    };

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[i] || ''}
                    onChange={e => handleChange(i, e)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    disabled={disabled}
                    className={`
            w-12 h-14 text-center text-xl font-bold rounded-xl border-2
            focus:outline-none transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            ${digits[i]
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-800 focus:border-blue-400 focus:bg-blue-50/30'
                        }
          `}
                />
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddPhonePage() {
    const router = useRouter();
    const { user, refreshAuth } = useAuth();

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('237');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Redirect if phone is already real
    useEffect(() => {
        if (user) {
            const isTemp =
                !user.phoneNumber ||
                (user.phoneNumber as string).startsWith('google_') ||
                (user.phoneNumber as string).startsWith('temp_');
            if (!isTemp) router.replace('/dashboard');
        }
    }, [user, router]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const formattedPhone = '+' + phone.replace(/\D/g, '');

    const handleSendCode = useCallback(async () => {
        setError('');
        const clean = phone.replace(/\D/g, '');
        if (clean.length < 10) {
            setError('Please enter a valid phone number.');
            return;
        }
        setIsLoading(true);
        try {
            await authService.sendPhoneCode(formattedPhone);
            setStep('otp');
            setResendCooldown(60);
        } catch (e: any) {
            setError(e.message || 'Failed to send code. Try again.');
        } finally {
            setIsLoading(false);
        }
    }, [phone, formattedPhone]);

    const handleVerify = useCallback(async () => {
        if (otp.replace(/\D/g, '').length < 6) {
            setError('Please enter the 6-digit code.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            // 1. Verify the code with auth service
            await authService.verifyPhoneCode(formattedPhone, otp);
            // 2. Update the user's profile with the real phone number
            await authService.updateMyProfile({ phoneNumber: formattedPhone });
            // 3. Refresh auth context so user object is up-to-date
            await refreshAuth();
            setStep('done');
            setTimeout(() => router.push('/dashboard'), 1500);
        } catch (e: any) {
            setError(e.message || 'Invalid code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [otp, formattedPhone, refreshAuth, router]);

    const handleResend = useCallback(async () => {
        if (resendCooldown > 0) return;
        setError('');
        setIsLoading(true);
        try {
            await authService.sendPhoneCode(formattedPhone);
            setResendCooldown(60);
            setOtp('');
        } catch (e: any) {
            setError(e.message || 'Failed to resend code.');
        } finally {
            setIsLoading(false);
        }
    }, [resendCooldown, formattedPhone]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 px-4">

            {/* Decorative blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">

                {/* Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-900/5 border border-white/60 p-8 md:p-10">

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <a href="/">
                            <img src="/horohouse.png" alt="HoroHouse" className="h-14 w-14" />
                        </a>
                    </div>

                    {/* ── STEP: PHONE ─────────────────────────────────────────────── */}
                    {step === 'phone' && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4">
                                    <ShieldCheck className="w-7 h-7 text-blue-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Add your phone number
                                </h1>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Your Google account doesn't have a phone number yet.
                                    We need it to keep your account secure.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number
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
                                onClick={handleSendCode}
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending code...</>
                                ) : (
                                    <>Send verification code <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

                            <p className="mt-5 text-center text-xs text-gray-400">
                                We'll send a 6-digit code to verify your number.
                            </p>

                            {/* Skip option */}
                            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
                                >
                                    Skip for now — I'll do this later
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP: OTP ───────────────────────────────────────────────── */}
                    {step === 'otp' && (
                        <div>
                            <button
                                onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Change number
                            </button>

                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                                    <ShieldCheck className="w-7 h-7 text-green-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Enter the code
                                </h1>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    We sent a 6-digit code to{' '}
                                    <span className="font-semibold text-gray-700">{formattedPhone}</span>
                                </p>
                            </div>

                            {error && (
                                <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="mb-8">
                                <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
                            </div>

                            <button
                                onClick={handleVerify}
                                disabled={isLoading || otp.replace(/\D/g, '').length < 6}
                                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                                ) : (
                                    <>Verify number <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

                            <div className="mt-5 text-center">
                                <button
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0 || isLoading}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {resendCooldown > 0
                                        ? `Resend code in ${resendCooldown}s`
                                        : 'Didn\'t receive it? Resend'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP: DONE ──────────────────────────────────────────────── */}
                    {step === 'done' && (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-5">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Phone verified!
                            </h1>
                            <p className="text-sm text-gray-500 mb-4">
                                Your account is now fully set up. Redirecting you to your dashboard…
                            </p>
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500 mx-auto" />
                        </div>
                    )}

                </div>

                {/* Footer note */}
                {step !== 'done' && (
                    <p className="text-center text-xs text-gray-400 mt-5">
                        <Lock className="inline-block w-4 h-4 mr-1" /> Your phone number is encrypted and never shared.
                    </p>
                )}
            </div>
        </div>
    );
}