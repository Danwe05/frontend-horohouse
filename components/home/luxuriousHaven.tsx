'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LuxuriousHaven() {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 25, stiffness: 120 });
  
  // Dynamic parallax
  const textX = useTransform(smoothProgress, [0, 1], [0, -400]);
  const imageY = useTransform(smoothProgress, [0, 1], [0, -100]);
  const imageScale = useTransform(smoothProgress, [0, 1], [1, 1.05]);

  return (
    <section ref={containerRef} className="relative min-h-screen bg-slate-50 py-24 overflow-hidden">
      
      {/* 1. KINETIC BACKGROUND TYPOGRAPHY (Watermark) */}
      <motion.div 
        style={{ x: textX }}
        className="absolute top-12 left-0 whitespace-nowrap select-none pointer-events-none opacity-[0.03] z-0"
      >
        <h2 className="text-[18rem] md:text-[24rem] font-black text-slate-900 tracking-tighter leading-none">
          HOROHOUSE • LUXURY • AFRICA • HOROHOUSE • LUXURY • AFRICA
        </h2>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* 2. THE HERO HEADER */}
        <div className="flex flex-col lg:flex-row gap-8 lg:items-end mb-20">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-[2px] bg-blue-600" />
                <span className="text-blue-600 font-bold text-sm uppercase tracking-[0.3em]">
                  {t.luxury?.collection || "The 2026 Collection"}
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter">
                {t.luxury?.title1 || "BEYOND"} <br />
                <span className="text-blue-600">{t.luxury?.title2 || "BOUNDS."}</span>
              </h1>
            </motion.div>
          </div>
          
          <div className="flex-1 lg:pb-6">
            <motion.p 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-slate-500 text-lg md:text-xl leading-relaxed max-w-md border-l-2 border-slate-300 pl-6 lg:ml-auto"
            >
              {t.luxury?.description || "Where architectural vision meets African soul. We don't just find houses; we secure legacies."}
            </motion.p>
          </div>
        </div>

        {/* 3. STRUCTURED GRID LAYOUT (Polished Flat Design) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Panoramic Image (Left) */}
          <motion.div 
            style={{ y: imageY, scale: imageScale }}
            className="lg:col-span-5 relative w-full h-[300px] md:h-[380px] rounded-3xl overflow-hidden group lg:order-1 border border-slate-200"
          >
            <Image
              src="/LuxuriousHaven.jpg"
              alt="Luxury Architecture"
              fill
              className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
            />
            {/* Soft gradient overlay at bottom for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
          </motion.div>

          {/* Right Side: Stacked Info Cards */}
          <div className="lg:col-span-7 flex flex-col gap-6 h-full lg:order-2">
            
            {/* Market Status Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex-1 bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-3xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 to-emerald-400 opacity-90" />
              
              <div className="mb-8">
                <h4 className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
                  {t.luxury?.marketStatus || "Market Status"}
                </h4>
                <p className="text-xl md:text-2xl font-light text-white leading-snug">
                  {t.luxury?.marketText || "Elite properties ready for immediate acquisition."}
                </p>
              </div>
              
              {/* Stats Layout */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/60 mt-auto">
                <div>
                  <p className="text-2xl lg:text-3xl font-bold text-white mb-1">40<span className="text-blue-500">k+</span></p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t.luxury?.stats?.investors || "Investors"}</p>
                </div>
                <div>
                  <p className="text-2xl lg:text-3xl font-bold text-white mb-1">50<span className="text-blue-500">k+</span></p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t.luxury?.stats?.portfolio || "Portfolio"}</p>
                </div>
                <div>
                  <p className="text-2xl lg:text-3xl font-bold text-white mb-1">30<span className="text-blue-500">+</span></p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t.luxury?.stats?.regions || "Regions"}</p>
                </div>
              </div>
            </motion.div>

            {/* Securing the Future CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white border border-slate-200 p-8 md:px-10 md:py-8 rounded-3xl flex items-center justify-between gap-6"
            >
              <div>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1.5">
                  {t.luxury?.futureLine1 || "Securing"}
                </p>
                <p className="text-slate-900 font-black text-2xl md:text-3xl uppercase tracking-tighter leading-none">
                  {t.luxury?.futureLine2 || "The Future"}
                </p>
              </div>
              
              <Link href="/properties" className="shrink-0">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full transition-colors"
                >
                  <FaArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}