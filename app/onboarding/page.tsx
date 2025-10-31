'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login?redirect=/onboarding');
        return;
      }

      // Check if user has already completed onboarding
      if (user?.onboardingCompleted) {
        router.push('/dashboard');
        return;
      }

      setIsOnboardingLoading(false);
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || isOnboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <OnboardingFlow />
      </div>
    </OnboardingProvider>
  );
}
