'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaBuilding,
  FaUsers,
  FaStar,
  FaLightbulb,
  FaCheckCircle,
  FaHeadset,
} from "react-icons/fa";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const cards = [
  {
    icon: <FaBuilding size={36} />,
    title: "Smart Property Search",
    desc: "Quickly find your ideal property with our advanced search engine.",
    gradient: "from-blue-400 to-blue-600",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  },
  {
    icon: <FaUsers size={36} />,
    title: "Easy Listing Submission",
    desc: "Individuals and agencies can easily publish their properties in just a few clicks.",
    gradient: "from-blue-500 to-blue-700",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
  },
  {
    icon: <FaStar size={36} />,
    title: "Immersive Virtual Tours",
    desc: "Explore properties remotely through our 3D tours and 360° videos.",
    gradient: "from-sky-400 to-blue-600",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  },
  {
    icon: <FaLightbulb size={36} />,
    title: "Personalized Recommendations",
    desc: "Receive property suggestions tailored to your preferences using AI.",
    gradient: "from-cyan-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    icon: <FaCheckCircle size={36} />,
    title: "Secure Title Verification",
    desc: "Ensure property legitimacy with blockchain-based verification.",
    gradient: "from-indigo-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80",
  },
  {
    icon: <FaHeadset size={36} />,
    title: "Intelligent Customer Support",
    desc: "Our AI chatbot assists you 24/7 with all your questions.",
    gradient: "from-blue-600 to-indigo-600",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  },
];

export default function WhatWeOffer() {
  const [activeIndex, setActiveIndex] = useState(2);
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 25, stiffness: 120 });
  const textX = useTransform(smoothProgress, [0, 1], [0, -200]);

  // Auto-scroll to center active card
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const card = container.children[activeIndex] as HTMLElement;
    if (card) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollLeft =
        card.offsetLeft - container.offsetLeft - containerRect.width / 2 + cardRect.width / 2;

      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeIndex]);

  // Debounced scroll handler for better performance
  const onScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      let closestIndex = 0;
      let closestDistance = Infinity;

      Array.from(container.children).forEach((child, i) => {
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.left + childRect.width / 2;
        const containerCenter = containerRect.left + containerRect.width / 2;
        const distance = Math.abs(containerCenter - childCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });

      setActiveIndex(closestIndex);
    }, 50);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setActiveIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "ArrowRight") {
      setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1));
    }
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full min-h-screen select-none bg-slate-50 py-20 overflow-hidden">
      <motion.div
        style={{ x: textX }}
        className="absolute top-10 left-0 whitespace-nowrap select-none pointer-events-none opacity-[0.03] z-0"
      >
        <h2 className="text-[10rem] sm:text-[14rem] lg:text-[20rem] font-black text-slate-900 tracking-tighter">
          HOROHOUSE • SERVICES • AFRICA • HOROHOUSE • SERVICES • AFRICA
        </h2>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
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
                <div className="w-12 h-1 bg-blue-500" />
                <span className="text-blue-500 font-black text-xs uppercase tracking-[0.4em]">Our Services</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                WHAT WE <br />
                <span className="text-blue-500">OFFER.</span>
              </h2>
            </motion.div>
          </div>

          <div className="flex-1 lg:pb-3">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 text-xl md:text-2xl leading-tight max-w-sm border-l-4 border-blue-500 pl-6"
            >
              Premier real estate solutions across Africa — engineered for speed, trust, and clarity.
            </motion.p>
          </div>
        </div>

        <div className="relative">
          <div
            ref={containerRef}
            onScroll={onScroll}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-label="Service cards carousel"
            className="flex space-x-6 overflow-x-auto snap-x snap-mandatory scrollbar-none py-4 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {cards.map((card, i) => {
              const isActive = i === activeIndex;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8 }}
                  className={`snap-center flex-shrink-0 w-72 md:w-80 cursor-pointer transition-all duration-500 rounded-[2.5rem] relative overflow-hidden group ${
                    isActive
                      ? "shadow-2xl scale-105"
                      : "shadow-lg hover:shadow-xl"
                  }`}
                  onClick={() => setActiveIndex(i)}
                  role="button"
                  aria-label={`${card.title}: ${card.desc}`}
                  aria-pressed={isActive}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveIndex(i);
                    }
                  }}
                >
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${card.image})` }}
                    aria-hidden="true"
                  />
                  
                  {/* Black Overlay with gradient accent */}
                  <div
                    className="absolute inset-0 bg-black/40 transition-opacity duration-500"
                    aria-hidden="true"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} transition-opacity duration-500 ${
                      isActive ? "opacity-20" : "opacity-10 group-hover:opacity-15"
                    }`}
                    aria-hidden="true"
                  />

                  <div className="relative z-10 h-full flex flex-col justify-between p-8">
                    <div>
                      {/* Icon container */}
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-white/15 backdrop-blur-sm text-white shadow-lg border border-white/10"
                        aria-hidden="true"
                      >
                        {card.icon}
                      </motion.div>

                      {/* Title */}
                      <h3 className="font-bold text-xl mb-3 text-white">
                        {card.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm leading-relaxed text-white/90">
                        {card.desc}
                      </p>
                    </div>

                    {/* Active indicator badge */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-6 right-6 w-3 h-3 bg-white rounded-full shadow-lg"
                        aria-label="Active card"
                      >
                        <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75"></span>
                      </motion.div>
                    )}
                    
                    {/* Decorative corner element */}
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-tl-full" aria-hidden="true" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Service navigation">
            {cards.map((card, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`View ${card.title}`}
                className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  i === activeIndex
                    ? "w-8 h-2 bg-blue-600"
                    : "w-2 h-2 bg-blue-200 hover:bg-blue-400"
                }`}
              />
            ))}
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-center mt-6 text-slate-500 text-sm md:hidden"
            aria-hidden="true"
          >
            ← Swipe to explore →
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}