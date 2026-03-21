'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, Home, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const PROPERTY_TYPES = [
  'Apartment', 'House', 'Condo', 'Townhouse',
  'Villa', 'Studio', 'Duplex', 'Penthouse'
];

const PROPERTY_FEATURES = [
  'Parking', 'Balcony', 'Garden', 'Swimming Pool',
  'Gym', 'Security', 'Elevator', 'Air Conditioning',
  'Furnished', 'Pet Friendly', 'Near Transport', 'Shopping Nearby'
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' }
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

  const handlePropertyTypeChange = (type: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      propertyType: checked
        ? [...prev.propertyType, type]
        : prev.propertyType.filter(t => t !== type)
    }));
  };

  const handleBedroomChange = (bedroom: number, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      bedrooms: checked
        ? [...prev.bedrooms, bedroom]
        : prev.bedrooms.filter(b => b !== bedroom)
    }));
  };

  const handleBathroomChange = (bathroom: number, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      bathrooms: checked
        ? [...prev.bathrooms, bathroom]
        : prev.bathrooms.filter(b => b !== bathroom)
    }));
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      features: checked
        ? [...prev.features, feature]
        : prev.features.filter(f => f !== feature)
    }));
  };

  const handleNext = async () => {
    if (preferences.propertyType.length === 0) {
      // Optional: use a toast instead of an alert
      alert('Please select at least one property type');
      return;
    }

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

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div className="text-center mb-6 sm:mb-8 shrink-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto w-14 h-14 bg-blue-50/80 rounded-2xl flex items-center justify-center mb-3 -inner border border-blue-100/50"
        >
          <Home className="h-7 w-7 text-blue-600" />
        </motion.div>
        <motion.h2 variants={fadeUpVariant} initial="hidden" animate="visible" className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Property Preferences
        </motion.h2>
        <motion.p variants={fadeUpVariant} initial="hidden" animate="visible" className="text-slate-500 mt-2 text-sm sm:text-base">
          Tell us what kind of properties you're looking for
        </motion.p>
      </div>

      <div className="flex-1 px-1 pb-4">
        <div className="space-y-6 sm:space-y-8">

          {/* Property Types */}
          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Label className="text-base font-semibold text-slate-800 mb-3 block">
              Property Types *
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PROPERTY_TYPES.map((type) => (
                <Label
                  key={type}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-1 transition-all cursor-pointer select-none
                    ${preferences.propertyType.includes(type)
                      ? 'border-blue-500 bg-blue-50/50 text-blue-700 -sm -blue-100'
                      : 'border-slate-200 bg-white/50 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                    }`}
                >
                  <Checkbox
                    checked={preferences.propertyType.includes(type)}
                    onCheckedChange={(checked) => handlePropertyTypeChange(type, checked as boolean)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-center">{type}</span>
                </Label>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Bedrooms */}
            <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Label className="text-base font-semibold text-slate-800 mb-3 block">
                Bedrooms
              </Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((bedroom) => {
                  const isChecked = preferences.bedrooms.includes(bedroom);
                  return (
                    <Label
                      key={bedroom}
                      className={`flex items-center justify-center w-12 h-12 rounded-xl border-1 font-medium transition-all cursor-pointer select-none
                        ${isChecked
                          ? 'border-blue-500 bg-blue-50 text-blue-700 -sm -blue-100'
                          : 'border-slate-200 bg-white/50 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => handleBedroomChange(bedroom, checked as boolean)}
                        className="sr-only"
                      />
                      <span>{bedroom}+</span>
                    </Label>
                  );
                })}
              </div>
            </motion.div>

            {/* Bathrooms */}
            <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Label className="text-base font-semibold text-slate-800 mb-3 block">
                Bathrooms
              </Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((bathroom) => {
                  const isChecked = preferences.bathrooms.includes(bathroom);
                  return (
                    <Label
                      key={bathroom}
                      className={`flex items-center justify-center w-12 h-12 rounded-xl border-1 font-medium transition-all cursor-pointer select-none
                        ${isChecked
                          ? 'border-blue-500 bg-blue-50 text-blue-700 -sm -blue-100'
                          : 'border-slate-200 bg-white/50 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => handleBathroomChange(bathroom, checked as boolean)}
                        className="sr-only"
                      />
                      <span>{bathroom}+</span>
                    </Label>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Label className="text-base font-semibold text-slate-800 mb-3 block">
              Preferred Features
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PROPERTY_FEATURES.map((feature) => (
                <Label
                  key={feature}
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none
                    ${preferences.features.includes(feature)
                      ? 'border-blue-300 bg-blue-50/50 text-blue-800'
                      : 'border-slate-200 bg-white/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  <Checkbox
                    checked={preferences.features.includes(feature)}
                    onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className="text-sm font-medium">{feature}</span>
                </Label>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Buttons fixed at bottom */}
      <motion.div
        variants={fadeUpVariant} initial="hidden" animate="visible"
        className="shrink-0 pt-6 mt-4 border-t border-slate-100 flex justify-between items-center bg-transparent"
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
          disabled={isLoading || preferences.propertyType.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 sm:px-8 -md -blue-200/50"
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
}