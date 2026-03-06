'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, Home, ChevronRight, ChevronLeft } from 'lucide-react';

const PROPERTY_TYPES = [
  'Apartment',
  'House',
  'Condo',
  'Townhouse',
  'Villa',
  'Studio',
  'Duplex',
  'Penthouse'
];

const PROPERTY_FEATURES = [
  'Parking',
  'Balcony',
  'Garden',
  'Swimming Pool',
  'Gym',
  'Security',
  'Elevator',
  'Air Conditioning',
  'Furnished',
  'Pet Friendly',
  'Near Public Transport',
  'Shopping Nearby'
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
      alert('Please select at least one property type');
      return;
    }

    setIsLoading(true);
    try {
      // Update preferences in context
      dispatch({ 
        type: 'SET_PROPERTY_PREFERENCES', 
        payload: {
          ...preferences,
          location: state.propertyPreferences?.location || []
        }
      });

      // Update step on backend
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
          <Home className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Property Preferences
        </CardTitle>
        <CardDescription className="text-gray-600">
          Tell us what kind of properties you're looking for
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Property Types */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            Property Types *
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {PROPERTY_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`property-${type}`}
                  checked={preferences.propertyType.includes(type)}
                  onCheckedChange={(checked) => handlePropertyTypeChange(type, checked as boolean)}
                />
                <Label htmlFor={`property-${type}`} className="text-sm cursor-pointer">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            Budget Range
          </Label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="min-budget" className="text-sm text-gray-600">Min</Label>
              <Input
                id="min-budget"
                type="number"
                value={preferences.budget.min}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  budget: { ...prev.budget, min: parseInt(e.target.value) || 0 }
                }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="max-budget" className="text-sm text-gray-600">Max</Label>
              <Input
                id="max-budget"
                type="number"
                value={preferences.budget.max}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  budget: { ...prev.budget, max: parseInt(e.target.value) || 0 }
                }))}
                placeholder="1000000"
              />
            </div>
            <div>
              <Label htmlFor="currency" className="text-sm text-gray-600">Currency</Label>
              <Select
                value={preferences.budget.currency}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  budget: { ...prev.budget, currency: value }
                }))}
              >
                <SelectTrigger>
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
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            Number of Bedrooms
          </Label>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((bedroom) => (
              <div key={bedroom} className="flex items-center space-x-2">
                <Checkbox
                  id={`bedroom-${bedroom}`}
                  checked={preferences.bedrooms.includes(bedroom)}
                  onCheckedChange={(checked) => handleBedroomChange(bedroom, checked as boolean)}
                />
                <Label htmlFor={`bedroom-${bedroom}`} className="text-sm cursor-pointer">
                  {bedroom}+ BR
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Bathrooms */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            Number of Bathrooms
          </Label>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((bathroom) => (
              <div key={bathroom} className="flex items-center space-x-2">
                <Checkbox
                  id={`bathroom-${bathroom}`}
                  checked={preferences.bathrooms.includes(bathroom)}
                  onCheckedChange={(checked) => handleBathroomChange(bathroom, checked as boolean)}
                />
                <Label htmlFor={`bathroom-${bathroom}`} className="text-sm cursor-pointer">
                  {bathroom}+ BA
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            Preferred Features
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {PROPERTY_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature}`}
                  checked={preferences.features.includes(feature)}
                  onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                />
                <Label htmlFor={`feature-${feature}`} className="text-sm cursor-pointer">
                  {feature}
                </Label>
              </div>
            ))}
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
            disabled={isLoading || preferences.propertyType.length === 0}
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