'use client';

import React, { useState, useRef, useEffect } from "react";
import {
  FaBuilding,
  FaUsers,
  FaStar,
  FaLightbulb,
  FaCheckCircle,
  FaHeadset,
} from "react-icons/fa";
import { motion } from "framer-motion";

const cards = [
  {
    icon: <FaBuilding size={36} />,
    title: "Smart Property Search",
    desc: "Quickly find your ideal property with our advanced search engine.",
    gradient: "from-blue-400 to-blue-600",
  },
  {
    icon: <FaUsers size={36} />,
    title: "Easy Listing Submission",
    desc: "Individuals and agencies can easily publish their properties in just a few clicks.",
    gradient: "from-blue-500 to-blue-700",
  },
  {
    icon: <FaStar size={36} />,
    title: "Immersive Virtual Tours",
    desc: "Explore properties remotely through our 3D tours and 360° videos.",
    gradient: "from-sky-400 to-blue-600",
  },
  {
    icon: <FaLightbulb size={36} />,
    title: "Personalized Recommendations",
    desc: "Receive property suggestions tailored to your preferences using AI.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: <FaCheckCircle size={36} />,
    title: "Secure Title Verification",
    desc: "Ensure property legitimacy with blockchain-based verification.",
    gradient: "from-indigo-500 to-blue-600",
  },
  {
    icon: <FaHeadset size={36} />,
    title: "Intelligent Customer Support",
    desc: "Our AI chatbot assists you 24/7 with all your questions.",
    gradient: "from-blue-600 to-indigo-600",
  },
];

export default function WhatWeOffer() {
  const [activeIndex, setActiveIndex] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const onScroll = () => {
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
  };

  return (
    <section className="w-full py-10 select-none bg-blue-50 to-white relative overflow-hidden">
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 mb-3 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full">
            Our Services
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            What We Offer
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Premier Real Estate Solutions Across Africa
          </p>
        </motion.div>

        <div className="mx-4 md:mx-12 relative">

          <div
            ref={containerRef}
            onScroll={onScroll}
            className="flex space-x-6 overflow-x-auto sndap-x snap-mandatory scrollbar-none py-4 px-2"
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
                  className={`snap-center flex-shrink-0 w-72 md:w-80 p-8 cursor-pointer transition-all duration-500 rounded-2xl relative overflow-hidden group ${isActive
                      ? "shadow-2xl scale-105"
                      : "shadow-lgd hover:shadow-xl bg-white"
                    }`}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, var(--tw-gradient-stops))`
                      : undefined,
                  }}
                  onClick={() => setActiveIndex(i)}
                >
                  {/* Active card gradient background */}
                  {isActive && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-100`}
                    ></div>
                  )}

                  {/* Hover gradient overlay for inactive cards */}
                  {!isActive && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    ></div>
                  )}

                  <div className="relative z-10">
                    {/* Icon container */}
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`inline-flex items-center justify-center w-16 h-16 mb-5 rounded-xl transition-all duration-300 ${isActive
                          ? "bg-white/20 backdrop-blur-sm text-white"
                          : "bg-gradient-to-br " + card.gradient + " text-white shadow-md"
                        }`}
                    >
                      {card.icon}
                    </motion.div>

                    {/* Title */}
                    <h3
                      className={`font-bold text-xl mb-3 transition-colors duration-300 ${isActive ? "text-white" : "text-gray-900"
                        }`}
                    >
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p
                      className={`text-sm leading-relaxed transition-colors duration-300 ${isActive ? "text-white/90" : "text-gray-600"
                        }`}
                    >
                      {card.desc}
                    </p>

                    {/* Decorative element */}
                    <div
                      className={`absolute bottom-0 right-0 w-20 h-20 rounded-tl-full transition-opacity duration-300 ${isActive
                          ? "bg-white/10"
                          : "bg-gradient-to-br " + card.gradient + " opacity-5"
                        }`}
                    ></div>
                  </div>

                  {/* Active indicator badge */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full shadow-lg"
                    >
                      <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75"></span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-6">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`transition-all duration-300 rounded-full ${i === activeIndex
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
            className="text-center mt-6 text-blue-400 text-sm md:hidden"
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