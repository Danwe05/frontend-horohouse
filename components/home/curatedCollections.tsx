"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { getLocalizedHref } from '@/lib/i18n';
import Link from 'next/link';

export default function CuratedCollections() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(Math.abs(scrollLeft) > 0);
      setCanScrollRight(Math.abs(scrollLeft) < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 600 : 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  const collections = [
    { title: "Beachfront", icon: "https://a0.muscache.com/pictures/bcd1adc0-5cee-4d7a-85ec-f6730b0f8d0c.jpg", query: "?query=beachfront" },
    { title: "Student Housing", icon: "https://a0.muscache.com/pictures/c0a24c04-ce1f-490c-833f-987613930eca.jpg", query: "?amenities=student_friendly" },
    { title: "Amazing pools", icon: "https://a0.muscache.com/pictures/3fb523a0-b622-4368-8142-b5e03df7549b.jpg", query: "?amenities=pool" },
    { title: "Pet-friendly", icon: "https://a0.muscache.com/pictures/1229410d-2b47-4952-aa38-2dfaf36c34e7.jpg", query: "?amenities=pets_allowed" },
    { title: "Villas", icon: "https://a0.muscache.com/pictures/3b1eb541-46d9-4bef-abc4-c37d77e3c21b.jpg", query: "?propertyType=villa" },
    { title: "Mansion", icon: "https://a0.muscache.com/pictures/78ba8486-6ba6-4a43-a56d-f556189193da.jpg", query: "?propertyType=mansion" },
    { title: "Luxe", icon: "https://a0.muscache.com/pictures/c8e2ed05-c666-47b6-99fc-4cb6edc18b1c.jpg", query: "?luxe=true" },
    { title: "City Breaks", icon: "https://a0.muscache.com/pictures/ed8b8e47-609b-44c2-9768-33e6a22eccb2.jpg", query: "?city=douala" },
    { title: "Design", icon: "https://a0.muscache.com/pictures/50861fca-582c-4ce5-b7ce-228af4f75e2e.jpg", query: "?query=modern" },
    { title: "Historical", icon: "https://a0.muscache.com/pictures/33848f9e-8dd6-4777-b905-ed38342bacb9.jpg", query: "?query=vintage" },
  ];

  return (
    <section className="bg-white py-6 md:py-8 px-6 lg:px-10 border-t border-[#EBEBEB] w-full shadow-sm sticky top-0 md:relative z-30" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto relative group">
        
        {canScrollLeft && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-white via-white to-transparent pr-8 py-2">
            <button 
              onClick={() => scroll(isRtl ? 'right' : 'left')}
              className="w-8 h-8 rounded-full border border-[#DDDDDD] bg-white flex items-center justify-center hover:scale-105 hover:shadow-md transition-all duration-200 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-[#222222]" />
            </button>
          </div>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-8 md:gap-10 overflow-x-auto scrollbar-hide no-scrollbar px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {collections.map((item, index) => (
            <Link href={getLocalizedHref(`/properties${item.query}`, language)} key={index}>
              <div className="flex flex-col items-center justify-center min-w-[70px] cursor-pointer group/item opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src={item.icon} 
                  alt={item.title} 
                  className="w-6 h-6 object-contain mb-2 filter grayscale group-hover/item:grayscale-0"
                />
                <span className="text-[12px] font-semibold text-[#222222] whitespace-nowrap pb-2 border-b-2 border-transparent group-hover/item:border-[#222222] transition-all">
                  {item.title}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {canScrollRight && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-l from-white via-white to-transparent pl-8 py-2">
            <button 
              onClick={() => scroll(isRtl ? 'left' : 'right')}
              className="w-8 h-8 rounded-full border border-[#DDDDDD] bg-white flex items-center justify-center hover:scale-105 hover:shadow-md transition-all duration-200 shadow-sm"
            >
              <ChevronRight className="w-4 h-4 text-[#222222]" />
            </button>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}
