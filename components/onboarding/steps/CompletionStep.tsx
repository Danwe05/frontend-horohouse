'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, CheckCircle2, Home, User, Sparkles, ArrowRight } from 'lucide-react';
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
        title: 'Ready for Business!',
        description: 'Your professional profile is complete. Start listing properties and connecting with the right clients today.',
        icon: <User className="h-10 w-10 text-white" />,
        color: 'from-blue-500 to-indigo-600',
        tasks: [
          'Publish your first property listing',
          'Review messages from potential clients',
          'Optimize your agent public profile'
        ]
      };
    } else {
      return {
        title: 'You\'re All Set!',
        description: 'We\'ve customized your experience. Now you\'ll see properties that exactly match what you\'re looking for.',
        icon: <Sparkles className="h-10 w-10 text-white" />,
        color: 'from-blue-500 to-indigo-600',
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
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto items-center justify-center py-8">

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`w-24 h-24 rounded-[2rem] flex items-center justify-center -xl mb-8 bg-gradient-to-br ${data.color}`}
      >
        {data.icon}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-3 mb-10 max-w-lg"
      >
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          {data.title}
        </h2>
        <p className="text-lg text-slate-500">
          {data.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md bg-white/60 backdrop-blur-sm border border-slate-100 rounded-3xl p-6 sm:p-8 -sm mb-10"
      >
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-blue-500" />
          Recommended Next Steps
        </h3>
        <ul className="space-y-4">
          {data.tasks.map((task, idx) => (
            <motion.li
              key={idx}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + (idx * 0.1) }}
              className="flex items-start text-slate-600"
            >
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <span className="text-sm font-medium pt-0.5">{task}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-xs"
      >
        <Button
          onClick={handleComplete}
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 text-lg font-semibold -lg -slate-300 transition-all group"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            <span className="flex items-center justify-center">
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </motion.div>

    </div>
  );
}
