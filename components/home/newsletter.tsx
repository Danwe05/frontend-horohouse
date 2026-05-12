"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Newsletter() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Subscribed with ${email}`); // Replace with actual API call
      setEmail('');
    }
  };

  return (
    <section className="w-full bg-[#111827] py-24 px-6 lg:px-10" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-16 md:gap-24">

        <div className="flex-1 w-full text-center md:text-left">
          <h2 className="text-[36px] md:text-[48px] font-bold text-white tracking-tight mb-4 leading-tight">
            Curated stays, <br className="hidden md:block" />delivered weekly.
          </h2>
          <p className="text-gray-400 text-[18px] font-light leading-relaxed">
            Join 50,000+ travelers receiving our best deals and inspiration.
          </p>
        </div>

        <div className="flex-1 w-full max-w-lg">
          <form onSubmit={handleSubscribe} className="flex flex-col gap-8 w-full">
            {/* Borderless minimalist input */}
            <div className="w-full relative">
              <input
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 bg-transparent outline-none text-[20px] text-white placeholder:text-gray-600 border-b border-gray-700 py-2 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <button
                type="submit"
                className="h-14 px-10 bg-blue-600 text-white rounded-full font-bold text-[16px] hover:bg-white hover:text-gray-900 transition-colors w-full sm:w-auto"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}
