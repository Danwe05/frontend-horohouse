'use client';

import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Data ─────────────────────────────────────────────────────────────────────

const CAMEROON_UNIVERSITIES = [
  'University of Buea (UB)',
  'University of Dschang (UDs)',
  'University of Yaoundé I (UY1)',
  'University of Yaoundé II (UY2)',
  'University of Douala (UD)',
  'University of Ngaoundéré (UN)',
  'University of Bamenda (UBa)',
  'University of Maroua (UM)',
  'IRIC – Yaoundé II',
  'ESSEC Business School Douala',
  'ICY – Institut Catholique de Yaoundé',
  'Other',
];

const CAMPUS_CITIES = [
  'Buea', 'Dschang', 'Yaoundé', 'Douala',
  'Ngaoundéré', 'Bamenda', 'Maroua', 'Bafoussam',
];

const STUDY_LEVELS = [
  { value: 'L1', label: 'L1 — First year' },
  { value: 'L2', label: 'L2 — Second year' },
  { value: 'L3', label: 'L3 — Third year' },
  { value: 'Master 1', label: 'Master 1' },
  { value: 'Master 2', label: 'Master 2' },
  { value: 'PhD', label: 'PhD / Doctorate' },
  { value: 'HND 1', label: 'HND 1' },
  { value: 'HND 2', label: 'HND 2' },
];

const FACULTIES = [
  'Faculty of Engineering & Technology',
  'Faculty of Science',
  'Faculty of Arts',
  'Faculty of Social & Management Sciences',
  'Faculty of Health Sciences',
  'Faculty of Agriculture & Veterinary Medicine',
  'Faculty of Law & Political Science',
  'Faculty of Economics & Management',
  'College of Technology',
  'Higher Teacher Training College',
  'Other',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentInfoStep() {
  const { state, nextStep, prevStep, dispatch } = useOnboarding();

  const saved = (state as any).studentInfo || {};

  const [form, setForm] = useState({
    universityName: saved.universityName || '',
    campusCity: saved.campusCity || '',
    campusName: saved.campusName || '',
    faculty: saved.faculty || '',
    studyLevel: saved.studyLevel || '',
    enrollmentYear: saved.enrollmentYear || new Date().getFullYear(),
  });

  const [isLoading, setIsLoading] = useState(false);

  const isValid =
    form.universityName.trim() !== '' &&
    form.campusCity.trim() !== '' &&
    form.studyLevel !== '';

  const handleNext = async () => {
    if (!isValid) return;
    setIsLoading(true);

    try {
      // Store in onboarding state — StudentCompletionStep submits to the API
      (dispatch as any)({ type: 'SET_STUDENT_INFO', payload: form });
      nextStep();
    } finally {
      setIsLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Airbnb input styling
  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";
  const selectClasses = "h-14 w-full rounded-xl border-[#B0B0B0] text-[16px] text-[#222222] focus:ring-[#222222]";

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
              Your university details
            </h2>
            <p className="text-[16px] text-[#717171]">
              This helps link your account to student-only housing.
            </p>
          </div>

          <div className="space-y-8 max-w-2xl">

            {/* University */}
            <div className="space-y-2">
              <Label className="text-[15px] font-medium text-[#222222]">
                University <span className="text-[#C2410C]">*</span>
              </Label>
              <Select value={form.universityName} onValueChange={set('universityName')}>
                <SelectTrigger className={selectClasses}>
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDDDDD] max-h-64">
                  {CAMEROON_UNIVERSITIES.map((u) => (
                    <SelectItem key={u} value={u} className="cursor-pointer py-3">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Custom university name when "Other" is selected */}
              {form.universityName === 'Other' && (
                <Input
                  className={inputClasses}
                  placeholder="Enter your university name"
                  value={form.universityName === 'Other' ? '' : form.universityName}
                  onChange={(e) => set('universityName')(e.target.value)}
                />
              )}
            </div>

            {/* Campus city + campus name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-[#222222]">
                  Campus city <span className="text-[#C2410C]">*</span>
                </Label>
                <Select value={form.campusCity} onValueChange={set('campusCity')}>
                  <SelectTrigger className={selectClasses}>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#DDDDDD]">
                    {CAMPUS_CITIES.map((c) => (
                      <SelectItem key={c} value={c} className="cursor-pointer py-3">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-[#222222]">
                  Campus / site name
                </Label>
                <Input
                  value={form.campusName}
                  onChange={(e) => set('campusName')(e.target.value)}
                  placeholder="e.g. Main campus, Molyko"
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Faculty */}
            <div className="space-y-2 pt-4 border-t border-[#EBEBEB]">
              <Label className="text-[15px] font-medium text-[#222222]">
                Faculty / department
              </Label>
              <Select value={form.faculty} onValueChange={set('faculty')}>
                <SelectTrigger className={selectClasses}>
                  <SelectValue placeholder="Select your faculty (optional)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDDDDD] max-h-64">
                  {FACULTIES.map((f) => (
                    <SelectItem key={f} value={f} className="cursor-pointer py-3">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Study level + year row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-[#222222]">
                  Study level <span className="text-[#C2410C]">*</span>
                </Label>
                <Select value={form.studyLevel} onValueChange={set('studyLevel')}>
                  <SelectTrigger className={selectClasses}>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#DDDDDD]">
                    {STUDY_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value} className="cursor-pointer py-3">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-medium text-[#222222]">
                  Enrollment year
                </Label>
                <Select
                  value={String(form.enrollmentYear)}
                  onValueChange={(v) => set('enrollmentYear')(Number(v))}
                >
                  <SelectTrigger className={selectClasses}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#DDDDDD] max-h-48">
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <SelectItem key={y} value={String(y)} className="cursor-pointer py-3">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
            onClick={handleNext}
            disabled={isLoading || !isValid}
            className="h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[16px] transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Next"}
          </Button>
        </div>
      </div>

    </div>
  );
}