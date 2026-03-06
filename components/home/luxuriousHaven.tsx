'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight, FaUsers, FaHome, FaGlobeAfrica } from 'react-icons/fa';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import PropertyTypeCards from './propertyTypeCards';

const stats = [
  { label: "Investors", value: "40k+" },
  { label: "Portfolio", value: "50k+" },
  { label: "Regions", value: "30+" },
];

export default function LuxuriousHaven() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 25, stiffness: 120 });
  
  // Dynamic parallax for that "magazine" feel
  const textX = useTransform(smoothProgress, [0, 1], [0, -200]);
  const imageY = useTransform(smoothProgress, [0, 1], [0, -80]);
  const bgBlueWidth = useTransform(smoothProgress, [0, 0.5], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative min-h-screen bg-slate-50 py-20 overflow-hidden">
      
      {/* 1. KINETIC BACKGROUND TYPOGRAPHY */}
      <motion.div 
        style={{ x: textX }}
        className="absolute top-10 left-0 whitespace-nowrap select-none pointer-events-none opacity-[0.03] z-0"
      >
        <h2 className="text-[20rem] font-black text-slate-900 tracking-tighter">
          HOROHOUSE • LUXURY • AFRICA • HOROHOUSE • LUXURY • AFRICA
        </h2>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* 2. THE ASYMMETRIC HERO HEADER */}
        <div className="flex flex-col lg:flex-row gap-12 lg:items-end mb-24">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-1 bg-blue-500" />
                <span className="text-blue-500 font-black text-xs uppercase tracking-[0.4em]">The 2026 Collection</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-black text-slate-900 leading-[0.8] tracking-tighter">
                BEYOND <br />
                <span className="text-blue-500">BOUNDS.</span>
              </h1>
            </motion.div>
          </div>
          
          <div className="flex-1 lg:pb-4">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-500 text-xl md:text-2xl leading-tight max-w-sm border-l-4 border-blue-500 pl-6"
            >
              Where architectural vision meets African soul. We don't just find houses; we secure legacies.
            </motion.p>
          </div>
        </div>

        {/* 3. THE DYNAMIC IMAGE MOSAIC */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch h-full">
          
          {/* Main Large Image Tile */}
          <motion.div 
            style={{ y: imageY }}
            className="md:col-span-8 relative rounded-[3rem] overflow-hidden shadow-2xl h-[500px] lg:h-[700px] group"
          >
            <Image
              src="/LuxuriousHaven.jpg"
              alt="Architecture"
              fill
              className="object-cover transition-transform duration-[1.5s] group-hover:scale-110"
            />
            {/* Solid Color Mask Reveal on scroll */}
            <motion.div 
              style={{ width: bgBlueWidth }}
              className="absolute inset-0 bg-blue-500/20 mix-blend-multiply"
            />
            
            {/* Round CTA Floating */}
            <Link href="/properties">
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-10 right-10 w-40 h-40 bg-white text-slate-900 rounded-full flex flex-col items-center justify-center shadow-2xl z-20 group/btn border-4 border-blue-500"
              >
                <FaArrowRight className="text-3xl mb-1 group-hover/btn:translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Explore</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Sidebar Info Tile (Solid Depth) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex-1 bg-slate-900 rounded-[3rem] p-10 flex flex-col justify-between text-white border-b-[16px] border-blue-500"
            >
              <div className="space-y-4">
                <h4 className="text-blue-500 font-black text-xs uppercase tracking-widest">Market Status</h4>
                <p className="text-3xl font-bold leading-tight">Elite properties ready for immediate acquisition.</p>
              </div>
              
              <div className="space-y-8">
                {stats.map((s, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-white/10 pb-2">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                    <span className="text-2xl font-black text-blue-500">{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <div className="h1/3 bg-blue-500 rounded-[3rem] p-10 flex items-center justify-center">
               <p className="text-white font-black text-center leading-none text-2xl uppercase tracking-tighter">
                 Securing <br/> The Future
               </p>
            </div>
          </div>
        </div>

        {/* 4. THE CATEGORY SECTION REVEAL */}
        
      </div>
    </section>
  );
}