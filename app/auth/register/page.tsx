"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { PatternFormat } from 'react-number-format';
import PromoSection from '@/components/auth/RightSideAuth';
import { authService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, User, Mail, Phone, Lock, ChevronDown } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login } = useAuth();
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({
    google: false,
    facebook: false,
    apple: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Language state
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState({
    code: "ENG",
    img: "/Flags/uk.jpg",
  });

  const languages = [
    { code: "ENG", img: "/Flags/uk.jpg", label: "English" },
    { code: "FR", img: "/flags/fr.jpg", label: "Français" },
    { code: "AR", img: "/flags/ar.jpg", label: "العربية" },
  ];

  // Country code state
  const [countryCode, setCountryCode] = useState("+237");
  const [showCountryMenu, setShowCountryMenu] = useState(false);

  const countryCodes = [
    { code: "+237", label: "Cameroon", flag: "/Flags/cameroun.jpg" },
    { code: "+234", label: "Nigeria", flag: "/Flags/nigeria.jpg" },
    { code: "+216", label: "Tunisia", flag: "/Flags/tunisie.jpg" },
    { code: "+33", label: "France", flag: "/Flags/fr.jpg" },
    { code: "+44", label: "UK", flag: "/Flags/uk.jpg" },
  ];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "registered_user",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    role: false,
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    }

    // Autofocus first name input on mount
    if (firstNameInputRef.current) {
      firstNameInputRef.current.focus();
    }
  }, [isAuthenticated, router, searchParams]);

  const handleLangSelect = (lang: any) => {
    setSelectedLang(lang);
    setShowLangMenu(false);
  };

  const validateField = (id: string, value: string) => {
    let error = "";
    switch (id) {
      case "firstName":
        if (!value.trim()) error = "First name is required";
        else if (value.trim().length < 2) error = "First name must be at least 2 characters";
        break;
      case "lastName":
        if (!value.trim()) error = "Last name is required";
        else if (value.trim().length < 2) error = "Last name must be at least 2 characters";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!emailRegex.test(value)) error = "Please enter a valid email address";
        break;
      case "phone":
        const cleanPhone = value.replace(/\D/g, '');
        if (!cleanPhone) error = "Phone number is required";
        else if (cleanPhone.length < 8) error = "Phone number must be at least 8 digits";
        else if (cleanPhone.length > 15) error = "Phone number is too long";
        break;
      case "password":
        if (!value.trim()) error = "Password is required";
        else if (value.length < 8) error = "Must be at least 8 characters";
        else if (!/[A-Z]/.test(value)) error = "Must contain an uppercase letter";
        else if (!/[a-z]/.test(value)) error = "Must contain a lowercase letter";
        else if (!/[0-9]/.test(value)) error = "Must contain a number";
        else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) error = "Must contain a special character";
        break;
      case "role":
        if (!value) error = "Please select an account type";
        break;
    }
    setErrors(prev => ({ ...prev, [id]: error }));
    return error === "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
    if (touched[id as keyof typeof touched]) {
      validateField(id, value);
    }
    setError('');
  };

  const handlePhoneChange = (values: any) => {
    const { value } = values;
    setForm({ ...form, phone: value });
    if (touched.phone) {
      validateField('phone', value);
    }
    setError('');
  };

  const handleBlur = (id: string) => {
    setTouched(prev => ({ ...prev, [id]: true }));
    validateField(id, form[id as keyof typeof form] || '');
  };

  const isFormValid = () => {
    const allFieldsValid = 
      validateField('firstName', form.firstName) &&
      validateField('lastName', form.lastName) &&
      validateField('email', form.email) &&
      validateField('phone', form.phone) &&
      validateField('password', form.password) &&
      validateField('role', form.role);
    
    return allFieldsValid &&
           form.firstName.trim() && 
           form.lastName.trim() && 
           form.email.trim() && 
           form.phone.trim() && 
           form.password.trim() && 
           form.role;
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      role: true,
    });
    
    const isValid = isFormValid();
    
    if (!isValid) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanPhone = form.phone.replace(/\D/g, '');
      const fullPhoneNumber = countryCode + cleanPhone;

      const tokens = await authService.registerWithEmail({
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        password: form.password,
        phoneNumber: fullPhoneNumber,
        role: form.role,
      });

      login(tokens);
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = async (provider: 'google' | 'facebook' | 'apple') => {
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
  };

  const getPasswordStrength = (password: string) => {
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

  const passwordStrength = getPasswordStrength(form.password);
  const isAnyLoading = isLoading || Object.values(socialLoading).some(loading => loading);

  return (
    <div className="min-h-screen flex pt-11 relative">
      {/* Language Switch */}
      <div className="absolute hidden lg:fixed top-6 right-6 z-50">
        <div
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-2 bg-white text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-xs border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          role="button"
          aria-label="Select language"
          aria-expanded={showLangMenu}
          aria-haspopup="true"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowLangMenu(!showLangMenu);
            }
          }}
        >
          <img src={selectedLang.img} alt={selectedLang.code} className="w-5 h-5 rounded-full object-cover shadow-sm" />
          {selectedLang.code}
          <ChevronDown className="w-3.5 h-3.5" />
        </div>

        {showLangMenu && (
          <div 
            className="absolute right-0 mt-2 bg-white text-black rounded-xl border border-gray-200 shadow-xl py-2 w-44 animate-in fade-in slide-in-from-top-2 duration-200"
            role="menu"
            aria-label="Language options"
          >
            {languages.map(lang => (
              <div
                key={lang.code}
                onClick={() => handleLangSelect(lang)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:bg-blue-50"
                role="menuitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLangSelect(lang);
                  }
                }}
              >
                <img src={lang.img} alt={lang.code} className="w-5 h-5 rounded-full object-cover shadow-sm" />
                <span className="text-gray-700">{lang.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 md:mr-[50%] flex flex-col justify-center items-center px-6 md:px-16 mb-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center content-center flex-col items-center">
            <a href="/"><img src="/horohouse.png" alt="" className="h-[130px] w-[130px] mb-2  "/></a>
            <h1 className="text-3xl font-bold text-gray-900 md:text-left text-center mb-2">
              Welcome to HoroHouse! 
            </h1>
            <p className="text-gray-600 md:text-left text-center text-sm">
              Create your account and start your journey
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div 
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
              role="alert"
              aria-live="polite"
            >
              <span className="flex-1">{error}</span>
            </div>
          )}

          {success && (
            <div 
              className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
              role="alert"
              aria-live="polite"
            >
              <span className="text-lg">✓</span>
              <span className="flex-1">{success}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleEmailRegister} noValidate>
            {/* Name Fields */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
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
                    aria-invalid={touched.firstName && errors.firstName ? 'true' : 'false'}
                    aria-describedby={touched.firstName && errors.firstName ? 'firstName-error' : undefined}
                    className={`w-full pl-10 pr-4 py-3 border-1 rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                      ${touched.firstName && errors.firstName 
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300"}`}
                  />
                </div>
                {touched.firstName && errors.firstName && (
                  <p id="firstName-error" className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                    <span aria-hidden="true">•</span> {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('lastName')}
                    placeholder="Doe"
                    disabled={isAnyLoading}
                    aria-invalid={touched.lastName && errors.lastName ? 'true' : 'false'}
                    aria-describedby={touched.lastName && errors.lastName ? 'lastName-error' : undefined}
                    className={`w-full pl-10 pr-4 py-3 border-1 rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                      ${touched.lastName && errors.lastName 
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300"}`}
                  />
                </div>
                {touched.lastName && errors.lastName && (
                  <p id="lastName-error" className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                    <span aria-hidden="true">•</span> {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="john.doe@example.com"
                  disabled={isAnyLoading}
                  aria-invalid={touched.email && errors.email ? 'true' : 'false'}
                  aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                  className={`w-full pl-10 pr-4 py-3 border-1 rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched.email && errors.email 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300"}`}
                />
              </div>
              {touched.email && errors.email && (
                <p id="email-error" className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                  <span aria-hidden="true">•</span> {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryMenu(!showCountryMenu)}
                    disabled={isAnyLoading}
                    aria-label="Select country code"
                    aria-expanded={showCountryMenu}
                    aria-haspopup="true"
                    className="flex items-center gap-2 px-3 py-3 border-1 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-semibold text-sm hover:border-gray-300 bg-white transition-all duration-200 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img
                      src={countryCodes.find(c => c.code === countryCode)?.flag}
                      alt="flag"
                      className="w-6 h-6 rounded-full object-cover shadow-sm"
                    />
                    <span>{countryCode}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {showCountryMenu && (
                    <div 
                      className="absolute text-gray-700 text-sm z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl w-56 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
                      role="menu"
                      aria-label="Country code options"
                    >
                      {countryCodes.map(c => (
                        <div
                          key={c.code}
                          onClick={() => {
                            setCountryCode(c.code);
                            setShowCountryMenu(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:bg-blue-50"
                          role="menuitem"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setCountryCode(c.code);
                              setShowCountryMenu(false);
                            }
                          }}
                        >
                          <img src={c.flag} alt={c.label} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                          <span className="flex-1 font-medium">{c.label}</span>
                          <span className="text-gray-500">{c.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" aria-hidden="true" />
                  <PatternFormat
                    format="### ### ####"
                    mask="_"
                    value={form.phone}
                    onValueChange={handlePhoneChange}
                    onBlur={() => handleBlur('phone')}
                    placeholder="123 456 7890"
                    disabled={isAnyLoading}
                    aria-invalid={touched.phone && errors.phone ? 'true' : 'false'}
                    aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined}
                    className={`w-full pl-10 pr-4 py-3 border-1 rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                      ${touched.phone && errors.phone 
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300"}`}
                  />
                </div>
              </div>
              {touched.phone && errors.phone && (
                <p id="phone-error" className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                  <span aria-hidden="true">•</span> {errors.phone}
                </p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                Account Type
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={form.role}
                  onChange={handleChange}
                  onBlur={() => handleBlur('role')}
                  disabled={isAnyLoading}
                  aria-invalid={touched.role && errors.role ? 'true' : 'false'}
                  aria-describedby={touched.role && errors.role ? 'role-error' : undefined}
                  className={`w-full px-4 py-3 border-1 rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm appearance-none bg-white cursor-pointer transition-all duration-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                    ${touched.role && errors.role 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"}`}
                >
                  <option value="registered_user">Regular User</option>
                  <option value="agent">Agent</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              </div>
              {touched.role && errors.role && (
                <p id="role-error" className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                  <span aria-hidden="true">•</span> {errors.role}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  disabled={isAnyLoading}
                  aria-invalid={touched.password && errors.password ? 'true' : 'false'}
                  aria-describedby={touched.password && errors.password ? 'password-error password-strength' : form.password ? 'password-strength' : undefined}
                  className={`w-full pl-10 pr-12 py-3 border-1 rounded-xl focus:outline-none focus:ring-2 text-gray-800 font-medium text-sm transition-all duration-200 placeholder:text-gray-400
                    ${touched.password && errors.password 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white hover:border-gray-300"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              
              {form.password && (
                <div id="password-strength" className="mt-2" aria-live="polite">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${passwordStrength.strength}%` }}
                        role="progressbar"
                        aria-valuenow={passwordStrength.strength}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Password strength: ${passwordStrength.label}`}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.label === 'Weak' ? 'text-red-500' :
                      passwordStrength.label === 'Medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              
              {touched.password && errors.password && (
                <p id="password-error" className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1" role="alert">
                  <span aria-hidden="true">•</span> {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAnyLoading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${!isAnyLoading
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-md active:scale-[0.98]"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
              aria-label="Create your account"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Creating your account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a 
              href="/auth/login" 
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-1"
              tabIndex={0}
            >
              Sign in
            </a>
          </p>

          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
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
                className="flex items-center justify-center gap-2 border-1 border-gray-200 rounded-full px-4 py-3 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Sign up with Google"
              >
                {socialLoading.google ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path
                      d="M533.5 278.4c0-17.5-1.6-34.3-4.7-50.7H272v95.8h146.9c-6.3 34-25 62.8-53.2 82v68h85.8c50.2-46.3 79-114.4 79-195.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M272 544.3c71.6 0 131.8-23.7 175.7-64.2l-85.8-68c-23.8 16-54.5 25.5-89.9 25.5-69.1 0-127.6-46.7-148.6-109.2H35.1v68.9C79.3 485.5 170.7 544.3 272 544.3z"
                      fill="#34A853"
                    />
                    <path
                      d="M123.4 321.3c-10.6-31.7-10.6-65.5 0-97.2V154.9H35.1c-43.1 85.9-43.1 187.9 0 273.8l88.3-68.4z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M272 107.6c37 0 70.2 12.7 96.4 37.6l72.2-72.2C403.8 29 343.6 5.3 272 5.3 170.7 5.3 79.3 64.1 35.1 154.9l88.3 68.9c21-62.5 79.5-109.2 148.6-109.2z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span className="text-sm">Google</span>
              </button>

              <button 
                type="button"
                onClick={() => handleSocialRegister('facebook')}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-2 border-1 border-gray-200 rounded-full px-4 py-3 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Sign up with Facebook"
              >
                {socialLoading.facebook ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <FaFacebook className="w-5 h-5" color="#1877F2" aria-hidden="true" />
                )}
                <span className="text-sm">Facebook</span>
              </button>

              <button 
                type="button"
                onClick={() => handleSocialRegister('apple')}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-2 border-1 border-gray-200 rounded-full px-4 py-3 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Sign up with Apple"
              >
                {socialLoading.apple ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <FaApple className="w-5 h-5" color="#000000" aria-hidden="true" />
                )}
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}