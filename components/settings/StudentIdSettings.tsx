'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileImage,
  RefreshCw,
  ShieldCheck,
  Info,
  ImageIcon,
  Loader2,
  X,
  Users,
  Home,
  CreditCard,
  Star,
} from 'lucide-react';
import { useStudentMode } from '@/contexts/StudentModeContext';
import { apiClient } from '@/lib/api';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  unverified: {
    label: 'Not Submitted',
    icon: <AlertCircle className="h-4 w-4" />,
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-gray-200',
    bg: 'bg-gray-50',
    iconColor: 'text-gray-400',
    ringColor: 'ring-gray-200',
  },
  pending: {
    label: 'Under Review',
    icon: <Clock className="h-4 w-4" />,
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    ringColor: 'ring-amber-200',
  },
  verified: {
    label: 'Verified',
    icon: <CheckCircle2 className="h-4 w-4" />,
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    ringColor: 'ring-emerald-200',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="h-4 w-4" />,
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-200',
    bg: 'bg-red-50',
    iconColor: 'text-red-500',
    ringColor: 'ring-red-200',
  },
} as const;

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ status }: { status: string | null }) {
  const steps = [
    { key: 'upload', label: 'Upload ID' },
    { key: 'review', label: 'Under Review' },
    { key: 'verified', label: 'Verified' },
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
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const state = getStepState(step.key);
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${state === 'done' ? 'bg-emerald-500 text-white' : ''}
                  ${state === 'current' ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                  ${state === 'upcoming' ? 'bg-gray-100 text-gray-400' : ''}
                  ${state === 'rejected' ? 'bg-red-100 text-red-400' : ''}
                `}
              >
                {state === 'done' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium text-center leading-tight
                  ${state === 'current' ? 'text-blue-700' : ''}
                  ${state === 'done' ? 'text-emerald-600' : ''}
                  ${state === 'upcoming' ? 'text-gray-400' : ''}
                  ${state === 'rejected' ? 'text-red-400' : ''}
                `}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 transition-all
                  ${state === 'done' ? 'bg-emerald-300' : 'bg-gray-200'}
                `}
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
}: {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  preview: string | null;
  onClear: () => void;
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
      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200 bg-emerald-50">
        <img
          src={preview}
          alt="ID preview"
          className="w-full h-48 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button
          onClick={onClear}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-all"
        >
          <X className="w-3.5 h-3.5 text-gray-700" />
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 rounded-full px-2.5 py-1">
          <FileImage className="w-3 h-3 text-emerald-600" />
          <span className="text-[11px] font-semibold text-emerald-700">Image selected</span>
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
      className={`
        relative rounded-xl border-2 border-dashed h-44 flex flex-col items-center justify-center gap-3
        transition-all duration-200 cursor-pointer group
        ${isDragging ? 'border-blue-400 bg-blue-50 scale-[0.99]' : ''}
        ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' : 'border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all
        ${isDragging ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'}`}
      >
        <ImageIcon className={`w-5 h-5 transition-colors
          ${isDragging ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`}
        />
      </div>
      <div className="text-center px-4">
        <p className={`text-sm font-semibold transition-colors
          ${isDragging ? 'text-blue-700' : 'text-gray-600 group-hover:text-blue-700'}`}
        >
          {isDragging ? 'Drop your image here' : 'Drop image or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP or HEIC · max 10 MB</p>
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header card with status */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800">
              <ShieldCheck className="h-5 w-5 text-gray-400" />
              <span>Student ID Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
                {cfg.icon}
                {cfg.label}
              </Badge>
              <button
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                title="Refresh status"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-5 space-y-5">
          {/* Progress steps */}
          <StepIndicator status={status} />

          {/* Status message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}
            >
              <div className={`mt-0.5 shrink-0 ${cfg.iconColor}`}>
                {status === 'pending' ? (
                  <Clock className="w-4 h-4" />
                ) : status === 'verified' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : status === 'rejected' ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>
              <div>
                {status === 'unverified' && (
                  <>
                    <p className="text-sm font-semibold text-gray-800">Upload your student ID to get verified</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload a clear photo of your valid student ID card. Verification usually takes less than 24 hours.
                    </p>
                  </>
                )}
                {status === 'pending' && (
                  <>
                    <p className="text-sm font-semibold text-amber-800">Your ID is being reviewed</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Our team is reviewing your submission. You'll be notified once it's approved — usually within 24 hours.
                    </p>
                  </>
                )}
                {status === 'verified' && (
                  <>
                    <p className="text-sm font-semibold text-emerald-800">You're fully verified!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      You have full access to the roommate pool and all student-exclusive features.
                    </p>
                  </>
                )}
                {status === 'rejected' && (
                  <>
                    <p className="text-sm font-semibold text-red-800">Your ID could not be verified</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      The photo was unclear or the ID was invalid. Please upload a clearer image and resubmit.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Student profile summary (if it exists) */}
          {studentProfile && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'University', value: studentProfile.universityName },
                { label: 'Campus', value: studentProfile.campusName },
                { label: 'City', value: studentProfile.campusCity },
                ...(studentProfile.faculty ? [{ label: 'Faculty', value: studentProfile.faculty }] : []),
                ...(studentProfile.studyLevel ? [{ label: 'Level', value: studentProfile.studyLevel }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{value}</p>
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
          <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-50">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                <Upload className="h-4 w-4 text-gray-400" />
                {status === 'rejected' ? 'Re-upload Student ID' : 'Upload Student ID'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">

              {/* Tips */}
              <div className="flex flex-wrap gap-2">
                {[
                  'Photo must be clear and legible',
                  'Show full ID card including name',
                  'Avoid glare or shadows',
                  'Must be a current valid ID',
                ].map((tip) => (
                  <span
                    key={tip}
                    className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium"
                  >
                    <Info className="w-3 h-3 shrink-0" />
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
              />

              {/* Submit button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="rounded-xl min-w-36 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {status === 'rejected' ? 'Resubmit ID' : 'Submit ID'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Perks card */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-50">
          <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            What verification unlocks
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: <Users className="w-4 h-4" />,
                color: 'bg-purple-100 text-purple-600',
                title: 'Roommate pool',
                desc: 'Browse and match with verified students looking to share housing.',
              },
              {
                icon: <Home className="w-4 h-4" />,
                color: 'bg-blue-100 text-blue-600',
                title: 'Student-verified listings',
                desc: 'See properties approved for students with student-friendly terms.',
              },
              {
                icon: <CreditCard className="w-4 h-4" />,
                color: 'bg-teal-100 text-teal-600',
                title: 'Rent advance scheme',
                desc: 'Access landlords offering flexible advance payment plans for students.',
              },
              {
                icon: <Star className="w-4 h-4" />,
                color: 'bg-amber-100 text-amber-600',
                title: 'Ambassador programme',
                desc: 'Eligible verified students can become campus ambassadors.',
              },
            ].map(({ icon, color, title, desc }) => (
              <div
                key={title}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all
                  ${isVerified ? 'border-emerald-100 bg-emerald-50/40' : 'border-gray-100 bg-gray-50/50'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  {icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800">{title}</p>
                    {isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
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
            className={`flex items-start gap-2.5 p-4 rounded-xl border text-sm
              ${message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            {message.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            }
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}