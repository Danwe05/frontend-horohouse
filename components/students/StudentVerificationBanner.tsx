'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStudentMode } from '@/contexts/StudentModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, AlertCircle, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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
      title: s.unverifiedTitle || 'Verify your student status',
      description: s.unverifiedDesc || 'Upload your university ID to access the roommate pool and student-verified listings.',
      ctaLabel: s.uploadBtn || 'Upload ID',
      ctaHref: '/dashboard/settings?tab=student-id',
    },
    pending: {
      show: true,
      variant: 'warning',
      title: s.pendingTitle || 'Your ID is under review',
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

const STYLES: Record<Variant, { container: string; iconBox: string; icon: string; title: string; desc: string }> = {
  info: {
    container: 'bg-white border-[#DDDDDD]',
    iconBox: 'bg-[#F7F7F7] border-[#EBEBEB]',
    icon: 'text-[#222222]',
    title: 'text-[#222222]',
    desc: 'text-[#717171]',
  },
  warning: {
    container: 'bg-[#FFF7ED] border-[#C2410C]/20',
    iconBox: 'bg-white/60 border-[#C2410C]/10',
    icon: 'text-[#C2410C]',
    title: 'text-[#C2410C]',
    desc: 'text-[#C2410C]/80',
  },
  success: {
    container: 'bg-[#EBFBF0] border-[#008A05]/20',
    iconBox: 'bg-white/60 border-[#008A05]/10',
    icon: 'text-[#008A05]',
    title: 'text-[#008A05]',
    desc: 'text-[#008A05]/80',
  },
  destructive: {
    container: 'bg-[#FFF8F6] border-[#C2293F]/20',
    iconBox: 'bg-white/60 border-[#C2293F]/10',
    icon: 'text-[#C2293F]',
    title: 'text-[#C2293F]',
    desc: 'text-[#C2293F]/80',
  },
};

const ICONS: Record<Variant, React.ReactNode> = {
  info: <ShieldCheck className="w-5 h-5 stroke-[1.5]" />,
  warning: <Clock className="w-5 h-5 stroke-[1.5]" />,
  success: <ShieldCheck className="w-5 h-5 stroke-[1.5]" />,
  destructive: <AlertCircle className="w-5 h-5 stroke-[1.5]" />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentVerificationBanner() {
  const config = useBannerConfig();
  const [dismissed, setDismissed] = useState(false);

  if (!config.show || dismissed) return null;
  const style = STYLES[config.variant];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 px-5 py-4 rounded-2xl border", style.container)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", style.iconBox, style.icon)}>
            {ICONS[config.variant]}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <p className={cn("font-semibold text-[15px] leading-tight", style.title)}>
              {config.title}
            </p>
            <p className={cn("text-[14px] mt-0.5 leading-snug", style.desc)}>
              {config.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pl-14 sm:pl-0 shrink-0">
          {config.ctaLabel && config.ctaHref && (
            <Link href={config.ctaHref} className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-[#222222] hover:bg-black text-white px-5 h-10 rounded-lg text-[14px] font-semibold transition-colors flex items-center justify-center gap-2">
                {config.ctaLabel} <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            </Link>
          )}
          {config.dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors focus:outline-none shrink-0"
              aria-label="Dismiss"
            >
              <X className={cn("w-5 h-5", style.icon)} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}