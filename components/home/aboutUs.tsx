'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { Pause, Play, CheckCircle, Home, Rocket, Users, Globe, Leaf, ArrowRight } from 'lucide-react';

const cards = [
  {
    title: "The Vision for Africa",
    text: "At Horo House, we are redefining property discovery across the continent. Born from a vision to simplify real estate access, our platform integrates deep local market understanding with world-class technology.",
    icon: Home,
    tag: "PURPOSE",
  },
  {
    title: "Technology at Scale",
    text: "We leverage cutting-edge AI to ensure transparency and security. Our blockchain-ready infrastructure provides an unparalleled user experience in emerging African markets.",
    icon: Rocket,
    tag: "INNOVATION",
  },
  {
    title: "Direct Connections",
    text: "Our platform removes the friction from real estate transactions, connecting buyers and sellers directly to foster community trust and local economic development.",
    icon: Users,
    tag: "COMMUNITY",
  },
  {
    title: "Global Standards",
    text: "With dedicated teams on the ground in multiple countries, we provide localized expertise backed by international standards of service and ethics.",
    icon: Globe,
    tag: "EXCELLENCE",
  }
];

export default function AboutUs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 25, stiffness: 120 });
  const bgTextX = useTransform(smoothProgress, [0, 1], ["10%", "-10%"]);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % cards.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const CurrentIcon = cards[activeIndex].icon;

  return (
    <section ref={sectionRef} className="relative bg-white py-24 px-6 overflow-hidden">
      {/* 1. LARGE ARCHITECTURAL BACKGROUND TEXT */}
      <motion.div
        style={{ x: bgTextX }}
        className="absolute top-20 left-0 whitespace-nowrap select-none pointer-events-none opacity-[0.04] z-0"
      >
        <h2 className="text-[15rem] font-black text-slate-900 tracking-tighter">
          HOROHOUSE • SINCE 2024 • BEYOND REAL ESTATE • AFRICA
        </h2>
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 2. HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-12 bg-blue-600" />
              <span className="text-blue-600 font-bold text-xs uppercase tracking-[0.3em]">Corporate Profile</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-slate-950 leading-[0.85] tracking-tighter">
              BORN IN <br />
              <span className="text-blue-600">AFRICA.</span>
            </h2>
          </div>
          <div className="max-w-md lg:pb-2">
            <p className="text-slate-500 text-lg font-medium leading-relaxed border-l-2 border-blue-600 pl-8">
              We aren't just a platform; we are a movement toward transparency and digital sovereignty in African Real Estate.
            </p>
          </div>
        </div>

        {/* 3. MAIN INTERACTIVE SPLIT */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT: THE FRAME */}
          <div className="lg:col-span-7 relative group">
            <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-2xl transition-transform duration-700 group-hover:scale-[1.01]">
              <Image
                src="/AboutUsImage.jpg" // Replace with your actual path
                alt="Architecture"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-transparent transition-colors duration-500" />
              
              {/* Floating Stat Bar */}
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl flex justify-between items-center">
                <div>
                  <p className="text-3xl font-black text-slate-950">50K+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listings</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-3xl font-black text-blue-600">30+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cities</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-3xl font-black text-slate-950">99%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: THE CONTENT SWITCHER */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#F8FAFC] rounded-[3rem] p-10 md:p-14 border border-slate-100 relative min-h-[480px] flex flex-col justify-between">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                      <CurrentIcon size={28} />
                    </div>
                    <span className="text-[10px] font-black tracking-[.2em] text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                      {cards[activeIndex].tag}
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                    {cards[activeIndex].title}
                  </h3>
                  
                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    {cards[activeIndex].text}
                  </p>

                  <div className="pt-4 grid grid-cols-1 gap-3">
                    {["Verified Listings", "Secure Payments"].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                        <CheckCircle className="text-blue-600" size={18} />
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* CONTROLS AREA */}
              <div className="mt-12 pt-8 border-t border-slate-200 flex items-center justify-between">
                <div className="flex gap-2">
                  {cards.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        idx === activeIndex ? 'w-10 bg-blue-600' : 'w-2 bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
                
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all"
                >
                  {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                </button>
              </div>

              {/* Dynamic Progress Bar */}
              {!isPaused && (
                <motion.div 
                  key={`bar-${activeIndex}`}
                  initial={{ width: 0 }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 5, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-1 bg-blue-600 rounded-b-full"
                />
              )}
            </div>
            
            {/* Secondary CTA Link */}
            <motion.div whileHover={{ x: 10 }} className="inline-flex items-center gap-4 text-slate-950 font-black cursor-pointer group">
                <span className="text-sm tracking-widest uppercase">Explore our full history</span>
                <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <ArrowRight size={20} />
                </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}