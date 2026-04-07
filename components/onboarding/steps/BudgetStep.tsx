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
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        title: 'Commission & range',
        description: 'Set your commission rate and the property price range you work with.',
        budgetLabel: 'Property price range'
      };
    } else {
      return {
        title: 'Budget range',
        description: 'What is your budget for purchasing a property?',
        budgetLabel: 'Your budget range'
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

  // Airbnb input styling
  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";
  const selectClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat";

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

          <div className="space-y-10 max-w-3xl">

            {/* Currency */}
            <div className="max-w-[300px]">
              <Label className="text-[16px] font-semibold text-[#222222] mb-3 block">
                Currency
              </Label>
              <select
                value={budget.currency}
                onChange={(e) => setBudget(prev => ({ ...prev, currency: e.target.value }))}
                className={selectClasses}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent Commission Rate */}
            {isAgent && (
              <div className="pt-4 border-t border-[#DDDDDD]">
                <Label className="text-[16px] font-semibold text-[#222222] mb-4 block">
                  Commission rate base
                </Label>
                <div className="flex flex-wrap gap-3 mb-6">
                  {COMMISSION_RANGES.map((range) => {
                    const isActive = commissionRate >= range.min && commissionRate <= range.max;
                    return (
                      <button
                        key={range.label}
                        type="button"
                        onClick={() => setCommissionRate(range.min)}
                        className={cn(
                          "px-5 py-2.5 rounded-full border text-[15px] font-medium transition-all cursor-pointer whitespace-nowrap",
                          isActive
                            ? "bg-[#F7F7F7] border-[#222222] text-[#222222] ring-1 ring-[#222222]"
                            : "bg-white border-[#DDDDDD] text-[#222222] hover:border-[#222222]"
                        )}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex items-center gap-3">
                  <Label htmlFor="commission-input" className="text-[15px] font-semibold text-[#222222]">
                    Custom %
                  </Label>
                  <Input
                    id="commission-input"
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="20"
                    step="0.1"
                    className={cn(inputClasses, "w-[120px] text-center")}
                  />
                </div>
              </div>
            )}

            {/* Presets */}
            <div className="pt-4 border-t border-[#DDDDDD]">
              <Label className="text-[16px] font-semibold text-[#222222] mb-4 block">
                {stepData.budgetLabel}
              </Label>
              <div className="flex flex-wrap gap-3 mb-8">
                {presets.map((preset) => {
                  const isActive = budget.min === preset.min && budget.max === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        "px-5 py-2.5 rounded-full border text-[15px] font-medium transition-all cursor-pointer whitespace-nowrap",
                        isActive
                          ? "bg-[#F7F7F7] border-[#222222] text-[#222222] ring-1 ring-[#222222]"
                          : "bg-white border-[#DDDDDD] text-[#222222] hover:border-[#222222]"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider */}
              <div className="bg-[#F7F7F7] border border-[#DDDDDD] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <Label className="text-[16px] font-semibold text-[#222222]">
                    Custom range
                  </Label>
                  <span className="text-[16px] font-bold text-[#222222]">
                    {formatCurrency(budget.min)} - {formatCurrency(budget.max)}
                  </span>
                </div>

                <div className="px-2 pb-2">
                  <Slider
                    value={[budget.min, budget.max]}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={maxSliderValue}
                    step={10000}
                    className="w-full"
                  />
                </div>
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