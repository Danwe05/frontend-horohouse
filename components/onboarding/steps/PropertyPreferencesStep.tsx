'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PROPERTY_TYPES = [
  'Apartment', 'House', 'Condo', 'Townhouse',
  'Villa', 'Studio', 'Duplex', 'Penthouse'
];

const PROPERTY_FEATURES = [
  'Parking', 'Balcony', 'Garden', 'Swimming Pool',
  'Gym', 'Security', 'Elevator', 'Air Conditioning',
  'Furnished', 'Pet Friendly', 'Near Transport', 'Shopping Nearby'
];

export function PropertyPreferencesStep() {
  const { user } = useAuth();
  const { state, nextStep, prevStep, dispatch } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const [preferences, setPreferences] = useState({
    propertyType: state.propertyPreferences?.propertyType || [],
    budget: {
      min: state.propertyPreferences?.budget?.min || 0,
      max: state.propertyPreferences?.budget?.max || 1000000,
      currency: state.propertyPreferences?.budget?.currency || 'USD'
    },
    bedrooms: state.propertyPreferences?.bedrooms || [],
    bathrooms: state.propertyPreferences?.bathrooms || [],
    features: state.propertyPreferences?.features || []
  });

  const handlePropertyTypeChange = (type: string) => {
    setPreferences(prev => {
      const isSelected = prev.propertyType.includes(type);
      return {
        ...prev,
        propertyType: isSelected
          ? prev.propertyType.filter(t => t !== type)
          : [...prev.propertyType, type]
      };
    });
  };

  const handleBedroomChange = (bedroom: number) => {
    setPreferences(prev => {
      const isSelected = prev.bedrooms.includes(bedroom);
      return {
        ...prev,
        bedrooms: isSelected
          ? prev.bedrooms.filter(b => b !== bedroom)
          : [...prev.bedrooms, bedroom]
      };
    });
  };

  const handleBathroomChange = (bathroom: number) => {
    setPreferences(prev => {
      const isSelected = prev.bathrooms.includes(bathroom);
      return {
        ...prev,
        bathrooms: isSelected
          ? prev.bathrooms.filter(b => b !== bathroom)
          : [...prev.bathrooms, bathroom]
      };
    });
  };

  const handleFeatureChange = (feature: string) => {
    setPreferences(prev => {
      const isSelected = prev.features.includes(feature);
      return {
        ...prev,
        features: isSelected
          ? prev.features.filter(f => f !== feature)
          : [...prev.features, feature]
      };
    });
  };

  const handleNext = async () => {
    if (preferences.propertyType.length === 0) return;

    setIsLoading(true);
    try {
      dispatch({
        type: 'SET_PROPERTY_PREFERENCES',
        payload: {
          ...preferences,
          location: state.propertyPreferences?.location || []
        }
      });

      await onboardingApi.updateOnboardingStep({
        currentStep: state.currentStep + 1,
        stepName: 'property-preferences',
        propertyPreferences: {
          ...preferences,
          location: state.propertyPreferences?.location || []
        }
      });

      nextStep();
    } catch (error) {
      console.error('Failed to update property preferences:', error);
      nextStep();
    } finally {
      setIsLoading(false);
    }
  };

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
              Property preferences
            </h2>
            <p className="text-[16px] text-[#717171]">
              Tell us what kind of properties you're looking for.
            </p>
          </div>

          <div className="space-y-10 max-w-3xl">

            {/* Property Types */}
            <div>
              <Label className="text-[18px] font-semibold text-[#222222] mb-1 block">
                Property types <span className="text-[#C2410C]">*</span>
              </Label>
              <p className="text-[15px] text-[#717171] mb-4">Select all that apply.</p>
              
              <div className="flex flex-wrap gap-3">
                {PROPERTY_TYPES.map((type) => {
                  const isSelected = preferences.propertyType.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handlePropertyTypeChange(type)}
                      className={cn(
                        "px-5 py-2.5 rounded-full border text-[15px] font-medium transition-all cursor-pointer whitespace-nowrap",
                        isSelected
                          ? "bg-[#F7F7F7] border-[#222222] text-[#222222] ring-1 ring-[#222222]"
                          : "bg-white border-[#DDDDDD] text-[#222222] hover:border-[#222222]"
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#DDDDDD] pt-8 grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-8">
              {/* Bedrooms */}
              <div>
                <Label className="text-[18px] font-semibold text-[#222222] mb-4 block">
                  Bedrooms
                </Label>
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5].map((bedroom) => {
                    const isSelected = preferences.bedrooms.includes(bedroom);
                    return (
                      <button
                        key={bedroom}
                        onClick={() => handleBedroomChange(bedroom)}
                        className={cn(
                          "w-14 h-14 rounded-full border text-[15px] font-medium transition-all cursor-pointer flex items-center justify-center",
                          isSelected
                            ? "bg-[#F7F7F7] border-[#222222] text-[#222222] ring-1 ring-[#222222]"
                            : "bg-white border-[#DDDDDD] text-[#222222] hover:border-[#222222]"
                        )}
                      >
                        {bedroom}+
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bathrooms */}
              <div>
                <Label className="text-[18px] font-semibold text-[#222222] mb-4 block">
                  Bathrooms
                </Label>
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4].map((bathroom) => {
                    const isSelected = preferences.bathrooms.includes(bathroom);
                    return (
                      <button
                        key={bathroom}
                        onClick={() => handleBathroomChange(bathroom)}
                        className={cn(
                          "w-14 h-14 rounded-full border text-[15px] font-medium transition-all cursor-pointer flex items-center justify-center",
                          isSelected
                            ? "bg-[#F7F7F7] border-[#222222] text-[#222222] ring-1 ring-[#222222]"
                            : "bg-white border-[#DDDDDD] text-[#222222] hover:border-[#222222]"
                        )}
                      >
                        {bathroom}+
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="border-t border-[#DDDDDD] pt-8">
              <Label className="text-[18px] font-semibold text-[#222222] mb-4 block">
                Amenities & Features
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {PROPERTY_FEATURES.map((feature) => {
                  const isSelected = preferences.features.includes(feature);
                  return (
                    <Label
                      key={feature}
                      className="flex items-center space-x-3 p-1 cursor-pointer select-none group"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleFeatureChange(feature)}
                        className="w-6 h-6 border-[#B0B0B0] text-[#222222] data-[state=checked]:bg-[#222222] data-[state=checked]:border-[#222222] rounded shadow-none group-hover:border-[#222222] transition-colors"
                      />
                      <span className="text-[15px] font-normal text-[#222222]">{feature}</span>
                    </Label>
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
            disabled={isLoading || preferences.propertyType.length === 0}
            className="h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}