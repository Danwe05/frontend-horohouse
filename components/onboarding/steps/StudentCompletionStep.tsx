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
  CheckCircle2,
  Clock,
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
        try { localStorage.setItem('horohouse_student_mode', 'true'); } catch { }
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
          try { localStorage.setItem('horohouse_student_mode', 'true'); } catch { }
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
    'Browse student-friendly listings near your campus',
    'Set up your roommate profile to join the matching pool',
    idUploaded
      ? 'Your ID is under review — full access granted within 24h'
      : 'Upload your student ID to unlock verified features'
  ];

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
            <GraduationCap className="h-12 w-12 text-[#222222] stroke-[1.5]" />
          </div>

          <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#222222] tracking-tight leading-[1.1] mb-4">
            {isCreated ? "You're in Campus Hub!" : "Almost there!"}
          </h2>

          <p className="text-[16px] text-[#717171] mb-8 px-4">
            {isCreated
              ? "Your student profile is live. Start exploring housing built for students."
              : `Ready to create your student profile, ${user?.name?.split(' ')[0]}?`}
          </p>

          {/* Verification status chip */}
          {!isCreated && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium mb-12 ${idUploaded
              ? 'bg-[#EBFBF0] text-[#008A05] border border-[#008A05]/20'
              : 'bg-[#F7F7F7] text-[#717171] border border-[#DDDDDD]'
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
            </div>
          )}

          <div className="w-full text-left space-y-6">
            <h3 className="text-[18px] font-semibold text-[#222222] mb-6 flex items-center border-b border-[#EBEBEB] pb-4">
              <CheckCircle2 className="w-6 h-6 mr-3 text-[#222222] stroke-[2]" />
              Recommended next steps
            </h3>

            <ul className="space-y-6 px-2">
              {nextSteps.map((task, idx) => (
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
          {!isCreated ? (
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="h-14 px-10 rounded-lg blue-blue-600 blue-blue-700 text-white font-semibold text-[16px] transition-colors disabled:opacity-50 w-full sm:w-auto active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create my student profile"
              )}
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
              <Button
                onClick={goToDashboard}
                variant="outline"
                className="h-14 px-8 rounded-lg border-[#222222] text-[#222222] hover:bg-[#F7F7F7] font-semibold text-[16px] transition-colors w-full sm:w-auto"
              >
                Go to dashboard
              </Button>
              <Button
                onClick={goToStudentSearch}
                className="h-14 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors w-full sm:w-auto active:scale-[0.98]"
              >
                Browse housing
              </Button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}