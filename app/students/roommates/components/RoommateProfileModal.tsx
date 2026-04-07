'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoommateProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProfile?: any;
  campusCity?: string;
}

// ─── Option groups ────────────────────────────────────────────────────────────

const CITIES = ['Buea', 'Dschang', 'Yaoundé', 'Douala', 'Ngaoundéré', 'Bamenda', 'Bafoussam'];

function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string; desc?: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="pt-6 border-t border-[#EBEBEB]">
      <Label className="text-[16px] font-semibold text-[#222222] mb-4 block">
        {label}
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all focus:outline-none",
              value === o.value
                ? "border-[#222222] bg-[#F7F7F7] shadow-[0_0_0_1px_#222222]"
                : "border-[#DDDDDD] bg-white hover:border-[#222222]"
            )}
          >
            <p className={cn("text-[15px] font-semibold mb-1", value === o.value ? "text-[#222222]" : "text-[#222222]")}>{o.label}</p>
            {o.desc && <p className="text-[13px] text-[#717171]">{o.desc}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

function BoolToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "flex items-center gap-3 px-5 py-3 rounded-full border text-[15px] font-medium transition-all focus:outline-none",
        value
          ? "border-[#222222] bg-[#F7F7F7] text-[#222222] shadow-[0_0_0_1px_#222222]"
          : "border-[#DDDDDD] bg-white text-[#222222] hover:border-[#222222]"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
        value ? "border-[#222222] bg-[#222222]" : "border-[#DDDDDD]"
      )}>
        {value && <span className="w-2 h-2 rounded-full bg-white" />}
      </div>
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoommateProfileModal({
  open,
  onClose,
  onSuccess,
  existingProfile,
  campusCity,
}: RoommateProfileModalProps) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.modal || {};

  const isEdit = !!existingProfile;

  const [form, setForm] = useState({
    mode: existingProfile?.mode ?? 'need_room' as 'have_room' | 'need_room',
    campusCity: existingProfile?.campusCity ?? campusCity ?? '',
    preferredNeighborhood: existingProfile?.preferredNeighborhood ?? '',
    budgetPerPersonMax: existingProfile?.budgetPerPersonMax ?? 50000,
    budgetPerPersonMin: existingProfile?.budgetPerPersonMin ?? 0,
    moveInDate: existingProfile?.moveInDate?.slice(0, 10) ?? '',
    sleepSchedule: existingProfile?.sleepSchedule ?? 'flexible' as string,
    cleanlinessLevel: existingProfile?.cleanlinessLevel ?? 'neat' as string,
    socialHabit: existingProfile?.socialHabit ?? 'balanced' as string,
    studyHabit: existingProfile?.studyHabit ?? 'mixed' as string,
    isSmoker: existingProfile?.isSmoker ?? false,
    acceptsSmoker: existingProfile?.acceptsSmoker ?? false,
    hasPet: existingProfile?.hasPet ?? false,
    acceptsPet: existingProfile?.acceptsPet ?? false,
    preferredRoommateGender: existingProfile?.preferredRoommateGender ?? 'any' as string,
    bio: existingProfile?.bio ?? '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isValid =
    form.campusCity &&
    form.moveInDate &&
    form.budgetPerPersonMax > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        budgetPerPersonMax: Number(form.budgetPerPersonMax),
        budgetPerPersonMin: Number(form.budgetPerPersonMin),
      };

      if (isEdit) {
        await apiClient.updateMyRoommateProfile(payload);
        toast.success(s.profileUpdated || 'Roommate profile updated.');
      } else {
        await apiClient.createRoommateProfile(payload as any);
        toast.success(s.profileCreated || 'Roommate profile created! You are now visible in the pool.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || s.saveError || 'Failed to save profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] transition-all";
  const selectClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] transition-all";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl p-0 flex flex-col bg-white">
        
        {/* Header */}
        <DialogHeader className="px-8 py-5 border-b border-[#EBEBEB] flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-[22px] font-semibold text-[#222222]">
              {isEdit ? (s.editProfileTitle || 'Edit roommate profile') : (s.createProfileTitle || 'Create roommate profile')}
            </DialogTitle>
            <p className="text-[14px] text-[#717171] mt-1">
              {s.modalDesc || 'Tell potential roommates about yourself so they can find you.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors focus:outline-none">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-8 py-8 overflow-y-auto flex-1 custom-scrollbar space-y-10">

          {/* Mode */}
          <div>
            <Label className="text-[18px] font-semibold text-[#222222] mb-4 block">
              {s.whatLookingFor || 'What are you looking for?'}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: 'need_room', label: s.needRoom || 'I need a room', desc: s.needRoomDesc || 'Looking for a place to co-lease' },
                { value: 'have_room', label: s.haveRoom || 'I have a room', desc: s.haveRoomDesc || 'Spare bed in my current place' },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set('mode')(o.value)}
                  className={cn(
                    "p-5 rounded-xl border text-left transition-all focus:outline-none",
                    form.mode === o.value
                      ? "border-[#222222] bg-[#F7F7F7] shadow-[0_0_0_1px_#222222]"
                      : "border-[#DDDDDD] bg-white hover:border-[#222222]"
                  )}
                >
                  <p className="text-[16px] font-semibold text-[#222222] mb-1">{o.label}</p>
                  <p className="text-[14px] text-[#717171]">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#EBEBEB]">
            <div className="space-y-2">
              <Label className="text-[16px] font-semibold text-[#222222]">
                {s.campusCity || 'Campus city'} <span className="text-[#C2410C]">*</span>
              </Label>
              <Select value={form.campusCity} onValueChange={set('campusCity')}>
                <SelectTrigger className={selectClasses}>
                  <SelectValue placeholder={s.selectCity || "Select city"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDDDDD]">
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c} className="cursor-pointer text-[15px] py-3">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-semibold text-[#222222]">
                {s.preferredNeighborhood || 'Preferred neighbourhood'}
              </Label>
              <Input
                value={form.preferredNeighborhood}
                onChange={(e) => set('preferredNeighborhood')(e.target.value)}
                placeholder={s.neighborhoodPlaceholder || "e.g. Molyko, Bonduma"}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Budget + Move-in */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#EBEBEB]">
            <div className="space-y-2">
              <Label className="text-[16px] font-semibold text-[#222222]">
                {s.maxBudget || 'Max budget / person (FCFA)'} <span className="text-[#C2410C]">*</span>
              </Label>
              <Input
                type="number"
                value={form.budgetPerPersonMax}
                onChange={(e) => set('budgetPerPersonMax')(Number(e.target.value))}
                min={5000}
                step={5000}
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[16px] font-semibold text-[#222222]">
                {s.targetMoveInDate || 'Target move-in date'} <span className="text-[#C2410C]">*</span>
              </Label>
              <Input
                type="date"
                value={form.moveInDate}
                onChange={(e) => set('moveInDate')(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Lifestyle */}
          <div className="space-y-6">
            <ToggleGroup
              label={s.sleepSchedule || "Sleep schedule"}
              value={form.sleepSchedule as any}
              onChange={set('sleepSchedule')}
              options={[
                { value: 'early_bird', label: s.earlyBird || 'Early bird', desc: s.earlyBirdDesc || 'Up by 7am' },
                { value: 'flexible', label: s.flexible || 'Flexible', desc: s.flexibleDesc || 'Goes with flow' },
                { value: 'night_owl', label: s.nightOwl || 'Night owl', desc: s.nightOwlDesc || 'Up past midnight' },
              ]}
            />

            <ToggleGroup
              label={s.cleanliness || "Cleanliness"}
              value={form.cleanlinessLevel as any}
              onChange={set('cleanlinessLevel')}
              options={[
                { value: 'very_neat', label: s.veryNeat || 'Very neat', desc: s.veryNeatDesc || 'Always tidy' },
                { value: 'neat', label: s.neat || 'Neat', desc: s.neatDesc || 'Weekly clean' },
                { value: 'relaxed', label: s.relaxed || 'Relaxed', desc: s.relaxedDesc || 'Some clutter OK' },
              ]}
            />

            <ToggleGroup
              label={s.socialHabits || "Social habits"}
              value={form.socialHabit as any}
              onChange={set('socialHabit')}
              options={[
                { value: 'introverted', label: s.quietHome || 'Quiet home', desc: s.quietHomeDesc || 'Rarely has guests' },
                { value: 'balanced', label: s.balanced || 'Balanced', desc: s.balancedDesc || 'Occasional guests' },
                { value: 'social', label: s.social || 'Social', desc: s.socialDesc || 'Friends over often' },
              ]}
            />

            <ToggleGroup
              label={s.studyHabits || "Study habits"}
              value={form.studyHabit as any}
              onChange={set('studyHabit')}
              options={[
                { value: 'home_studier', label: s.studiesHome || 'Studies home', desc: s.studiesHomeDesc || 'Needs quiet' },
                { value: 'mixed', label: s.mixed || 'Mixed', desc: s.mixedDesc || 'Flexible' },
                { value: 'library_goer', label: s.studiesOut || 'Studies out', desc: s.studiesOutDesc || 'Home is relaxed' },
              ]}
            />
          </div>

          {/* Smoking + pets */}
          <div className="pt-6 border-t border-[#EBEBEB]">
            <Label className="text-[16px] font-semibold text-[#222222] mb-4 block">
              {s.smokingAndPets || 'Smoking & pets'}
            </Label>
            <div className="flex flex-wrap gap-3">
              <BoolToggle label={s.iSmoke || "I smoke"} value={form.isSmoker} onChange={set('isSmoker')} />
              <BoolToggle label={s.smokersOk || "Smokers OK"} value={form.acceptsSmoker} onChange={set('acceptsSmoker')} />
              <BoolToggle label={s.iHavePet || "I have a pet"} value={form.hasPet} onChange={set('hasPet')} />
              <BoolToggle label={s.petsOk || "Pets OK"} value={form.acceptsPet} onChange={set('acceptsPet')} />
            </div>
          </div>

          {/* Gender preference */}
          <div className="pt-6 border-t border-[#EBEBEB]">
            <Label className="text-[16px] font-semibold text-[#222222] mb-4 block">
              {s.preferredGender || 'Preferred roommate gender'}
            </Label>
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              {[
                { value: 'any', label: s.noPreference || 'No preference' },
                { value: 'female', label: s.female || 'Female' },
                { value: 'male', label: s.male || 'Male' },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set('preferredRoommateGender')(o.value)}
                  className={cn(
                    "flex-1 py-3 px-6 rounded-full border text-[15px] font-medium transition-all focus:outline-none",
                    form.preferredRoommateGender === o.value
                      ? "border-[#222222] bg-[#F7F7F7] text-[#222222] shadow-[0_0_0_1px_#222222]"
                      : "border-[#DDDDDD] bg-white text-[#222222] hover:border-[#222222]"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="pt-6 border-t border-[#EBEBEB]">
            <Label className="text-[16px] font-semibold text-[#222222] mb-2 flex items-baseline justify-between">
              <span>{s.shortBio || 'Short bio'}</span>
              <span className="text-[13px] font-normal text-[#717171]">{s.optionalMax300 || 'Optional, max 300 chars'}</span>
            </Label>
            <Textarea
              value={form.bio}
              onChange={(e) => set('bio')(e.target.value.slice(0, 300))}
              placeholder={s.bioPlaceholder || "Tell potential roommates a bit about yourself..."}
              rows={4}
              className="w-full px-4 py-3 text-[16px] border border-[#B0B0B0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] resize-none bg-white placeholder:text-[#717171]"
            />
            <p className="text-[13px] text-[#717171] text-right mt-2">{form.bio.length}/300</p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[#EBEBEB] bg-white shrink-0 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="w-full sm:w-auto h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[16px] active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isEdit ? (s.saveChanges || 'Save changes') : (s.joinPoolBtn || 'Join the roommate pool')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}