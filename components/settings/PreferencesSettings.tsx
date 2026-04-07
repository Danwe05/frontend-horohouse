'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Home,
  DollarSign,
  MapPin,
  Bed,
  Bath,
  Check,
  AlertCircle,
  Plus,
  X,
  Briefcase,
  Award,
  Building2,
  ShieldCheck
} from 'lucide-react';
import apiClient from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ─── Constants matching onboarding exactly ───────────────────────────────────

const PROPERTY_TYPES = [
  'Apartment', 'House', 'Condo', 'Townhouse',
  'Villa', 'Studio', 'Duplex', 'Penthouse',
];

const PROPERTY_FEATURES = [
  'Parking', 'Balcony', 'Garden', 'Swimming Pool',
  'Gym', 'Security', 'Elevator', 'Air Conditioning',
  'Furnished', 'Pet Friendly', 'Near Transport', 'Shopping Nearby',
];

const CURRENCIES = [
  { value: 'XAF', label: 'XAF (FCFA)', symbol: 'FCFA' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
];

const BUDGET_PRESETS_BUYER = [
  { min: 0, max: 200000, label: 'Under 200K' },
  { min: 200000, max: 500000, label: '200K – 500K' },
  { min: 500000, max: 750000, label: '500K – 750K' },
  { min: 750000, max: 1000000, label: '750K – 1M' },
  { min: 1000000, max: 2000000, label: '1M – 2M' },
  { min: 2000000, max: 10000000, label: '2M+' },
];

const BUDGET_PRESETS_AGENT = [
  { min: 0, max: 300000, label: 'Up to 300K' },
  { min: 300000, max: 600000, label: '300K – 600K' },
  { min: 600000, max: 1000000, label: '600K – 1M' },
  { min: 1000000, max: 2000000, label: '1M – 2M' },
  { min: 2000000, max: 5000000, label: '2M – 5M' },
  { min: 5000000, max: 20000000, label: '5M+' },
];

const COMMISSION_RANGES = [
  { min: 2.5, max: 3.0, label: '2.5% – 3.0%' },
  { min: 3.0, max: 3.5, label: '3.0% – 3.5%' },
  { min: 3.5, max: 4.0, label: '3.5% – 4.0%' },
  { min: 4.0, max: 5.0, label: '4.0% – 5.0%' },
  { min: 5.0, max: 6.0, label: '5.0% – 6.0%' },
  { min: 6.0, max: 10.0, label: '6.0%+' },
];

const SPECIALIZATIONS = [
  'Residential Sales', 'Commercial Real Estate', 'Luxury Properties',
  'First-time Buyers', 'Investment Properties', 'New Construction',
  'Foreclosures', 'Short Sales', 'Rental Properties',
  'Property Management', 'Land Sales', 'Relocation Services',
];

const EXPERIENCE_RANGES = [
  { value: 0, label: 'New Agent (0–1 years)' },
  { value: 2, label: '2–5 years' },
  { value: 6, label: '6–10 years' },
  { value: 11, label: '11–15 years' },
  { value: 16, label: '16–20 years' },
  { value: 21, label: '20+ years' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentPrefs {
  licenseNumber?: string;
  agency?: string;
  experience?: number;
  specializations?: string[];
  serviceAreas?: string[];
  commissionRate?: number;
  propertyPriceRange?: { min: number; max: number; currency: string };
}

interface UserPreferences {
  cities?: string[];
  propertyTypes?: string[];
  bedrooms?: number[];
  bathrooms?: number[];
  amenities?: string[];
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  maxRadius?: number;
  minArea?: number;
  maxArea?: number;
}

interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  role: string;
  preferences?: UserPreferences;
  agentPreferences?: AgentPrefs;
}

interface PreferencesSettingsProps {
  user: User;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currencyValue: string) {
  const c = CURRENCIES.find(c => c.value === currencyValue);
  const symbol = c?.symbol ?? 'FCFA';
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  return `${symbol}${amount.toLocaleString()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PreferencesSettings: React.FC<PreferencesSettingsProps> = ({ user }) => {
  const isAgent = user.role === 'agent';
  const { t } = useLanguage();
  const s = (t as any)?.settings || {};

  // ── SAFE TEXT EXTRACTORS ──
  // Extracts the string safely if the translation file returns an object {title, description}
  const safeTitle = (val: any, fallback: string) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.title) return val.title;
    return fallback;
  };
  const safeDesc = (objVal: any, strVal: any, fallback: string) => {
    if (typeof strVal === 'string') return strVal;
    if (objVal && typeof objVal === 'object' && objVal.description) return objVal.description;
    return fallback;
  };

  const [prefs, setPrefs] = useState<UserPreferences>({
    cities: user.preferences?.cities ?? [],
    propertyTypes: user.preferences?.propertyTypes ?? [],
    bedrooms: user.preferences?.bedrooms ?? [],
    bathrooms: user.preferences?.bathrooms ?? [],
    amenities: user.preferences?.amenities ?? [],
    minPrice: user.preferences?.minPrice ?? 0,
    maxPrice: user.preferences?.maxPrice ?? 1_000_000,
    currency: user.preferences?.currency ?? 'XAF',
    maxRadius: user.preferences?.maxRadius ?? 25,
    minArea: user.preferences?.minArea ?? 0,
    maxArea: user.preferences?.maxArea ?? 5_000,
  });

  const [agentPrefs, setAgentPrefs] = useState<AgentPrefs>({
    licenseNumber: user.agentPreferences?.licenseNumber ?? '',
    agency: user.agentPreferences?.agency ?? '',
    experience: user.agentPreferences?.experience ?? 0,
    specializations: user.agentPreferences?.specializations ?? [],
    serviceAreas: user.agentPreferences?.serviceAreas ?? [],
    commissionRate: user.agentPreferences?.commissionRate ?? 3.0,
    propertyPriceRange: user.agentPreferences?.propertyPriceRange ?? { min: 0, max: 2_000_000, currency: 'XAF' },
  });

  const [newLocation, setNewLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Toggle helpers
  function toggleItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }

  const togglePropertyType = (t: string) => setPrefs(p => ({ ...p, propertyTypes: toggleItem(p.propertyTypes ?? [], t) }));
  const toggleAmenity = (a: string) => setPrefs(p => ({ ...p, amenities: toggleItem(p.amenities ?? [], a) }));
  const toggleBedroom = (n: number) => setPrefs(p => ({ ...p, bedrooms: toggleItem(p.bedrooms ?? [], n) }));
  const toggleBathroom = (n: number) => setPrefs(p => ({ ...p, bathrooms: toggleItem(p.bathrooms ?? [], n) }));
  const toggleSpecialization = (s: string) => setAgentPrefs(p => ({ ...p, specializations: toggleItem(p.specializations ?? [], s) }));

  // Location functions
  const addLocation = () => {
    const v = newLocation.trim();
    if (v && !prefs.cities?.includes(v)) {
      setPrefs(p => ({ ...p, cities: [...(p.cities ?? []), v] }));
      setNewLocation('');
    }
  };

  const removeLocation = (loc: string) => setPrefs(p => ({ ...p, cities: p.cities?.filter(c => c !== loc) ?? [] }));

  const selectBuyerPreset = (preset: { min: number; max: number }) => setPrefs(p => ({ ...p, minPrice: preset.min, maxPrice: preset.max }));
  const selectAgentPreset = (preset: { min: number; max: number }) => setAgentPrefs(p => ({
    ...p,
    propertyPriceRange: { ...(p.propertyPriceRange ?? { min: 0, max: 0, currency: 'XAF' }), ...preset },
  }));

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await apiClient.updatePreferences(prefs);
      if (isAgent) {
        await apiClient.updateProfile({ agentPreferences: agentPrefs } as any);
      }
      showMessage('success', safeTitle(s?.successPreferencesSaved, 'Preferences saved successfully'));
    } catch {
      showMessage('error', safeTitle(s?.errorPreferencesSaved, 'Failed to save preferences'));
    } finally {
      setIsLoading(false);
    }
  };

  // Airbnb Styling Constants
  const chipBase = "px-5 py-2.5 rounded-full border text-[14px] font-medium transition-all cursor-pointer whitespace-nowrap";
  const chipOn = "border-[#222222] bg-[#F7F7F7] text-[#222222] ring-1 ring-[#222222]";
  const chipOff = "border-[#DDDDDD] bg-white text-[#222222] hover:border-[#222222]";

  const inputClasses = "flex h-14 w-full rounded-xl border border-[#B0B0B0] bg-white px-4 py-2 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:border-transparent transition-all";
  const selectClasses = "h-14 px-4 pr-10 rounded-xl border border-[#B0B0B0] bg-white text-[16px] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222] focus:border-transparent transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23222222%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-no-repeat";
  
  const priceCurrency = prefs.currency ?? 'XAF';
  const agentCurrency = agentPrefs.propertyPriceRange?.currency ?? 'XAF';

  return (
    <div className="w-full max-w-[800px] animate-in fade-in duration-300 pb-24">

      {/* ── Page Header ── */}
      <div className="mb-10">
        <h2 className="text-[32px] font-semibold text-[#222222] tracking-tight">
          {safeTitle(s?.preferences, "Preferences")}
        </h2>
        <p className="text-[16px] text-[#717171] mt-2">
          {safeDesc(s?.preferences, s?.preferencesDesc, "Tell us what you're looking for to get personalized property recommendations.")}
        </p>
      </div>

      <div className="space-y-0">

        {/* ── Location ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
            <MapPin className="h-5 w-5 stroke-[1.5]" />
            {safeTitle(s?.preferredLocations, 'Preferred locations')}
          </h3>
          
          <div className="space-y-6">
            <div className="flex gap-3">
              <Input
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                placeholder={safeTitle(s?.enterACity, 'Enter a city or neighborhood...')}
                className={inputClasses}
              />
              <Button
                type="button"
                onClick={addLocation}
                disabled={!newLocation.trim()}
                className="h-14 px-6 rounded-xl bg-[#222222] hover:bg-black text-white shrink-0 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-5 h-5 stroke-[2]" />
              </Button>
            </div>

            {(prefs.cities?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {prefs.cities!.map(loc => (
                  <span key={loc} className="flex items-center gap-2 bg-[#F7F7F7] border border-[#DDDDDD] text-[#222222] px-4 py-2 rounded-full text-[14px] font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {loc}
                    <button onClick={() => removeLocation(loc)} className="ml-1 text-[#717171] hover:text-[#222222] focus:outline-none">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2">
              <div className="flex justify-between items-end mb-4">
                <Label className="text-[15px] font-medium text-[#222222]">{safeTitle(s?.searchRadius, 'Search radius')}</Label>
                <span className="text-[15px] font-semibold text-[#222222]">{prefs.maxRadius} km</span>
              </div>
              <input
                type="range" min="5" max="100" step="5"
                value={prefs.maxRadius}
                onChange={e => setPrefs(p => ({ ...p, maxRadius: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-[#DDDDDD] rounded-lg appearance-none cursor-pointer accent-[#222222]"
              />
              <div className="flex justify-between text-[13px] text-[#717171] mt-2 font-medium">
                <span>5 km</span><span>100 km</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Property Types ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
            <Home className="h-5 w-5 stroke-[1.5]" />
            {safeTitle(s?.propertyTypes, 'Property types')}
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {PROPERTY_TYPES.map(type => {
              const on = prefs.propertyTypes?.includes(type);
              const translatedType = safeTitle((t as any)?.propertyTypes?.[type.toLowerCase()], type);
              return (
                <button
                  key={type}
                  onClick={() => togglePropertyType(type)}
                  className={cn(chipBase, on ? chipOn : chipOff)}
                >
                  {translatedType}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Rooms ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3 mb-6">
                <Bed className="h-5 w-5 stroke-[1.5]" />
                {safeTitle(s?.bedrooms, 'Bedrooms')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map(n => {
                  const on = prefs.bedrooms?.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleBedroom(n)}
                      className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-full border transition-all text-[15px] font-medium",
                        on ? chipOn : chipOff
                      )}
                    >
                      {n}+
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3 mb-6">
                <Bath className="h-5 w-5 stroke-[1.5]" />
                {safeTitle(s?.bathrooms, 'Bathrooms')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map(n => {
                  const on = prefs.bathrooms?.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleBathroom(n)}
                      className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-full border transition-all text-[15px] font-medium",
                        on ? chipOn : chipOff
                      )}
                    >
                      {n}+
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-8 border-t border-[#DDDDDD] space-y-6">
          <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
            <Palette className="h-5 w-5 stroke-[1.5]" />
            {safeTitle(s?.preferredFeatures, 'Amenities & Features')}
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {PROPERTY_FEATURES.map(feature => {
              const on = prefs.amenities?.includes(feature);
              const translatedFeature = safeTitle((t as any)?.features?.[feature.toLowerCase().replace(/ /g, '_')], feature);
              return (
                <button
                  key={feature}
                  onClick={() => toggleAmenity(feature)}
                  className={cn(chipBase, on ? chipOn : chipOff)}
                >
                  {translatedFeature}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Budget (Buyer) ── */}
        {!isAgent && (
          <section className="py-8 border-t border-[#DDDDDD] space-y-6">
            <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
              <DollarSign className="h-5 w-5 stroke-[1.5]" />
              {safeTitle(s?.budgetRange, 'Budget range')}
            </h3>
            
            <div className="space-y-8">
              <div>
                <Label className="text-[15px] font-medium text-[#222222] mb-2 block">{safeTitle(s?.currency, 'Currency')}</Label>
                <select
                  value={priceCurrency}
                  onChange={e => setPrefs(p => ({ ...p, currency: e.target.value }))}
                  className={cn(selectClasses, "max-w-[300px]")}
                >
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-[15px] font-medium text-[#222222] mb-3 block">{safeTitle(s?.quickSelect, 'Quick select')}</Label>
                <div className="flex flex-wrap gap-3">
                  {BUDGET_PRESETS_BUYER.map(preset => {
                    const on = prefs.minPrice === preset.min && prefs.maxPrice === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => selectBuyerPreset(preset)}
                        className={cn(chipBase, on ? chipOn : chipOff)}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-4">
                  <Label className="text-[15px] font-medium text-[#222222]">{safeTitle(s?.customRange, 'Custom range')}</Label>
                  <span className="text-[15px] font-semibold text-[#222222]">
                    {formatCurrency(prefs.minPrice ?? 0, priceCurrency)} – {formatCurrency(prefs.maxPrice ?? 1_000_000, priceCurrency)}
                  </span>
                </div>
                <div className="px-2 pb-2">
                  <Slider
                    value={[prefs.minPrice ?? 0, prefs.maxPrice ?? 1_000_000]}
                    onValueChange={([min, max]) => setPrefs(p => ({ ...p, minPrice: min, maxPrice: max }))}
                    min={0}
                    max={2_000_000}
                    step={10_000}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <Label htmlFor="minArea" className="text-[15px] font-medium text-[#222222] mb-2 block">{safeTitle(s?.minArea, 'Min area (m²)')}</Label>
                  <Input
                    id="minArea"
                    type="number"
                    value={prefs.minArea}
                    onChange={e => setPrefs(p => ({ ...p, minArea: parseInt(e.target.value) || 0 }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <Label htmlFor="maxArea" className="text-[15px] font-medium text-[#222222] mb-2 block">{safeTitle(s?.maxArea, 'Max area (m²)')}</Label>
                  <Input
                    id="maxArea"
                    type="number"
                    value={prefs.maxArea}
                    onChange={e => setPrefs(p => ({ ...p, maxArea: parseInt(e.target.value) || 5000 }))}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Agent: Professional Preferences ── */}
        {isAgent && (
          <section className="py-8 border-t border-[#DDDDDD] space-y-8">
            <h3 className="text-[18px] font-semibold text-[#222222] flex items-center gap-3">
              <Briefcase className="h-5 w-5 stroke-[1.5]" />
              {safeTitle(s?.professionalPreferences, 'Professional preferences')}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="licenseNumber" className="text-[15px] font-medium text-[#222222] mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#717171]" /> {safeTitle(s?.licenseNumber, 'License number')}
                </Label>
                <Input
                  id="licenseNumber"
                  value={agentPrefs.licenseNumber}
                  onChange={e => setAgentPrefs(p => ({ ...p, licenseNumber: e.target.value }))}
                  placeholder={safeTitle(s?.licenseNumberPlaceholder, 'e.g. DRE# 01234567')}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label htmlFor="agency" className="text-[15px] font-medium text-[#222222] mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#717171]" /> {safeTitle(s?.agencyBrokerage, 'Agency / Brokerage')}
                </Label>
                <Input
                  id="agency"
                  value={agentPrefs.agency}
                  onChange={e => setAgentPrefs(p => ({ ...p, agency: e.target.value }))}
                  placeholder={safeTitle(s?.agencyPlaceholder, 'Where do you work?')}
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <Label className="text-[15px] font-medium text-[#222222] mb-2 block">{safeTitle(s?.yearsOfExperience, 'Years of experience')}</Label>
              <select
                value={agentPrefs.experience?.toString() ?? '0'}
                onChange={e => setAgentPrefs(p => ({ ...p, experience: parseInt(e.target.value) }))}
                className={cn(selectClasses, "max-w-[300px]")}
              >
                {EXPERIENCE_RANGES.map(r => <option key={r.value} value={r.value.toString()}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <Label className="text-[15px] font-medium text-[#222222] mb-3 block">{safeTitle(s?.specializations, 'Specializations')}</Label>
              <div className="flex flex-wrap gap-3">
                {SPECIALIZATIONS.map(spec => {
                  const on = agentPrefs.specializations?.includes(spec);
                  const translatedSpec = safeTitle((t as any)?.specializations?.[spec.toLowerCase().replace(/ /g, '_')], spec);
                  return (
                    <button
                      key={spec}
                      onClick={() => toggleSpecialization(spec)}
                      className={cn(chipBase, on ? chipOn : chipOff)}
                    >
                      {translatedSpec}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-[15px] font-medium text-[#222222] mb-3 block">{safeTitle(s?.commissionRate, 'Commission rate')}</Label>
              <div className="flex flex-wrap gap-3 mb-4">
                {COMMISSION_RANGES.map(range => {
                  const cr = agentPrefs.commissionRate ?? 3.0;
                  const on = cr >= range.min && cr <= range.max;
                  return (
                    <button
                      key={range.label}
                      type="button"
                      onClick={() => setAgentPrefs(p => ({ ...p, commissionRate: range.min }))}
                      className={cn(chipBase, on ? chipOn : chipOff)}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="commissionInput" className="text-[15px] font-medium text-[#222222]">{safeTitle(s?.customPercent, 'Custom %:')}</Label>
                <Input
                  id="commissionInput"
                  type="number"
                  value={agentPrefs.commissionRate}
                  onChange={e => setAgentPrefs(p => ({ ...p, commissionRate: parseFloat(e.target.value) || 0 }))}
                  min="0" max="20" step="0.1"
                  className={cn(inputClasses, "w-28 text-center")}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#DDDDDD] space-y-6">
              <h4 className="text-[16px] font-semibold text-[#222222]">{safeTitle(s?.propertyPriceRangeAgent, 'Property price range you work with')}</h4>
              
              <div>
                <Label className="text-[15px] font-medium text-[#222222] mb-2 block">{safeTitle(s?.currency, 'Currency')}</Label>
                <select
                  value={agentCurrency}
                  onChange={e => setAgentPrefs(p => ({
                    ...p,
                    propertyPriceRange: { ...(p.propertyPriceRange ?? { min: 0, max: 2_000_000, currency: 'XAF' }), currency: e.target.value },
                  }))}
                  className={cn(selectClasses, "max-w-[300px]")}
                >
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-[15px] font-medium text-[#222222] mb-3 block">{safeTitle(s?.quickSelect, 'Quick select')}</Label>
                <div className="flex flex-wrap gap-3">
                  {BUDGET_PRESETS_AGENT.map(preset => {
                    const ppr = agentPrefs.propertyPriceRange;
                    const on = ppr?.min === preset.min && ppr?.max === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => selectAgentPreset(preset)}
                        className={cn(chipBase, on ? chipOn : chipOff)}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-4">
                  <Label className="text-[15px] font-medium text-[#222222]">{safeTitle(s?.customRange, 'Custom range')}</Label>
                  <span className="text-[15px] font-semibold text-[#222222]">
                    {formatCurrency(agentPrefs.propertyPriceRange?.min ?? 0, agentCurrency)} – {formatCurrency(agentPrefs.propertyPriceRange?.max ?? 2_000_000, agentCurrency)}
                  </span>
                </div>
                <div className="px-2 pb-2">
                  <Slider
                    value={[agentPrefs.propertyPriceRange?.min ?? 0, agentPrefs.propertyPriceRange?.max ?? 2_000_000]}
                    onValueChange={([min, max]) => setAgentPrefs(p => ({
                      ...p,
                      propertyPriceRange: { ...(p.propertyPriceRange ?? { min, max, currency: 'XAF' }), min, max },
                    }))}
                    min={0}
                    max={5_000_000}
                    step={10_000}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

          </section>
        )}

      </div>

      {/* ── Status Messages ── */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-50 min-w-[300px]",
              message.type === 'success' ? "bg-[#222222] text-white" : "bg-[#C2410C] text-white"
            )}
          >
            {message.type === 'success' ? (
              <ShieldCheck className="h-5 w-5 shrink-0 stroke-[2]" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            )}
            <span className="text-[15px] font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] p-4 sm:p-5 z-40">
        <div className="max-w-[800px] mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
          <p className="hidden sm:block text-[15px] text-[#717171]">
            Remember to save any changes you've made.
          </p>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#222222] hover:bg-black text-white font-semibold text-[15px] transition-colors disabled:opacity-50"
          >
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />}
            {isLoading ? safeTitle(s?.saving, 'Saving...') : safeTitle(s?.savePreferences, 'Save')}
          </Button>
        </div>
      </div>
      
    </div>
  );
};