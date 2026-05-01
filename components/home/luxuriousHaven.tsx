'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LuxuriousHaven() {
  const { t } = useLanguage();

  return (
    <section className="relative bg-white py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        
        {/* HERO TITLE & DESCRIPTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row gap-8 md:items-end justify-between mb-10"
        >
          <div className="max-w-2xl">
            <h2 className="text-[2rem] md:text-[2.5rem] lg:text-[3rem] font-semibold text-[#222222] leading-tight tracking-tight mb-4">
              {t.luxury?.title1 || "Beyond"} {t.luxury?.title2 || "Bounds."}
            </h2>
            <p className="text-[#717171] text-lg leading-relaxed md:max-w-[80%]">
              {t.luxury?.description || "Where architectural vision meets African soul. We don't just find houses; we secure legacies."}
            </p>
          </div>
          
          <div className="hidden md:block pb-1 shrink-0">
            <Link href="/properties">
              <button className="flex items-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-3.5 rounded-xl font-semibold transition-colors duration-200">
                <span>{t.luxury?.futureLine1 || "Explore Collection"}</span>
                <FaArrowRight className="text-sm" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* IMAGE & STATS GRID */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* Main Panoramic Image (Left) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="w-full lg:w-[65%] relative h-[350px] md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden"
          >
            <Image
              src="/LuxuriousHaven.jpg"
              alt="Luxury Architecture"
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Right Side: Stats & Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="w-full lg:w-[35%] flex flex-col gap-6"
          >
            
            {/* Minimalist Stat Card */}
            <div className="border border-[#DDDDDD] p-6 lg:p-8 rounded-2xl flex flex-col bg-white">
              <h4 className="text-[#222222] font-semibold text-lg mb-2">
                {t.luxury?.marketStatus || "Market Status"}
              </h4>
              <p className="text-[#717171] text-base mb-6 md:mb-8 leading-relaxed">
                {t.luxury?.marketText || "Elite properties ready for immediate acquisition. Curated specifically for visionary investors."}
              </p>
              
              <div className="flex flex-col gap-5 pt-6 border-t border-[#DDDDDD]">
                <div className="flex justify-between items-center group">
                  <span className="text-[#717171]">{t.luxury?.stats?.investors || "Investors"}</span>
                  <span className="text-xl font-semibold text-[#222222]">40k+</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[#717171]">{t.luxury?.stats?.portfolio || "Portfolio"}</span>
                  <span className="text-xl font-semibold text-[#222222]">50k+</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[#717171]">{t.luxury?.stats?.regions || "Regions"}</span>
                  <span className="text-xl font-semibold text-[#222222]">30+</span>
                </div>
              </div>
            </div>

            {/* Mobile CTA */}
            <div className="md:hidden">
              <Link href="/properties">
                <button className="w-full flex items-center justify-center gap-2 bg-[#222222] hover:bg-black text-white px-6 py-4 rounded-xl font-semibold transition-colors duration-200">
                  <span>{t.luxury?.futureLine1 || "Explore Collection"}</span>
                  <FaArrowRight className="text-sm" />
                </button>
              </Link>
            </div>
            
          </motion.div>
        </div>

      </div>
    </section>
  );
}