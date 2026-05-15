"use client";

import { useLanguage } from '@/contexts/LanguageContext';

const STEPS = [
  {
    number: "01",
    title: "Discover",
    desc: "Find the perfect property using exact filters — by city, price, type, and more.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
  },
  {
    number: "02",
    title: "Book",
    desc: "Reserve instantly with secure payments and instant confirmation.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800",
  },
  {
    number: "03",
    title: "Enjoy",
    desc: "Arrive seamlessly and experience more with local host support.",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800",
  },
];

export default function HowItWorks() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <section className="bg-white py-20 px-6 lg:px-10" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1100px] mx-auto">

        {/* Heading */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-[36px] md:text-[44px] font-bold text-[#222222] tracking-tight inline-block relative">
            How it{' '}
            <span className="relative z-10 whitespace-nowrap">
              works
              <span className="absolute bottom-2 md:bottom-3 left-0 w-full h-3 md:h-4 bg-blue-200/80 -z-10 rounded-sm transform -rotate-1" />
            </span>
          </h2>
          <p className="text-[16px] md:text-[18px] text-[#717171] font-light mt-4 max-w-xl mx-auto leading-relaxed">
            A simple three-step process to find and book your perfect stay.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center group">

              {/* Image Container */}
              <div className="w-full max-w-[340px] aspect-[4/3] rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative z-0">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Subtle dark overlay that fades on hover */}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
              </div>

              {/* Number Badge (overlapping the image bottom edge) */}
              <div className="relative z-10 mb-6 -mt-[30px]">
                <div className="w-[60px] h-[60px] rounded-full bg-blue-600 group-hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center shadow-lg ring-[6px] ring-white">
                  <span className="text-[20px] font-bold text-white leading-none">{i + 1}</span>
                </div>
              </div>

              {/* Text */}
              <h3 className="text-[22px] font-bold text-[#222222] mb-3 tracking-tight">{step.title}</h3>
              <p className="text-[15px] text-[#717171] leading-relaxed max-w-[260px]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
