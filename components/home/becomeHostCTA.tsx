"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

export default function BecomeHostCTA() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <section className="w-full bg-[#F9FAFB] py-24 px-6 lg:px-10" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1280px] mx-auto relative h-auto md:h-[450px] flex items-center">
        
        {/* Minimalist Floating Card Context */}
        <div className="w-full md:w-[60%] lg:w-[50%] bg-white p-12 lg:p-16 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.04)] relative z-10">
          <p className="text-blue-600 font-bold tracking-widest uppercase text-[12px] mb-4">HoroHouse Hosting</p>
          <h2 className="text-[40px] lg:text-[52px] font-bold tracking-tight text-gray-900 leading-[1.05] mb-6">
            Unlock your home's potential.
          </h2>
          <p className="text-[18px] text-gray-500 font-light leading-relaxed mb-10">
            Earn extra income and meet people from around the world. We give you the tools, support, and audience to succeed.
          </p>
          <Link 
            href="/dashboard/hosting"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-[16px] hover:bg-gray-900 transition-colors shadow-sm"
          >
            Start Hosting Today
          </Link>
        </div>

        {/* Floating Offset Image */}
        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[45%] lg:w-[55%] h-[500px] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] z-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" 
            alt="Become a Host" 
            className="w-full h-full object-cover scale-105"
          />
        </div>

      </div>
    </section>
  );
}
