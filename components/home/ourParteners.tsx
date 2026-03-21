"use client";

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function OurPartners() {
  const { t } = useLanguage();
  const partners = [
    {
      name: 'Zillow',
      logo: 'https://cdn.worldvectorlogo.com/logos/zillow.svg',
    },
    {
      name: 'Airbnb',
      logo: 'https://cdn.worldvectorlogo.com/logos/airbnb.svg',
    },
    {
      name: 'Jumia',
      logo: 'https://cdn.worldvectorlogo.com/logos/jumia.svg',
    },
    {
      name: 'MTN',
      logo: 'https://cdn.worldvectorlogo.com/logos/mtn-2.svg',
    },
    {
      name: 'Equity Bank',
      logo: 'https://cdn.worldvectorlogo.com/logos/equity-bank.svg',
    },
    {
      name: 'Safaricom',
      logo: 'https://cdn.worldvectorlogo.com/logos/safaricom.svg',
    },
    {
      name: 'Orange Africa',
      logo: 'https://cdn.worldvectorlogo.com/logos/orange-1.svg',
    },
    {
      name: 'Standard Bank',
      logo: 'https://cdn.worldvectorlogo.com/logos/standard-bank.svg',
    },
    {
      name: 'Flutterwave',
      logo: 'https://cdn.worldvectorlogo.com/logos/flutterwave.svg',
    },
    {
      name: 'Ecobank',
      logo: 'https://cdn.worldvectorlogo.com/logos/ecobank.svg',
    },
  ];

  const duplicatedPartners = [...partners, ...partners];

  return (
    <div className="bg-white py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center gap-6 mb-16 px-4"
        >
          <div className="max-w-3xl flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-12 bg-blue-600 hidden md:block" />
              <span className="text-blue-600 font-bold text-xs uppercase tracking-[0.3em] px-2">
                {t.ourPartners?.trustedBy || 'Trusted By Industry Leaders'}
              </span>
              <span className="h-px w-12 bg-blue-600 hidden md:block" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6 mt-2">
              {t.ourPartners?.title || 'Our Partners'}
            </h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
              {t.ourPartners?.description || "We're proud to work with world-class companies who trust our platform."}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        {/* Scrolling Row 1 - Left to Right */}
        <div className="flex mb-8 overflow-hidden">
          <motion.div
            className="flex gap-12 items-center w-max pr-12"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
          >
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-48 h-24 bg-white rounded-2xl -md hover:-xl transition-all duration-300 flex items-center justify-center p-6 group border border-gray-100"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-sm font-bold text-gray-400 text-center">${partner.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scrolling Row 2 - Right to Left */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-12 items-center w-max pr-12"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
          >
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-48 h-24 bg-white rounded-2xl -md hover:-xl transition-all duration-300 flex items-center justify-center p-6 group border border-gray-100"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-sm font-bold text-gray-400 text-center">${partner.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}