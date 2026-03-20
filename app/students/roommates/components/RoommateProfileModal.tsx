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
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
    <div>
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
        {label}
      </Label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              value === o.value
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/30'
            }`}
          >
            <p className="text-xs font-semibold">{o.label}</p>
            {o.desc && <p className="text-[10px] text-slate-400 mt-0.5">{o.desc}</p>}
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
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
        value
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
        value ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
      }`}>
        {value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
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
  const isEdit = !!existingProfile;

  const [form, setForm] = useState({
    mode:                    existingProfile?.mode                    ?? 'need_room' as 'have_room' | 'need_room',
    campusCity:              existingProfile?.campusCity              ?? campusCity ?? '',
    preferredNeighborhood:   existingProfile?.preferredNeighborhood   ?? '',
    budgetPerPersonMax:      existingProfile?.budgetPerPersonMax      ?? 50000,
    budgetPerPersonMin:      existingProfile?.budgetPerPersonMin      ?? 0,
    moveInDate:              existingProfile?.moveInDate?.slice(0, 10) ?? '',
    sleepSchedule:           existingProfile?.sleepSchedule           ?? 'flexible'  as string,
    cleanlinessLevel:        existingProfile?.cleanlinessLevel        ?? 'neat'      as string,
    socialHabit:             existingProfile?.socialHabit             ?? 'balanced'  as string,
    studyHabit:              existingProfile?.studyHabit              ?? 'mixed'     as string,
    isSmoker:                existingProfile?.isSmoker                ?? false,
    acceptsSmoker:           existingProfile?.acceptsSmoker           ?? false,
    hasPet:                  existingProfile?.hasPet                  ?? false,
    acceptsPet:              existingProfile?.acceptsPet              ?? false,
    preferredRoommateGender: existingProfile?.preferredRoommateGender ?? 'any'       as string,
    bio:                     existingProfile?.bio                     ?? '',
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
        toast.success('Roommate profile updated.');
      } else {
        await apiClient.createRoommateProfile(payload as any);
        toast.success('Roommate profile created! You are now visible in the pool.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">
                {isEdit ? 'Edit roommate profile' : 'Create roommate profile'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Tell potential roommates about yourself so they can find you.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-6">

          {/* Mode */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              What are you looking for?
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'need_room', label: 'I need a room', desc: 'Looking for a place to co-lease' },
                { value: 'have_room', label: 'I have a room', desc: 'Spare bed in my current place' },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set('mode')(o.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.mode === o.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.mode === o.value ? 'text-blue-800' : 'text-slate-700'}`}>
                    {o.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                Campus city *
              </Label>
              <Select value={form.campusCity} onValueChange={set('campusCity')}>
                <SelectTrigger className="rounded-xl border-slate-200 h-10 text-sm">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c} className="cursor-pointer text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                Preferred neighbourhood
              </Label>
              <Input
                value={form.preferredNeighborhood}
                onChange={(e) => set('preferredNeighborhood')(e.target.value)}
                placeholder="e.g. Molyko, Bonduma"
                className="rounded-xl border-slate-200 h-10 text-sm"
              />
            </div>
          </div>

          {/* Budget + Move-in */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                Max budget / person (XAF) *
              </Label>
              <Input
                type="number"
                value={form.budgetPerPersonMax}
                onChange={(e) => set('budgetPerPersonMax')(Number(e.target.value))}
                min={5000}
                step={5000}
                className="rounded-xl border-slate-200 h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                Target move-in date *
              </Label>
              <Input
                type="date"
                value={form.moveInDate}
                onChange={(e) => set('moveInDate')(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="rounded-xl border-slate-200 h-10 text-sm"
              />
            </div>
          </div>

          {/* Lifestyle */}
          <ToggleGroup
            label="Sleep schedule"
            value={form.sleepSchedule as any}
            onChange={set('sleepSchedule')}
            options={[
              { value: 'early_bird', label: 'Early bird', desc: 'Up by 7am' },
              { value: 'flexible',   label: 'Flexible',   desc: 'Goes with flow' },
              { value: 'night_owl',  label: 'Night owl',  desc: 'Up past midnight' },
            ]}
          />

          <ToggleGroup
            label="Cleanliness"
            value={form.cleanlinessLevel as any}
            onChange={set('cleanlinessLevel')}
            options={[
              { value: 'very_neat', label: 'Very neat',  desc: 'Always tidy' },
              { value: 'neat',      label: 'Neat',       desc: 'Weekly clean' },
              { value: 'relaxed',   label: 'Relaxed',    desc: 'Some clutter OK' },
            ]}
          />

          <ToggleGroup
            label="Social habits"
            value={form.socialHabit as any}
            onChange={set('socialHabit')}
            options={[
              { value: 'introverted', label: 'Quiet home', desc: 'Rarely has guests' },
              { value: 'balanced',    label: 'Balanced',   desc: 'Occasional guests' },
              { value: 'social',      label: 'Social',     desc: 'Friends over often' },
            ]}
          />

          <ToggleGroup
            label="Study habits"
            value={form.studyHabit as any}
            onChange={set('studyHabit')}
            options={[
              { value: 'home_studier',  label: 'Studies home',    desc: 'Needs quiet' },
              { value: 'mixed',         label: 'Mixed',           desc: 'Flexible' },
              { value: 'library_goer',  label: 'Studies out',     desc: 'Home is relaxed' },
            ]}
          />

          {/* Smoking + pets */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Smoking & pets
            </Label>
            <div className="flex flex-wrap gap-2">
              <BoolToggle label="I smoke"         value={form.isSmoker}       onChange={set('isSmoker')} />
              <BoolToggle label="Smokers OK"       value={form.acceptsSmoker}  onChange={set('acceptsSmoker')} />
              <BoolToggle label="I have a pet"     value={form.hasPet}         onChange={set('hasPet')} />
              <BoolToggle label="Pets OK"          value={form.acceptsPet}     onChange={set('acceptsPet')} />
            </div>
          </div>

          {/* Gender preference */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Preferred roommate gender
            </Label>
            <div className="flex gap-2">
              {[
                { value: 'any',    label: 'No preference' },
                { value: 'female', label: 'Female' },
                { value: 'male',   label: 'Male' },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set('preferredRoommateGender')(o.value)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    form.preferredRoommateGender === o.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
              Short bio <span className="normal-case font-normal text-slate-400">(optional, max 300 chars)</span>
            </Label>
            <Textarea
              value={form.bio}
              onChange={(e) => set('bio')(e.target.value.slice(0, 300))}
              placeholder="Tell potential roommates a bit about yourself…"
              rows={3}
              className="rounded-xl border-slate-200 text-sm resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right mt-1">{form.bio.length}/300</p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-200/50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              isEdit ? 'Save changes' : 'Join the roommate pool'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}