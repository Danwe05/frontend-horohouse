'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Cpu, TrendingUp } from 'lucide-react';

const features = [
  {
    title: "Vetted Intelligence",
    description: "Every property in our collection is passed through a multi-dimensional verification protocol.",
    icon: <Shield className="w-7 h-7" />,
  },
  {
    title: "Hyper-Local Precision",
    description: "We map the African real estate landscape with data-driven accuracy you won't find elsewhere.",
    icon: <Target className="w-7 h-7" />,
  },
  {
    title: "Next-Gen Engine",
    description: "Built on high-performance architecture for a search experience that feels like the future.",
    icon: <Cpu className="w-7 h-7" />,
  },
  {
    title: "Wealth Preservation",
    description: "Tailored for the serious investor seeking high-yield assets in emerging urban hubs.",
    icon: <TrendingUp className="w-7 h-7" />,
  },
];

const WhyHoroHouseCinematic = () => {
  return (
    <section className="relative bg-[#050505] py-32 overflow-hidden">
      
      {/* Background Blueprint/Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{ backgroundImage: `linear-gradient(#2563EB 0.5px, transparent 0.5px), linear-gradient(90deg, #2563EB 0.5px, transparent 0.5px)`, 
           backgroundSize: '80px 80px' }} />
      
      {/* Central Blue-600 Light Source */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 mb-6 rounded-full border border-blue-600/30 bg-blue-600/5 text-blue-500 text-xs font-bold tracking-[0.3em] uppercase"
          >
            The HoroHouse Standard
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none"
          >
            WHY <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-700">US?</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed"
          >
            A convergence of elite technology and uncompromising real estate standards.
          </motion.p>
        </div>

        {/* Floating Feature Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="group relative p-10 bg-transparent border border-white/5 hover:bg-white/[0.02] transition-all duration-700"
            >
              {/* Feature Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(400px_at_center,rgba(37,99,235,0.05),transparent)]" />
              
              <div className="relative z-10">
                <div className="mb-8 text-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-500 transform-gpu">
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4 tracking-tight">
                  {feature.title}
                </h3>
                
                <p className="text-slate-500 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                  {feature.description}
                </p>

                {/* Animated Accent Line */}
                <div className="mt-8 h-[2px] w-0 bg-blue-600 transition-all duration-700 group-hover:w-12" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subtle CTA Footnote */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <p className="text-slate-500 text-sm font-mono tracking-wider italic">
            // STATUS: SYSTEM_READY_FOR_UPGRADE
          </p>
          <div className="flex gap-4">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">Experience Excellence</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default WhyHoroHouseCinematic;