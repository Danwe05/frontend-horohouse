'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LocationStep() {
  const { user } = useAuth();
  const { state, nextStep, prevStep, dispatch } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const [locationInput, setLocationInput] = useState('');
  const [locations, setLocations] = useState<string[]>(
    user?.role === 'agent'
      ? state.agentPreferences?.serviceAreas || []
      : state.propertyPreferences?.location || []
  );

  const handleAddLocation = () => {
    const trimmedLocation = locationInput.trim();
    if (trimmedLocation && !locations.includes(trimmedLocation)) {
      setLocations(prev => [...prev, trimmedLocation]);
      setLocationInput('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setLocations(prev => prev.filter(l => l !== location));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLocation();
    }
  };

  const isFormValid = () => {
    return locations.length > 0;
  };

  const getStepData = () => {
    if (user?.role === 'agent') {
      return {
        title: 'Service areas',
        description: 'Where do you provide your real estate services?',
        placeholder: 'e.g. Downtown',
        popularAreas: ['Downtown', 'Suburbs', 'Northside', 'West End', 'Historic District']
      };
    } else {
      return {
        title: 'Preferred locations',
        description: 'Where would you like to find properties?',
        placeholder: 'e.g. City Center',
        popularAreas: ['City Center', 'Suburbs', 'Uptown', 'Near Transit', 'Quiet Neighborhoods']
      };
    }
  };

  const stepData = getStepData();

  const handleNext = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      if (user?.role === 'agent') {
        const updatedAgentPreferences = {
          ...state.agentPreferences!,
          serviceAreas: locations
        };

        dispatch({ type: 'SET_AGENT_PREFERENCES', payload: updatedAgentPreferences });
        await onboardingApi.updateOnboardingStep({
          currentStep: state.currentStep + 1,
          stepName: 'service-areas',
          agentPreferences: updatedAgentPreferences
        });
      } else {
        const updatedPropertyPreferences = {
          ...state.propertyPreferences!,
          location: locations
        };

        dispatch({ type: 'SET_PROPERTY_PREFERENCES', payload: updatedPropertyPreferences });
        await onboardingApi.updateOnboardingStep({
          currentStep: state.currentStep + 1,
          stepName: 'preferred-locations',
          propertyPreferences: updatedPropertyPreferences
        });
      }

      nextStep();
    } catch (error) {
      console.error('Failed to update location preferences:', error);
      nextStep();
    } finally {
      setIsLoading(false);
    }
  };

  function handleAddLocationSuggestion(area: string) {
    if (!locations.includes(area)) {
      setLocations(prev => [...prev, area]);
    }
  }

  // Airbnb input styling
  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";

  return (
    <div className="flex flex-col h-full">
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-10">
            <h2 className="text-[32px] sm:text-[36px] font-semibold text-[#222222] tracking-tight mb-2">
              {stepData.title}
            </h2>
            <p className="text-[16px] text-[#717171]">
              {stepData.description}
            </p>
          </div>

          <div className="space-y-8 max-w-3xl">

            {/* Input Area */}
            <div>
              <Label htmlFor="location" className="text-[18px] font-semibold text-[#222222] mb-4 block">
                Add areas <span className="text-[#C2410C]">*</span>
              </Label>
              <div className="flex gap-3">
                <Input
                  id="location"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={stepData.placeholder}
                  className={inputClasses}
                />
                <Button
                  type="button"
                  onClick={handleAddLocation}
                  disabled={!locationInput.trim()}
                  className="h-14 w-14 rounded-xl shrink-0 bg-[#222222] hover:bg-black text-white p-0 disabled:opacity-50"
                >
                  <Plus className="w-6 h-6 stroke-[2]" />
                </Button>
              </div>
            </div>

            {/* Selected Locations Container */}
            <div className="min-h-[140px] p-6 rounded-2xl border border-[#DDDDDD] bg-[#F7F7F7]">
              <AnimatePresence>
                {locations.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {locations.map((loc) => (
                      <motion.div
                        key={loc}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-[#222222] text-[#222222] text-[15px] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                      >
                        {loc}
                        <button
                          type="button"
                          onClick={() => handleRemoveLocation(loc)}
                          className="ml-2 w-5 h-5 rounded-full bg-[#EBEBEB] hover:bg-[#DDDDDD] flex items-center justify-center transition-colors focus:outline-none"
                        >
                          <X className="w-3 h-3 text-[#222222] stroke-[2]" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#717171] py-8">
                    <span className="text-[15px]">No locations added yet</span>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Suggestions */}
            <div className="pt-4">
              <Label className="text-[16px] font-semibold text-[#222222] mb-4 block">
                Popular suggestions
              </Label>
              <div className="flex flex-wrap gap-3">
                {stepData.popularAreas.map((area) => {
                  const isSelected = locations.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => handleAddLocationSuggestion(area)}
                      disabled={isSelected}
                      className="px-4 py-2 text-[14px] font-medium border border-[#DDDDDD] rounded-full hover:border-[#222222] transition-all disabled:opacity-40 disabled:bg-[#F7F7F7] disabled:border-[#DDDDDD] text-[#222222]"
                    >
                      + {area}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] p-4 sm:p-6 z-50">
        <div className="max-w-[850px] mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            className="text-[16px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
          >
            Back
          </button>
          <Button
            onClick={handleNext}
            disabled={isLoading || !isFormValid()}
            className="h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Next"}
          </Button>
        </div>
      </div>

    </div>
  );
}