'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react';

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
    { min: 0, max: 200000, label: 'Under 200K XAF' },
    { min: 200000, max: 500000, label: '$200K - 500K XAF' },
    { min: 500000, max: 750000, label: '500K XAF - 750K XAF' },
    { min: 750000, max: 1000000, label: '750K XAF - 1M XAF' },
    { min: 1000000, max: 2000000, label: '1M XAF - 2M XAF' },
    { min: 2000000, max: 10000000, label: '2M+ XAF' }
  ],
  agent: [
    { min: 0, max: 300000, label: 'Up to $300K' },
    { min: 300000, max: 600000, label: '$300K - $600K' },
    { min: 600000, max: 1000000, label: '$600K - $1M' },
    { min: 1000000, max: 2000000, label: '$1M - $2M' },
    { min: 2000000, max: 5000000, label: '$2M - $5M' },
    { min: 5000000, max: 20000000, label: '$5M+' }
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
    setBudget(prev => ({
      ...prev,
      min: preset.min,
      max: preset.max
    }));
  };

  const handleSliderChange = (values: number[]) => {
    setBudget(prev => ({
      ...prev,
      min: values[0],
      max: values[1]
    }));
  };

  const getStepData = () => {
    if (isAgent) {
      return {
        title: 'Commission & Property Range',
        description: 'Set your commission rate and property price range you work with',
        budgetLabel: 'Property Price Range You Handle'
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

  const isFormValid = () => {
    return budget.min >= 0 && budget.max > budget.min;
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      alert('Please set a valid budget range');
      return;
    }

    setIsLoading(true);
    try {
      if (isAgent) {
        // For agents, we might store commission info separately or in agent preferences
        const updatedAgentPreferences = {
          ...state.agentPreferences!,
          commissionRate: commissionRate,
          propertyPriceRange: budget
        };
        
        dispatch({ 
          type: 'SET_AGENT_PREFERENCES', 
          payload: updatedAgentPreferences
        });

        await onboardingApi.updateOnboardingStep({
          currentStep: state.currentStep + 1,
          stepName: 'commission-budget',
          agentPreferences: updatedAgentPreferences
        });
      } else {
        const updatedPropertyPreferences = {
          ...state.propertyPreferences!,
          budget: budget
        };
        
        dispatch({ 
          type: 'SET_PROPERTY_PREFERENCES', 
          payload: updatedPropertyPreferences
        });

        await onboardingApi.updateOnboardingStep({
          currentStep: state.currentStep + 1,
          stepName: 'budget-range',
          propertyPreferences: updatedPropertyPreferences
        });
      }

      nextStep();
    } catch (error) {
      console.error('Failed to update budget preferences:', error);
      // Continue anyway
      nextStep();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <DollarSign className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {stepData.title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {stepData.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Currency Selection */}
        <div>
          <Label htmlFor="currency" className="text-base font-semibold text-gray-900 mb-2 block">
            Currency
          </Label>
          <Select
            value={budget.currency}
            onValueChange={(value) => setBudget(prev => ({ ...prev, currency: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Commission Rate (Agent Only) */}
        {isAgent && (
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-3 block">
              Commission Rate
            </Label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {COMMISSION_RANGES.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => setCommissionRate(range.min)}
                  className={`p-3 text-sm border rounded-lg transition-colors ${
                    commissionRate >= range.min && commissionRate <= range.max
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <Label htmlFor="commission-input" className="text-sm text-gray-600">
                Custom Rate:
              </Label>
              <Input
                id="commission-input"
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="10"
                step="0.1"
                className="w-20"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>
        )}

        {/* Budget Presets */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            {stepData.budgetLabel} - Quick Select
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 text-sm border rounded-lg transition-colors ${
                  budget.min === preset.min && budget.max === preset.max
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Slider */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            Custom Range
          </Label>
          <div className="space-y-4">
            <div className="px-3">
              <Slider
                value={[budget.min, budget.max]}
                onValueChange={handleSliderChange}
                min={0}
                max={maxSliderValue}
                step={10000}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{formatCurrency(budget.min)}</span>
              <span>{formatCurrency(budget.max)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-budget" className="text-sm text-gray-600">Minimum</Label>
                <Input
                  id="min-budget"
                  type="number"
                  value={budget.min}
                  onChange={(e) => setBudget(prev => ({ 
                    ...prev, 
                    min: Math.max(0, parseInt(e.target.value) || 0) 
                  }))}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="max-budget" className="text-sm text-gray-600">Maximum</Label>
                <Input
                  id="max-budget"
                  type="number"
                  value={budget.max}
                  onChange={(e) => setBudget(prev => ({ 
                    ...prev, 
                    max: Math.max(prev.min + 1, parseInt(e.target.value) || 0) 
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            {isAgent ? 'Your Service Summary' : 'Your Budget Summary'}
          </h3>
          <div className="text-blue-700 space-y-1">
            <p>Range: {formatCurrency(budget.min)} - {formatCurrency(budget.max)}</p>
            <p>Currency: {budget.currency}</p>
            {isAgent && <p>Commission Rate: {commissionRate}%</p>}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            onClick={prevStep}
            variant="outline"
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isLoading || !isFormValid()}
            className="flex items-center bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}