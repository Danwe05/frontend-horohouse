'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PropertyBentoGrid() {
  const { t, language } = useLanguage();
  const _t = t as any;

  const propertyTypes = [
    {
      id: '01',
      label: _t.propertyTypeCards?.types?.residential || 'Residential',
      description: _t.propertyTypeCards?.types?.residentialDesc || 'Bespoke family estates and private villas.',
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80',
      gridClass: 'md:col-span-2 md:row-span-2',
    },
    {
      id: '02',
      label: _t.propertyTypeCards?.types?.commercial || 'Commercial',
      description: _t.propertyTypeCards?.types?.commercialDesc || 'High-performance workspaces.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
      gridClass: 'md:col-span-2 md:row-span-1',
    },
    {
      id: '03',
      label: _t.propertyTypeCards?.types?.apartment || 'Apartment',
      description: _t.propertyTypeCards?.types?.apartmentDesc || 'Sky-high luxury living.',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
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

  return (
    <section className="bg-white py-16 px-6 md:px-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">

        {/* Airbnb Style Header - Clean, minimal, readable */}
        <div className="mb-10">
          <h2 className="text-[32px] md:text-[40px] font-semibold text-[#222222] tracking-tight leading-tight mb-2">
            {_t.propertyTypeCards?.title || 'Discover your perfect space'}
          </h2>
          <p className="text-[#717171] text-lg max-w-2xl">
            {_t.propertyTypeCards?.subtitle || 'From private residences to industrial hubs — explore curated properties across every market segment.'}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-[auto] md:grid-rows-[320px_320px] gap-4 md:gap-6">
          {propertyTypes.map((type) => {
            return (
              <div
                key={type.id}
                className={`relative group overflow-hidden rounded-2xl cursor-pointer ${type.gridClass}`}
              >
                {/* Image with subtle zoom on hover (Airbnb signature) */}
                <div className="absolute inset-0 z-0 bg-[#EBEBEB]">
                  <img
                    src={type.image}
                    alt={type.label}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Soft bottom gradient just enough to make text pop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />
                </div>

                {/* Card Content - Always visible, clean layout */}
                <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
                  <h3 className="text-[22px] md:text-2xl font-semibold text-white tracking-tight mb-1">
                    {type.label}
                  </h3>
                  <p className="text-white/90 text-sm md:text-base leading-snug line-clamp-2">
                    {type.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}