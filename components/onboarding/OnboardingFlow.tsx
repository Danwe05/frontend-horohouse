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
import { StudentInfoStep } from './steps/StudentInfoStep';
import { StudentIdUploadStep } from './steps/StudentIdUploadStep';
import { StudentCompletionStep } from './steps/StudentCompletionStep';
import { CompletionStep } from './steps/CompletionStep';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const stepVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 }
};

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
      const totalSteps = user?.role === 'agent' ? 6 : user?.role === 'student' ? 4 : 5;
      dispatch({ type: 'SET_TOTAL_STEPS', payload: totalSteps });

      await onboardingApi.initializeOnboarding(user?.role || 'registered_user');
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
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full">
          <Loader2 className="h-8 w-8 animate-spin text-[#222222] mb-4 stroke-[2.5]" />
          <p className="text-[15px] font-semibold text-[#222222]">Setting things up...</p>
        </div>
      );
    }

    let StepComponent;

    // ── Student flow (4 steps) ──────────────────────────────────────────────
    if (user?.role === 'student') {
      switch (state.currentStep) {
        case 1: StepComponent = <WelcomeStep />; break;
        case 2: StepComponent = <StudentInfoStep />; break;
        case 3: StepComponent = <StudentIdUploadStep />; break;
        default: StepComponent = <StudentCompletionStep />; break;
      }
    } else {
      // ── Agent flow (6 steps) & Default user flow (5 steps) ─────────────────
      switch (state.currentStep) {
        case 1: StepComponent = <WelcomeStep />; break;
        case 2: StepComponent = user?.role === 'agent' ? <AgentInfoStep /> : <PropertyPreferencesStep />; break;
        case 3: StepComponent = user?.role === 'agent' ? <PropertyPreferencesStep /> : <LocationStep />; break;
        case 4: StepComponent = user?.role === 'agent' ? <LocationStep /> : <BudgetStep />; break;
        case 5: StepComponent = user?.role === 'agent' ? <BudgetStep /> : <CompletionStep />; break;
        default: StepComponent = <CompletionStep />; break;
      }
    }

    return (
      <motion.div
        key={state.currentStep}
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full flex flex-col w-full"
      >
        {StepComponent}
      </motion.div>
    );
  };

  // ── Error State ──
  if (state.error) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-[400px] w-full">
          <div className="w-16 h-16 rounded-full bg-[#FFF7ED] flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-[#C2410C] stroke-[2]" />
          </div>
          <h2 className="text-[26px] font-semibold text-[#222222] mb-3 tracking-tight">Something went wrong</h2>
          <p className="text-[16px] text-[#717171] mb-8">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-12 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Main Layout ──
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-white relative overflow-x-hidden">
      
      {/* Top Navbar / Logo Area (Hidden on Step 1 so WelcomeStep can take over) */}
      

      {/* Main Content Area */}
      <div className={cn("flex-1 flex flex-col w-full", state.currentStep > 1 && "pt-[0px]")}>
        
        {/* Progress Bar Header */}
        {!isInitializing && !state.error && state.currentStep > 1 && (
          <div className="w-full max-w-[850px] mx-auto px-6 sm:px-10 pt-10 pb-4">
            <OnboardingProgress />
          </div>
        )}

        {/* Dynamic Step Container */}
        <div className="flex-1 flex flex-col w-full max-w-[850px] mx-auto px-6 sm:px-10 pb-32">
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DDDDDD;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B0B0B0;
        }
      `}</style>
    </div>
  );
}