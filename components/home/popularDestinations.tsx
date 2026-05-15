"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

export default function PopularDestinations() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  const cities = [
    { name: 'Yaoundé', sub: "Capital City", img: 'https://carcameroun.s3.amazonaws.com/uploads/post/featured_image/234/78.jpg', colSpan: "md:col-span-2 md:row-span-2" },
    { name: 'Douala', sub: "Economic Core", img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTffgalHBN8p1x-JvDzRyeUdU5-X_ddSF2fw&s', colSpan: "md:col-span-1 md:row-span-1" },
    { name: 'Kribi', sub: "Coastal Escapes", img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQx-OvaMz6sivb1MFavCFVwV9wSrO-WZKHR7w&s', colSpan: "md:col-span-1 md:row-span-1" },
    { name: 'Buea', sub: "Mountain Views", img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAje2q2t8XQOIEdFVjhXcdvJ-aoyWBoX7gvw&s', colSpan: "md:col-span-2 md:row-span-1" },
  ];

  return (
    <section className="py-12 px-6 lg:px-10 bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1280px] mx-auto">

        <div className="flex flex-col md:flex-row items-end justify-between mb-12">
          <div className="max-w-xl">
            <h2 className="text-[36px] md:text-[44px] font-bold text-gray-900 tracking-tight mb-4 relative inline-block">
              Trending{' '}
              <span className="relative z-10 whitespace-nowrap">
                destinations
                <span className="absolute bottom-3 left-0 w-full h-4 bg-blue-200/80 -z-10 rounded-sm transform -rotate-1"></span>
              </span>
            </h2>
            <p className="text-[18px] text-gray-500 font-light mt-2">
              Explore the most sought-after cities. Uncover the perfect backdrop for your next stay.
            </p>
          </div>
          <Link href="/properties" className="hidden md:block text-[15px] font-semibold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest">
            Explore All →
          </Link>
        </div>

        {/* Bento Grid Layout - Highly polished and modern */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:grid-rows-2 md:h-[600px]">
          {cities.map((city, i) => (
            <Link href={`/properties?city=${encodeURIComponent(city.name)}`} key={i} className={`group block relative rounded-2xl overflow-hidden ${city.colSpan}`}>
              <div className="absolute inset-0 bg-gray-900/20 group-hover:bg-gray-900/40 transition-colors duration-500 z-10" />
              <img
                src={city.img}
                alt={city.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-0 left-0 p-8 z-20">
                <h3 className="text-[28px] font-bold text-white leading-none mb-2">{city.name}</h3>
                <p className="text-[15px] font-medium text-white/80">{city.sub}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
