"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import PromoSection from '@/components/auth/RightSideAuth';
import { authService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Constants moved outside component
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Memoized Google Icon
const GoogleIcon = React.memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M533.5 278.4c0-17.5-1.6-34.3-4.7-50.7H272v95.8h146.9c-6.3 34-25 62.8-53.2 82v68h85.8c50.2-46.3 79-114.4 79-195.1z" fill="#4285F4" />
    <path d="M272 544.3c71.6 0 131.8-23.7 175.7-64.2l-85.8-68c-23.8 16-54.5 25.5-89.9 25.5-69.1 0-127.6-46.7-148.6-109.2H35.1v68.9C79.3 485.5 170.7 544.3 272 544.3z" fill="#34A853" />
    <path d="M123.4 321.3c-10.6-31.7-10.6-65.5 0-97.2V154.9H35.1c-43.1 85.9-43.1 187.9 0 273.8l88.3-68.4z" fill="#FBBC05" />
    <path d="M272 107.6c37 0 70.2 12.7 96.4 37.6l72.2-72.2C403.8 29 343.6 5.3 272 5.3 170.7 5.3 79.3 64.1 35.1 154.9l88.3 68.9c21-62.5 79.5-109.2 148.6-109.2z" fill="#EA4335" />
  </svg>
));
GoogleIcon.displayName = 'GoogleIcon';

