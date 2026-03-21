'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudentMode } from '@/contexts/StudentModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, AlertCircle, Upload, ArrowRight, X } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'info' | 'warning' | 'success' | 'destructive';

interface BannerConfig {
  show: boolean;
  title: string;
  description: string;
  variant: Variant;
  ctaLabel?: string;
  ctaHref?: string;
  dismissible?: boolean;
}

// ─── Derive banner config from context ───────────────────────────────────────

function useBannerConfig(): BannerConfig {
  const ctx = useStudentMode();
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.banner || {};

  // Support both old stub context (no verificationStatus) and new full context
  const status: string | null =
    ctx.verificationStatus ??
    ctx.studentProfile?.verificationStatus ??
    null;

  const isStudent: boolean = ctx.isStudent ?? false;

  if (!isStudent || !status) {
    return { show: false, title: '', description: '', variant: 'info' };
  }

  const configs: Record<string, BannerConfig> = {
    unverified: {
      show: true,
      variant: 'info',
      title: s.unverifiedTitle || 'Upload your student ID to unlock all features',
      description: s.unverifiedDesc || 'Verify your university ID to access the roommate pool and student-verified listings.',
      ctaLabel: s.uploadBtn || 'Upload ID',
      ctaHref: '/dashboard/settings?tab=student-id',
    },
    pending: {
      show: true,
      variant: 'warning',
      title: s.pendingTitle || 'Your student ID is under review',
      description: s.pendingDesc || "Verification usually takes less than 24 hours. We'll notify you once approved.",
      dismissible: true,
    },
    verified: {
      show: false,
      variant: 'success',
      title: '',
      description: '',
    },
    rejected: {
      show: true,
      variant: 'destructive',
      title: s.rejectedTitle || 'Student ID not approved',
      description: s.rejectedDesc || 'Your ID could not be verified. Please upload a clearer photo and resubmit.',
      ctaLabel: s.reuploadBtn || 'Re-upload ID',
      ctaHref: '/dashboard/settings?tab=student-id',
    },
  };

  return configs[status] ?? { show: false, title: '', description: '', variant: 'info' };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES: Record<Variant, string> = {
  info:        'bg-slate-900 border-slate-800 text-white',
  warning:     'bg-amber-500 border-amber-400 text-white',
  success:     'bg-emerald-500 border-emerald-400 text-white',
  destructive: 'bg-red-500 border-red-400 text-white',
};

const ICONS: Record<Variant, React.ReactNode> = {
  info:        <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400" />,
  warning:     <Clock className="w-5 h-5 shrink-0" />,
  success:     <ShieldCheck className="w-5 h-5 shrink-0" />,
  destructive: <AlertCircle className="w-5 h-5 shrink-0" />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentVerificationBanner() {
  const config = useBannerConfig();
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.banner || {};

  if (!config.show || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`flex items-center gap-4 px-6 py-4 rounded-3xl border shadow-xl shadow-slate-900/10 ${STYLES[config.variant]}`}
      >
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          {ICONS[config.variant]}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-black uppercase tracking-widest text-[11px] opacity-60 mb-1">{config.variant} {s.notificationLbl || 'notification'}</p>
          <p className="font-bold text-sm tracking-tight">{config.title}</p>
          <p className="text-xs opacity-80 mt-0.5 line-clamp-1">{config.description}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {config.ctaLabel && config.ctaHref && (
            <Link href={config.ctaHref}>
              <button className="bg-white text-slate-900 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-colors">
                {config.ctaLabel}
              </button>
            </Link>
          )}
          {config.dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}