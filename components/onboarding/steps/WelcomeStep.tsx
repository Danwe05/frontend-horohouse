'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, Home, User, MapPin, DollarSign } from 'lucide-react';

export function WelcomeStep() {
  const router = useRouter();
  const { user } = useAuth();
  const { nextStep, dispatch } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      // Send welcome email
      await onboardingApi.sendWelcomeEmail();
      
      // Move to next step
      nextStep();
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Continue anyway
      nextStep();
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatures = () => {
    if (user?.role === 'agent') {
      return [
        {
          icon: <User className="h-6 w-6" />,
          title: 'Agent Profile',
          description: 'Set up your professional profile and credentials'
        },
        {
          icon: <Home className="h-6 w-6" />,
          title: 'Property Types',
          description: 'Choose the types of properties you specialize in'
        },
        {
          icon: <MapPin className="h-6 w-6" />,
          title: 'Service Areas',
          description: 'Define your service areas and coverage'
        },
        {
          icon: <DollarSign className="h-6 w-6" />,
          title: 'Commission Setup',
          description: 'Configure your commission structure'
        }
      ];
    } else {
      return [
        {
          icon: <Home className="h-6 w-6" />,
          title: 'Property Preferences',
          description: 'Tell us what type of properties you\'re looking for'
        },
        {
          icon: <MapPin className="h-6 w-6" />,
          title: 'Location Preferences',
          description: 'Set your preferred neighborhoods and areas'
        },
        {
          icon: <DollarSign className="h-6 w-6" />,
          title: 'Budget Range',
          description: 'Define your budget range and financing preferences'
        }
      ];
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Home className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900">
          Welcome to HoroHouse, {user?.name?.split(' ')[0]}!
        </CardTitle>
        <CardDescription className="text-lg text-gray-600">
          Let's set up your profile to get you the best experience on our platform.
          This will only take a few minutes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getFeatures().map((feature, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
            >
              <div className="text-green-600 mt-1">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Get Started'
            )}
          </Button>
          
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Skip for Now
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500">
          You can always complete your profile later from your dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
