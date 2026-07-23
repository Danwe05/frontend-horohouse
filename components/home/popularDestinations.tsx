"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedHref } from '@/lib/i18n';
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

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[22px] font-semibold text-[#222222] tracking-tight">
            Explore nearby destinations
          </h2>
          <Link
            href={getLocalizedHref("/properties", language)}
            className="text-[14px] font-semibold underline text-[#222222] hover:text-[#717171] transition-colors hidden md:block"
          >
            Explore all
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:grid-rows-2 md:h-[560px]">
          {cities.map((city, i) => (
            <Link
              href={getLocalizedHref(`/properties?city=${encodeURIComponent(city.name)}`, language)}
              key={i}
              className={`group block relative rounded-xl overflow-hidden ${city.colSpan}`}
            >
              <div className="absolute inset-0 bg-gray-900/20 group-hover:bg-gray-900/30 transition-colors duration-300 z-10" />
              <img
                src={city.img}
                alt={city.name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
              <div className="absolute bottom-0 left-0 p-6 z-20">
                <h3 className="text-[20px] font-semibold text-white leading-none mb-1">{city.name}</h3>
                <p className="text-[13px] text-white/75">{city.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 md:hidden">
          <Link
            href={getLocalizedHref("/properties", language)}
            className="text-[14px] font-semibold underline text-[#222222] hover:text-[#717171] transition-colors"
          >
            Explore all
          </Link>
        </div>

      </div>
    </section>
  );
}
