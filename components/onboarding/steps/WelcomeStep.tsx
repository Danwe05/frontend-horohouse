'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function WelcomeStep() {
  const router = useRouter();
  const { user } = useAuth();
  const { nextStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      await onboardingApi.sendWelcomeEmail();
      nextStep();
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      nextStep();
    } finally {
      setIsLoading(false);
    }
  };

  const getSteps = () => {
    if (user?.role === 'agent') {
      return [
        { title: 'Tell us about yourself', description: 'Share your professional credentials and agency details.' },
        { title: 'Define your expertise', description: 'Select your property types and preferred service areas.' },
        { title: 'Set your terms', description: 'Configure your commissions and finish up your profile.' }
      ];
    } else {
      return [
        { title: 'Tell us what you want', description: 'Choose the specific types of properties you are looking for.' },
        { title: 'Choose your locations', description: 'Highlight your preferred neighborhoods and regions.' },
        { title: 'Set your budget', description: 'Define your price range so we can find the perfect match.' }
      ];
    }
  };

  return (
    <div className="flex flex-col h-full absolute inset-0 bg-white z-50">

      {/* Split Screen Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto pb-[100px]">

        {/* Left Side: Massive Headline */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 md:sticky md:top-0 md:h-[calc(100vh-100px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[480px]"
          >
            <h1 className="text-[36px] sm:text-[48px] lg:text-[54px] font-semibold text-[#222222] leading-[1.1] tracking-tight">
              It's easy to get started on HoroHouse
            </h1>
          </motion.div>
        </div>

        {/* Right Side: 1-2-3 Steps */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16">
          <div className="w-full max-w-[480px]">
            {getSteps().map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex gap-4 sm:gap-6">
                  <div className="text-[22px] font-semibold text-[#222222] pt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-[22px] font-semibold text-[#222222] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[16px] text-[#717171] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Airbnb separator lines (don't show after the last item) */}
                {index < getSteps().length - 1 && (
                  <div className="border-b border-[#DDDDDD] my-8 w-full" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] p-4 sm:p-6 z-[60]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[16px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
          >
            Skip for now
          </button>
          <Button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="h-12 sm:h-14 px-8 rounded-lg blue-blue-600 blue-blue-700 text-white font-semibold text-[16px] transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Get started"
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}