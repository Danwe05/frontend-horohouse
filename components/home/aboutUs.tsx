'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, CheckCircle, Home, Rocket, Users, Globe, Leaf, Building2, MapPin, Smile, MessageCircle } from 'lucide-react';

const cards = [
  {
    title: "Your Trusted Real Estate Partner Across Africa",
    text: "At Horo House, we are redefining the way people discover, rent, buy, and sell properties across Africa. Born from a vision to simplify real estate access and increase property transparency, our platform is built with a deep understanding of local markets, cultural needs, and modern technology.",
    icon: Home,
    shade: "50",
  },
  {
    title: "Innovative Technology for Seamless Experience",
    text: "We integrate cutting-edge AI and blockchain technology to ensure transparency, security, and an unparalleled user experience across all African real estate markets.",
    icon: Rocket,
    shade: "100",
  },
  {
    title: "Connecting Communities and Markets",
    text: "Our platform connects buyers, sellers, and renters directly to foster trust and community development, breaking down traditional barriers in real estate transactions.",
    icon: Users,
    shade: "200",
  },
  {
    title: "Localized Expertise and Support",
    text: "With teams on the ground in multiple countries, we provide localized support and knowledge, ensuring you get the best deals tailored to your market.",
    icon: Globe,
    shade: "300",
  },
  {
    title: "Sustainable and Ethical Real Estate",
    text: "Committed to sustainability, we promote ethical real estate practices that contribute to healthier communities and environmental stewardship.",
    icon: Leaf,
    shade: "400",
  },
];

export default function AboutUs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % cards.length);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const handleIndicatorClick = (idx: number) => {
    setDirection(idx > activeIndex ? 1 : -1);
    setActiveIndex(idx);
  };

  const handlePauseToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused((prev) => !prev);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  const CurrentIcon = cards[activeIndex].icon;
  const currentShade = cards[activeIndex].shade;

  return (
    <div className="bg-white py-20 px-6 relative overflow-hidden">
      {/* Decorative background elements - blue tones */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <section className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-5 py-2 mb-4 text-sm font-bold text-blue-600 bg-blue-100 rounded-full uppercase tracking-wide">
            Our Story
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">About Us</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Building the future of African real estate, one property at a time
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative">
          {/* Image - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative z-20"
          >
            <div className="relative rounded-3xl overflow-hidden group border-8 border-white">
              <div className="relative h-[400px] md:h-[550px]">
                <Image
                  src="/AboutUsImage.jpg"
                  alt="About Us Image"
                  fill
                  className="object-cover transition-transform duration-700 group--105"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              
              {/* Stats overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">50k+</p>
                    <p className="text-xs text-gray-600 font-medium">Properties</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">30+</p>
                    <p className="text-xs text-gray-600 font-medium">Countries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">40k+</p>
                    <p className="text-xs text-gray-600 font-medium">Customers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative corner accent - all blue */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-600 rounded-2xl opacity-20"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500 rounded-2xl opacity-20"></div>
          </motion.div>

          {/* Content Card - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative z-10"
          >
            <div className="bg-white rounded-3xl overflow-hidden relative border border-gray-100">
              {/* Top accent bar - always blue */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600 transition-all duration-500"></div>

              <div className="p-8 md:p-12 min-h-[500px] flex flex-col">
                {/* Icon with background - varying blue shades */}
                <motion.div
                  key={`icon-${activeIndex}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className={`w-20 h-20 bg-blue-${currentShade} rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500`}
                >
                  <CurrentIcon className="w-10 h-10 text-blue-600" strokeWidth={2} />
                </motion.div>

                {/* Content with animation */}
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={activeIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="space-y-5"
                    >
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                        {cards[activeIndex].title}
                      </h3>
                      <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                        {cards[activeIndex].text}
                      </p>

                      {/* Key features list */}
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Verified and secure transactions</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">24/7 customer support</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Pan-African coverage</span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-gray-100">
                  {/* Indicators */}
                  <div className="flex gap-3">
                    {cards.map((card, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleIndicatorClick(idx)}
                        className="relative group"
                        aria-label={`Slide ${idx + 1}`}
                      >
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            idx === activeIndex 
                              ? 'w-12 bg-blue-600'
                              : 'w-3 bg-gray-300 group-hover:bg-gray-400'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>

                  {/* Pause/Play button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePauseToggle}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 border-2 ${
                      isPaused
                        ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                        : 'bg-blue-50 text-blue-600 border-transparent hover:border-blue-300'
                    }`}
                  >
                    {isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
                  </motion.button>
                </div>

                {/* Progress bar - always blue */}
                {!isPaused && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    key={activeIndex}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievement Cards */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Achievements That Matter
            </h3>
            <p className="text-gray-600">Building trust through transparency and excellence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "50k+", label: "Properties Listed", icon: Building2 },
              { value: "30+", label: "Countries Served", icon: MapPin },
              { value: "40k+", label: "Happy Customers", icon: Smile },
              { value: "24/7", label: "Support Available", icon: MessageCircle },
            ].map((stat, index) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all border border-gray-100 text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <StatIcon className="w-8 h-8 text-blue-600" strokeWidth={2} />
                  </div>
                  <p className="text-4xl font-bold mb-2 text-blue-600">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div> */}
      </section>
    </div>
  );
}