"use client";

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedHref } from '@/lib/i18n';
import { Home, Building2, CalendarDays, Hotel } from 'lucide-react';

const TYPES = [
  {
    label: 'Homes',
    icon: Home,
    href: '/properties?propertyType=house',
  },
  {
    label: 'Apartments',
    icon: Building2,
    href: '/properties?propertyType=apartment',
  },
  {
    label: 'Short Stays',
    icon: CalendarDays,
    href: '/properties?listingType=short_term',
  },
  {
    label: 'Hotels',
    icon: Hotel,
    href: '/properties?propertyType=hotel',
  },
];

export default function PropertyTypePills() {
  const { language } = useLanguage();

  return (
    <section className="bg-white border-b border-[#EBEBEB] px-6 lg:px-10">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4">
          {TYPES.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={getLocalizedHref(href, language)}
              className="group flex items-center gap-2 shrink-0 px-5 py-2.5 rounded-full border border-[#DDDDDD] bg-white text-[14px] font-semibold text-[#222222] hover:border-[#222222] hover:shadow-sm transition-all duration-200 whitespace-nowrap"
            >
              <Icon className="w-4 h-4 text-[#717171] group-hover:text-[#222222] transition-colors" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
