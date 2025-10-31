'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface PropertyPreferences {
  propertyType: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  location: string[];
  bedrooms: number[];
  bathrooms: number[];
  features: string[];
}

export interface AgentPreferences {
  licenseNumber: string;
  agency: string;
  experience: number;
  specializations: string[];
  serviceAreas: string[];
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  propertyPreferences?: PropertyPreferences;
  agentPreferences?: AgentPreferences;
  completedSteps: string[];
  isLoading: boolean;
  error: string | null;
}

export type OnboardingAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_TOTAL_STEPS'; payload: number }
  | { type: 'SET_PROPERTY_PREFERENCES'; payload: PropertyPreferences }
  | { type: 'SET_AGENT_PREFERENCES'; payload: AgentPreferences }
  | { type: 'ADD_COMPLETED_STEP'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_COMPLETED'; payload: boolean }
  | { type: 'RESET_ONBOARDING' };

// Initial state
const initialState: OnboardingState = {
  currentStep: 1,
  totalSteps: 4,
  isCompleted: false,
  completedSteps: [],
  isLoading: false,
  error: null,
};

// Reducer
function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'SET_TOTAL_STEPS':
      return { ...state, totalSteps: action.payload };
    
    case 'SET_PROPERTY_PREFERENCES':
      return { ...state, propertyPreferences: action.payload };
    
    case 'SET_AGENT_PREFERENCES':
      return { ...state, agentPreferences: action.payload };
    
    case 'ADD_COMPLETED_STEP':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.payload)
          ? state.completedSteps
          : [...state.completedSteps, action.payload],
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_COMPLETED':
      return { ...state, isCompleted: action.payload };
    
    case 'RESET_ONBOARDING':
      return initialState;
    
    default:
      return state;
  }
}

// Context
interface OnboardingContextType {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  updatePropertyPreferences: (preferences: PropertyPreferences) => void;
  updateAgentPreferences: (preferences: AgentPreferences) => void;
  completeStep: (stepName: string) => void;
  getProgress: () => number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Provider
interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  const nextStep = () => {
    if (state.currentStep < state.totalSteps) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= state.totalSteps) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: step });
    }
  };

  const updatePropertyPreferences = (preferences: PropertyPreferences) => {
    dispatch({ type: 'SET_PROPERTY_PREFERENCES', payload: preferences });
  };

  const updateAgentPreferences = (preferences: AgentPreferences) => {
    dispatch({ type: 'SET_AGENT_PREFERENCES', payload: preferences });
  };

  const completeStep = (stepName: string) => {
    dispatch({ type: 'ADD_COMPLETED_STEP', payload: stepName });
  };

  const getProgress = () => {
    return Math.round((state.currentStep / state.totalSteps) * 100);
  };

  const value: OnboardingContextType = {
    state,
    dispatch,
    nextStep,
    prevStep,
    goToStep,
    updatePropertyPreferences,
    updateAgentPreferences,
    completeStep,
    getProgress,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Hook
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
