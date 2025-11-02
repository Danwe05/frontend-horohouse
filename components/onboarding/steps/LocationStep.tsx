'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';

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
        placeholder: 'Enter cities, neighborhoods, or areas you serve',
        helpText: 'Add all the areas where you actively work as a real estate agent',
        popularAreas: ['Downtown', 'Financial District', 'Suburbs', 'Waterfront', 'Historic District']
      };
    } else {
      return {
        title: 'Preferred Locations',
        description: 'Where would you like to find properties?',
        placeholder: 'Enter cities, neighborhoods, or areas of interest',
        helpText: 'Add all the locations where you\'d like to search for properties',
        popularAreas: ['City Center', 'Suburbs', 'Near Schools', 'Near Transit', 'Quiet Neighborhoods']
      };
    }
  };

  const stepData = getStepData();

  const handleNext = async () => {
    if (!isFormValid()) {
      alert('Please add at least one location');
      return;
    }

    setIsLoading(true);
    try {
      // Update preferences based on user role
      if (user?.role === 'agent') {
        const updatedAgentPreferences = {
          ...state.agentPreferences!,
          serviceAreas: locations
        };
        
        dispatch({ 
          type: 'SET_AGENT_PREFERENCES', 
          payload: updatedAgentPreferences
        });

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
        
        dispatch({ 
          type: 'SET_PROPERTY_PREFERENCES', 
          payload: updatedPropertyPreferences
        });

        await onboardingApi.updateOnboardingStep({
          currentStep: state.currentStep + 1,
          stepName: 'preferred-locations',
          propertyPreferences: updatedPropertyPreferences
        });
      }

      nextStep();
    } catch (error) {
      console.error('Failed to update location preferences:', error);
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
          <MapPin className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {stepData.title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {stepData.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Location Input */}
        <div>
          <Label htmlFor="location" className="text-base font-semibold text-gray-900 mb-2 block">
            Add Locations *
          </Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                id="location"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={stepData.placeholder}
                className="flex-1"
              />
              <Button 
                type="button"
                onClick={handleAddLocation}
                variant="outline"
                disabled={!locationInput.trim()}
              >
                Add
              </Button>
            </div>
            
            <p className="text-sm text-gray-500">
              {stepData.helpText}
            </p>
          </div>
        </div>

        {/* Added Locations */}
        {locations.length > 0 && (
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-3 block">
              Selected Locations ({locations.length})
            </Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locations.map((location, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{location}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(location)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove location"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {locations.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No locations added yet</p>
            <p className="text-sm text-gray-400">Start typing to add your preferred locations</p>
          </div>
        )}

        {/* Popular Suggestions */}
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">
            Popular Areas
          </Label>
          <div className="flex flex-wrap gap-2">
            {stepData.popularAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => {
                  if (!locations.includes(area)) {
                    setLocations(prev => [...prev, area]);
                  }
                }}
                disabled={locations.includes(area)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + {area}
              </button>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Tips</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Be specific with neighborhood names for better matches</li>
            <li>• Include nearby landmarks or districts</li>
            <li>• You can always update these preferences later</li>
            {user?.role === 'agent' && (
              <li>• Consider including areas you're planning to expand into</li>
            )}
          </ul>
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