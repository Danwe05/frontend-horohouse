'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudentVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

interface StudentProfile {
  universityName: string;
  campusCity: string;
  campusName: string;
  faculty?: string;
  studyLevel?: string;
  verificationStatus: StudentVerificationStatus;
  roommateProfileId?: string;
  isAmbassador?: boolean;
  ambassadorCode?: string;
}

interface StudentModeContextType {
  /** Whether the UI is currently in student / campus hub mode */
  isStudentMode: boolean;
  /** Toggle campus hub mode on/off */
  toggleStudentMode: () => void;
  /** Force-enable campus hub mode (e.g. after onboarding completes) */
  enableStudentMode: () => void;
  /** Force-disable campus hub mode */
  disableStudentMode: () => void;

  /** Whether the current user has the STUDENT role */
  isStudent: boolean;
  /** Verification status of the student ID */
  verificationStatus: StudentVerificationStatus | null;
  /** Whether the student ID has been fully verified */
  isVerified: boolean;
  /** Whether we are still loading the student profile */
  isLoadingProfile: boolean;
  /** The student profile, if it exists */
  studentProfile: StudentProfile | null;
  /** Whether the student has a roommate profile */
  hasRoommateProfile: boolean;

  /** Re-fetch the student profile (call after onboarding, ID upload, etc.) */
  refreshStudentProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StudentModeContext = createContext<StudentModeContextType | undefined>(undefined);

const STORAGE_KEY = 'horohouse_student_mode';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StudentModeProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const isStudent = user?.role === 'student';

  // ── Persistent toggle state ───────────────────────────────────────────────

  const [isStudentMode, setIsStudentMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // ── Student profile state ─────────────────────────────────────────────────

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<StudentVerificationStatus | null>(null);

  // ── Auto-enable student mode when the user's role is STUDENT ─────────────

  useEffect(() => {
    if (isStudent && !isStudentMode) {
      setIsStudentMode(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    } else if (!isStudent) {
      // Clear it for non-students
      setIsStudentMode(false);
      localStorage.setItem(STORAGE_KEY, 'false');
    }
  }, [isStudent]);

  // ── Fetch student profile when authenticated as student ───────────────────

  const refreshStudentProfile = useCallback(async () => {
    if (!isAuthenticated || !isStudent) {
      setStudentProfile(null);
      setVerificationStatus(null);
      return;
    }

    setIsLoadingProfile(true);
    try {
      const profile = await apiClient.getMyStudentProfile();
      setStudentProfile(profile);
      setVerificationStatus(profile.verificationStatus ?? 'unverified');
    } catch (err: any) {
      // 404 = no profile yet (student just switched roles, not onboarded yet)
      if (err?.response?.status === 404) {
        setStudentProfile(null);
        setVerificationStatus('unverified');
      } else {
        console.error('[StudentModeContext] Failed to fetch student profile:', err);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, [isAuthenticated, isStudent]);

  useEffect(() => {
    refreshStudentProfile();
  }, [refreshStudentProfile]);

  // ── Poll verification status while PENDING (every 30s) ───────────────────
  // Stops polling once status moves to verified or rejected.

  useEffect(() => {
    if (verificationStatus !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        const { verificationStatus: latest } =
          await apiClient.getStudentVerificationStatus();
        setVerificationStatus(latest);

        if (latest !== 'pending') {
          // Update the cached profile too
          setStudentProfile((prev) =>
            prev ? { ...prev, verificationStatus: latest } : prev,
          );
          clearInterval(interval);
        }
      } catch {
        // Silent — don't break the UI if polling fails
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [verificationStatus]);

  // ── Toggle handlers ───────────────────────────────────────────────────────

  const enableStudentMode = useCallback(() => {
    setIsStudentMode(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { }
  }, []);

  const disableStudentMode = useCallback(() => {
    setIsStudentMode(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'false');
    } catch { }
  }, []);

  const toggleStudentMode = useCallback(() => {
    setIsStudentMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch { }
      return next;
    });
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const isVerified = verificationStatus === 'verified';
  const hasRoommateProfile = !!studentProfile?.roommateProfileId;

  return (
    <StudentModeContext.Provider
      value={{
        isStudentMode,
        toggleStudentMode,
        enableStudentMode,
        disableStudentMode,
        isStudent,
        verificationStatus,
        isVerified,
        isLoadingProfile,
        studentProfile,
        hasRoommateProfile,
        refreshStudentProfile,
      }}
    >
      {children}
    </StudentModeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudentMode(): StudentModeContextType {
  const context = useContext(StudentModeContext);
  if (!context) {
    throw new Error('useStudentMode must be used within a StudentModeProvider');
  }
  return context;
}

// ─── Convenience hooks ────────────────────────────────────────────────────────

/**
 * Returns true if the current user is a fully verified student.
 * Use this to gate features like the roommate pool.
 */
export function useIsVerifiedStudent(): boolean {
  const { isStudent, isVerified } = useStudentMode();
  return isStudent && isVerified;
}

/**
 * Returns the student's verification status with human-readable messaging.
 * Useful for displaying inline status banners.
 */
export function useVerificationBanner(): {
  show: boolean;
  status: StudentVerificationStatus | null;
  title: string;
  description: string;
  variant: 'info' | 'warning' | 'success' | 'destructive';
} {
  const { isStudent, verificationStatus, isLoadingProfile } = useStudentMode();

  if (!isStudent || isLoadingProfile || !verificationStatus) {
    return { show: false, status: null, title: '', description: '', variant: 'info' };
  }

  const banners: Record<
    StudentVerificationStatus,
    { show: boolean; title: string; description: string; variant: 'info' | 'warning' | 'success' | 'destructive' }
  > = {
    unverified: {
      show: true,
      title: 'Upload your student ID to unlock all features',
      description: 'Verify your university ID to access the roommate pool and student-verified listings.',
      variant: 'info',
    },
    pending: {
      show: true,
      title: 'Your student ID is under review',
      description: 'Verification usually takes less than 24 hours. We\'ll notify you once approved.',
      variant: 'warning',
    },
    verified: {
      show: false,
      title: 'Student ID verified',
      description: 'You have full access to all student features.',
      variant: 'success',
    },
    rejected: {
      show: true,
      title: 'Student ID not approved',
      description: 'Your ID could not be verified. Please upload a clearer photo and resubmit.',
      variant: 'destructive',
    },
  };

  return { status: verificationStatus, ...banners[verificationStatus] };
}