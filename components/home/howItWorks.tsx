"use client";

import { useLanguage } from '@/contexts/LanguageContext';

export default function HowItWorks() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const steps = [
    {
      title: "Discover",
      desc: "Find the perfect property using exact filters.",
    },
    {
      title: "Book",
      desc: "Reserve instantly with secure payments.",
    },
    {
      title: "Enjoy",
      desc: "Arrive seamlessly and experience more.",
    },
  ];

  return (
    <section className="bg-white py-24 px-6 lg:px-10 border-t border-gray-100" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-[36px] font-bold text-gray-900 tracking-tight">
            How it works
          </h2>
        </div>

        <div className="relative">
          {/* Minimalist Horizontal Line */}
          <div className="hidden md:block absolute top-[12px] left-[10%] right-[10%] h-[1px] bg-gray-200"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-0">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative group">
                {/* Clean Dot Marker */}
                <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-200 group-hover:border-blue-600 transition-colors duration-300 relative z-10 mb-8 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-blue-600 transition-colors duration-300"></div>
                </div>
                
                {/* Top Number indicator */}
                <span className="text-[14px] font-bold text-blue-600 tracking-widest uppercase mb-4">
                  Step 0{i + 1}
                </span>

                <h3 className="text-[24px] font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-[16px] text-gray-500 font-light leading-relaxed max-w-[250px]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
