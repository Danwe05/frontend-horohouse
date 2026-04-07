'use client';

import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnboardingProgress() {
  const { state, getProgress } = useOnboarding();
  const { user } = useAuth();

  const progress = getProgress();

  const getStepTitle = (step: number) => {
    if (user?.role === 'student') {
      switch (step) {
        case 1: return 'Welcome';
        case 2: return 'University';
        case 3: return 'Verify ID';
        case 4: return 'Done';
        default: return `Step ${step}`;
      }
    }

    if (user?.role === 'agent') {
      switch (step) {
        case 1: return 'Welcome';
        case 2: return 'Agent Info';
        case 3: return 'Properties';
        case 4: return 'Locations';
        case 5: return 'Complete';
        default: return `Step ${step}`;
      }
    }

    // Default user
    switch (step) {
      case 1: return 'Welcome';
      case 2: return 'Properties';
      case 3: return 'Location';
      case 4: return 'Budget';
      default: return `Step ${step}`;
    }
  };

  return (
    <div className="w-full">
      {/* Progress Track */}
      <div className="relative flex items-center justify-between mt-2">
        
        {/* Background line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#EBEBEB] z-0 overflow-hidden">
          {/* Active line */}
          <motion.div
            className="h-full bg-[#222222]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Steps */}
        {Array.from({ length: state.totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === state.currentStep;
          const isCompleted = stepNumber < state.currentStep;

          return (
            <div key={stepNumber} className="relative z-10 flex flex-col items-center group">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isActive || isCompleted ? '#222222' : '#FFFFFF',
                  borderColor: isActive || isCompleted ? '#222222' : '#DDDDDD',
                }}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-[2px] transition-colors duration-300",
                  isActive || isCompleted ? "text-white" : "text-[#717171]"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3]" />
                ) : (
                  <span className="text-[13px] sm:text-[14px] font-bold">
                    {stepNumber}
                  </span>
                )}
              </motion.div>

              {/* Title that appears below */}
              <div className="absolute top-12 w-32 text-center hidden sm:block">
                <span className={cn(
                  "text-[13px] font-semibold transition-colors duration-300",
                  isActive ? "text-[#222222]" : isCompleted ? "text-[#222222]" : "text-[#717171]"
                )}>
                  {getStepTitle(stepNumber)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom spacing for the absolute positioned titles on desktop */}
      <div className="hidden sm:block h-8" />
    </div>
  );
}