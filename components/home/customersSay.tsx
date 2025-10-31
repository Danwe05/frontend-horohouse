'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaQuoteLeft } from 'react-icons/fa';

const customers = [
  {
    name: 'Jean-Marc T.',
    location: 'Lagos, Nigeria',
    role: 'Real Estate Agent',
    text: `"As an agent, I love the visibility and leads I get from HoroHouse. It's easy to use, and the support team is always available. Highly recommend!"`,
    rating: 5,
    img: '/customerSayImage.png',
  },
  {
    name: 'Julienne N.',
    location: 'Yaoundé, Cameroon',
    role: 'Homeowner',
    text: `"I finally found a platform that understands the African market. HoroHouse helped me find a home in Yaoundé in just 3 days. Everything was smooth, and I felt secure throughout."`,
    rating: 5,
    img: '/customerSayImage.png',
  },
  {
    name: 'Fatima S.',
    location: 'Abidjan, Ivory Coast',
    role: 'Property Buyer',
    text: `"Clean interface, verified listings, and great customer service. Just waiting for the mobile app to drop!"`,
    rating: 5,
    img: '/customerSayImage.png',
  },
  {
    name: 'Ali K.',
    location: 'Nairobi, Kenya',
    role: 'Tenant',
    text: `"Fantastic platform! Helped me find an apartment quickly and easily. The virtual tours feature is amazing!"`,
    rating: 5,
    img: '/customerSayImage.png',
  },
  {
    name: 'Sophie M.',
    location: 'Johannesburg, South Africa',
    role: 'Investor',
    text: `"User-friendly and reliable service. The blockchain verification gives me peace of mind. Highly recommended!"`,
    rating: 5,
    img: '/customerSayImage.png',
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex space-x-1">
      {Array.from({ length: count }).map((_, i) => (
        <motion.svg
          key={i}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.1, type: "spring" }}
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-amber-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          stroke="none"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.92-.755 1.688-1.54 1.118L10 13.347l-3.371 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L3.642 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
        </motion.svg>
      ))}
    </div>
  );
}

export default function CustomersSay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [centerIndex, setCenterIndex] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (!container) return;
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

    container.addEventListener('scroll', onScroll, { passive: true });

    onScroll();

    return () => {
      container.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-white via-blue-50/30 to-white py-20 px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl pointer-events-none"></div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <section className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-3 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
            Testimonials
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h3>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say.
          </p>
        </motion.div>

        <div
          ref={containerRef}
          className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-8 px-4"
          style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
        >
          {customers.map((customer, idx) => {
            const isCenter = idx === centerIndex;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={`relative w-96 flex-shrink-0 snap-center transition-all duration-500 ease-out ${
                  isCenter ? 'scale-110' : 'scale-95 opacity-70'
                }`}
              >
                <div
                  className={`relative rounded-3xl overflow-hidden transition-all duration-500 ${
                    isCenter
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-2xl'
                      : 'bg-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {/* Quote icon */}
                  <div
                    className={`absolute top-6 right-6 text-6xl transition-colors duration-500 ${
                      isCenter ? 'text-white/20' : 'text-blue-100'
                    }`}
                  >
                    <FaQuoteLeft />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-8 pt-20">
                    {/* Profile Image */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl ${
                          isCenter ? 'border-white' : 'border-blue-500'
                        }`}
                      >
                        <Image
                          src={customer.img}
                          alt={customer.name}
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      </motion.div>
                    </div>

                    {/* Name and Location */}
                    <div className="text-center mb-4">
                      <h4
                        className={`font-bold text-xl mb-1 transition-colors duration-500 ${
                          isCenter ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {customer.name}
                      </h4>
                      <p
                        className={`text-sm transition-colors duration-500 ${
                          isCenter ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {customer.location}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 transition-colors duration-500 ${
                          isCenter
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {customer.role}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="flex justify-center mb-4">
                      <Stars count={customer.rating} />
                    </div>

                    {/* Testimonial Text */}
                    <p
                      className={`text-sm leading-relaxed text-center transition-colors duration-500 ${
                        isCenter ? 'text-white/90' : 'text-gray-600'
                      }`}
                    >
                      {customer.text}
                    </p>
                  </div>

                  {/* Decorative bottom curve */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-500 ${
                      isCenter
                        ? 'bg-gradient-to-r from-blue-400 to-purple-400'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-12">
          {customers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                const container = containerRef.current;
                if (!container) return;
                const card = container.children[idx] as HTMLElement;
                if (card) {
                  card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
              }}
              className={`transition-all duration-300 rounded-full ${
                idx === centerIndex
                  ? 'w-10 h-3 bg-gradient-to-r from-blue-600 to-blue-700'
                  : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>

        {/* Swipe hint for mobile */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-center mt-8 text-gray-400 text-sm md:hidden"
        >
          ← Swipe to see more →
        </motion.div>
      </section>
    </div>
  );
}