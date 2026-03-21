'use client';

import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

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
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200/60 rounded-full z-0 overflow-hidden">
          {/* Active line */}
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
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
                  backgroundColor: isActive || isCompleted ? '#2563eb' : '#ffffff',
                  borderColor: isActive || isCompleted ? '#2563eb' : '#cbd5e1',
                  scale: isActive ? 1 : 1
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-colors duration-300 -sm
                  ${isActive ? 'ring-4 ring-blue-100 -blue-200' : '-slate-100'}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                ) : (
                  <span className={`text-sm font-bold ${isActive || isCompleted ? 'text-white' : 'text-slate-400'}`}>
                    {stepNumber}
                  </span>
                )}
              </motion.div>

              {/* Title that appears below */}
              <div className="absolute top-12 w-28 text-center hidden sm:block">
                <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                  {getStepTitle(stepNumber)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom spacing for the absolute positioned titles on desktop */}
      <div className="hidden sm:block h-6" />
    </div>
  );
}
