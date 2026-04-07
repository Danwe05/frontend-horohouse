'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, CheckCircle2, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function CompletionStep() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const { state, dispatch } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await onboardingApi.completeOnboarding({
        isCompleted: true,
        propertyPreferences: state.propertyPreferences,
        agentPreferences: state.agentPreferences,
      });

      dispatch({ type: 'SET_COMPLETED', payload: true });
      await refreshAuth(); // re-fetch user so preferences appear immediately in Settings
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getCompletionMessage = () => {
    if (user?.role === 'agent') {
      return {
        title: 'You’re all set to host',
        description: 'Your professional profile is complete. Start listing properties and connecting with the right clients today.',
        icon: <User className="h-12 w-12 text-[#222222] stroke-[1.5]" />,
        tasks: [
          'Publish your first property listing',
          'Review messages from potential clients',
          'Optimize your agent public profile'
        ]
      };
    } else {
      return {
        title: 'You’re all set',
        description: 'We’ve customized your experience. Now you’ll see properties that exactly match what you’re looking for.',
        icon: <Sparkles className="h-12 w-12 text-[#222222] stroke-[1.5]" />,
        tasks: [
          'Browse matched properties in your areas',
          'Save favorites to get instant price updates',
          'Connect with verified agents directly'
        ]
      };
    }
  };

  const data = getCompletionMessage();

  return (
    <div className="flex flex-col h-full">
      
      {/* Scrollable Content */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto pb-32 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[500px] flex flex-col items-center text-center"
        >
          <div className="mb-8">
            {data.icon}
          </div>

          <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#222222] tracking-tight leading-[1.1] mb-4">
            {data.title}
          </h2>
          
          <p className="text-[16px] text-[#717171] mb-12">
            {data.description}
          </p>

          <div className="w-full text-left space-y-6">
            <h3 className="text-[18px] font-semibold text-[#222222] mb-6 flex items-center border-b border-[#EBEBEB] pb-4">
              <CheckCircle2 className="w-6 h-6 mr-3 text-[#222222] stroke-[2]" />
              Recommended next steps
            </h3>
            
            <ul className="space-y-6 px-2">
              {data.tasks.map((task, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  className="flex items-start text-[#222222]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#F7F7F7] border border-[#EBEBEB] flex items-center justify-center text-[12px] font-bold mr-4 shrink-0 mt-0.5 text-[#222222]">
                    {idx + 1}
                  </div>
                  <span className="text-[16px]">{task}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] p-4 sm:p-6 z-50">
        <div className="max-w-[850px] mx-auto flex items-center justify-end">
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="h-14 px-10 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors disabled:opacity-50 w-full sm:w-auto active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Explore HoroHouse"
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}