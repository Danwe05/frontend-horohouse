'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const SPECIALIZATIONS = [
  'Residential Sales', 'Commercial Real Estate', 'Luxury Properties',
  'First-time Buyers', 'Investment Properties', 'New Construction',
  'Foreclosures', 'Short Sales', 'Rental Properties',
  'Property Management', 'Land Sales', 'Relocation Services'
];

const EXPERIENCE_RANGES = [
  { value: 0, label: 'New Agent (0-1 years)' },
  { value: 2, label: '2-5 years' },
  { value: 6, label: '6-10 years' },
  { value: 11, label: '11-15 years' },
  { value: 16, label: '16-20 years' },
  { value: 21, label: '20+ years' }
];

export function AgentInfoStep() {
  const { user } = useAuth();
  const { state, nextStep, prevStep, dispatch } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const [agentInfo, setAgentInfo] = useState({
    licenseNumber: state.agentPreferences?.licenseNumber || '',
    agency: state.agentPreferences?.agency || '',
    experience: state.agentPreferences?.experience || 0,
    specializations: state.agentPreferences?.specializations || []
  });

  const handleSpecializationChange = (specialization: string) => {
    setAgentInfo(prev => {
      const isSelected = prev.specializations.includes(specialization);
      return {
        ...prev,
        specializations: isSelected
          ? prev.specializations.filter(s => s !== specialization)
          : [...prev.specializations, specialization]
      };
    });
  };

  const isFormValid = () => {
    return agentInfo.licenseNumber.trim() !== '' &&
      agentInfo.agency.trim() !== '' &&
      agentInfo.specializations.length > 0;
  };

  const handleNext = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      dispatch({
        type: 'SET_AGENT_PREFERENCES',
        payload: { ...state.agentPreferences, ...agentInfo, serviceAreas: state.agentPreferences?.serviceAreas || [] }
      });

      await onboardingApi.updateOnboardingStep({
        currentStep: state.currentStep + 1,
        stepName: 'agent-info',
        agentPreferences: { ...state.agentPreferences, ...agentInfo, serviceAreas: state.agentPreferences?.serviceAreas || [] }
      });

      nextStep();
    } catch (error) {
      console.error('Failed to update agent info:', error);
      nextStep(); 
    } finally {
      setIsLoading(false);
    }
  };

  // Airbnb input styling
  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";
  const selectClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-32">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-10">
            <h2 className="text-[32px] sm:text-[36px] font-semibold text-[#222222] tracking-tight mb-2">
              Professional details
            </h2>
            <p className="text-[16px] text-[#717171]">
              Let's set up your agent credentials so clients can verify you.
            </p>
          </div>

          <div className="space-y-8 max-w-3xl">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="license" className="text-[15px] font-medium text-[#222222]">
                  License number <span className="text-[#C2410C]">*</span>
                </Label>
                <Input
                  id="license"
                  value={agentInfo.licenseNumber}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  placeholder="e.g. DRE# 01234567"
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency" className="text-[15px] font-medium text-[#222222]">
                  Agency / Brokerage <span className="text-[#C2410C]">*</span>
                </Label>
                <Input
                  id="agency"
                  value={agentInfo.agency}
                  onChange={(e) => setAgentInfo(prev => ({ ...prev, agency: e.target.value }))}
                  placeholder="Where do you work?"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="space-y-2 max-w-[300px]">
              <Label htmlFor="experience" className="text-[15px] font-medium text-[#222222]">
                Years of experience
              </Label>
              <select
                id="experience"
                value={agentInfo.experience.toString()}
                onChange={(e) => setAgentInfo(prev => ({ ...prev, experience: parseInt(e.target.value) }))}
                className={selectClasses}
              >
                {EXPERIENCE_RANGES.map((range) => (
                  <option key={range.value} value={range.value.toString()}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#DDDDDD]">
              <div>
                <Label className="text-[18px] font-semibold text-[#222222]">
                  Specializations <span className="text-[#C2410C]">*</span>
                </Label>
                <p className="text-[15px] text-[#717171] mt-1">Select at least one area of expertise.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {SPECIALIZATIONS.map((specialization) => {
                  const isSelected = agentInfo.specializations.includes(specialization);
                  return (
                    <button
                      key={specialization}
                      onClick={() => handleSpecializationChange(specialization)}
                      className={cn(
                        "px-5 py-2.5 rounded-full border text-[15px] font-medium transition-all cursor-pointer whitespace-nowrap",
                        isSelected
                          ? "bg-[#F7F7F7] border-[#222222] text-[#222222] ring-1 ring-[#222222]"
                          : "bg-white border-[#DDDDDD] text-[#222222] hover:border-[#222222]"
                      )}
                    >
                      {specialization}
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