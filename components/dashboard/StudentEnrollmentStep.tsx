'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, MapPin, Droplets, Zap, Sofa, Users,
  Clock, ShieldCheck, Wallet, BedDouble, ChevronDown,
  CheckCircle2, Info, X,
} from 'lucide-react';

// ─── Types (mirrors MarkStudentFriendlyDto) ───────────────────────────────────

export interface StudentEnrollmentData {
  enabled: boolean;
  campusProximityMeters?: number;
  nearestCampus?: string;
  walkingMinutes?: number;
  taxiMinutes?: number;
  waterSource?: string;
  electricityBackup?: string;
  furnishingStatus?: string;
  genderRestriction?: string;
  curfewTime?: string;
  visitorsAllowed?: boolean;
  cookingAllowed?: boolean;
  hasGatedCompound?: boolean;
  hasNightWatchman?: boolean;
  hasFence?: boolean;
  maxAdvanceMonths?: number;
  acceptsRentAdvanceScheme?: boolean;
  availableBeds?: number;
  totalBeds?: number;
  pricePerPersonMonthly?: number;
}

interface Props {
  data: StudentEnrollmentData;
  onChange: (data: StudentEnrollmentData) => void;
}

// ─── Option sets ──────────────────────────────────────────────────────────────

const WATER_OPTIONS = [
  { value: 'camwater',              label: 'CAMWATER (municipal)' },
  { value: 'borehole',              label: 'Private borehole' },
  { value: 'camwater_and_borehole', label: 'CAMWATER + Borehole' },
  { value: 'well',                  label: 'Open well' },
  { value: 'tanker',                label: 'Tanker delivery' },
];

const ELECTRICITY_OPTIONS = [
  { value: 'none',                label: 'ENEO grid only (no backup)' },
  { value: 'solar',               label: 'Solar panels' },
  { value: 'generator',           label: 'Generator' },
  { value: 'solar_and_generator', label: 'Solar + Generator' },
];

const FURNISHING_OPTIONS = [
  { value: 'unfurnished',    label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-furnished (bed + wardrobe)' },
  { value: 'furnished',      label: 'Fully furnished' },
];

const GENDER_OPTIONS = [
  { value: 'none',       label: 'No restriction' },
  { value: 'women_only', label: 'Women only' },
  { value: 'men_only',   label: 'Men only' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color = 'text-blue-600', bg = 'bg-blue-50' }: {
  icon: React.ElementType; title: string; color?: string; bg?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg} ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
    </div>
  );
}

