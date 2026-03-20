'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import {
  Loader2,
  Upload,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE_MB = 10;

export function StudentIdUploadStep() {
  const { state, nextStep, prevStep } = useOnboarding();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── File validation ────────────────────────────────────────────────────────

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return 'Only JPEG, PNG, WebP, or HEIC images are accepted.';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const handleFile = (f: File) => {
    const error = validateFile(f);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(f);
    setUploadError(null);
    setUploaded(false);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  // ── Upload ─────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      await apiClient.uploadStudentId(file);
      setUploaded(true);
      toast.success('ID uploaded — our team will review it shortly.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Upload failed. Please try again.';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setUploaded(false);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 shrink-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto w-14 h-14 bg-indigo-50/80 rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-indigo-100/50"
        >
          <ShieldCheck className="h-7 w-7 text-indigo-600" />
        </motion.div>
        <motion.h2
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight"
        >
          Verify your student ID
        </motion.h2>
        <motion.p
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          className="text-slate-500 mt-2 text-sm sm:text-base px-4"
        >
          Upload a photo of your university ID card to unlock the roommate pool
          and student-verified listings. Usually approved within 24 hours.
        </motion.p>
      </div>

      {/* Upload zone */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        className="flex-1 px-1"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <AnimatePresence mode="wait">
          {!preview ? (
            /* Drop zone */
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                relative cursor-pointer rounded-2xl border-2 border-dashed p-10
                flex flex-col items-center justify-center gap-3 text-center
                transition-colors duration-200
                ${isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50/30'
                }
              `}
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Drag your ID here, or{' '}
                  <span className="text-blue-600 underline underline-offset-2">
                    browse files
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  JPEG, PNG, WebP, HEIC — max {MAX_SIZE_MB} MB
                </p>
              </div>
            </motion.div>
          ) : (
            /* Preview */
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
            >
              <img
                src={preview}
                alt="Student ID preview"
                className="w-full object-cover max-h-56"
              />

              {/* Overlay badges */}
              <div className="absolute top-3 right-3 flex gap-2">
                {uploaded && (
                  <span className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                    <CheckCircle2 className="w-3 h-3" />
                    Uploaded
                  </span>
                )}
                <button
                  onClick={clearFile}
                  className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* File name bar */}
              <div className="px-4 py-3 flex items-center gap-2 border-t border-slate-100">
                <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600 truncate flex-1">
                  {file?.name}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {(file!.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload error */}
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {uploadError}
          </motion.div>
        )}

        {/* Upload button — shows once a file is chosen and not yet uploaded */}
        <AnimatePresence>
          {file && !uploaded && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200/50 font-semibold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload ID for verification
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip hint */}
        <p className="text-xs text-center text-slate-400 mt-4">
          You can skip this step and upload your ID later from your student
          profile — some features will be locked until verified.
        </p>
      </motion.div>

      {/* Navigation */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        className="shrink-0 pt-6 mt-6 border-t border-slate-100 flex justify-between items-center"
      >
        <Button
          onClick={prevStep}
          variant="ghost"
          className="text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl px-4 sm:px-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>

        <Button
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 sm:px-8 shadow-md shadow-blue-200/50"
        >
          <span className="flex items-center font-medium">
            {uploaded ? 'Continue' : 'Skip for now'}
            <ChevronRight className="w-5 h-5 ml-1" />
          </span>
        </Button>
      </motion.div>
    </div>
  );
}