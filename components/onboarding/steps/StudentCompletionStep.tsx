'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useStudentMode } from '@/contexts/StudentModeContext';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import {
  Loader2,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Home,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function StudentCompletionStep() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const { state, dispatch } = useOnboarding();
  const studentModeCtx = useStudentMode();

  const [isLoading, setIsLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const studentInfo = (state as any).studentInfo || {};
  const idUploaded = !!(state as any).studentIdUploaded;

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // 1. Create the student profile (flips role to STUDENT on the backend)
      await apiClient.createStudentProfile({
        universityName: studentInfo.universityName || 'Unknown University',
        campusCity: studentInfo.campusCity || 'Yaoundé',
        campusName: studentInfo.campusName || studentInfo.campusCity || 'Main campus',
        faculty: studentInfo.faculty,
        studyLevel: studentInfo.studyLevel,
        enrollmentYear: studentInfo.enrollmentYear,
      });

      setIsCreated(true);

      // 2. Re-fetch auth so user.role === 'student' everywhere immediately
      await refreshAuth();

      // 3. Enable student mode — call the method if it exists on the context,
      //    otherwise fall back to localStorage directly so the toggle activates
      if (typeof (studentModeCtx as any).enableStudentMode === 'function') {
        (studentModeCtx as any).enableStudentMode();
      } else if (typeof (studentModeCtx as any).toggleStudentMode === 'function') {
        // Only toggle on if not already on
        if (!(studentModeCtx as any).isStudentMode) {
          (studentModeCtx as any).toggleStudentMode();
        }
      } else {
        try { localStorage.setItem('horohouse_student_mode', 'true'); } catch {}
      }

      // 4. Refresh the student profile in context if the method is available
      if (typeof (studentModeCtx as any).refreshStudentProfile === 'function') {
        await (studentModeCtx as any).refreshStudentProfile();
      }

      dispatch({ type: 'SET_COMPLETED' as any, payload: true });
      toast.success('Student profile created! Welcome to Campus Hub.');
    } catch (err: any) {
      // 409 = profile already exists — still proceed
      if (err?.response?.status === 409) {
        await refreshAuth();
        if (typeof (studentModeCtx as any).enableStudentMode === 'function') {
          (studentModeCtx as any).enableStudentMode();
        } else {
          try { localStorage.setItem('horohouse_student_mode', 'true'); } catch {}
        }
        setIsCreated(true);
      } else {
        const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
        toast.error(msg);
        setIsLoading(false);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goToDashboard = () => router.push('/dashboard');
  const goToStudentSearch = () => router.push('/students');

  const nextSteps = [
    {
      icon: <Home className="w-4 h-4" />,
      text: 'Browse student-friendly listings near your campus',
    },
    {
      icon: <Users className="w-4 h-4" />,
      text: 'Set up your roommate profile to join the matching pool',
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      text: idUploaded
        ? 'Your ID is under review — full access granted within 24h'
        : 'Upload your student ID to unlock verified features',
    },
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-xl mx-auto items-center justify-center py-8">

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl mb-8 bg-gradient-to-br from-blue-500 to-indigo-600"
      >
        <GraduationCap className="h-12 w-12 text-white" />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-3 mb-8 max-w-md"
      >
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          {isCreated ? "You're in Campus Hub!" : 'Almost there!'}
        </h2>
        <p className="text-lg text-slate-500">
          {isCreated
            ? 'Your student profile is live. Start exploring housing built for students.'
            : `Ready to create your student profile, ${user?.name?.split(' ')[0]}?`}
        </p>
      </motion.div>

      {/* Verification status chip */}
      {isCreated && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 ${
            idUploaded
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {idUploaded ? (
            <>
              <Clock className="w-4 h-4" />
              ID under review — some features locked until verified
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Upload your ID anytime from your student profile
            </>
          )}
        </motion.div>
      )}

      {/* Next steps card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="w-full bg-white/60 backdrop-blur-sm border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm mb-8"
      >
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-blue-500" />
          What's next
        </h3>
        <ul className="space-y-4">
          {nextSteps.map((step, idx) => (
            <motion.li
              key={idx}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="flex items-start text-slate-600"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                {step.icon}
              </div>
              <span className="text-sm font-medium pt-0.5">{step.text}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-xs flex flex-col gap-3"
      >
        {!isCreated ? (
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 text-base font-semibold shadow-lg shadow-blue-200 transition-all group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center">
                Create my student profile
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={goToStudentSearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 font-semibold shadow-md shadow-blue-200 group"
            >
              <span className="flex items-center justify-center">
                Browse student housing
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <Button
              onClick={goToDashboard}
              variant="ghost"
              className="w-full rounded-2xl h-12 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              Go to dashboard
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}