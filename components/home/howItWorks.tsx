"use client";

import { useLanguage } from '@/contexts/LanguageContext';

const STEPS = [
  {
    title: "Find your perfect space",
    desc: "Search by city, price, and property type to discover exactly what you're looking for.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Book with confidence",
    desc: "Reserve your stay instantly with secure payments and host verification.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Enjoy your stay",
    desc: "Experience seamless check-ins and responsive support throughout your trip.",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800",
  },
];

export default function HowItWorks() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <section className="bg-white py-12 px-6 lg:px-10" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[22px] font-semibold text-[#222222] tracking-tight">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                />
              </div>
              <h3 className="text-[16px] font-semibold text-[#222222] mb-1 leading-tight">{step.title}</h3>
              <p className="text-[15px] text-[#717171] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}


