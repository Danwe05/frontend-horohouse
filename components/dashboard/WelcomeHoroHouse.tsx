'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState<ReactNode | null>(null);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const _t = t as any;
  const displayName = user?.name ;
  const role = user?.role ?? 'user';

  useEffect(() => {
    setMounted(true);

    const updateGreeting = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        setGreeting(_t.welcome?.morning || 'Good Morning');
        setGreetingIcon(<Sunrise className="ml-2 h-6 w-6 text-yellow-400" />);
      } else if (hour >= 12 && hour < 17) {
        setGreeting(_t.welcome?.afternoon || 'Good Afternoon');
        setGreetingIcon(<Sun className="ml-2 h-6 w-6 text-yellow-400" />);
      } else if (hour >= 17 && hour < 21) {
        setGreeting(_t.welcome?.evening || 'Good Evening');
        setGreetingIcon(<Sunset className="ml-2 h-6 w-6 text-orange-400" />);
      } else {
        setGreeting(_t.welcome?.night || 'Good Night');
        setGreetingIcon(<Moon className="ml-2 h-6 w-6 text-slate-400" />);
      }
    };

    updateGreeting();
    // Update greeting every minute in case time changes
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Render a stable placeholder until after hydration
  if (!mounted) {
    return (
      <div className="w-full relative overflow-hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-700 flex items-center gap-2">
            {displayName ? `${displayName}!` : ''}
          </h1>
          <p className="text-gray-500 text-lg md:text-sm mt-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden">

      {/* Welcome Text */}
      <div className="">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-700 flex items-center gap-2">
            {greeting}    
            {_t.welcome?.greetingSep || ", "}{displayName}!
            {greetingIcon}                       
        </h1>
        <p className="text-gray-500 text-lg md:text-sm mt-3 ">
          {role === 'admin' && (
            <>{_t.welcome?.adminDesc || 'Admin control center — review listings, users and analytics.'}</>
          )}
          {role === 'agent' && (
            <>{_t.welcome?.agentDesc || 'Manage your listings, view leads, and grow your business.'}</>
          )}      
          {role === 'user' && (
            <>{_t.welcome?.userDesc || 'Your all-in-one hub to explore properties, save favorites, and contact agents.'}</>
          )}
        </p>
      </div>


    </div>
  );
};

export default WelcomeHorohouse;