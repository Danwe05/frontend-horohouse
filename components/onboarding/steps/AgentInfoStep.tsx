'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, User, ChevronRight, ChevronLeft, Building2, MapPin, Briefcase, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setAgentInfo(prev => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, specialization]
        : prev.specializations.filter(s => s !== specialization)
    }));
  };

  const isFormValid = () => {
    return agentInfo.licenseNumber.trim() !== '' &&
      agentInfo.agency.trim() !== '' &&
      agentInfo.specializations.length > 0;
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      return;
    }

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
          className="mx-auto w-14 h-14 bg-indigo-50/80 rounded-2xl flex items-center justify-center mb-3 -inner border border-indigo-100/50"
        >
          <Briefcase className="h-7 w-7 text-indigo-600" />
        </motion.div>
        <motion.h2 variants={fadeUpVariant} initial="hidden" animate="visible" className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Professional Details
        </motion.h2>
        <motion.p variants={fadeUpVariant} initial="hidden" animate="visible" className="text-slate-500 mt-2 text-sm sm:text-base">
          Let's set up your agent credentials
        </motion.p>
      </div>

      <div className="flex-1 px-1 pb-4">
        <div className="space-y-6 sm:space-y-8">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* License Number */}
            <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-2">
              <Label htmlFor="license" className="text-sm font-semibold text-slate-700 flex items-center">
                <Award className="w-4 h-4 mr-1 text-slate-400" /> License Number *
              </Label>
              <Input
                id="license"
                value={agentInfo.licenseNumber}
                onChange={(e) => setAgentInfo(prev => ({ ...prev, licenseNumber: e.target.value }))}
                placeholder="e.g. DRE# 01234567"
                className="bg-white/50 border-slate-200 focus-visible:ring-indigo-500 rounded-xl h-11"
              />
            </motion.div>

            {/* Agency */}
            <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-2">
              <Label htmlFor="agency" className="text-sm font-semibold text-slate-700 flex items-center">
                <Building2 className="w-4 h-4 mr-1 text-slate-400" /> Agency/Brokerage *
              </Label>
              <Input
                id="agency"
                value={agentInfo.agency}
                onChange={(e) => setAgentInfo(prev => ({ ...prev, agency: e.target.value }))}
                placeholder="Where do you work?"
                className="bg-white/50 border-slate-200 focus-visible:ring-indigo-500 rounded-xl h-11"
              />
            </motion.div>
          </div>

          {/* Experience */}
          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-2 max-w-md">
            <Label htmlFor="experience" className="text-sm font-semibold text-slate-700">
              Years of Experience
            </Label>
            <Select
              value={agentInfo.experience.toString()}
              onValueChange={(value) => setAgentInfo(prev => ({ ...prev, experience: parseInt(value) }))}
            >
              <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-indigo-500 rounded-xl h-11">
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 -xl">
                {EXPERIENCE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value.toString()} className="hover:bg-indigo-50 focus:bg-indigo-50 focus:text-indigo-900 cursor-pointer">
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Specializations */}
          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
            <Label className="text-base font-semibold text-slate-800">
              Specializations * <span className="text-xs font-normal text-slate-500 ml-1">(Select at least one)</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SPECIALIZATIONS.map((specialization) => {
                const isSelected = agentInfo.specializations.includes(specialization);
                return (
                  <Label
                    key={specialization}
                    className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none
                      ${isSelected
                        ? 'border-indigo-300 bg-indigo-50/50 text-indigo-800 -sm -indigo-100/50'
                        : 'border-slate-200 bg-white/50 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                      }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSpecializationChange(specialization, checked as boolean)}
                      className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <span className="text-sm font-medium">{specialization}</span>
                  </Label>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Buttons fixed at bottom */}
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
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 sm:px-8 -md -indigo-200/50"
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