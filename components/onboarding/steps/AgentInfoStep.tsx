'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, User, ChevronRight, ChevronLeft } from 'lucide-react';

const SPECIALIZATIONS = [
  'Residential Sales',
  'Commercial Real Estate',
  'Luxury Properties',
  'First-time Buyers',
  'Investment Properties',
  'New Construction',
  'Foreclosures',
  'Short Sales',
  'Rental Properties',
  'Property Management',
  'Land Sales',
  'Relocation Services'
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
    specializations: state.agentPreferences?.specializations || [],
    serviceAreas: state.agentPreferences?.serviceAreas || []
  });

  const [serviceAreaInput, setServiceAreaInput] = useState('');

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setAgentInfo(prev => ({
      ...prev,
      specializations: checked 
        ? [...prev.specializations, specialization]
        : prev.specializations.filter(s => s !== specialization)
    }));
  };

  const handleAddServiceArea = () => {
    if (serviceAreaInput.trim() && !agentInfo.serviceAreas.includes(serviceAreaInput.trim())) {
      setAgentInfo(prev => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, serviceAreaInput.trim()]
      }));
      setServiceAreaInput('');
    }
  };

  const handleRemoveServiceArea = (area: string) => {
    setAgentInfo(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter(a => a !== area)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddServiceArea();
    }
  };

  const isFormValid = () => {
    return agentInfo.licenseNumber.trim() !== '' && 
           agentInfo.agency.trim() !== '' && 
           agentInfo.specializations.length > 0 &&
           agentInfo.serviceAreas.length > 0;
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Update preferences in context
      dispatch({ 
        type: 'SET_AGENT_PREFERENCES', 
        payload: agentInfo
      });

      // Update step on backend
      await onboardingApi.updateOnboardingStep({
        currentStep: state.currentStep + 1,
        stepName: 'agent-info',
        agentPreferences: agentInfo
      });

      nextStep();
    } catch (error) {
      console.error('Failed to update agent info:', error);
      // Continue anyway
      nextStep();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Agent Information
        </CardTitle>
        <CardDescription className="text-gray-600">
          Tell us about your professional background and expertise
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* License Number */}
        <div>
          <Label htmlFor="license" className="text-base font-semibold text-gray-900 mb-2 block">
            License Number *
          </Label>
          <Input
            id="license"
            value={agentInfo.licenseNumber}
            onChange={(e) => setAgentInfo(prev => ({ ...prev, licenseNumber: e.target.value }))}
            placeholder="Enter your real estate license number"
            className="w-full"
          />
        </div>

        {/* Agency */}
        <div>
          <Label htmlFor="agency" className="text-base font-semibold text-gray-900 mb-2 block">
            Agency/Brokerage *
          </Label>
          <Input
            id="agency"
            value={agentInfo.agency}
            onChange={(e) => setAgentInfo(prev => ({ ...prev, agency: e.target.value }))}
            placeholder="Enter your agency or brokerage name"
            className="w-full"
          />
        </div>

        {/* Experience */}
        <div>
          <Label htmlFor="experience" className="text-base font-semibold text-gray-900 mb-2 block">
            Years of Experience
          </Label>
          <Select
            value={agentInfo.experience.toString()}
            onValueChange={(value) => setAgentInfo(prev => ({ ...prev, experience: parseInt(value) }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value.toString()}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Specializations */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            Specializations * (Select at least one)
          </Label>
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
            {SPECIALIZATIONS.map((specialization) => (
              <div key={specialization} className="flex items-center space-x-2">
                <Checkbox
                  id={`spec-${specialization}`}
                  checked={agentInfo.specializations.includes(specialization)}
                  onCheckedChange={(checked) => handleSpecializationChange(specialization, checked as boolean)}
                />
                <Label htmlFor={`spec-${specialization}`} className="text-sm cursor-pointer">
                  {specialization}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Service Areas */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-2 block">
            Service Areas * (Cities, neighborhoods, etc.)
          </Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={serviceAreaInput}
                onChange={(e) => setServiceAreaInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a city or area"
                className="flex-1"
              />
              <Button 
                type="button"
                onClick={handleAddServiceArea}
                variant="outline"
                disabled={!serviceAreaInput.trim()}
              >
                Add
              </Button>
            </div>
            
            {agentInfo.serviceAreas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {agentInfo.serviceAreas.map((area, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceArea(area)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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
            className="flex items-center bg-green-600 hover:bg-green-700"
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