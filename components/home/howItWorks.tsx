"use client";

import { motion } from 'framer-motion';
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
      <div className="max-w-[1600px] mx-auto">

        {/* Heading */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-[32px] md:text-[44px] font-bold text-[#222222] tracking-tight inline-block relative">
            How it{' '}
            <span className="relative z-10 whitespace-nowrap">
              works
              <span className="absolute bottom-2 md:bottom-2.5 left-0 w-full h-3 md:h-4 bg-blue-100/80 -z-10 rounded-sm transform -rotate-1" />
            </span>
          </h2>
          <p className="text-[16px] md:text-[18px] text-[#717171] mt-4 max-w-xl mx-auto leading-relaxed">
            A simple three-step process to find and book your perfect stay.
          </p>
        </div>

        {/* Steps Grid (Airbnb Minimalist Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {STEPS.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col group cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Number Badge (Clean Overlay) */}
                <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center font-bold text-[18px] text-[#222222]">
                  {i + 1}
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-2">
                <h3 className="text-[20px] font-bold text-[#222222] tracking-tight">{step.title}</h3>
                <p className="text-[15px] text-[#717171] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Minimalist CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center border-t border-[#F0F0F0] pt-12"
        >
          <a 
            href="/properties" 
            className="text-[16px] font-bold text-[#222222] underline underline-offset-4 hover:text-[#717171] transition-colors"
          >
            Explore all properties
          </a>
        </motion.div>

      </div>
    </section>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
