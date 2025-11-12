'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { WelcomeStep } from './steps/WelcomeStep';
import { PropertyPreferencesStep } from './steps/PropertyPreferencesStep';
import { AgentInfoStep } from './steps/AgentInfoStep';
import { LocationStep } from './steps/LocationStep';
import { BudgetStep } from './steps/BudgetStep';
import { CompletionStep } from './steps/CompletionStep';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2 } from 'lucide-react';

export function OnboardingFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, dispatch } = useOnboarding();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Set total steps based on user role
      const totalSteps = user?.role === 'agent' ? 5 : 4;
      dispatch({ type: 'SET_TOTAL_STEPS', payload: totalSteps });

      // Initialize onboarding on backend
      await onboardingApi.initializeOnboarding(user?.role || 'registered_user');
      
      // Get current onboarding status
      const status = await onboardingApi.getOnboardingStatus();
      
      if (status) {
        dispatch({ type: 'SET_CURRENT_STEP', payload: status.currentStep });
        dispatch({ type: 'SET_COMPLETED', payload: status.isCompleted });
        
        if (status.propertyPreferences) {
          dispatch({ type: 'SET_PROPERTY_PREFERENCES', payload: status.propertyPreferences });
        }
        
        if (status.agentPreferences) {
          dispatch({ type: 'SET_AGENT_PREFERENCES', payload: status.agentPreferences });
        }
      }

      setIsInitializing(false);
    } catch (error) {
      console.error('Failed to initialize onboarding:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize onboarding' });
      setIsInitializing(false);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const renderCurrentStep = () => {
    if (isInitializing) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Setting up your profile...</p>
          </div>
        </div>
      );
    }

    switch (state.currentStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return user?.role === 'agent' ? <AgentInfoStep /> : <PropertyPreferencesStep />;
      case 3:
        return user?.role === 'agent' ? <PropertyPreferencesStep /> : <LocationStep />;
      case 4:
        return user?.role === 'agent' ? <LocationStep /> : <BudgetStep />;
      case 5:
        return user?.role === 'agent' ? <BudgetStep /> : <CompletionStep />;
      default:
        return <CompletionStep />;
    }
  };

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Bar */}
      <OnboardingProgress />
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 bg-blue-100">
        <div className="w-full max-w-2xl">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
}
