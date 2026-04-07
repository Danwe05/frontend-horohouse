'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileImage,
  RefreshCw,
  ShieldCheck,
  Info,
  Image as ImageIcon,
  Loader2,
  X,
  Users,
  Home,
  CreditCard,
  Star,
  GraduationCap
} from 'lucide-react';
import { useStudentMode } from '@/contexts/StudentModeContext';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  unverified: {
    label: 'Not Submitted',
    icon: <AlertCircle className="h-4 w-4" />,
    badge: 'border-[#DDDDDD] text-[#717171] bg-white',
    border: 'border-[#DDDDDD]',
    bg: 'bg-white',
    iconColor: 'text-[#717171]',
  },
  pending: {
    label: 'Under Review',
    icon: <Clock className="h-4 w-4" />,
    badge: 'border-[#C2410C]/30 text-[#C2410C] bg-[#FFF7ED]',
    border: 'border-[#C2410C]/20',
    bg: 'bg-[#FFF7ED]',
    iconColor: 'text-[#C2410C]',
  },
  verified: {
    label: 'Verified',
    icon: <CheckCircle2 className="h-4 w-4" />,
    badge: 'border-[#008A05]/30 text-[#008A05] bg-[#EBFBF0]',
    border: 'border-[#008A05]/20',
    bg: 'bg-[#EBFBF0]',
    iconColor: 'text-[#008A05]',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="h-4 w-4" />,
    badge: 'border-[#C2293F]/30 text-[#C2293F] bg-[#FFF8F6]',
    border: 'border-[#C2293F]/20',
    bg: 'bg-[#FFF8F6]',
    iconColor: 'text-[#C2293F]',
  },
} as const;

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ status, s }: { status: string | null, s: any }) {
  const steps = [
    { key: 'upload', label: s?.uploadId || 'Upload ID' },
    { key: 'review', label: s?.underReview || 'Under Review' },
    { key: 'verified', label: s?.verified || 'Verified' },
  ];

  const getStepState = (stepKey: string) => {
    if (!status || status === 'unverified') {
      return stepKey === 'upload' ? 'current' : 'upcoming';
    }
    if (status === 'pending') {
      if (stepKey === 'upload') return 'done';
      if (stepKey === 'review') return 'current';
      return 'upcoming';
    }
    if (status === 'verified') return 'done';
    if (status === 'rejected') {
      if (stepKey === 'upload') return 'done';
      return 'rejected';
    }
    return 'upcoming';
  };

  return (
    <div className="flex items-center w-full max-w-[400px]">
      {steps.map((step, idx) => {
        const state = getStepState(step.key);
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-2 w-[80px]">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all border-2",
                  state === 'done' ? "bg-[#222222] border-[#222222] text-white" : "",
                  state === 'current' ? "bg-white border-[#222222] text-[#222222]" : "",
                  state === 'upcoming' ? "bg-white border-[#DDDDDD] text-[#717171]" : "",
                  state === 'rejected' ? "bg-[#FFF8F6] border-[#C2293F] text-[#C2293F]" : ""
                )}
              >
                {state === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-white stroke-[3]" />
                ) : state === 'rejected' ? (
                  <XCircle className="w-5 h-5 text-[#C2293F] stroke-[3]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[12px] font-semibold text-center leading-tight",
                  state === 'current' ? "text-[#222222]" : "",
                  state === 'done' ? "text-[#222222]" : "",
                  state === 'upcoming' ? "text-[#717171]" : "",
                  state === 'rejected' ? "text-[#C2293F]" : ""
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-[2px] mb-6 transition-all",
                  state === 'done' ? "bg-[#222222]" : "bg-[#EBEBEB]"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Drop zone ────────────────────────────────────────────────────────────────

function DropZone({
  onFileSelect,
  disabled,
  preview,
  onClear,
  s,
}: {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  preview: string | null;
  onClear: () => void;
  s: any;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) onFileSelect(file);
    },
    [disabled, onFileSelect],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-[#DDDDDD] bg-[#F7F7F7]">
        <img
          src={preview}
          alt="ID preview"
          className="w-full h-[280px] object-cover object-center"
        />
        <button
          onClick={onClear}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white hover:bg-[#F7F7F7] shadow-md flex items-center justify-center transition-colors focus:outline-none"
        >
          <X className="w-5 h-5 text-[#222222]" />
        </button>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#222222] text-white rounded-full px-3 py-1.5 shadow-md">
          <FileImage className="w-4 h-4" />
          <span className="text-[13px] font-semibold">{s?.imageSelected || "Image selected"}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "relative rounded-2xl border border-dashed h-[280px] flex flex-col items-center justify-center gap-4 transition-colors duration-200 cursor-pointer group",
        isDragging ? "border-[#222222] bg-[#F7F7F7]" : "border-[#B0B0B0] bg-white hover:bg-[#F7F7F7]",
        disabled && "opacity-50 cursor-not-allowed hover:bg-white border-[#DDDDDD]"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <div className="w-16 h-16 rounded-full bg-[#EBEBEB] flex items-center justify-center">
        <ImageIcon className="w-7 h-7 text-[#222222] stroke-[1.5]" />
      </div>
      <div className="text-center px-4">
        <p className="text-[16px] font-semibold text-[#222222]">
          {isDragging ? (s?.dropYourImageHere || 'Drop your image here') : (s?.dropImageOrClickToBrowse || 'Drop image or click to browse')}
        </p>
        <p className="text-[14px] text-[#717171] mt-1">{s?.jpgPngWebpOrHeic || "JPEG, PNG, WEBP, HEIC — max 10 MB"}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentIdSettings() {
  const {
    verificationStatus,
    isVerified,
    isLoadingProfile,
    studentProfile,
    refreshStudentProfile,
  } = useStudentMode();

  const { t } = useLanguage();
  const s = (t as any)?.settings || {};

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const status = verificationStatus ?? 'unverified';
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unverified;

  const canUpload = status === 'unverified' || status === 'rejected';

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File is too large. Maximum size is 10 MB.' });
      return;
    }

    try {
      setIsUploading(true);
      setMessage(null);
      await apiClient.uploadStudentId(selectedFile);
      await refreshStudentProfile();
      handleClear();
      setMessage({ type: 'success', text: 'Student ID submitted successfully. We\'ll review it within 24 hours.' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message ?? 'Upload failed. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await refreshStudentProfile();
      setMessage({ type: 'success', text: 'Status refreshed.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to refresh status.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#222222] stroke-[2.5]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">

      <div className="mb-2">
        <h2 className="text-[32px] font-semibold tracking-tight text-[#222222] mb-2">Student verification</h2>
        <p className="text-[16px] text-[#717171]">Manage your student identity to access exclusive housing and features.</p>
      </div>

      {/* Header card with status */}
      <Card className="rounded-2xl border-[#DDDDDD] shadow-none overflow-hidden bg-white">
        <CardHeader className="pb-4 border-b border-[#EBEBEB]">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#222222] text-[18px]">
              <ShieldCheck className="h-5 w-5 stroke-[1.5]" />
              <span>{s?.studentIdVerification || "Student ID Verification"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold border', cfg.badge)}>
                {cfg.icon}
                {s?.[status] || cfg.label}
              </span>
              <button
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                title="Refresh status"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#717171] hover:bg-[#F7F7F7] hover:text-[#222222] transition-colors focus:outline-none"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-10">
          {/* Progress steps */}
          <StepIndicator status={status} s={s} />

          {/* Status message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-xl border", cfg.bg, cfg.border)}
            >
              <div className={cn("shrink-0", cfg.iconColor)}>
                {status === 'pending' ? <Clock className="w-6 h-6 stroke-[1.5]" />
                  : status === 'verified' ? <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
                  : status === 'rejected' ? <XCircle className="w-6 h-6 stroke-[1.5]" />
                  : <Info className="w-6 h-6 stroke-[1.5]" />}
              </div>
              <div>
                {status === 'unverified' && (
                  <>
                    <p className="text-[16px] font-semibold text-[#222222]">{s?.uploadYourStudentIdToGetVerified || "Upload your student ID to get verified"}</p>
                    <p className="text-[14px] text-[#717171] mt-1">
                      {s?.uploadYourStudentIdDesc || "Upload a clear photo of your valid student ID card. Verification usually takes less than 24 hours."}
                    </p>
                  </>
                )}
                {status === 'pending' && (
                  <>
                    <p className="text-[16px] font-semibold text-[#C2410C]">{s?.yourIdIsBeingReviewed || "Your ID is being reviewed"}</p>
                    <p className="text-[14px] text-[#C2410C] mt-1 opacity-80">
                      {s?.yourIdIsBeingReviewedDesc || "Our team is reviewing your submission. You'll be notified once it's approved — usually within 24 hours."}
                    </p>
                  </>
                )}
                {status === 'verified' && (
                  <>
                    <p className="text-[16px] font-semibold text-[#008A05]">{s?.youAreFullyVerified || "You're fully verified!"}</p>
                    <p className="text-[14px] text-[#008A05] mt-1 opacity-80">
                      {s?.youAreFullyVerifiedDesc || "You have full access to the roommate pool and all student-exclusive features."}
                    </p>
                  </>
                )}
                {status === 'rejected' && (
                  <>
                    <p className="text-[16px] font-semibold text-[#C2293F]">{s?.yourIdCouldNotBeVerified || "Your ID could not be verified"}</p>
                    <p className="text-[14px] text-[#C2293F] mt-1 opacity-80">
                      {s?.yourIdCouldNotBeVerifiedDesc || "The photo was unclear or the ID was invalid. Please upload a clearer image and resubmit."}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Student profile summary */}
          {studentProfile && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-[#EBEBEB]">
              {[
                { label: 'University', value: studentProfile.universityName },
                { label: 'Campus', value: studentProfile.campusName },
                { label: 'City', value: studentProfile.campusCity },
                ...(studentProfile.faculty ? [{ label: 'Faculty', value: studentProfile.faculty }] : []),
                ...(studentProfile.studyLevel ? [{ label: 'Level', value: studentProfile.studyLevel }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-[#717171]">{label}</p>
                  <p className="text-[15px] font-semibold text-[#222222] truncate">{value}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload card — only shown when upload is allowed */}
      {canUpload && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="rounded-2xl border-[#DDDDDD] shadow-none overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b border-[#EBEBEB]">
              <CardTitle className="flex items-center gap-2.5 text-[#222222] text-[18px]">
                <Upload className="h-5 w-5 stroke-[1.5]" />
                {status === 'rejected' ? (s?.reUploadStudentId || 'Re-upload Student ID') : (s?.uploadStudentId || 'Upload Student ID')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">

              {/* Tips */}
              <div className="flex flex-wrap gap-3">
                {[
                  s?.photoMustBeClear || 'Photo must be clear and legible',
                  s?.showFullId || 'Show full ID card including name',
                  s?.avoidGlare || 'Avoid glare or shadows',
                  s?.mustBeCurrentId || 'Must be a current valid ID',
                ].map((tip) => (
                  <span
                    key={tip}
                    className="inline-flex items-center gap-2 text-[13px] bg-[#F7F7F7] text-[#222222] px-3 py-1.5 rounded-full font-medium border border-[#EBEBEB]"
                  >
                    <Info className="w-3.5 h-3.5 shrink-0 text-[#717171]" />
                    {tip}
                  </span>
                ))}
              </div>

              {/* Drop zone */}
              <DropZone
                onFileSelect={handleFileSelect}
                disabled={isUploading}
                preview={preview}
                onClear={handleClear}
                s={s}
              />

              {/* Submit button */}
              <div className="flex justify-end pt-4 border-t border-[#EBEBEB]">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="rounded-lg h-12 px-8 bg-[#222222] hover:bg-black text-white font-semibold text-[15px] transition-colors disabled:opacity-50 w-full sm:w-auto active:scale-[0.98]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {s?.uploading || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {status === 'rejected' ? (s?.resubmitId || 'Resubmit ID') : (s?.submitId || 'Submit ID')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Perks card */}
      <Card className="rounded-2xl border-[#DDDDDD] shadow-none overflow-hidden bg-white">
        <CardHeader className="pb-4 border-b border-[#EBEBEB]">
          <CardTitle className="flex items-center gap-2.5 text-[#222222] text-[18px]">
            <GraduationCap className="h-5 w-5 stroke-[1.5]" />
            {s?.whatVerificationUnlocks || "What verification unlocks"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: <Users className="w-5 h-5" />,
                title: s?.roommatePool || 'Roommate pool',
                desc: s?.roommatePoolDesc || 'Browse and match with verified students looking to share housing.',
              },
              {
                icon: <Home className="w-5 h-5" />,
                title: s?.studentVerifiedListings || 'Student-verified listings',
                desc: s?.studentVerifiedListingsDesc || 'See properties approved for students with student-friendly terms.',
              },
              {
                icon: <CreditCard className="w-5 h-5" />,
                title: s?.rentAdvanceScheme || 'Rent advance scheme',
                desc: s?.rentAdvanceSchemeDesc || 'Access landlords offering flexible advance payment plans for students.',
              },
              {
                icon: <Star className="w-5 h-5" />,
                title: s?.ambassadorProgramme || 'Ambassador programme',
                desc: s?.ambassadorProgrammeDesc || 'Eligible verified students can become campus ambassadors.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border transition-all",
                  isVerified ? "border-[#DDDDDD] bg-[#F7F7F7]" : "border-[#EBEBEB] bg-white"
                )}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white border border-[#DDDDDD] text-[#222222]">
                  {icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[16px] font-semibold text-[#222222]">{title}</p>
                    {isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-[#008A05] shrink-0" />
                    )}
                  </div>
                  <p className="text-[14px] text-[#717171] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "flex items-start gap-3 p-5 rounded-xl border text-[14px] font-medium",
              message.type === 'success'
                ? "bg-[#EBFBF0] border-[#008A05]/20 text-[#008A05]"
                : "bg-[#FFF7ED] border-[#C2410C]/20 text-[#C2410C]"
            )}
          >
            {message.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            }
            <span className="pt-0.5">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}