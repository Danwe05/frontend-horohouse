'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, CheckCircle, Home, User, MapPin, DollarSign } from 'lucide-react';

export function CompletionStep() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, dispatch } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Complete onboarding on backend
      await onboardingApi.completeOnboarding({
        isCompleted: true,
        propertyPreferences: state.propertyPreferences,
        agentPreferences: state.agentPreferences,
      });

      dispatch({ type: 'SET_COMPLETED', payload: true });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still redirect to dashboard
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getCompletionMessage = () => {
    if (user?.role === 'agent') {
      return {
        title: 'Agent Profile Complete!',
        description: 'Your professional profile is now set up. You can start listing properties and connecting with potential clients.',
        icon: <User className="h-12 w-12 text-green-600" />
      };
    } else {
      return {
        title: 'Profile Setup Complete!',
        description: 'Your preferences are saved. We\'ll use this information to show you the best properties that match your criteria.',
        icon: <Home className="h-12 w-12 text-green-600" />
      };
    }
  };

  const completionMessage = getCompletionMessage();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          {completionMessage.icon}
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900">
          {completionMessage.title}
        </CardTitle>
        <CardDescription className="text-lg text-gray-600">
          {completionMessage.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* What's Next */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="font-semibold text-green-800 mb-3">What's Next?</h3>
          <div className="space-y-2">
            <div className="flex items-center text-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Browse properties in your preferred areas</span>
            </div>
            <div className="flex items-center text-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Save favorites and get notifications</span>
            </div>
            <div className="flex items-center text-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Connect with agents and schedule viewings</span>
            </div>
            {user?.role === 'agent' && (
              <div className="flex items-center text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Start listing your properties</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6">
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Setup...
              </>
            ) : (
              'Go to Dashboard'
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500">
          You can always update your preferences later from your profile settings.
        </p>
      </CardContent>
    </Card>
  );
}