function SelectField({ label, value, options, onChange, placeholder = 'Select…' }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, placeholder = '0', suffix }: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void;
  min?: number; placeholder?: string; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={min}
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={placeholder}
          className="border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        value
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
      }`}
    >
      <div>
        <p className={`text-sm font-semibold ${value ? 'text-emerald-800' : 'text-slate-700'}`}>{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
        value ? 'bg-emerald-500' : 'bg-slate-200'
      }`}>
        {value && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentEnrollmentStep({ data, onChange }: Props) {
  const set = <K extends keyof StudentEnrollmentData>(key: K, value: StudentEnrollmentData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-6">

      {/* Header opt-in card */}
      <div
        onClick={() => set('enabled', !data.enabled)}
        className={`relative overflow-hidden rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
          data.enabled
            ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50'
            : 'border-slate-200 bg-slate-50 hover:border-blue-300'
        }`}
      >
        <div className="p-5 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
            data.enabled ? 'bg-blue-600' : 'bg-slate-200'
          }`}>
            <GraduationCap className={`w-6 h-6 ${data.enabled ? 'text-white' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`font-bold text-base ${data.enabled ? 'text-blue-900' : 'text-slate-700'}`}>
                Enroll in Student Housing Programme
              </p>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                data.enabled ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`}>
                {data.enabled && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Make this property visible in the student housing search. Students can filter by campus distance, water source, electricity backup, and more.
            </p>
            {data.enabled && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Student search', 'Campus filters', 'Student-Approved eligible'].map(tag => (
                  <span key={tag} className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optional tip */}
      {!data.enabled && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            This step is optional. You can enroll your property later from your property management dashboard.
          </p>
        </div>
      )}

      {/* Form — only shown when enabled */}
      <AnimatePresence>
        {data.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-8 pt-2">

              {/* ── 1. Campus distance ── */}
              <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <SectionHeader icon={MapPin} title="Campus Distance" color="text-blue-600" bg="bg-blue-50" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nearest Campus</Label>
                    <Input
                      value={data.nearestCampus ?? ''}
                      onChange={e => set('nearestCampus', e.target.value)}
                      placeholder="e.g. University of Buea"
                      className="border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <NumberField
                    label="Campus Proximity"
                    value={data.campusProximityMeters}
                    onChange={v => set('campusProximityMeters', v)}
                    placeholder="e.g. 500"
                    suffix="m"
                  />
                  <NumberField
                    label="Walking Time"
                    value={data.walkingMinutes}
                    onChange={v => set('walkingMinutes', v)}
                    placeholder="e.g. 7"
                    suffix="min"
                  />
                  <NumberField
                    label="Taxi / Moto Time"
                    value={data.taxiMinutes}
                    onChange={v => set('taxiMinutes', v)}
                    placeholder="e.g. 3"
                    suffix="min"
                  />
                </div>
              </section>

              {/* ── 2. Infrastructure ── */}
              <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <SectionHeader icon={Droplets} title="Infrastructure" color="text-teal-600" bg="bg-teal-50" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SelectField
                    label="Water Source"
                    value={data.waterSource ?? ''}
                    options={WATER_OPTIONS}
                    onChange={v => set('waterSource', v)}
                  />
                  <SelectField
                    label="Electricity Backup"
                    value={data.electricityBackup ?? ''}
                    options={ELECTRICITY_OPTIONS}
                    onChange={v => set('electricityBackup', v)}
                  />
                  <SelectField
                    label="Furnishing"
                    value={data.furnishingStatus ?? ''}
                    options={FURNISHING_OPTIONS}
                    onChange={v => set('furnishingStatus', v)}
                  />
                </div>
              </section>

              {/* ── 3. House rules ── */}
              <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <SectionHeader icon={Clock} title="House Rules" color="text-amber-600" bg="bg-amber-50" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <SelectField
                    label="Gender Restriction"
                    value={data.genderRestriction ?? ''}
                    options={GENDER_OPTIONS}
                    onChange={v => set('genderRestriction', v)}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Curfew Time</Label>
                    <Input
                      type="time"
                      value={data.curfewTime ?? ''}
                      onChange={e => set('curfewTime', e.target.value)}
                      className="border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-300"
                    />
                    <p className="text-[10px] text-slate-400">Leave empty if no curfew.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ToggleRow
                    label="Visitors allowed"
                    desc="Guests can enter the compound"
                    value={data.visitorsAllowed ?? false}
                    onChange={v => set('visitorsAllowed', v)}
                  />
                  <ToggleRow
                    label="Cooking allowed"
                    desc="Students can cook in their room"
                    value={data.cookingAllowed ?? false}
                    onChange={v => set('cookingAllowed', v)}
                  />
                </div>
              </section>

              {/* ── 4. Security ── */}
              <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <SectionHeader icon={ShieldCheck} title="Security" color="text-emerald-600" bg="bg-emerald-50" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ToggleRow
                    label="Gated compound"
                    value={data.hasGatedCompound ?? false}
                    onChange={v => set('hasGatedCompound', v)}
                  />
                  <ToggleRow
                    label="Night watchman"
                    value={data.hasNightWatchman ?? false}
                    onChange={v => set('hasNightWatchman', v)}
                  />
                  <ToggleRow
                    label="Secure fence"
                    value={data.hasFence ?? false}
                    onChange={v => set('hasFence', v)}
                  />
                </div>
              </section>

              {/* ── 5. Rent terms ── */}
              <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <SectionHeader icon={Wallet} title="Rent Terms" color="text-purple-600" bg="bg-purple-50" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <NumberField
                    label="Max Advance Months"
                    value={data.maxAdvanceMonths}
                    onChange={v => set('maxAdvanceMonths', v)}
                    min={1}
                    placeholder="e.g. 3"
                    suffix="mo"
                  />
                  <NumberField
                    label="Price Per Person / Mo"
                    value={data.pricePerPersonMonthly}
                    onChange={v => set('pricePerPersonMonthly', v)}
                    placeholder="e.g. 25000"
                    suffix="XAF"
                  />
                </div>
                <ToggleRow
                  label="Accept HoroHouse rent-advance scheme"
                  desc="Allow students to pay rent in installments via HoroHouse microfinance"
                  value={data.acceptsRentAdvanceScheme ?? false}
                  onChange={v => set('acceptsRentAdvanceScheme', v)}
                />
              </section>

              {/* ── 6. Colocation ── */}
              <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <SectionHeader icon={BedDouble} title="Colocation (Shared Housing)" color="text-pink-600" bg="bg-pink-50" />
                <p className="text-xs text-slate-400 mb-4 -mt-2">
                  Fill this section if multiple students share the same unit.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberField
                    label="Total Beds in Unit"
                    value={data.totalBeds}
                    onChange={v => set('totalBeds', v)}
                    min={1}
                    placeholder="e.g. 2"
                    suffix="beds"
                  />
                  <NumberField
                    label="Available Beds"
                    value={data.availableBeds}
                    onChange={v => set('availableBeds', v)}
                    min={0}
                    placeholder="e.g. 1"
                    suffix="free"
                  />
                </div>
              </section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}