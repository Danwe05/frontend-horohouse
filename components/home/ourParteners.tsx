"use client";

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function OurPartners() {
  const { t } = useLanguage();
  
  // ⚡ Adjust this number to change the speed (in seconds)
  const SCROLL_SPEED = 30; 

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
    <div className="bg-slate-50 py-20 overflow-hidden relative">
      {/* Injecting custom keyframes for the marquee. 
        Using standard CSS animations makes "pause on hover" buttery smooth.
      */}
      <style dangerouslySetInnerHTML={{__html: `
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

      <div className="max-w-7xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-6 px-4"
        >
          <div className="max-w-3xl flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-12 bg-blue-500 hidden md:block opacity-50" />
              <span className="text-blue-500 font-bold text-sm uppercase tracking-[0.2em] px-2">
                {t.ourPartners?.trustedBy || 'Trusted Payment & Industry Partners'}
              </span>
              <span className="h-px w-12 bg-blue-500 hidden md:block opacity-50" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 mt-2 ">
              {t.ourPartners?.title || 'Our Partners'}
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              {t.ourPartners?.description || "We're proud to seamlessly integrate with world-class financial institutions and platforms."}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="relative mt-8">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

        {/* Scrolling Row 1 - Left to Right */}
        <div className="flex mb-6 overflow-hidden">
          {/* Added hover:[animation-play-state:paused] to stop the track when hovered
          */}
          <div className="flex gap-6 md:gap-8 items-center w-max pr-6 md:pr-8 animate-marquee-left hover:[animation-play-state:paused]">
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-48 h-28 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center p-8 group border border-slate-200/60 cursor-pointer"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-50 group-hover:opacity-100"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-base font-bold text-slate-400 text-center">${partner.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scrolling Row 2 - Right to Left */}
        <div className="flex overflow-hidden">
          {/* Added hover:[animation-play-state:paused] to stop the track when hovered
          */}
          <div className="flex gap-6 md:gap-8 items-center w-max pr-6 md:pr-8 animate-marquee-right hover:[animation-play-state:paused]">
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-48 h-28 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center p-8 group border border-slate-200/60 cursor-pointer"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-50 group-hover:opacity-100"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-base font-bold text-slate-400 text-center">${partner.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}