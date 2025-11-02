'use client';

import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

export function OnboardingProgress() {
  const { state, getProgress } = useOnboarding();
  const { user } = useAuth();

  const progress = getProgress();

  const getStepTitle = (step: number) => {
    if (user?.role === 'agent') {
      switch (step) {
        case 1: return 'Welcome';
        case 2: return 'Agent Info';
        case 3: return 'Property Types';
        case 4: return 'Service Areas';
        case 5: return 'Complete';
        default: return `Step ${step}`;
      }
    } else {
      switch (step) {
        case 1: return 'Welcome';
        case 2: return 'Property Types';
        case 3: return 'Location';
        case 4: return 'Budget';
        default: return `Step ${step}`;
      }
    }
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Step {state.currentStep} of {state.totalSteps}: {getStepTitle(state.currentStep)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{progress}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {Array.from({ length: state.totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === state.currentStep;
            const isCompleted = stepNumber < state.currentStep;
            
            return (
              <div
                key={stepNumber}
                className={`flex flex-col items-center ${
                  isActive ? 'text-green-600' : isCompleted ? 'text-green-500' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className="text-xs font-medium">{getStepTitle(stepNumber)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
