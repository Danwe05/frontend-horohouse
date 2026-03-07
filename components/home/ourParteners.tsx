"use client";

import { motion } from 'framer-motion';

export default function OurPartners() {
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
          className="text-center"
        >
          <span className="inline-block px-4 py-2 mb-3 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
            Trusted By Industry Leaders
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Our Partners
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're proud to work with world-class companies who trust our platform
          </p>
        </motion.div>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        {/* Scrolling Row 1 - Left to Right */}
        <div className="flex mb-8">
          <motion.div
            className="flex gap-12 items-center"
            animate={{ x: [0, -1920] }}
            transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 40, ease: "linear" } }}
          >
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-48 h-24 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center p-6 group border border-gray-100"
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
          <motion.div
            className="flex gap-12 items-center ml-12"
            animate={{ x: [0, -1920] }}
            transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 40, ease: "linear" } }}
          >
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row1-duplicate-${index}`}
                className="flex-shrink-0 w-48 h-24 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center p-6 group border border-gray-100"
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
        <div className="flex">
          <motion.div
            className="flex gap-12 items-center"
            animate={{ x: [-1920, 0] }}
            transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 40, ease: "linear" } }}
          >
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-48 h-24 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center p-6 group border border-gray-100"
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
          <motion.div
            className="flex gap-12 items-center ml-12"
            animate={{ x: [-1920, 0] }}
            transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 40, ease: "linear" } }}
          >
            {duplicatedPartners.map((partner, index) => (
              <div
                key={`row2-duplicate-${index}`}
                className="flex-shrink-0 w-48 h-24 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center p-6 group border border-gray-100"
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