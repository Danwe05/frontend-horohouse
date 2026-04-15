'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function PropertyBentoGrid() {
  const { t, language } = useLanguage();
  const _t = t as any;

  const propertyTypes = [
    {
      id: '01',
      label: _t.propertyTypeCards?.types?.residential || 'Residential',
      description: _t.propertyTypeCards?.types?.residentialDesc || 'Bespoke family estates and private villas.',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      gridClass: 'md:col-span-2 md:row-span-2',
      badge: 'Most Popular'
    },
    {
      id: '02',
      label: _t.propertyTypeCards?.types?.commercial || 'Commercial',
      description: _t.propertyTypeCards?.types?.commercialDesc || 'High-performance workspaces.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      gridClass: 'md:col-span-2 md:row-span-1',
    },
    {
      id: '03',
      label: _t.propertyTypeCards?.types?.apartment || 'Apartments',
      description: _t.propertyTypeCards?.types?.apartmentDesc || 'Sky-high luxury living.',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      gridClass: 'md:col-span-1 md:row-span-1',
    },
    {
      id: '04',
      label: _t.propertyTypeCards?.types?.industrial || 'Industrial',
      description: _t.propertyTypeCards?.types?.industrialDesc || 'Smart logistics facilities.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      gridClass: 'md:col-span-1 md:row-span-1',
    }
  ];

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  return (
    <section className="bg-white py-20 px-6 lg:px-10 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-[1200px] mx-auto">

       {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div className="max-w-3xl">
            {/* Elegant Kicker / Tagline */}
            <span className="text-blue-600 font-bold tracking-widest text-[13px] uppercase mb-4 block">
              {_t.propertyTypeCards?.tagline || 'Explore Collections'}
            </span>
            
            {/* Massive, tightly-tracked headline */}
            <h2 className="text-4xl md:text-[56px] font-semibold text-[#222222] tracking-tighter leading-[1.05] mb-5">
              {_t.propertyTypeCards?.title || 'Discover your perfect space'}
            </h2>
            
            {/* Softer, slightly larger subtitle */}
            <p className="text-[#717171] text-lg md:text-xl leading-relaxed max-w-2xl">
              {_t.propertyTypeCards?.subtitle || 'From private residences to industrial hubs — explore curated properties across every market segment.'}
            </p>
          </div>

          {/* Desktop Action Button aligned to the right */}
          <div className="hidden md:block shrink-0 pb-2">
            <button className="px-6 py-3.5 rounded-xl border border-[#DDDDDD] text-[#222222] font-semibold text-[15px] hover:border-[#222222] hover:bg-[#F7F7F7] active:scale-[0.98] transition-all">
              {_t.propertyTypeCards?.exploreAll || 'Explore all'}
            </button>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-4 grid-rows-[minmax(250px,auto)] md:grid-rows-[340px_340px] gap-4 lg:gap-6"
        >
          {propertyTypes.map((type) => (
            <motion.div
              key={type.id}
              className={`relative group overflow-hidden rounded-3xl cursor-pointer ${type.gridClass} min-h-[280px] md:min-h-0 shadow-sm hover:shadow-xl transition-shadow duration-500`}
            >
              {/* Background Image with Zoom */}
              <div className="absolute inset-0 bg-[#F7F7F7]">
                <img
                  src={type.image}
                  alt={type.label}
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                />
                {/* Refined Vignette Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
              </div>

              {/* Optional Top Badge */}
              {type.badge && (
                <div className="absolute top-6 left-6 z-20">
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                    {type.badge}
                  </span>
                </div>
              )}

              {/* Content Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-8">
                <div className="flex items-end justify-between gap-4 transform transition-transform duration-500 group-hover:-translate-y-2">
                  <div>
                    <h3 className="text-3xl font-semibold text-white tracking-tight mb-2">
                      {type.label}
                    </h3>
                    <p className="text-white/80 text-base leading-snug max-w-sm line-clamp-2">
                      {type.description}
                    </p>
                  </div>

                  {/* Hover Action Button */}
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-[0.22,1,0.36,1]">
                    <ArrowRight className="w-5 h-5 text-[#222222]" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
      </div>
    </section>
  );
}