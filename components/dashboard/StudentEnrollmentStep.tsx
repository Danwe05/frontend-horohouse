'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, MapPin, Droplets, ShieldCheck, Wallet, BedDouble, Info
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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

// ─── Airbnb-Style Shared UI Components ────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-semibold text-[#222222]">{title}</h3>
      {subtitle && <p className="text-base text-[#717171] mt-1">{subtitle}</p>}
    </div>
  );
}

function FormInput({ className, suffix, ...props }: any) {
  return (
    <div className="relative w-full">
      <input
        {...props}
        className={`w-full p-4 text-base border border-[#B0B0B0] rounded-xl text-[#222222] bg-white transition-colors outline-none focus:border-[#222222] focus:ring-1 focus:ring-[#222222] placeholder-[#717171] ${suffix ? 'pr-16' : ''} ${className}`}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-semibold text-[#222222]">
          {suffix}
        </span>
      )}
    </div>
  );
}

function InputLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2">
      <Label className="text-[#222222] text-base font-semibold block">{title}</Label>
      {subtitle && <span className="text-sm text-[#717171]">{subtitle}</span>}
    </div>
  );
}

function SelectField({ label, value, options, onChange, placeholder = 'Select…' }: any) {
  return (
    <div className="w-full">
      <InputLabel title={label} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full p-4 text-base border border-[#B0B0B0] rounded-xl text-[#222222] bg-white outline-none focus:border-[#222222] appearance-none"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function AirbnbToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; }) {
  return (
    <div className="flex items-center justify-between py-6 border-b border-[#EBEBEB] cursor-pointer" onClick={() => onChange(!value)}>
      <div className="pr-4">
        <div className="text-base text-[#222222] font-semibold">{label}</div>
        {desc && <div className="text-sm text-[#717171] mt-1 leading-snug">{desc}</div>}
      </div>
      <button 
        type="button" 
        className={`w-12 h-8 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-[#222222]' : 'bg-[#B0B0B0]'}`}
      >
        <div className={`w-7 h-7 bg-white rounded-full absolute top-0.5 transition-transform ${value ? 'right-0.5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function CounterRow({ title, subtitle, value = 0, onIncrement, onDecrement }: any) {
  return (
    <div className="flex items-center justify-between py-6 border-b border-[#EBEBEB]">
      <div>
        <div className="text-base text-[#222222] font-semibold">{title}</div>
        {subtitle && <div className="text-sm text-[#717171] mt-1">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={onDecrement} className="w-8 h-8 rounded-full border border-[#B0B0B0] flex items-center justify-center text-[#717171] hover:border-[#222222] hover:text-[#222222] disabled:opacity-30">
          -
        </button>
        <span className="w-4 text-center text-base text-[#222222]">{value}</span>
        <button type="button" onClick={onIncrement} className="w-8 h-8 rounded-full border border-[#B0B0B0] flex items-center justify-center text-[#717171] hover:border-[#222222] hover:text-[#222222]">
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentEnrollmentStep({ data, onChange }: Props) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.propertyForm?.student || {};

  const set = <K extends keyof StudentEnrollmentData>(key: K, value: StudentEnrollmentData[K]) =>
    onChange({ ...data, [key]: value });

  const WATER_OPTIONS = [
    { value: 'camwater', label: s.waterOptions?.camwater || 'CAMWATER (municipal)' },
    { value: 'borehole', label: s.waterOptions?.borehole || 'Private borehole' },
    { value: 'camwater_and_borehole', label: s.waterOptions?.camwaterAndBorehole || 'CAMWATER + Borehole' },
    { value: 'well', label: s.waterOptions?.well || 'Open well' },
    { value: 'tanker', label: s.waterOptions?.tanker || 'Tanker delivery' },
  ];

  const ELECTRICITY_OPTIONS = [
    { value: 'none', label: s.electricityOptions?.none || 'ENEO grid only (no backup)' },
    { value: 'solar', label: s.electricityOptions?.solar || 'Solar panels' },
    { value: 'generator', label: s.electricityOptions?.generator || 'Generator' },
    { value: 'solar_and_generator', label: s.electricityOptions?.solarAndGenerator || 'Solar + Generator' },
  ];

  const FURNISHING_OPTIONS = [
    { value: 'unfurnished', label: s.furnishingOptions?.unfurnished || 'Unfurnished' },
    { value: 'semi_furnished', label: s.furnishingOptions?.semiFurnished || 'Semi-furnished (bed + wardrobe)' },
    { value: 'furnished', label: s.furnishingOptions?.furnished || 'Fully furnished' },
  ];

  const GENDER_OPTIONS = [
    { value: 'none', label: s.genderOptions?.none || 'No restriction' },
    { value: 'women_only', label: s.genderOptions?.womenOnly || 'Women only' },
    { value: 'men_only', label: s.genderOptions?.menOnly || 'Men only' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Main Opt-in Card */}
      <div
        onClick={() => set('enabled', !data.enabled)}
        className={`relative overflow-hidden rounded-2xl border-2 cursor-pointer transition-all duration-300 p-6 sm:p-8 flex items-start gap-6 ${
          data.enabled
            ? 'border-[#222222] bg-[#F7F7F7]'
            : 'border-[#B0B0B0] bg-white hover:border-[#222222]'
        }`}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold text-[#222222] mb-2">
            {s.enrollTitle || 'Enroll in Student Housing Programme'}
          </h2>
          <p className="text-base text-[#717171] leading-relaxed">
            {s.enrollDesc || 'Make this property visible in the dedicated student housing search. Students can filter by campus distance, water source, electricity backup, and more.'}
          </p>
          
          {data.enabled && (
            <div className="flex flex-wrap gap-2 mt-6">
              {[(s.tagSearch || 'Student search'), (s.tagFilters || 'Campus filters'), (s.tagApproved || 'Student-Approved')].map(tag => (
                <span key={tag} className="text-xs font-semibold bg-white border border-[#DDDDDD] text-[#222222] px-3 py-1.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Toggle Switch inside the card */}
        <div className="pt-1 hidden sm:block">
           <button type="button" className={`w-14 h-8 rounded-full transition-colors relative ${data.enabled ? 'bg-[#222222]' : 'bg-[#B0B0B0]'}`}>
            <div className={`w-7 h-7 bg-white rounded-full absolute top-0.5 transition-transform ${data.enabled ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {!data.enabled && (
        <div className="flex items-start gap-3 text-[#717171]">
          <Info className="w-5 h-5 shrink-0" />
          <p className="text-sm leading-relaxed">
            {s.optionalTip || 'This step is optional. You can enroll your property later from your property management dashboard.'}
          </p>
        </div>
      )}

      {/* Form — only shown when enabled */}
      <AnimatePresence>
        {data.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-12 pt-6">

              {/* ── 1. Campus distance ── */}
              <section>
                <SectionHeader title={s.campusDistanceTitle || "Campus Distance"} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <InputLabel title={s.nearestCampusLabel || 'Nearest Campus'} subtitle="e.g. University of Buea" />
                    <FormInput
                      value={data.nearestCampus ?? ''}
                      onChange={(e: any) => set('nearestCampus', e.target.value)}
                      placeholder={s.nearestCampusPlaceholder || "Enter institution name"}
                    />
                  </div>
                  <div>
                    <InputLabel title={s.campusProximityLabel || "Distance to Campus"} />
                    <FormInput
                      type="number"
                      min={0}
                      value={data.campusProximityMeters ?? ''}
                      onChange={(e: any) => set('campusProximityMeters', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="500"
                      suffix="m"
                    />
                  </div>
                  <div>
                    <InputLabel title={s.walkingTimeLabel || "Walking Time"} />
                    <FormInput
                      type="number"
                      min={0}
                      value={data.walkingMinutes ?? ''}
                      onChange={(e: any) => set('walkingMinutes', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="7"
                      suffix="min"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <InputLabel title={s.taxiTimeLabel || "Taxi / Moto Time"} />
                    <FormInput
                      type="number"
                      min={0}
                      value={data.taxiMinutes ?? ''}
                      onChange={(e: any) => set('taxiMinutes', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="3"
                      suffix="min"
                    />
                  </div>
                </div>
              </section>

              <hr className="border-[#EBEBEB]" />

              {/* ── 2. Infrastructure ── */}
              <section>
                <SectionHeader title={s.infrastructureTitle || "Infrastructure & Setup"} />
                <div className="grid grid-cols-1 gap-6">
                  <SelectField
                    label={s.waterSourceLabel || "Water Source"}
                    value={data.waterSource ?? ''}
                    options={WATER_OPTIONS}
                    onChange={(v: string) => set('waterSource', v)}
                  />
                  <SelectField
                    label={s.electricityBackupLabel || "Electricity Backup"}
                    value={data.electricityBackup ?? ''}
                    options={ELECTRICITY_OPTIONS}
                    onChange={(v: string) => set('electricityBackup', v)}
                  />
                  <SelectField
                    label={s.furnishingLabel || "Furnishing Status"}
                    value={data.furnishingStatus ?? ''}
                    options={FURNISHING_OPTIONS}
                    onChange={(v: string) => set('furnishingStatus', v)}
                  />
                </div>
              </section>

              <hr className="border-[#EBEBEB]" />

              {/* ── 3. House rules ── */}
              <section>
                <SectionHeader title={s.houseRulesTitle || "House Rules"} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-2">
                  <SelectField
                    label={s.genderRestrictionLabel || "Gender Restriction"}
                    value={data.genderRestriction ?? ''}
                    options={GENDER_OPTIONS}
                    onChange={(v: string) => set('genderRestriction', v)}
                  />
                  <div>
                    <InputLabel title={s.curfewTimeLabel || "Curfew Time"} subtitle={s.curfewTimeHelp || "Leave empty if no curfew"} />
                    <FormInput
                      type="time"
                      value={data.curfewTime ?? ''}
                      onChange={(e: any) => set('curfewTime', e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <AirbnbToggleRow
                    label={s.visitorsAllowedLabel || "Visitors allowed"}
                    desc={s.visitorsAllowedDesc || "Guests can enter the compound and visit rooms."}
                    value={data.visitorsAllowed ?? false}
                    onChange={v => set('visitorsAllowed', v)}
                  />
                  <AirbnbToggleRow
                    label={s.cookingAllowedLabel || "Cooking allowed"}
                    desc={s.cookingAllowedDesc || "Students are permitted to cook inside their room."}
                    value={data.cookingAllowed ?? false}
                    onChange={v => set('cookingAllowed', v)}
                  />
                </div>
              </section>

              {/* ── 4. Security ── */}
              <section>
                <SectionHeader title={s.securityTitle || "Security"} />
                <div>
                  <AirbnbToggleRow
                    label={s.gatedCompoundLabel || "Gated compound"}
                    value={data.hasGatedCompound ?? false}
                    onChange={v => set('hasGatedCompound', v)}
                  />
                  <AirbnbToggleRow
                    label={s.nightWatchmanLabel || "Night watchman"}
                    desc="Property has a dedicated security guard at night."
                    value={data.hasNightWatchman ?? false}
                    onChange={v => set('hasNightWatchman', v)}
                  />
                  <AirbnbToggleRow
                    label={s.secureFenceLabel || "Secure fence"}
                    value={data.hasFence ?? false}
                    onChange={v => set('hasFence', v)}
                  />
                </div>
              </section>

              {/* ── 5. Rent terms ── */}
              <section>
                <SectionHeader title={s.rentTermsTitle || "Rent Terms"} subtitle="Special payment terms for students" />
                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div>
                    <InputLabel title={s.maxAdvanceMonthsLabel || "Max Advance Months"} subtitle="Maximum number of months rent required upfront." />
                    <FormInput
                      type="number"
                      min={1}
                      value={data.maxAdvanceMonths ?? ''}
                      onChange={(e: any) => set('maxAdvanceMonths', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="e.g. 3"
                      suffix="Months"
                    />
                  </div>
                  <div>
                    <InputLabel title={s.pricePerPersonLabel || "Price Per Person (Monthly)"} subtitle="Useful if charging per student rather than per room." />
                    <FormInput
                      type="number"
                      min={0}
                      value={data.pricePerPersonMonthly ?? ''}
                      onChange={(e: any) => set('pricePerPersonMonthly', e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="e.g. 25000"
                      suffix="XAF"
                    />
                  </div>
                </div>
                <div className="border-t border-[#EBEBEB]">
                  <AirbnbToggleRow
                    label={s.acceptsRentAdvanceLabel || "Accept HoroHouse rent-advance scheme"}
                    desc={s.acceptsRentAdvanceDesc || "Allow students to pay rent in installments via HoroHouse microfinance. You still get paid upfront."}
                    value={data.acceptsRentAdvanceScheme ?? false}
                    onChange={v => set('acceptsRentAdvanceScheme', v)}
                  />
                </div>
              </section>

              {/* ── 6. Colocation ── */}
              <section>
                <SectionHeader title={s.colocationTitle || "Colocation (Shared Housing)"} subtitle={s.colocationDesc || "Complete this section if multiple students will share the exact same room or unit."} />
                <div className="border-t border-[#EBEBEB]">
                  <CounterRow
                    title={s.totalBedsLabel || "Total Beds in Unit"}
                    value={data.totalBeds ?? 0}
                    onDecrement={() => set('totalBeds', Math.max(0, (data.totalBeds ?? 0) - 1))}
                    onIncrement={() => set('totalBeds', (data.totalBeds ?? 0) + 1)}
                  />
                  <CounterRow
                    title={s.availableBedsLabel || "Available Beds"}
                    subtitle="Number of beds currently open for rent."
                    value={data.availableBeds ?? 0}
                    onDecrement={() => set('availableBeds', Math.max(0, (data.availableBeds ?? 0) - 1))}
                    onIncrement={() => set('availableBeds', (data.availableBeds ?? 0) + 1)}
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