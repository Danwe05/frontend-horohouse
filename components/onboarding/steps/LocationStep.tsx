'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, MapPin, ChevronRight, ChevronLeft, Plus, X } from 'lucide-react';
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
        title: 'Service Areas',
        description: 'Where do you provide your real estate services?',
        placeholder: 'Enter a city or neighborhood...',
        helpText: 'Add all the areas where you actively work',
        popularAreas: ['Downtown', 'Suburbs', 'Northside', 'West End', 'Historic District']
      };
    } else {
      return {
        title: 'Preferred Locations',
        description: 'Where would you like to find properties?',
        placeholder: 'Enter a city or neighborhood...',
        helpText: 'Add all locations you\'d like to search in',
        popularAreas: ['City Center', 'Suburbs', 'Uptown', 'Near Transit', 'Quiet Neighborhoods']
      };
    }
  };

  const stepData = getStepData();

  const handleNext = async () => {
    if (!isFormValid()) {
      return;
    }

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

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      <div className="text-center mb-6 sm:mb-8 shrink-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto w-14 h-14 bg-teal-50/80 rounded-2xl flex items-center justify-center mb-3 -inner border border-teal-100/50"
        >
          <MapPin className="h-7 w-7 text-teal-600" />
        </motion.div>
        <motion.h2 variants={fadeUpVariant} initial="hidden" animate="visible" className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {stepData.title}
        </motion.h2>
        <motion.p variants={fadeUpVariant} initial="hidden" animate="visible" className="text-slate-500 mt-2 text-sm sm:text-base px-4">
          {stepData.description}
        </motion.p>
      </div>

      <div className="flex-1 px-1 pb-4">
        <div className="space-y-6 sm:space-y-8 max-w-xl mx-auto">

          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Label htmlFor="location" className="text-base font-semibold text-slate-800 mb-3 block">
              Add Areas *
            </Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={stepData.placeholder}
                className="flex-1 bg-white/70 border-slate-200 focus-visible:ring-teal-500 h-12 rounded-xl text-base -sm"
              />
              <Button
                type="button"
                onClick={handleAddLocation}
                disabled={!locationInput.trim()}
                className="h-12 w-12 rounded-xl shrink-0 bg-slate-900 hover:bg-slate-800 text-white p-0"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-slate-400 mt-2 text-center">
              Press Enter or click + to add multiple locations
            </p>
          </motion.div>

          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="min-h-[120px] p-4 rounded-2xl border-1 border-dashed border-slate-200 bg-white/30 backdrop-blur-sm">
              <AnimatePresence>
                {locations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {locations.map((loc, idx) => (
                      <motion.div
                        key={loc}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-100/50 text-teal-800 text-sm font-medium -sm"
                      >
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-teal-500" />
                        {loc}
                        <button
                          type="button"
                          onClick={() => handleRemoveLocation(loc)}
                          className="ml-2 hover:bg-teal-200/50 rounded-md p-0.5 transition-colors text-teal-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                    <MapPin className="w-8 h-8 opacity-20 mb-2" />
                    <span className="text-sm">No selected locations yet</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Label className="text-sm border-b border-slate-100 pb-2 font-medium text-slate-600 mb-3 block">
              Suggestions
            </Label>
            <div className="flex flex-wrap gap-2">
              {stepData.popularAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleAddLocationSuggestion(area)}
                  disabled={locations.includes(area)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:bg-slate-50 text-slate-600"
                >
                  + {area}
                </button>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      <motion.div
        variants={fadeUpVariant} initial="hidden" animate="visible"
        className="shrink-0 pt-6 mt-4 border-t border-slate-100 flex justify-between items-center"
      >
        <Button
          onClick={prevStep}
          variant="ghost"
          className="text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl px-4 sm:px-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={isLoading || !isFormValid()}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 sm:px-8 -md -teal-200/50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <span className="flex items-center font-medium">
              Next Step
              <ChevronRight className="w-5 h-5 ml-1" />
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );

  function handleAddLocationSuggestion(area: string) {
    if (!locations.includes(area)) {
      setLocations(prev => [...prev, area]);
    }
  }
}