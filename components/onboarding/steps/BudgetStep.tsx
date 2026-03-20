'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding, AgentPreferences, PropertyPreferences } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const CURRENCIES = [
  { value: 'XAF', label: 'XAF (FCFA)', symbol: 'FCFA' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' }
];

const BUDGET_PRESETS = {
  buyer: [
    { min: 0, max: 200000, label: 'Under 200K' },
    { min: 200000, max: 500000, label: '200K - 500K' },
    { min: 500000, max: 750000, label: '500K - 750K' },
    { min: 750000, max: 1000000, label: '750K - 1M' },
    { min: 1000000, max: 2000000, label: '1M - 2M' },
    { min: 2000000, max: 10000000, label: '2M+' }
  ],
  agent: [
    { min: 0, max: 300000, label: 'Up to 300K' },
    { min: 300000, max: 600000, label: '300K - 600K' },
    { min: 600000, max: 1000000, label: '600K - 1M' },
    { min: 1000000, max: 2000000, label: '1M - 2M' },
    { min: 2000000, max: 5000000, label: '2M - 5M' },
    { min: 5000000, max: 20000000, label: '5M+' }
  ]
};

const COMMISSION_RANGES = [
  { min: 2.5, max: 3.0, label: '2.5% - 3.0%' },
  { min: 3.0, max: 3.5, label: '3.0% - 3.5%' },
  { min: 3.5, max: 4.0, label: '3.5% - 4.0%' },
  { min: 4.0, max: 5.0, label: '4.0% - 5.0%' },
  { min: 5.0, max: 6.0, label: '5.0% - 6.0%' },
  { min: 6.0, max: 10.0, label: '6.0%+' }
];

export function BudgetStep() {
  const { user } = useAuth();
  const { state, nextStep, prevStep, dispatch } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const isAgent = user?.role === 'agent';
  const currentBudget = state.propertyPreferences?.budget || { min: 0, max: 1000000, currency: 'XAF' };

  const [budget, setBudget] = useState({
    min: currentBudget.min,
    max: currentBudget.max,
    currency: currentBudget.currency
  });

  const [commissionRate, setCommissionRate] = useState(3.0);

  const formatCurrency = (amount: number) => {
    const currency = CURRENCIES.find(c => c.value === budget.currency);
    const symbol = currency?.symbol || 'FCFA';

    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handlePresetSelect = (preset: { min: number; max: number }) => {
    setBudget(prev => ({ ...prev, min: preset.min, max: preset.max }));
  };

  const handleSliderChange = (values: number[]) => {
    setBudget(prev => ({ ...prev, min: values[0], max: values[1] }));
  };

  const getStepData = () => {
    if (isAgent) {
      return {
        title: 'Commission & Range',
        description: 'Set your commission rate and property price range you work with',
        budgetLabel: 'Property Price Range'
      };
    } else {
      return {
        title: 'Budget Range',
        description: 'What\'s your budget for purchasing a property?',
        budgetLabel: 'Your Budget Range'
      };
    }
  };

  const stepData = getStepData();
  const presets = isAgent ? BUDGET_PRESETS.agent : BUDGET_PRESETS.buyer;
  const maxSliderValue = isAgent ? 5000000 : 2000000;

  const isFormValid = () => budget.min >= 0 && budget.max > budget.min;

  const handleNext = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      if (isAgent) {
        const updatedAgentPreferences = {
          ...(state.agentPreferences || {}),
          commissionRate: commissionRate,
          propertyPriceRange: budget
        } as AgentPreferences;

        dispatch({ type: 'SET_AGENT_PREFERENCES', payload: updatedAgentPreferences });
        await onboardingApi.updateOnboardingStep({
          currentStep: state.currentStep + 1,
          stepName: 'commission-budget',
          agentPreferences: updatedAgentPreferences
        });
      } else {
        const updatedPropertyPreferences = {
          ...(state.propertyPreferences || {}),
          budget: budget
        } as PropertyPreferences;

        dispatch({ type: 'SET_PROPERTY_PREFERENCES', payload: updatedPropertyPreferences });
        await onboardingApi.updateOnboardingStep({
          currentStep: state.currentStep + 1,
          stepName: 'budget-range',
          propertyPreferences: updatedPropertyPreferences
        });
      }

      nextStep();
    } catch (error) {
      console.error('Failed to update budget preferences:', error);
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
          className="mx-auto w-14 h-14 bg-emerald-50/80 rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-emerald-100/50"
        >
          <DollarSign className="h-7 w-7 text-emerald-600" />
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
            <Label className="text-sm font-semibold text-slate-700 block mb-2">
              Currency
            </Label>
            <Select
              value={budget.currency}
              onValueChange={(value) => setBudget(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-emerald-500 h-12 rounded-xl text-base shadow-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value} className="cursor-pointer">
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {isAgent && (
            <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }} className="pt-2">
              <Label className="text-sm font-semibold text-slate-700 block mb-3">
                Commission Rate Base
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {COMMISSION_RANGES.map((range) => {
                  const isActive = commissionRate >= range.min && commissionRate <= range.max;
                  return (
                    <button
                      key={range.label}
                      type="button"
                      onClick={() => setCommissionRate(range.min)}
                      className={`py-2 px-3 text-xs sm:text-sm border rounded-lg transition-colors font-medium
                        ${isActive
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center space-x-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <Label htmlFor="commission-input" className="text-sm font-medium text-slate-600 whitespace-nowrap">
                  Custom % :
                </Label>
                <Input
                  id="commission-input"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="20"
                  step="0.1"
                  className="w-24 bg-white border-slate-200 text-center text-emerald-700 font-bold"
                />
              </div>
            </motion.div>
          )}

          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Label className="text-sm font-semibold text-slate-700 block mb-3">
              {stepData.budgetLabel} Presets
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((preset) => {
                const isActive = budget.min === preset.min && budget.max === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`py-2.5 px-2 text-xs sm:text-sm border rounded-xl transition-colors font-medium
                      ${isActive
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }} className="pt-2 pb-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-semibold text-slate-700">
                Custom Range Tuning
              </Label>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {formatCurrency(budget.min)} - {formatCurrency(budget.max)}
              </span>
            </div>

            <div className="px-2 pt-4 pb-2">
              <Slider
                value={[budget.min, budget.max]}
                onValueChange={handleSliderChange}
                min={0}
                max={maxSliderValue}
                step={10000}
                className="w-full"
              />
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 sm:px-8 shadow-md shadow-emerald-200/50"
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