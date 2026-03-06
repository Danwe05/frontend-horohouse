'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

const customers = [
  {
    name: 'Jean-Marc T.',
    location: 'Lagos, Nigeria',
    role: 'Real Estate Agent',
    text: `"As an agent, I love the visibility and leads I get from HoroHouse. It's easy to use, and the support team is always available."`,
    rating: 5,
    img: '/testimonials/jean-marc.png',
  },
  {
    name: 'Julienne N.',
    location: 'Yaoundé, Cameroon',
    role: 'Homeowner',
    text: `"I finally found a platform that understands the African market. HoroHouse helped me find a home in Yaoundé in just 3 days."`,
    rating: 5,
    img: '/testimonials/julienne.png',
  },
  {
    name: 'Fatima S.',
    location: 'Abidjan, Ivory Coast',
    role: 'Property Buyer',
    text: `"Clean interface, verified listings, and great customer service. Just waiting for the mobile app to drop!"`,
    rating: 5,
    img: '/testimonials/fatima.png',
  },
  {
    name: 'Ali K.',
    location: 'Nairobi, Kenya',
    role: 'Tenant',
    text: `"Fantastic platform! Helped me find an apartment quickly and easily. The virtual tours feature is amazing!"`,
    rating: 5,
    img: '/testimonials/ali.png',
  },
  {
    name: 'Sophie M.',
    location: 'Johannesburg, South Africa',
    role: 'Investor',
    text: `"User-friendly and reliable service. The blockchain verification gives me peace of mind. Highly recommended!"`,
    rating: 5,
    img: '/testimonials/sophie.png',
  },
];

// Tripling the array to allow for infinite scrolling buffer
const duplicatedCustomers = [...customers, ...customers, ...customers];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex space-x-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < count ? "fill-blue-500 text-blue-500" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function CustomersSay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerIndex, setCenterIndex] = useState(customers.length); // Start in the middle set
  const [isPaused, setIsPaused] = useState(false);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    const card = container.children[index] as HTMLElement;
    if (!card) return;

    const containerWidth = container.offsetWidth;
    const cardWidth = card.offsetWidth;
    const cardLeft = card.offsetLeft;
    const scrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);

    container.scrollTo({ left: scrollLeft, behavior });
  }, []);

  // Initialization: Snap to the middle set
  useEffect(() => {
    // Small timeout to ensure DOM is rendered
    const timer = setTimeout(() => {
      scrollToIndex(customers.length, 'instant');
    }, 50);
    return () => clearTimeout(timer);
  }, [scrollToIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleInfiniteScroll = () => {
      const { scrollLeft, scrollWidth, offsetWidth } = container;
      
      // If we scroll too far left (into the first set), jump to the middle set
      if (scrollLeft <= 0) {
        container.scrollTo({
          left: scrollLeft + (scrollWidth / 3),
          behavior: 'instant'
        });
      } 
      // If we scroll too far right (into the third set), jump to the middle set
      else if (scrollLeft + offsetWidth >= scrollWidth) {
        container.scrollTo({
          left: scrollLeft - (scrollWidth / 3),
          behavior: 'instant'
        });
      }

      // Calculate which item is in the center
      const children = Array.from(container.children);
      const containerCenter = container.offsetWidth / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      children.forEach((child, index) => {
        const childRect = child.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const childCenter = childRect.left - containerRect.left + childRect.width / 2;
        const distance = Math.abs(containerCenter - childCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCenterIndex(closestIndex);
    };

    container.addEventListener('scroll', handleInfiniteScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleInfiniteScroll);
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      scrollToIndex(centerIndex + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, centerIndex, scrollToIndex]);

  return (
    <div className="bg-white py-24 relative overflow-hidden">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <section className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 px-4">
          <span className="inline-block px-4 py-2 mb-3 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
            Testimonials
          </span>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            What Our Customers Say
          </h3>
        </div>

        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={containerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide px-4"
            style={{ 
                scrollSnapType: 'x mandatory',
                paddingLeft: 'calc(50% - 13rem)', // Centers the first item (adjust based on card width)
                paddingRight: 'calc(50% - 13rem)' 
            }}
          >
            {duplicatedCustomers.map((customer, idx) => {
              const isCenter = idx === centerIndex;
              // Map back to original index for the dots
              const originalIndex = idx % customers.length;

              return (
                <div
                  key={idx}
                  className={`relative w-[22rem] md:w-[26rem] flex-shrink-0 snap-center transition-all duration-700 ease-in-out ${
                    isCenter ? 'scale-100 opacity-100' : 'scale-90 opacity-40 blur-[0.5px]'
                  }`}
                  onClick={() => scrollToIndex(idx)}
                >
                  <div className={`relative h-full rounded-2xl p-8 border cursor-pointer transition-colors ${
                    isCenter ? 'bg-white border-gray-200 shadow-xl' : 'bg-gray-50 border-transparent'
                  }`}>
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200 border">
                          <Image src={customer.img} alt={customer.name} fill className="object-cover" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                          <p className="text-sm text-gray-500">{customer.location}</p>
                        </div>
                        <Quote className="ml-auto text-blue-500/10" size={32} />
                      </div>
                      <p className="text-gray-700 leading-relaxed flex-grow">
                        {customer.text}
                      </p>
                      <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                          {customer.role}
                        </span>
                        <Stars count={customer.rating} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Dots (only shows original 5) */}
        <div className="flex justify-center gap-2 mt-8">
          {customers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                // Find the closest instance of this index to the current center
                const currentSet = Math.floor(centerIndex / customers.length);
                scrollToIndex(idx + (currentSet * customers.length));
              }}
              className={`transition-all duration-300 rounded-full ${
                (centerIndex % customers.length) === idx
                  ? 'w-8 h-2 bg-blue-600'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}