// Password strength calculator moved outside
const calculatePasswordStrength = (password: string) => {
  if (!password) return { strength: 0, label: '', color: '' };
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  if (strength <= 2) return { strength: 33, label: 'Weak', color: 'bg-red-500' };
  if (strength <= 4) return { strength: 66, label: 'Medium', color: 'bg-yellow-500' };
  return { strength: 100, label: 'Strong', color: 'bg-green-500' };
};

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login } = useAuth();
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({ google: false, facebook: false, apple: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phone, setPhone] = useState('237');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'registered_user',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: '',
  });
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    role: false,
  });

  const validateField = useCallback((id: string, value: string) => {
    let error = '';
    switch (id) {
      case 'firstName':
        if (!value.trim()) error = 'First name is required';
        else if (value.trim().length < 2) error = 'First name must be at least 2 characters';
        break;
      case 'lastName':
        if (!value.trim()) error = 'Last name is required';
        else if (value.trim().length < 2) error = 'Last name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!EMAIL_REGEX.test(value)) error = 'Please enter a valid email address';
        break;
      case 'phone': {
        const cleanPhone = value.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 3) error = 'Phone number is required';
        else if (cleanPhone.length < 10) error = 'Please enter a valid phone number';
        else if (cleanPhone.length > 15) error = 'Phone number is too long';
        break;
      }
      case 'password': {
        if (!value.trim()) {
          error = 'Password is required';
          break;
        }
        const rules = [
          { test: value.length >= 8, msg: 'At least 8 characters' },
          { test: /[A-Z]/.test(value), msg: 'One uppercase letter' },
          { test: /[a-z]/.test(value), msg: 'One lowercase letter' },
          { test: /[0-9]/.test(value), msg: 'One number' },
          { test: /[!@#$%^&*(),.?":{}|<>]/.test(value), msg: 'One special character' },
        ];
        const failed = rules.filter(r => !r.test).map(r => r.msg);
        if (failed.length) error = `Password needs: ${failed.join(', ')}`;
        break;
      }
      case 'role':
        if (!value) error = 'Please select an account type';
        break;
    }
    setErrors(prev => ({ ...prev, [id]: error }));
    return error === '';
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
    if (touched[id as keyof typeof touched]) {
      validateField(id, value);
    }
    setError('');
  }, [touched, validateField]);

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value);
    setForm(prev => ({ ...prev, phone: value }));
    if (touched.phone) {
      validateField('phone', value);
    }
    setError('');
  }, [touched.phone, validateField]);

  const handleBlur = useCallback((id: string) => {
    setTouched(prev => ({ ...prev, [id]: true }));
    validateField(id, form[id as keyof typeof form] || '');
  }, [form, validateField]);

  const handleEmailRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      role: true,
    });

    const isValid =
      validateField('firstName', form.firstName) &&
      validateField('lastName', form.lastName) &&
      validateField('email', form.email) &&
      validateField('phone', form.phone) &&
      validateField('password', form.password) &&
      validateField('role', form.role);

    if (!isValid) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // react-phone-input-2 already includes country code digits
      const fullPhoneNumber = '+' + form.phone.replace(/\D/g, '');

      const tokens = await authService.registerWithEmail({
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        password: form.password,
        phoneNumber: fullPhoneNumber,
        role: form.role,
      });

      login(tokens);
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => router.push('/onboarding'), 800);
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [form, validateField, login, router]);

  const handleSocialRegister = useCallback(async (provider: 'google' | 'facebook' | 'apple') => {
    setSocialLoading(prev => ({ ...prev, [provider]: true }));
    setError('');
    try {
      if (provider === 'google') {
        await authService.loginWithGoogle();
      } else {
        throw new Error(`${provider} registration is not yet implemented`);
      }
    } catch (error: any) {
      setError(error.message || `${provider.charAt(0).toUpperCase() + provider.slice(1)} registration failed`);
      setSocialLoading(prev => ({ ...prev, [provider]: false }));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(searchParams.get('redirect') || '/');
      return;
    }
    firstNameInputRef.current?.focus();
  }, [isAuthenticated, router, searchParams]);

  const passwordStrength = useMemo(() => calculatePasswordStrength(form.password), [form.password]);
  const isAnyLoading = useMemo(() =>
    isLoading || Object.values(socialLoading).some(loading => loading),
    [isLoading, socialLoading]
  );

  // Shared input class builder
  const inputClass = (field: keyof typeof touched) =>
    `w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400 ${touched[field] && errors[field]
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'
    }`;

  return (
    <div className="min-h-screen flex pt-11 relative">
      <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 mb-10">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-8 flex justify-center flex-col items-center">
            <a href="/"><img src="/horohouse.png" alt="HoroHouse" className="h-[130px] w-[130px] mb-2" loading="eager" /></a>
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Welcome to HoroHouse!</h1>
            <p className="text-gray-600 text-center text-sm">Create your account and start your journey</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm flex gap-3" role="alert">
              <span>✓</span><span>{success}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleEmailRegister} noValidate>

            {/* Name */}
            <div className="grid lg:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    ref={firstNameInputRef}
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('firstName')}
                    placeholder="John"
                    disabled={isAnyLoading}
                    className={inputClass('firstName')}
                  />
                </div>
                {touched.firstName && errors.firstName && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1">• {errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('lastName')}
                    placeholder="Doe"
                    disabled={isAnyLoading}
                    className={inputClass('lastName')}
                  />
                </div>
                {touched.lastName && errors.lastName && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1">• {errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="john.doe@example.com"
                  disabled={isAnyLoading}
                  className={inputClass('email')}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">• {errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <PhoneInput
                country="cm"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur('phone')}
                disabled={isAnyLoading}
                enableSearch
                searchPlaceholder="Search country..."
                inputProps={{
                  id: 'phone',
                  name: 'phone',
                  autoComplete: 'tel',
                }}
                containerClass="w-full"
                inputStyle={{
                  width: '100%',
                  height: '48px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  border: touched.phone && errors.phone
                    ? '1px solid #fca5a5'
                    : '1px solid #e5e7eb',
                  backgroundColor: touched.phone && errors.phone ? '#fef2f2' : '#ffffff',
                  color: '#1f2937',
                  paddingLeft: '52px',
                }}
                buttonStyle={{
                  borderRadius: '12px 0 0 12px',
                  border: touched.phone && errors.phone
                    ? '1px solid #fca5a5'
                    : '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  borderRight: 'none',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                }}
                dropdownStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                  maxHeight: '220px',
                  zIndex: 9999,
                }}
                searchStyle={{
                  width: '93%',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  padding: '6px 10px',
                  fontSize: '13px',
                  margin: '4px 0',
                }}
              />
              {touched.phone && errors.phone && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">• {errors.phone}</p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
              <div className="relative">
                <select
                  id="role"
                  value={form.role}
                  onChange={handleChange}
                  onBlur={() => handleBlur('role')}
                  disabled={isAnyLoading}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm appearance-none bg-white cursor-pointer transition-all duration-200 hover:border-gray-300 disabled:opacity-50 ${touched.role && errors.role
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                >
                  <option value="registered_user">Regular User</option>
                  <option value="student">Student</option>
                  <option value="agent">Agent</option>
                  <option value="landlord">Landlord</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {touched.role && errors.role && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">• {errors.role}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  disabled={isAnyLoading}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400 ${touched.password && errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${passwordStrength.label === 'Weak' ? 'text-red-500' :
                      passwordStrength.label === 'Medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1.5 ml-1">• {errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isAnyLoading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 -sm mt-6 ${!isAnyLoading
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:-md active:scale-[0.98]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating your account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/auth/login" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">Sign in</a>
          </p>

          {/* Social auth */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative bg-white px-4">
                <p className="text-sm text-gray-500 font-medium">Or continue with</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSocialRegister('google')}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-2 border border-gray-200 rounded-full px-4 py-3 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold transition-all duration-200 disabled:opacity-50"
              >
                {socialLoading.google ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                <span className="text-sm">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialRegister('facebook')}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-2 border border-gray-200 rounded-full px-4 py-3 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold transition-all duration-200 disabled:opacity-50"
              >
                {socialLoading.facebook ? <Loader2 className="w-5 h-5 animate-spin" /> : <FaFacebook className="w-5 h-5" color="#1877F2" />}
                <span className="text-sm">Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialRegister('apple')}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-2 border border-gray-200 rounded-full px-4 py-3 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold transition-all duration-200 disabled:opacity-50"
              >
                {socialLoading.apple ? <Loader2 className="w-5 h-5 animate-spin" /> : <FaApple className="w-5 h-5" color="#000000" />}
                <span className="text-sm">Apple</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <PromoSection />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}