"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FaBuilding, FaUsers, FaStar, FaLightbulb, FaCheckCircle, FaHeadset,
} from "react-icons/fa";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";

const getCards = (t: any) => [
  {
    icon: <FaBuilding size={28} />,
    title: t.services?.smartSearch?.title || "Smart Property Search",
    desc: t.services?.smartSearch?.desc || "Quickly find your ideal property with our advanced search engine.",
    gradient: "from-blue-400 to-blue-600",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  },
  {
    icon: <FaUsers size={28} />,
    title: t.services?.easyListing?.title || "Easy Listing Submission",
    desc: t.services?.easyListing?.desc || "Individuals and agencies can easily publish their properties in just a few clicks.",
    gradient: "from-blue-500 to-blue-700",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
  },
  {
    icon: <FaStar size={28} />,
    title: t.services?.virtualTours?.title || "Immersive Virtual Tours",
    desc: t.services?.virtualTours?.desc || "Explore properties remotely through our 3D tours and 360° videos.",
    gradient: "from-sky-400 to-blue-600",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  },
  {
    icon: <FaLightbulb size={28} />,
    title: t.services?.recommendations?.title || "Personalized Recommendations",
    desc: t.services?.recommendations?.desc || "Receive property suggestions tailored to your preferences using AI.",
    gradient: "from-cyan-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    icon: <FaCheckCircle size={28} />,
    title: t.services?.verification?.title || "Secure Title Verification",
    desc: t.services?.verification?.desc || "Ensure property legitimacy with blockchain-based verification.",
    gradient: "from-indigo-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80",
  },
  {
    icon: <FaHeadset size={28} />,
    title: t.services?.support?.title || "Intelligent Customer Support",
    desc: t.services?.support?.desc || "Our AI chatbot assists you 24/7 with all your questions.",
    gradient: "from-blue-600 to-indigo-600",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  },
];

export default function WhatWeOffer() {
  const { t, language } = useLanguage();
  const cards = getCards(t);

  const sectionRef = useRef<HTMLElement | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(2);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 25, stiffness: 120 });
  const textX = useTransform(smoothProgress, [0, 1], [0, -200]);

  useEffect(() => {
    if (!api) return;
    setActiveIndex(api.selectedScrollSnap());
    api.on("select", () => setActiveIndex(api.selectedScrollSnap()));
  }, [api]);

  const scrollTo = (index: number) => api?.scrollTo(index);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen select-none bg-white py-10 sm:py-12 md:py-16 overflow-hidden"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Scrolling background text — clamped so it doesn't destroy mobile layout */}
      <motion.div
        style={{ x: textX }}
        className="absolute top-6 left-0 whitespace-nowrap select-none pointer-events-none opacity-[0.03] z-0"
      >
        <h2 className="text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] font-black text-slate-900 tracking-tighter uppercase">
          {t.services?.banner || 'HOROHOUSE • SERVICES • AFRICA • HOROHOUSE • SERVICES • AFRICA'}
        </h2>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 lg:items-end mb-10 md:mb-14">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-3 md:space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 sm:w-10 h-1 bg-blue-500" />
                <span className="text-blue-500 font-black text-[10px] sm:text-xs uppercase tracking-[0.3em]">
                  {t.services?.title || 'Our Services'}
                </span>
              </div>
              {/* Responsive heading: smaller on mobile, scales up */}
              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase">
                {t.services?.headingLine1 || 'WHAT WE'} <br />
                <span className="text-blue-500">{t.services?.headingLine2 || 'OFFER.'}</span>
              </h2>
            </motion.div>
          </div>

          <div className="flex-1 lg:pb-3">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 text-base sm:text-lg md:text-xl leading-snug max-w-sm border-l-4 border-blue-500 pl-4"
            >
              {t.services?.subtitle || 'Premier real estate solutions across Africa — engineered for speed, trust, and clarity.'}
            </motion.p>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              startIndex: 2,
              direction: language === 'ar' ? 'rtl' : 'ltr',
              dragFree: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 sm:-ml-4 py-4 md:py-8">
              {cards.map((card, i) => {
                const isActive = i === activeIndex;
                return (
                  <CarouselItem
                    key={i}
                    // basis controls card width per breakpoint
                    className="pl-3 sm:pl-4 basis-[78vw] xs:basis-[70vw] sm:basis-[320px] md:basis-[300px] lg:basis-[320px]"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      whileHover={{ y: -6 }}
                      onClick={() => scrollTo(i)}
                      role="button"
                      aria-label={`${card.title}: ${card.desc}`}
                      aria-pressed={isActive}
                      tabIndex={0}
                      // Fixed height: slightly shorter on mobile
                      className={`w-full h-[240px] sm:h-[270px] md:h-[300px] cursor-pointer transition-all duration-500 rounded-[1.5rem] md:rounded-[2.5rem] relative overflow-hidden group ${
                        isActive
                          ? "shadow-2xl scale-[1.02] md:scale-105"
                          : "shadow-md hover:shadow-xl"
                      }`}
                    >
                      {/* Background image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${card.image})` }}
                        aria-hidden="true"
                      />

                      {/* Overlays */}
                      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${card.gradient} transition-opacity duration-500 ${
                          isActive ? "opacity-25" : "opacity-10 group-hover:opacity-20"
                        }`}
                        aria-hidden="true"
                      />

                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-6 md:p-8">
                        <div>
                          <div className="inline-flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 mb-3 md:mb-4 rounded-xl md:rounded-2xl bg-white/15 text-white border border-white/10">
                            {card.icon}
                          </div>
                          <h3 className="font-bold text-base sm:text-lg md:text-xl mb-1.5 md:mb-2 text-white leading-snug">
                            {card.title}
                          </h3>
                          <p className="text-xs sm:text-sm leading-relaxed text-white/85 line-clamp-3">
                            {card.desc}
                          </p>
                        </div>

                        {/* Active ping dot */}
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 md:top-6 md:right-6 w-2.5 h-2.5 bg-white rounded-full"
                            aria-label="Active card"
                          >
                            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                          </motion.div>
                        )}

                        {/* Decorative corner */}
                        <div className="absolute bottom-0 right-0 w-14 h-14 md:w-20 md:h-20 bg-white/5 rounded-tl-full" aria-hidden="true" />
                      </div>
                    </motion.div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6 md:mt-8" role="tablist" aria-label="Service navigation">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  i === activeIndex
                    ? "w-7 sm:w-8 h-2 bg-blue-600"
                    : "w-2 h-2 bg-blue-200 hover:bg-blue-400"
                }`}
              />
            ))}
          </div>

          {/* Swipe hint — mobile only */}
          <motion.p
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-center mt-4 text-slate-400 text-xs lg:hidden"
            aria-hidden="true"
          >
            {t.services?.swipe || '← Swipe to explore →'}
          </motion.p>
        </div>
      </div>
    </section>
  );
}