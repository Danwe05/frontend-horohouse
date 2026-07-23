'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star } from 'lucide-react';

const getCustomers = (t: any) => [
  {
    name: 'Jean-Marc T.',
    location: 'Lagos, Nigeria',
    date: 'February 2026',
    text: `"${t.customersSay?.['0']?.text || "As an agent, I love the visibility and leads I get from HoroHouse. It's easy to use, and the support team is always available."}"`,
    img: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Julienne N.',
    location: 'Yaoundé, Cameroon',
    date: 'January 2026',
    text: `"${t.customersSay?.['1']?.text || "I finally found a platform that understands the African market. HoroHouse helped me find a home in Yaoundé in just 3 days."}"`,
    img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Fatima S.',
    location: 'Abidjan, Ivory Coast',
    date: 'December 2025',
    text: `"${t.customersSay?.['2']?.text || "Clean interface, verified listings, and great customer service. Just waiting for the mobile app to drop!"}"`,
    img: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Ali K.',
    location: 'Nairobi, Kenya',
    date: 'November 2025',
    text: `"${t.customersSay?.['3']?.text || "Fantastic platform! Helped me find an apartment quickly and easily. Highly recommended."}"`,
    img: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=150&h=150&fit=crop&crop=face',
  },
];

export default function CustomersSay() {
  const { t, language } = useLanguage();
  const customers = getCustomers(t);
  const isRtl = language === 'ar';

  return (
    <div className="bg-white py-12 px-6 lg:px-10" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[22px] font-semibold text-[#222222] tracking-tight">
            Guest favorites and reviews
          </h2>
        </div>

        <div className="flex overflow-x-auto gap-4 snap-x pb-4 scrollbar-hide">
          {customers.map((customer, idx) => (
            <div 
              key={idx} 
              className="flex flex-col snap-start shrink-0 w-[300px] md:w-[380px] p-6 lg:p-8 rounded-2xl border border-[#DDDDDD] bg-white hover:shadow-md transition-shadow duration-300 h-[280px]"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
                ))}
              </div>
              <p className="text-[15px] text-[#222222] leading-relaxed mb-auto line-clamp-4">
                {customer.text}
              </p>
              <div className="flex items-center gap-4 mt-6">
                <img 
                  src={customer.img} 
                  alt={customer.name} 
                  className="w-12 h-12 rounded-full object-cover shrink-0" 
                />
                <div>
                  <h4 className="font-semibold text-[15px] text-[#222222] leading-tight">{customer.name}</h4>
                  <p className="text-[13px] text-[#717171]">{customer.location} · {customer.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}