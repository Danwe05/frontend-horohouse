'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';

// Adjust this to 'h-4 w-4', 'h-5 w-5', 'h-6 w-6', 'h-8 w-8', etc. to change icon size
const ICON_SIZE_CLASS = 'h-5 w-5';

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
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState<ReactNode | null>(null);
  const { user } = useAuth();
  const displayName = user?.name ? String(user.name).split(' ')[0] : 'HoroHouser';

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        setGreeting('Good Morning');
        setGreetingIcon(<Sunrise className="ml-2 h-6 w-6 text-yellow-400" />);
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good Afternoon');
        setGreetingIcon(<Sun className="ml-2 h-6 w-6 text-yellow-400" />);
      } else if (hour >= 17 && hour < 21) {
        setGreeting('Good Evening');
        setGreetingIcon(<Sunset className="ml-2 h-6 w-6 text-orange-400" />);
      } else {
        setGreeting('Good Night');
        setGreetingIcon(<Moon className="ml-2 h-6 w-6 text-slate-400" />);
      }
    };

    updateGreeting();
    // Update greeting every minute in case time changes
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white py-3 relative overflow-hidden">

      {/* Welcome Text */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-blue-600 flex items-center gap-2">
          <span>
            {greeting}
            {greetingIcon && <span className="ml-2 inline-flex items-center">{greetingIcon}</span>}, {displayName}!
          </span>
        </h1>
        <p className="text-gray-500 text-lg md:text-sm mt-3 ">
          Your all-in-one hub to explore properties, manage listings, and connect seamlessly—start your real estate journey today!
        </p>
      </div>

      {/* Sale Banner */}
      <div className="relative bg-blue-500 rounded-lg p-4 md:px-6 flex flex-col md:flex-row items-center gap-4 text-white overflow-hidden">
        {/* Ligne ondulée */}
        <WavyLine />

        <div className="flex-1 relative z-10">
          <h2 className="text-lg md:text-xl font-semibold mb-2">
            Get Yourself In Big Discount On This Sale
          </h2>
          <button className="bg-white text-blue-500 px-10 py-2 rounded-md font-medium hover:bg-gray-100 transition">
            Explore new
          </button>
        </div>

        <div className="flex-1 relative z-10">
          <img
            src="/Dashboard_Image1.png"
            alt="House"
            className="w-full h-45 object-cover rounded-md"
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeHorohouse;