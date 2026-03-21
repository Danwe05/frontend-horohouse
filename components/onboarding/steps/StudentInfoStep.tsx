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
import { Loader2, GraduationCap, ChevronRight, ChevronLeft, MapPin, BookOpen } from 'lucide-react';
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

const fadeUpVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 shrink-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto w-14 h-14 bg-blue-50/80 rounded-2xl flex items-center justify-center mb-3 -inner border border-blue-100/50"
        >
          <GraduationCap className="h-7 w-7 text-blue-600" />
        </motion.div>
        <motion.h2
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight"
        >
          Your university details
        </motion.h2>
        <motion.p
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          className="text-slate-500 mt-2 text-sm sm:text-base"
        >
          This links your account to the student housing pool
        </motion.p>
      </div>

      {/* Fields */}
      <div className="flex-1 px-1 pb-4 space-y-5">

        {/* University */}
        <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            University *
          </Label>
          <Select value={form.universityName} onValueChange={set('universityName')}>
            <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-blue-500 rounded-xl h-11">
              <SelectValue placeholder="Select your university" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 -xl max-h-64">
              {CAMEROON_UNIVERSITIES.map((u) => (
                <SelectItem key={u} value={u} className="cursor-pointer">
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Custom university name when "Other" is selected */}
          {form.universityName === 'Other' && (
            <Input
              className="mt-2 bg-white/50 border-slate-200 rounded-xl h-11"
              placeholder="Enter your university name"
              onChange={(e) => set('universityName')(e.target.value)}
            />
          )}
        </motion.div>

        {/* Campus city + campus name row */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              Campus city *
            </Label>
            <Select value={form.campusCity} onValueChange={set('campusCity')}>
              <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-blue-500 rounded-xl h-11">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 -xl">
                {CAMPUS_CITIES.map((c) => (
                  <SelectItem key={c} value={c} className="cursor-pointer">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1.5">
              Campus / site name
            </Label>
            <Input
              value={form.campusName}
              onChange={(e) => set('campusName')(e.target.value)}
              placeholder="e.g. Main campus, Molyko"
              className="bg-white/50 border-slate-200 focus-visible:ring-blue-500 rounded-xl h-11"
            />
          </div>
        </motion.div>

        {/* Faculty */}
        <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-400" />
            Faculty / department
          </Label>
          <Select value={form.faculty} onValueChange={set('faculty')}>
            <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-blue-500 rounded-xl h-11">
              <SelectValue placeholder="Select your faculty (optional)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 -xl max-h-64">
              {FACULTIES.map((f) => (
                <SelectItem key={f} value={f} className="cursor-pointer">
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Study level + year row */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1.5">
              Study level *
            </Label>
            <Select value={form.studyLevel} onValueChange={set('studyLevel')}>
              <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-blue-500 rounded-xl h-11">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 -xl">
                {STUDY_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value} className="cursor-pointer">
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1.5">
              Enrollment year
            </Label>
            <Select
              value={String(form.enrollmentYear)}
              onValueChange={(v) => set('enrollmentYear')(Number(v))}
            >
              <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-blue-500 rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 -xl max-h-48">
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <SelectItem key={y} value={String(y)} className="cursor-pointer">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        className="shrink-0 pt-6 mt-4 border-t border-slate-100 flex justify-between items-center"
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
          onClick={handleNext}
          disabled={isLoading || !isValid}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 sm:px-8 -md -blue-200/50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <span className="flex items-center font-medium">
              Next Step
              <ChevronRight className="w-5 h-5 ml-1" />
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );
}