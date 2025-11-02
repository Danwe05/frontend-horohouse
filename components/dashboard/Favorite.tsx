'use client';

import React from 'react';
import SavedPropertiesFavorite from './SavedPropertiesFavorite';
import RecentViewFavorite from './RecentViewFavorite';

// Ligne ondulée style "vague" comme ton image
const WavyLine = () => { 
  return (
    <svg
      className="w-full h-32 md:h-40 absolute bottom-0 left-0"
      viewBox="0 0 1440 320"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path
        fill="white"
        fillOpacity="0.3"
        d="
          M0,160 
          C360,20 1080,300 1440,160 
          L1440,320 
          L0,320 
          Z
        "
      />
    </svg>
  );
};




const WelcomeHorohouse = () => {
  return (
    <div className="w-2xl max-w-6xl bg-white px-10 py-3 relative overflow-hidden">
      {/* Search Bar */}
      <div className="mt-4 mb-8">
        <div className="relative w-[250px] max-w-sm">
          <input
            type="text"
            placeholder="Search"
            className="w-full border border-gray-300 rounded-md py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
      </div>

      
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-blue-600">
          Favorite Properties
        </h1>
        <p className="text-gray-500 text-lg md:text-[15px] mt-3 max-w-md mx-auto">
          Curate your perfect home collection! View and manage your saved listings effortlessly. Your dream properties are always at your fingertips.
        </p>
      </div>

      <div>
        <SavedPropertiesFavorite />
      </div>
    
      {/* Sale Banner */}
      <div className="relative bg-blue-500 rounded-lg p-4 md:px-6 flex flex-col md:flex-row items-center gap-4 text-white overflow-hidden">
        {/* Ligne ondulée */}
        <WavyLine />

        <div className="flex-1 relative z-10">
          <h2 className="text-lg md:text-[20px] font-semibold mb-10 w-60">
            Get new property details direct to your inbox
          </h2>
          
        </div>

        <div className="flex-1 relative z-10">
          <img
            src="/FavoritePage/touchscreen.png"
            alt="House"
            className="w-30 h-30"
          />
        </div>
        <div className='mt-auto cursor-pointer'>
            <button className="bg-white text-blue-500 px-10 py-2 rounded-md font-bold hover:bg-blue-300 transition ">
                Join now
            </button>
        </div>
        
      </div>
      <div>
        <RecentViewFavorite />
      </div>
    </div>
  );
};

export default WelcomeHorohouse;
