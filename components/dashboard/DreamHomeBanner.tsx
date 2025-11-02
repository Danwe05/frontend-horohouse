'use client';
import { div } from 'framer-motion/client';
import React from 'react';

const DreamHomeBanner = () => {
  return (
    <div className="bg-blue-500 rounded-lg p-4 flex justify-between items-center">
      <div className="text-white">
        <p className="font-bold text-lg">Get Your</p>
        <p className="font-bold text-lg">Dream Home</p>
        <button className="mt-3 px-4 py-2 bg-white text-black font-semibold rounded-md hover:bg-gray-100 text-xs">
          Contact us
        </button>
      </div>
      <img src="/DashboardCard_Image.png" alt="House" className="w-40 h-30 object-contain" />
    </div>
  );
};

export default DreamHomeBanner;
