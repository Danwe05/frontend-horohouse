'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SlidersHorizontal,
  Droplets,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Bed,
  MapPin,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useLanguage } from '@/contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentFilters {
  city?: string;
  maxCampusProximityMeters?: number;
  minPricePerPerson?: number;
  maxPricePerPerson?: number;
  waterSource?: string;
  electricityBackup?: string;
  furnishingStatus?: string;
  genderRestriction?: string;
  noCurfew?: boolean;
  visitorsAllowed?: boolean;
  hasGatedCompound?: boolean;
  hasNightWatchman?: boolean;
  studentApprovedOnly?: boolean;
  acceptsRentAdvanceScheme?: boolean;
  hasAvailableBeds?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface StudentSearchFiltersProps {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
  onReset: () => void;
  activeCount: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CITIES = ['Buea', 'Dschang', 'Yaoundé', 'Douala', 'Ngaoundéré', 'Bamenda', 'Bafoussam'];

// ─── Toggle chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-full border transition-all ${active
          ? 'bg-blue-600 text-white border-blue-600 -md -blue-500/20'
          : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:bg-slate-50'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentSearchFilters({
  filters,
  onChange,
  onReset,
  activeCount,
}: StudentSearchFiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.filters || {};

  const WATER_OPTIONS = [
    { value: '', label: s.anyWater || 'Any water source' },
    { value: 'camwater', label: s.camwater || 'CAMWATER' },
    { value: 'borehole', label: s.borehole || 'Borehole' },
    { value: 'camwater_and_borehole', label: s.dualWater || 'Dual (CAMWATER + borehole)' },
    { value: 'tanker', label: s.tanker || 'Tanker delivery' },
  ];

  const ELECTRICITY_OPTIONS = [
    { value: '', label: s.anyBackup || 'Any backup' },
    { value: 'solar', label: s.solar || 'Solar panels' },
    { value: 'generator', label: s.generator || 'Generator' },
    { value: 'solar_and_generator', label: s.solarGen || 'Solar + Generator' },
    { value: 'none', label: s.eneoOnly || 'ENEO only (no backup)' },
  ];

  const SORT_OPTIONS = [
    { value: 'campusProximityMeters-asc', label: s.sortClosest || 'Closest to campus' },
    { value: 'pricePerPersonMonthly-asc', label: s.sortPriceUp || 'Price per person ↑' },
    { value: 'pricePerPersonMonthly-desc', label: s.sortPriceDown || 'Price per person ↓' },
    { value: 'createdAt-desc', label: s.sortNewest || 'Newest listings' },
  ];

  const set = (key: keyof StudentFilters, value: any) =>
    onChange({ ...filters, [key]: value || undefined });

  const toggleBool = (key: keyof StudentFilters) =>
    onChange({ ...filters, [key]: !filters[key] || undefined });

  const currentSort = filters.sortBy
    ? `${filters.sortBy}-${filters.sortOrder || 'asc'}`
    : 'campusProximityMeters-asc';

  const handleSortChange = (val: string) => {
    const [sortBy, sortOrder] = val.split('-');
    onChange({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
  };

  return (
    <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-white border-b border-slate-100 mb-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Desktop Quick Filters + Active Indicators */}
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <FilterChip
            label={s.verified || "Verified"}
            active={!!filters.studentApprovedOnly}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => toggleBool('studentApprovedOnly')}
          />
          <FilterChip
            label={s.bedsAvailable || "Beds available"}
            active={!!filters.hasAvailableBeds}
            icon={<Bed className="w-3.5 h-3.5" />}
            onClick={() => toggleBool('hasAvailableBeds')}
          />

          {activeCount > 0 && <div className="h-4 w-px bg-slate-100 mx-2 shrink-0" />}

          {filters.city && (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shrink-0">
              <MapPin className="w-3 h-3" />
              {filters.city}
              <button onClick={() => set('city', '')} className="ml-1 hover:text-blue-800"><X className="w-3 h-3" /></button>
            </div>
          )}
          {filters.maxCampusProximityMeters && (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shrink-0">
              {(filters.maxCampusProximityMeters / 1000).toFixed(1)}km
              <button onClick={() => set('maxCampusProximityMeters', undefined)} className="ml-1 hover:text-blue-800"><X className="w-3 h-3" /></button>
            </div>
          )}
          {filters.waterSource && (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shrink-0">
              <Droplets className="w-3 h-3" />
              {filters.waterSource.split('_').pop()}
              <button onClick={() => set('waterSource', '')} className="ml-1 hover:text-blue-800"><X className="w-3 h-3" /></button>
            </div>
          )}
          {filters.electricityBackup && (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shrink-0">
              <Zap className="w-3 h-3" />
              {filters.electricityBackup.split('_').pop()}
              <button onClick={() => set('electricityBackup', '')} className="ml-1 hover:text-blue-800"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        {/* Mobile Filter */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="lg:hidden flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest -xl -slate-900/30 shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {s.moreFilters || 'More Filters'}
          {activeCount > 0 && (
            <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
              {activeCount}
            </span>
          )}
        </button>

        {/* Advanced & Sort */}
        <div className="flex items-center gap-3 ml-auto">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 px-3 transition-colors"
            >
              {s.reset || 'Reset'}
            </button>
          )}

          <div className="hidden sm:block h-6 w-px bg-slate-100" />

          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-44 h-11 rounded-full border-slate-50 bg-slate-50 text-[11px] font-bold uppercase tracking-wide px-5 focus:ring-blue-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-50 p-1">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs font-bold rounded-xl cursor-pointer py-2.5">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="hidden lg:flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white h-11 px-6 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {s.more || 'More'}
          </button>
        </div>
      </div>

      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="max-w-md w-full h-[85vh] flex flex-col p-0 border-slate-100 rounded-[32px] overflow-hidden gap-0 bg-white">
          <DialogHeader className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tighter uppercase">{s.advancedFilters || 'Advanced Filters'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar">
            <section>
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">{s.prefLoc || 'Preferred Location'}</Label>
              <div className="flex flex-wrap gap-2">
                {['', ...CITIES].map(c => (
                  <button
                    key={c}
                    onClick={() => set('city', c)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${filters.city === c || (!c && !filters.city)
                      ? 'bg-blue-600 text-white border-blue-600 -lg -blue-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {c || s.anyCity || 'Any City'}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-6">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.campusProx || 'Campus Proximity'}</Label>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {filters.maxCampusProximityMeters ? `${s.max || 'Max'} ${(filters.maxCampusProximityMeters / 1000).toFixed(1)}km` : s.anyDist || 'Any Distance'}
                </span>
              </div>
              <Slider
                min={200}
                max={5000}
                step={100}
                value={[filters.maxCampusProximityMeters ?? 5000]}
                onValueChange={([v]) => set('maxCampusProximityMeters', v === 5000 ? undefined : v)}
              />
              <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                <span>200m</span>
                <span>5km+</span>
              </div>
            </section>

            <section>
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">{s.waterPower || 'Water & Power'}</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{s.waterSrc || 'Water Source'}</p>
                  <div className="flex flex-wrap gap-2">
                    {WATER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('waterSource', opt.value)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filters.waterSource === opt.value || (!opt.value && !filters.waterSource)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-500 border-slate-100 hover:border-blue-100'}`}
                      >
                        {opt.label.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{s.elecBackup || 'Electricity Backup'}</p>
                  <div className="flex flex-wrap gap-2">
                    {ELECTRICITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('electricityBackup', opt.value)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${filters.electricityBackup === opt.value || (!opt.value && !filters.electricityBackup)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-500 border-slate-100 hover:border-blue-100'}`}
                      >
                        {opt.label.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">{s.livingRules || 'Living Rules'}</Label>
              <div className="flex flex-wrap gap-2">
                <FilterChip label={s.noCurfew || "No Curfew"} active={!!filters.noCurfew} onClick={() => toggleBool('noCurfew')} />
                <FilterChip label={s.visAllowed || "Visitors Allowed"} active={!!filters.visitorsAllowed} onClick={() => toggleBool('visitorsAllowed')} />
              </div>
            </section>

            <section>
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">{s.propSecurity || 'Property Security'}</Label>
              <div className="flex flex-wrap gap-2">
                <FilterChip label={s.gated || "Gated Compound"} active={!!filters.hasGatedCompound} onClick={() => toggleBool('hasGatedCompound')} />
                <FilterChip label={s.nightMan || "Night Watchman"} active={!!filters.hasNightWatchman} onClick={() => toggleBool('hasNightWatchman')} />
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 z-10">
            <Button
              onClick={() => setIsDrawerOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 text-sm font-black uppercase tracking-widest"
            >
              {s.showResults || 'Show Results'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}