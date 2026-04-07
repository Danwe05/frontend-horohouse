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
  ChevronDown,
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
import { cn } from '@/lib/utils';
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
      className={cn(
        "flex items-center gap-2 text-[14px] font-medium px-4 py-2 rounded-full border transition-colors focus:outline-none whitespace-nowrap",
        active
          ? "bg-[#F7F7F7] text-[#222222] border-[#222222] shadow-[0_0_0_1px_#222222]"
          : "bg-white text-[#222222] border-[#DDDDDD] hover:border-[#222222]"
      )}
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
    { value: 'pricePerPersonMonthly-asc', label: s.sortPriceUp || 'Price per person: Low to High' },
    { value: 'pricePerPersonMonthly-desc', label: s.sortPriceDown || 'Price per person: High to Low' },
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
    <div className="sticky top-[80px] z-30 -mx-6 px-6 py-4 bg-white border-b border-[#EBEBEB] mb-8">
      <div className="flex items-center justify-between gap-4">
        
        {/* Desktop Quick Filters + Active Indicators */}
        <div className="hidden lg:flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          <FilterChip
            label={s.verified || "Verified only"}
            active={!!filters.studentApprovedOnly}
            icon={<CheckCircle2 className="w-4 h-4 stroke-[2]" />}
            onClick={() => toggleBool('studentApprovedOnly')}
          />
          <FilterChip
            label={s.bedsAvailable || "Beds available"}
            active={!!filters.hasAvailableBeds}
            icon={<Bed className="w-4 h-4 stroke-[2]" />}
            onClick={() => toggleBool('hasAvailableBeds')}
          />

          {activeCount > 0 && <div className="h-6 w-px bg-[#DDDDDD] mx-2 shrink-0" />}

          {/* Active Status Pills */}
          {filters.city && (
            <div className="flex items-center gap-1.5 bg-[#F7F7F7] text-[#222222] px-3 py-1.5 rounded-full text-[13px] font-medium border border-[#DDDDDD] shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              {filters.city}
              <button onClick={() => set('city', '')} className="ml-1 hover:text-[#C2293F] focus:outline-none"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {filters.maxCampusProximityMeters && (
            <div className="flex items-center gap-1.5 bg-[#F7F7F7] text-[#222222] px-3 py-1.5 rounded-full text-[13px] font-medium border border-[#DDDDDD] shrink-0">
              Max {(filters.maxCampusProximityMeters / 1000).toFixed(1)}km
              <button onClick={() => set('maxCampusProximityMeters', undefined)} className="ml-1 hover:text-[#C2293F] focus:outline-none"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {filters.waterSource && (
            <div className="flex items-center gap-1.5 bg-[#F7F7F7] text-[#222222] px-3 py-1.5 rounded-full text-[13px] font-medium border border-[#DDDDDD] shrink-0">
              <Droplets className="w-3.5 h-3.5" />
              {filters.waterSource.split('_').pop()}
              <button onClick={() => set('waterSource', '')} className="ml-1 hover:text-[#C2293F] focus:outline-none"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {filters.electricityBackup && (
            <div className="flex items-center gap-1.5 bg-[#F7F7F7] text-[#222222] px-3 py-1.5 rounded-full text-[13px] font-medium border border-[#DDDDDD] shrink-0">
              <Zap className="w-3.5 h-3.5" />
              {filters.electricityBackup.split('_').pop()}
              <button onClick={() => set('electricityBackup', '')} className="ml-1 hover:text-[#C2293F] focus:outline-none"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="lg:hidden flex items-center justify-center gap-2 bg-white border border-[#222222] text-[#222222] px-6 h-12 rounded-full text-[14px] font-semibold shrink-0 w-full sm:w-auto"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
          {s.moreFilters || 'Filters'}
          {activeCount > 0 && (
            <span className="bg-[#222222] text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px] ml-1">
              {activeCount}
            </span>
          )}
        </button>

        {/* Advanced & Sort (Right Side) */}
        <div className="hidden sm:flex items-center gap-4 ml-auto">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="text-[14px] font-semibold underline text-[#222222] hover:text-[#717171] px-2 transition-colors focus:outline-none"
            >
              {s.reset || 'Clear all'}
            </button>
          )}

          <div className="hidden lg:block h-6 w-px bg-[#DDDDDD]" />

          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px] h-11 rounded-full border border-[#DDDDDD] bg-white text-[14px] font-medium px-4 focus:ring-0 hover:border-[#222222] transition-colors shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#DDDDDD]">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-[14px] py-2.5">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="hidden lg:flex items-center gap-2 bg-white border border-[#DDDDDD] hover:border-[#222222] text-[#222222] h-11 px-5 rounded-full text-[14px] font-medium transition-colors focus:outline-none"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[1.5]" />
            {s.more || 'Filters'}
          </button>
        </div>
      </div>

      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="max-w-2xl w-full h-[85vh] flex flex-col p-0 border-[#DDDDDD] rounded-2xl overflow-hidden bg-white gap-0">
          <DialogHeader className="p-6 border-b border-[#EBEBEB] flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-[20px] font-semibold text-[#222222]">{s.advancedFilters || 'Filters'}</DialogTitle>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors focus:outline-none">
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            <section>
              <Label className="text-[18px] font-semibold text-[#222222] mb-4 block">{s.prefLoc || 'Preferred location'}</Label>
              <div className="flex flex-wrap gap-3">
                {['', ...CITIES].map(c => (
                  <button
                    key={c}
                    onClick={() => set('city', c)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-[15px] font-medium transition-all border focus:outline-none",
                      filters.city === c || (!c && !filters.city)
                        ? "bg-[#F7F7F7] text-[#222222] border-[#222222] shadow-[0_0_0_1px_#222222]"
                        : "bg-white text-[#222222] border-[#DDDDDD] hover:border-[#222222]"
                    )}
                  >
                    {c || s.anyCity || 'Any city'}
                  </button>
                ))}
              </div>
            </section>

            <section className="pt-8 border-t border-[#EBEBEB]">
              <div className="flex justify-between items-center mb-6">
                <Label className="text-[18px] font-semibold text-[#222222]">{s.campusProx || 'Campus proximity'}</Label>
                <span className="text-[15px] font-medium text-[#717171]">
                  {filters.maxCampusProximityMeters ? `${s.max || 'Max'} ${(filters.maxCampusProximityMeters / 1000).toFixed(1)} km` : s.anyDist || 'Any distance'}
                </span>
              </div>
              <div className="px-2">
                <Slider
                  min={200}
                  max={5000}
                  step={100}
                  value={[filters.maxCampusProximityMeters ?? 5000]}
                  onValueChange={([v]) => set('maxCampusProximityMeters', v === 5000 ? undefined : v)}
                />
              </div>
              <div className="flex justify-between mt-3 text-[14px] text-[#717171]">
                <span>200m</span>
                <span>5km+</span>
              </div>
            </section>

            <section className="pt-8 border-t border-[#EBEBEB]">
              <Label className="text-[18px] font-semibold text-[#222222] mb-6 block">{s.waterPower || 'Water & Power'}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-[15px] font-medium text-[#717171] mb-3">{s.waterSrc || 'Water source'}</p>
                  <div className="flex flex-col gap-3">
                    {WATER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('waterSource', opt.value)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-[15px] text-left transition-all border focus:outline-none",
                          filters.waterSource === opt.value || (!opt.value && !filters.waterSource)
                            ? "bg-[#F7F7F7] text-[#222222] border-[#222222] font-semibold shadow-[0_0_0_1px_#222222]"
                            : "bg-white text-[#222222] border-[#DDDDDD] hover:border-[#222222]"
                        )}
                      >
                        {opt.label.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[15px] font-medium text-[#717171] mb-3">{s.elecBackup || 'Electricity backup'}</p>
                  <div className="flex flex-col gap-3">
                    {ELECTRICITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('electricityBackup', opt.value)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-[15px] text-left transition-all border focus:outline-none",
                          filters.electricityBackup === opt.value || (!opt.value && !filters.electricityBackup)
                            ? "bg-[#F7F7F7] text-[#222222] border-[#222222] font-semibold shadow-[0_0_0_1px_#222222]"
                            : "bg-white text-[#222222] border-[#DDDDDD] hover:border-[#222222]"
                        )}
                      >
                        {opt.label.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-8 border-t border-[#EBEBEB]">
              <Label className="text-[18px] font-semibold text-[#222222] mb-4 block">{s.livingRules || 'Living rules'}</Label>
              <div className="flex flex-wrap gap-3">
                <FilterChip label={s.noCurfew || "No curfew"} active={!!filters.noCurfew} onClick={() => toggleBool('noCurfew')} />
                <FilterChip label={s.visAllowed || "Visitors allowed"} active={!!filters.visitorsAllowed} onClick={() => toggleBool('visitorsAllowed')} />
              </div>
            </section>

            <section className="pt-8 border-t border-[#EBEBEB]">
              <Label className="text-[18px] font-semibold text-[#222222] mb-4 block">{s.propSecurity || 'Property security'}</Label>
              <div className="flex flex-wrap gap-3">
                <FilterChip label={s.gated || "Gated compound"} active={!!filters.hasGatedCompound} onClick={() => toggleBool('hasGatedCompound')} />
                <FilterChip label={s.nightMan || "Night watchman"} active={!!filters.hasNightWatchman} onClick={() => toggleBool('hasNightWatchman')} />
              </div>
            </section>
          </div>

          <div className="px-6 py-4 border-t border-[#EBEBEB] bg-white shrink-0 flex items-center justify-between">
            <button
              onClick={() => { onReset(); setIsDrawerOpen(false); }}
              className="text-[16px] font-semibold underline text-[#222222] hover:text-[#717171] focus:outline-none"
            >
              {s.clearAll || 'Clear all'}
            </button>
            <Button
              onClick={() => setIsDrawerOpen(false)}
              className="bg-[#222222] hover:bg-black text-white rounded-lg h-12 px-8 text-[16px] font-semibold active:scale-[0.98] transition-transform"
            >
              {s.showResults || 'Show properties'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}