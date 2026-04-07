'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import {
  Loader2,
  Upload,
  ShieldCheck,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
      toast.success('ID uploaded successfully. Our team will review it shortly.');
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
    <div className="flex flex-col h-full">
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-10">
            <h2 className="text-[32px] sm:text-[36px] font-semibold text-[#222222] tracking-tight mb-2">
              Verify your student ID
            </h2>
            <p className="text-[16px] text-[#717171] leading-relaxed max-w-2xl">
              Upload a photo of your university ID card to unlock the roommate pool and student-verified listings. Usually approved within 24 hours.
            </p>
          </div>

          <div className="max-w-2xl">
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
                  className={cn(
                    "relative cursor-pointer rounded-2xl border border-dashed p-10 flex flex-col items-center justify-center gap-4 text-center transition-colors duration-200 min-h-[280px]",
                    isDragging
                      ? "border-[#222222] bg-[#F7F7F7]"
                      : "border-[#B0B0B0] bg-white hover:bg-[#F7F7F7]"
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-[#EBEBEB] flex items-center justify-center">
                    <Upload className="w-7 h-7 text-[#222222] stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-[#222222]">
                      Drag your ID here, or{' '}
                      <span className="underline underline-offset-2">
                        browse files
                      </span>
                    </p>
                    <p className="text-[14px] text-[#717171] mt-1">
                      JPEG, PNG, WebP, HEIC — max {MAX_SIZE_MB} MB
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Preview */
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative rounded-2xl overflow-hidden border border-[#DDDDDD] bg-[#F7F7F7]"
                >
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Student ID preview"
                      className="w-full object-cover max-h-[340px]"
                    />

                    {/* Overlay badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {uploaded && (
                        <span className="flex items-center gap-1.5 bg-[#222222] text-white text-[13px] font-semibold px-3 py-1.5 rounded-full shadow-md">
                          <CheckCircle2 className="w-4 h-4" />
                          Uploaded
                        </span>
                      )}
                      <button
                        onClick={clearFile}
                        className="bg-white hover:bg-[#F7F7F7] shadow-md rounded-full p-2 transition-colors focus:outline-none"
                      >
                        <X className="w-5 h-5 text-[#222222]" />
                      </button>
                    </div>
                  </div>

                  {/* File name bar */}
                  <div className="px-5 py-4 flex items-center gap-3 border-t border-[#DDDDDD] bg-white">
                    <ImageIcon className="w-5 h-5 text-[#717171] shrink-0" />
                    <span className="text-[15px] font-medium text-[#222222] truncate flex-1">
                      {file?.name}
                    </span>
                    <span className="text-[14px] text-[#717171] shrink-0">
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
                className="mt-4 flex items-start gap-2 text-[#C2410C] text-[14px] font-medium bg-[#FFF7ED] border border-[#C2410C]/20 rounded-xl p-4"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </motion.div>
            )}

            {/* Upload button — shows once a file is chosen and not yet uploaded */}
            <AnimatePresence>
              {file && !uploaded && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6"
                >
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full sm:w-auto h-12 px-8 bg-[#222222] hover:bg-black text-white rounded-lg font-semibold text-[16px] transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload ID for verification
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skip hint */}
            <p className="text-[14px] text-[#717171] mt-6">
              You can skip this step and upload your ID later from your student profile — some features will be locked until verified.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] p-4 sm:p-6 z-50">
        <div className="max-w-[850px] mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            className="text-[16px] font-semibold text-[#222222] underline hover:text-[#717171] transition-colors focus:outline-none"
          >
            Back
          </button>
          <Button
            onClick={nextStep}
            className="h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors disabled:opacity-50"
          >
            {uploaded ? 'Next' : 'Skip for now'}
          </Button>
        </div>
      </div>

    </div>
  );
}