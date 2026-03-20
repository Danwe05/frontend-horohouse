'use client';

import { motion } from 'framer-motion';
import { FaGraduationCap, FaSearchLocation, FaHandshake } from 'react-icons/fa';

export default function StudentHero() {
  return (
    <section className="relative bg-blue-600 text-white overflow-hidden pb-12 pt-20">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&h=800&fit=crop"
          alt="Students on campus"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/90 to-blue-600/80" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 lg:px-10">
        <div className="text-center max-w-3xl mx-auto mt-10">
          <motion.span
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full font-semibold backdrop-blur-md mb-6 border border-white/20"
          >
            <FaGraduationCap className="text-lg" />
            HoroCampus
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Student Living, <br />
            <span className="text-blue-200">Simplified & Verified.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100 mb-10"
          >
            Find affordable accommodation close to campus, split rent with verified roommates, and deal only with student-approved landlords.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl flex items-center justify-center gap-2">
              <FaSearchLocation />
              Find Housing
            </button>
            <button className="bg-blue-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-xl flex items-center justify-center gap-2 border border-blue-500/30">
              <FaHandshake />
              Find Roommates
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative wave divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 rotate-180">
        <svg
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(110%+1.3px)] h-[50px] md:h-[70px]"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-gray-50"
          ></path>
        </svg>
      </div>
    </section>
  );
}
