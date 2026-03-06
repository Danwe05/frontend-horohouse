"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoveRight, MapPin, Building2 } from 'lucide-react';

const sectors = [
  {
    id: '01',
    label: 'Residential',
    title: 'BASTOS SIGNATURE',
    description: 'Ultra-luxurious private estates in the heart of Yaoundé, combining traditional Sahelian elegance with modern security.',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071',
    location: 'Bastos, Yaoundé'
  },
  {
    id: '02',
    label: 'Commercial',
    title: 'AKWA BUSINESS HUB',
    description: 'Grade-A office towers designed for the burgeoning tech and financial sectors in Douala’s economic center.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070',
    location: 'Akwa, Douala'
  },
  {
    id: '03',
    label: 'Apartment',
    title: 'KRIBI OCEAN VIEW',
    description: 'High-end seaside residences offering 360-degree views of the Atlantic, merging tourism with urban luxury.',
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=2070',
    location: 'Coastal Road, Kribi'
  },
  {
    id: '04',
    label: 'Industrial',
    title: 'NEXUS LOGISTICS PORT',
    description: 'Smart warehousing and logistics facilities supporting the Deep Sea Port operations and regional trade.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070',
    location: 'Industrial Zone, Kribi'
  }
];

export default function CameroonCinematicShowcase() {
  const [active, setActive] = useState(0);

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col lg:flex-row overflow-hidden font-sans select-none">
      
      {/* NAVIGATION: SIDEBAR (DESKTOP) / TOP BAR (MOBILE) */}
      <aside className="w-full lg:w-1/3 h-auto lg:h-full border-b lg:border-r lg:border-b-0 border-white/5 flex flex-col p-6 lg:p-12 justify-between z-20 bg-slate-950/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-4 mb-8 lg:mb-20">
            <div className="h-8 w-8 bg-blue-500 rounded-sm rotate-45 flex items-center justify-center">
                <Building2 size={16} className="text-white -rotate-45" />
            </div>
            <span className="text-white font-bold tracking-[0.2em] text-sm uppercase">Cameroun • HoroHouse</span>
          </div>

          {/* Desktop List / Mobile Scroller */}
          <div className="flex lg:flex-col gap-6 lg:gap-12 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
            {sectors.map((item, index) => (
              <div 
                key={item.id}
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                className="group cursor-pointer relative shrink-0"
              >
                <div className="flex items-center gap-4 lg:gap-6">
                  <span className={`font-mono text-[10px] lg:text-xs transition-colors duration-300 ${active === index ? 'text-blue-500' : 'text-slate-600'}`}>
                    {item.id}
                  </span>
                  <h3 className={`text-lg lg:text-2xl font-bold tracking-tight transition-all duration-300 ${active === index ? 'text-white translate-x-1 lg:translate-x-2' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {item.label}
                  </h3>
                </div>
                {active === index && (
                  <motion.div 
                    layoutId="activeBar"
                    className="absolute -bottom-1 lg:bottom-auto lg:-left-12 lg:top-1/2 lg:-translate-y-1/2 w-full lg:w-1 h-[2px] lg:h-8 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block space-y-4">
          <p className="text-slate-500 text-[10px] font-mono tracking-widest leading-loose uppercase">
            Emerging Markets • Douala • Yaoundé <br /> 
            <span className="text-blue-500/50 italic">Developing the Central African Hub.</span>
          </p>
          <div className="h-px w-24 bg-blue-500" />
        </div>
      </aside>

      {/* RIGHT: THE VIEWPORT */}
      <main className="flex-1 relative overflow-hidden bg-slate-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <img 
              src={sectors[active].image} 
              alt={sectors[active].title} 
              className="w-full h-full object-cover brightness-[0.3] lg:brightness-[0.4]"
            />

            {/* Content Overlays */}
            <div className="absolute inset-0 p-8 lg:p-20 flex flex-col justify-end pointer-events-none">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 text-blue-500 mb-4"
              >
                <MapPin size={16} />
                <span className="font-mono text-xs lg:text-sm tracking-[0.4em] uppercase font-bold">
                    {sectors[active].location}
                </span>
              </motion.div>
              
              <motion.h2 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl lg:text-8xl font-black text-white tracking-tighter mb-6 lg:mb-8 max-w-2xl leading-[0.9]"
              >
                {sectors[active].title}
              </motion.h2>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12"
              >
                <p className="text-slate-300 text-sm lg:text-lg max-w-md leading-relaxed">
                  {sectors[active].description}
                </p>
                <div className="pointer-events-auto">
                    <button className="h-14 w-14 lg:h-20 lg:w-20 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-blue-500 hover:border-blue-500 transition-all group">
                        <MoveRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
              </motion.div>
            </div>

            {/* Decorative Outline Text (Hidden on small mobile) */}
            <div className="hidden sm:block absolute top-10 right-10 select-none pointer-events-none">
              <span className="text-[6rem] lg:text-[12rem] font-black text-transparent uppercase leading-none" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.05)' }}>
                {sectors[active].label}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Corner HUD */}
        <div className="absolute top-6 right-6 lg:top-auto lg:bottom-10 lg:right-10 flex gap-4">
           <div className="p-3 lg:p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-sm">
              <span className="text-blue-500 font-mono text-[10px] block mb-1 font-bold uppercase tracking-widest">Growth Rate</span>
              <span className="text-white text-lg lg:text-xl font-bold italic">+12.4% YOY</span>
           </div>
        </div>
      </main>
    </div>
  );
}