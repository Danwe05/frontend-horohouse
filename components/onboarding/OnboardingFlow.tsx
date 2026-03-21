
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
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
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
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-500 font-medium animate-pulse">Setting up your profile...</p>
          </div>
        </div>
      );
    }

    // ── Student flow (4 steps) ──────────────────────────────────────────────
    if (user?.role === 'student') {
      let StepComponent;
      switch (state.currentStep) {
        case 1: StepComponent = <WelcomeStep />; break;
        case 2: StepComponent = <StudentInfoStep />; break;
        case 3: StepComponent = <StudentIdUploadStep />; break;
        default: StepComponent = <StudentCompletionStep />; break;
      }
      return (
        <motion.div
          key={state.currentStep}
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, type: "spring", bounce: 0.1 }}
          className="h-full flex flex-col"
        >
          {StepComponent}
        </motion.div>
      );
    }

    // ── Agent flow (6 steps, unchanged) ────────────────────────────────────
    // ── Default user flow (5 steps, unchanged) ─────────────────────────────
    let StepComponent;
    switch (state.currentStep) {
      case 1: StepComponent = <WelcomeStep />; break;
      case 2: StepComponent = user?.role === 'agent' ? <AgentInfoStep /> : <PropertyPreferencesStep />; break;
      case 3: StepComponent = user?.role === 'agent' ? <PropertyPreferencesStep /> : <LocationStep />; break;
      case 4: StepComponent = user?.role === 'agent' ? <LocationStep /> : <BudgetStep />; break;
      case 5: StepComponent = user?.role === 'agent' ? <BudgetStep /> : <CompletionStep />; break;
      default: StepComponent = <CompletionStep />; break;
    }

    return (
      <motion.div
        key={state.currentStep}
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.4, type: "spring", bounce: 0.1 }}
        className="h-full flex flex-col"
      >
        {StepComponent}
      </motion.div>
    );
  };

  if (state.error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm p-8 bg-white rounded-3xl -xl border border-red-50">
          <div className="text-red-500 mb-6 bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">Oops, an error occurred</h2>
          <p className="text-slate-500 mb-8">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 relative selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-100/50 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
        {/* Progress Bar Header wrapper */}
        <div className="flex-none mb-8 mt-2 w-full max-w-3xl mx-auto">
          {!isInitializing && !state.error && <OnboardingProgress />}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 bg-white/70 backdrop-blur-2xl border border-white -2xl -slate-200/50 rounded-[2rem] overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />
          <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 sm:py-10 z-10 custom-scrollbar">
            <AnimatePresence mode="wait">
              {renderCurrentStep()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
