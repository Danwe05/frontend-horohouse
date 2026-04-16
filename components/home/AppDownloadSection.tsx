'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AppDownloadSection() {
  return (
    <section className="w-full bg-[#F7F7F7] border-y border-[#EBEBEB] overflow-hidden font-sans">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between">
        
        {/* Left: Typography & CTA */}
        <div className="py-16 lg:py-24 md:w-1/2 md:pr-10 z-10 text-center md:text-left">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-[44px] lg:text-[52px] font-semibold tracking-tight text-[#222222] mb-4 leading-[1.1]"
          >
            Get the HoroHouse app
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-[#717171] mb-10 leading-relaxed max-w-md mx-auto md:mx-0"
          >
            Find your perfect place, message hosts, and manage your property portfolio from anywhere.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center md:items-start gap-6"
          >
            {/*  QR Code Box (Hidden on small mobile) */}
            <div className="hidden sm:flex flex-col items-center gap-3 p-4 bg-white border border-[#EBEBEB] rounded-xl shadow-sm">
              {/* Place a QR code PNG in your public folder as /qr-code.png */}
              <div className="w-24 h-24 bg-[#F7F7F7] flex items-center justify-center rounded">
                <img 
                  src="/qr-code.png" 
                  alt="Scan QR Code" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback square if no QR code image is found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('border', 'border-dashed', 'border-[#B0B0B0]');
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#717171] uppercase tracking-widest">
                Scan to download
              </span>
            </div>

            {/* Standard Black Store Badges */}
            <div className="flex flex-col gap-4 justify-center">
              <a 
                href="#ios-app" 
                className="transition-opacity hover:opacity-70 active:scale-[0.98] transform"
              >
                <img 
                  src="/app-store-badge.png" 
                  alt="Download on the App Store" 
                  className="h-[40px] w-auto object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden px-5 py-2.5 bg-black text-white rounded-lg font-semibold text-sm flex items-center justify-center">
                  Download on the App Store
                </div>
              </a>
              
              <a 
                href="#android-app" 
                className="transition-opacity hover:opacity-70 active:scale-[0.98] transform"
              >
                <img 
                  src="/google-play-badge.png" 
                  alt="Get it on Google Play" 
                  className="h-[40px] w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden px-5 py-2.5 bg-black text-white rounded-lg font-semibold text-sm flex items-center justify-center">
                  Get it on Google Play
                </div>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Right: Minimal Phone Mockup */}
        <div className="md:w-1/2 w-full h-[350px] md:h-[500px] relative flex justify-center md:justify-end items-end pt-10">
          <motion.img
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            src="/mobile-mockup.png"
            alt="HoroHouse App Interface"
            className="absolute bottom-[-15%] md:bottom-[-20%] w-[260px] md:w-[320px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            onError={(e) => {
              // Clean wireframe fallback
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          
          {/* Wireframe Fallback (If no /mobile-mockup.png exists) */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden absolute bottom-[-10%] md:bottom-[-15%] w-[260px] md:w-[320px] h-[500px] bg-white rounded-t-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border-[10px] border-b-0 border-[#222222] p-2"
          >
            <div className="w-full h-full bg-[#F7F7F7] rounded-t-[1.5rem] overflow-hidden pt-6 px-4">
              <div className="w-1/2 h-4 bg-[#EBEBEB] rounded-full mb-6" />
              <div className="w-full h-48 bg-white rounded-xl shadow-sm mb-4" />
              <div className="w-full h-48 bg-white rounded-xl shadow-sm" />
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}