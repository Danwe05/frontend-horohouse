"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldCheck, Lock, Globe2 } from 'lucide-react';

export default function TrustSafetyBanner() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <section className="bg-white py-12 px-6 lg:px-10" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1280px] mx-auto">

        {/* Minimalist Header */}
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <h2 className="text-[36px] md:text-[44px] font-bold tracking-tight text-gray-900 mb-6 inline-block relative">
            Protected from start to{' '}
            <span className="relative z-10 whitespace-nowrap">
              finish.
              <span className="absolute bottom-2 md:bottom-3 left-0 w-full h-3 md:h-4 bg-blue-200/80 -z-10 rounded-sm transform -rotate-1"></span>
            </span>
          </h2>
          <p className="text-[18px] md:text-[20px] text-gray-500 font-light leading-relaxed mt-2">
            Every booking is backed by comprehensive coverage. No hidden fees, no complicated policies. Just complete peace of mind.
          </p>
        </div>

        {/* Ultra-clean 3 Pillars without ANY boxes or borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 relative text-center">
          <div className="flex flex-col items-center">
            <div className="mb-8">
              <ShieldCheck className="w-12 h-12 text-blue-600 stroke-[1.5]" />
            </div>
            <h4 className="text-[20px] font-bold text-gray-900 mb-3">Verified Community</h4>
            <p className="text-[16px] text-gray-500 leading-relaxed font-light">
              We rigorously verify all host and guest identities to maintain a safe, trusted ecosystem.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-8">
              <Lock className="w-12 h-12 text-blue-600 stroke-[1.5]" />
            </div>
            <h4 className="text-[20px] font-bold text-gray-900 mb-3">Secure Escrow</h4>
            <p className="text-[16px] text-gray-500 leading-relaxed font-light">
              Your money is held safely until check-in. Payments are encrypted and fully protected.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-8">
              <Globe2 className="w-12 h-12 text-blue-600 stroke-[1.5]" />
            </div>
            <h4 className="text-[20px] font-bold text-gray-900 mb-3">Global 24/7 Support</h4>
            <p className="text-[16px] text-gray-500 leading-relaxed font-light">
              Our dedicated safety agents are available worldwide, every single hour of the day.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
