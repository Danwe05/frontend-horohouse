'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const propertyTypes = [
  {
    id: '01',
    label: 'Residential',
    description: 'Bespoke family estates and private villas in prime locations.',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80',
    gridClass: 'md:col-span-2 md:row-span-2',
  },
  {
    id: '02',
    label: 'Commercial',
    description: 'High-performance workspaces.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    gridClass: 'md:col-span-2 md:row-span-1',
  },
  {
    id: '03',
    label: 'Apartment',
    description: 'Sky-high luxury living.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    gridClass: 'md:col-span-1 md:row-span-1',
  },
  {
    id: '04',
    label: 'Industrial',
    description: 'Smart logistics facilities.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    gridClass: 'md:col-span-1 md:row-span-1',
  }
];

export default function PropertyBentoGrid() {
  return (
    <section className="bg-slate-50 py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header — matching "What We Offer" two-column layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:items-end mb-16">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-1 bg-blue-600" />
                <span className="text-blue-600 font-black text-xs uppercase tracking-[0.4em]">Market Access</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                OUR <br />
                <span className="text-blue-600">ASSETS.</span>
              </h2>
            </motion.div>
          </div>

          <div className="flex-1 lg:pb-3">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 text-xl md:text-2xl leading-tight max-w-sm border-l-4 border-blue-600 pl-6"
            >
              From private residences to industrial hubs — curated properties across every market segment.
            </motion.p>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto md:grid-rows-2 gap-4 h-auto md:h-[700px]">
          {propertyTypes.map((type, index) => {
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative group overflow-hidden rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer ${type.gridClass}`}
              >
                {/* Background Image with Zoom on Hover */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={type.image}
                    alt={type.label}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-blue-900/20 transition-colors duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                </div>

                {/* Card Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-8">
                  <div className="flex justify-end items-start">
                    <ArrowUpRight className="text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      View Listings
                    </p>
                    {/* Thin line divider */}
                    <div className="w-8 h-[1.5px] bg-white/40 group-hover:w-12 group-hover:bg-blue-400 transition-all duration-500" />
                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {type.label}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed max-w-[280px] line-clamp-2 md:line-clamp-none">
                      {type.description}
                    </p>
                  </div>
                </div>

                {/* Blue Border Glow on Hover */}
                <div className="absolute inset-0 border-2 border-blue-600/0 group-hover:border-blue-600/50 rounded-[2rem] transition-all duration-500 pointer-events-none" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}