'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { onboardingApi } from '@/lib/onboarding-api';
import { Loader2, Home, User, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

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

  const getFeatures = () => {
    if (user?.role === 'agent') {
      return [
        { icon: <User className="w-5 h-5" />, title: 'Agent Profile', description: 'Set up credentials' },
        { icon: <Home className="w-5 h-5" />, title: 'Property Types', description: 'Your specialties' },
        { icon: <MapPin className="w-5 h-5" />, title: 'Service Areas', description: 'Regions covered' },
        { icon: <DollarSign className="w-5 h-5" />, title: 'Commissions', description: 'Configure fees' }
      ];
    } else {
      return [
        { icon: <Home className="w-5 h-5" />, title: 'Preferences', description: 'Tell us what you want' },
        { icon: <MapPin className="w-5 h-5" />, title: 'Locations', description: 'Preferred neighborhoods' },
        { icon: <DollarSign className="w-5 h-5" />, title: 'Budget', description: 'Financing details' }
      ];
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col h-full justify-between items-center text-center w-full max-w-2xl mx-auto py-2">
      <div className="flex flex-col items-center justify-center flex-1 w-full space-y-6 sm:space-y-8 min-h-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50/80 rounded-3xl flex items-center justify-center -inner border border-blue-100/50 backdrop-blur-sm shrink-0"
        >
          <Home className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
        </motion.div>

        <div className="space-y-2 sm:space-y-3 shrink-0">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight"
          >
            Welcome to HoroHouse, <span className="text-blue-600">{user?.name?.split(' ')[0]}</span>!
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed px-4"
          >
            Let's customize your experience in just a few quick steps. This will help us find exactly what you're looking for.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl sm:gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 pb-2"
        >
          {getFeatures().map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -2 }}
              className="flex items-center sm:flex-col sm:items-center sm:text-center p-3 sm:p-5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 -sm hover:-md transition-all group cursor-default text-left gap-4 sm:gap-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 sm:mb-3 group-hover:scale-110 transition-transform bg-gradient-to-br from-blue-50 to-indigo-50 shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-0.5 sm:mb-1 text-sm sm:text-base">{feature.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center items-center shrink-0"
      >
        <Button
          onClick={() => router.push('/dashboard')}
          variant="ghost"
          size="lg"
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 rounded-xl px-8 w-full sm:w-auto"
        >
          Skip for Now
        </Button>
        <Button
          onClick={handleGetStarted}
          disabled={isLoading}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 -lg -blue-200 group relative overflow-hidden w-full sm:w-auto"
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Preparing...
            </span>
          ) : (
            <span className="flex items-center font-semibold text-base">
              Start
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
