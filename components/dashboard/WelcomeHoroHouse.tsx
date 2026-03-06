'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState<ReactNode | null>(null);
  const { user } = useAuth();
  const displayName = user?.name ;
  const role = user?.role ?? 'user';

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
    <div className="w-full relative overflow-hidden">

      {/* Welcome Text */}
      <div className="">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-700 flex items-center gap-2">
         
            {greeting}    
            {greetingIcon}                       
            , {displayName}!
          
        </h1>
        <p className="text-gray-500 text-lg md:text-sm mt-3 ">
          {role === 'admin' && (
            <>Admin control center — review listings, users and analytics.</>
          )}
          {role === 'agent' && (
            <>Manage your listings, view leads, and grow your business.</>
          )}      
          {role === 'user' && (
            <>Your all-in-one hub to explore properties, save favorites, and contact agents.</>
          )}
        </p>
      </div>


    </div>
  );
};

export default WelcomeHorohouse;