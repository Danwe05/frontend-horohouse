"use client";

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function OurPartners() {
  const { t } = useLanguage();

  const SCROLL_SPEED = 40;

  const partners = [
    { name: 'Visa', logo: 'https://cdn.worldvectorlogo.com/logos/visa-10.svg' },
    { name: 'MasterCard', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/1280px-Mastercard_2019_logo.svg.png' },
    { name: 'PayPal', logo: 'https://cdn.worldvectorlogo.com/logos/paypal-3.svg' },
    { name: 'Zillow', logo: 'https://cdn.worldvectorlogo.com/logos/zillow.svg' },
    { name: 'Airbnb', logo: 'https://cdn.worldvectorlogo.com/logos/airbnb.svg' },
    { name: 'UBA', logo: 'https://www.ubacameroon.com/wp-content/uploads/sites/8/2025/09/Logo_Plan-de-travail-1.png' },
    { name: 'Orange Money', logo: 'https://cdn.worldvectorlogo.com/logos/orange-1.svg' },
    { name: 'Mobile Money', logo: 'https://mtn.cm/MobileMoney' },
  ];

  const duplicatedPartners = [...partners, ...partners, ...partners, ...partners];

  return (
    <section className="py-16 md:py-24 bg-white border-b border-[#EBEBEB] overflow-hidden relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: scroll-left ${SCROLL_SPEED}s linear infinite;
        }
        .animate-marquee-right {
          animation: scroll-right ${SCROLL_SPEED}s linear infinite;
        }
      `}} />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center flex flex-col items-center">
        <p className="text-[12px] font-semibold tracking-[0.1em] uppercase text-blue-600 mb-2">
          {t.ourPartners?.trustedBy || 'Trusted By Industry Leaders'}
        </p>
        <h2 className="text-[28px] md:text-[34px] font-bold text-[#222222] tracking-tight leading-tight max-w-2xl relative inline-block">
          <span className="relative z-10">
            {t.ourPartners?.title || 'Our Global Partners'}
            <span className="absolute bottom-1 md:bottom-2 left-0 w-full h-2 md:h-3 bg-blue-200/80 -z-10 rounded-sm transform -rotate-1"></span>
          </span>
        </h2>
        <p className="text-[#717171] mt-3 text-[15px] max-w-2xl">
          {t.ourPartners?.description || "Seamlessly integrated with world-class financial institutions and platforms to ensure a secure experience."}
        </p>
      </div>

      <div className="relative mt-8">
        {/* Gradient Overlays for smooth fade out */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        {/* Scrolling Row 1 */}
        <div className="flex mb-8 overflow-hidden">
          <div className="flex gap-8 md:gap-12 items-center w-max pr-8 md:pr-12 animate-marquee-left hover:[animation-play-state:paused]">
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-40 h-20 flex items-center justify-center p-4 group cursor-pointer"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale opacity-50 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-[14px] font-semibold text-[#717171] group-hover:text-[#222222] transition-colors">${partner.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scrolling Row 2 */}
        <div className="flex overflow-hidden">
          <div className="flex gap-8 md:gap-12 items-center w-max pr-8 md:pr-12 animate-marquee-right hover:[animation-play-state:paused]">
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-40 h-20 flex items-center justify-center p-4 group cursor-pointer"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale opacity-50 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-[14px] font-semibold text-[#717171] group-hover:text-[#222222] transition-colors">${partner.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}