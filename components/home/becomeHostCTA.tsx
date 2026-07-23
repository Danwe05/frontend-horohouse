"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

export default function BecomeHostCTA() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <section className="w-full bg-white py-12 px-6 lg:px-10" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1280px] mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-[#F7F7F7] md:h-[440px] flex flex-col md:flex-row items-stretch">

          {/* Text side */}
          <div className="flex-1 flex flex-col justify-center p-10 lg:p-16 z-10">
            <h2 className="text-[32px] lg:text-[40px] font-semibold tracking-tight text-[#222222] leading-[1.1] mb-4">
              Try hosting on HoroHouse
            </h2>
            <p className="text-[16px] text-[#717171] leading-relaxed mb-8 max-w-md">
              Earn extra income and meet people from around the world. We give you the tools, support, and audience to succeed.
            </p>
            <div>
              <Link
                href="/dashboard/hosting"
                className="inline-flex items-center justify-center bg-[#222222] text-white px-7 py-3.5 rounded-full font-semibold text-[15px] hover:bg-[#111111] transition-colors"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Image side */}
          <div className="hidden md:block relative w-[45%] lg:w-[48%] shrink-0">
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
              alt="Become a Host"
              className="w-full h-full object-cover"
            />
          </div>

        </div>
      </div>
    </section>
  );
}

