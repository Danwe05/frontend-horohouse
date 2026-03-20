'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Palette,
  Home,
  DollarSign,
  MapPin,
  Bed,
  Bath,
  Save,
  Check,
  AlertCircle,
  Plus,
  X,
  Briefcase,
  Award,
  Building2,
} from 'lucide-react';
import apiClient from '@/lib/api';

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
  // Location
  cities?: string[];           // same as onboarding "location"
  // Property
  propertyTypes?: string[];    // same as onboarding "propertyType"
  bedrooms?: number[];         // multi-select, matches onboarding
  bathrooms?: number[];        // multi-select, matches onboarding
  amenities?: string[];        // same as onboarding "features"
  // Budget
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

  // ── Regular-user preferences (also partially used by agents) ──────────────
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

  // ── Agent-specific preferences ────────────────────────────────────────────
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

  // ── Generic toggle helpers ────────────────────────────────────────────────

  function toggleItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }

  const togglePropertyType = (t: string) =>
    setPrefs(p => ({ ...p, propertyTypes: toggleItem(p.propertyTypes ?? [], t) }));

  const toggleAmenity = (a: string) =>
    setPrefs(p => ({ ...p, amenities: toggleItem(p.amenities ?? [], a) }));

  const toggleBedroom = (n: number) =>
    setPrefs(p => ({ ...p, bedrooms: toggleItem(p.bedrooms ?? [], n) }));

  const toggleBathroom = (n: number) =>
    setPrefs(p => ({ ...p, bathrooms: toggleItem(p.bathrooms ?? [], n) }));

  const toggleSpecialization = (s: string) =>
    setAgentPrefs(p => ({ ...p, specializations: toggleItem(p.specializations ?? [], s) }));

  // ── Location ─────────────────────────────────────────────────────────────

  const addLocation = () => {
    const v = newLocation.trim();
    if (v && !prefs.cities?.includes(v)) {
      setPrefs(p => ({ ...p, cities: [...(p.cities ?? []), v] }));
      setNewLocation('');
    }
  };

  const removeLocation = (loc: string) =>
    setPrefs(p => ({ ...p, cities: p.cities?.filter(c => c !== loc) ?? [] }));

  // ── Budget (buyer) ────────────────────────────────────────────────────────

  const selectBuyerPreset = (preset: { min: number; max: number }) =>
    setPrefs(p => ({ ...p, minPrice: preset.min, maxPrice: preset.max }));

  // ── Agent price range ─────────────────────────────────────────────────────

  const selectAgentPreset = (preset: { min: number; max: number }) =>
    setAgentPrefs(p => ({
      ...p,
      propertyPriceRange: { ...(p.propertyPriceRange ?? { min: 0, max: 0, currency: 'XAF' }), ...preset },
    }));

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      await apiClient.updatePreferences(prefs);
      if (isAgent) {
        await apiClient.updateProfile({ agentPreferences: agentPrefs } as any);
      }
      setMessage({ type: 'success', text: 'Preferences saved successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const chipBase = 'px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer select-none';
  const chipOn = 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100';
  const chipOff = 'border-slate-200 bg-white/50 text-slate-600 hover:border-blue-200 hover:bg-slate-50';

  const agentChipOn = 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100';
  const agentChipOff = 'border-slate-200 bg-white/50 text-slate-600 hover:border-indigo-200 hover:bg-slate-50';

  const emeraldChipOn = 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm';
  const emeraldChipOff = 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50';

  const priceCurrency = prefs.currency ?? 'XAF';
  const agentCurrency = agentPrefs.propertyPriceRange?.currency ?? 'XAF';

  return (
    <div className="space-y-5">

      {/* ── Location ───────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <MapPin className="h-5 w-5 text-gray-400" />
            Preferred Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex gap-2">
            <Input
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLocation())}
              placeholder="Enter a city or neighbourhood…"
              className="flex-1 rounded-xl h-11 bg-white/70 border-slate-200 focus-visible:ring-blue-500"
            />
            <Button
              type="button"
              onClick={addLocation}
              disabled={!newLocation.trim()}
              className="h-11 w-11 rounded-xl shrink-0 bg-slate-900 hover:bg-slate-800 text-white p-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {(prefs.cities?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {prefs.cities!.map(loc => (
                <Badge
                  key={loc}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm"
                >
                  <MapPin className="w-3 h-3 text-blue-500" />
                  {loc}
                  <button onClick={() => removeLocation(loc)} className="ml-1 hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Search Radius */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Search Radius: <span className="text-blue-600 font-semibold">{prefs.maxRadius} km</span>
            </Label>
            <input
              type="range" min="5" max="100" step="5"
              value={prefs.maxRadius}
              onChange={e => setPrefs(p => ({ ...p, maxRadius: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 km</span><span>100 km</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Property Types ─────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Home className="h-5 w-5 text-gray-400" />
            Property Types
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROPERTY_TYPES.map(type => {
              const on = prefs.propertyTypes?.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => togglePropertyType(type)}
                  className={`${chipBase} py-2.5 ${on ? chipOn : chipOff}`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Bedrooms & Bathrooms ───────────────────────────────────────────── */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Bed className="h-5 w-5 text-gray-400" />
            Rooms
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-3 block">Bedrooms</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map(n => {
                const on = prefs.bedrooms?.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => toggleBedroom(n)}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 font-semibold transition-all cursor-pointer ${on ? chipOn : chipOff}`}
                  >
                    {n}+
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-3 block">Bathrooms</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map(n => {
                const on = prefs.bathrooms?.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => toggleBathroom(n)}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 font-semibold transition-all cursor-pointer ${on ? chipOn : chipOff}`}
                  >
                    {n}+
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Features / Amenities ───────────────────────────────────────────── */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Palette className="h-5 w-5 text-gray-400" />
            Preferred Features
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROPERTY_FEATURES.map(feature => {
              const on = prefs.amenities?.includes(feature);
              return (
                <button
                  key={feature}
                  onClick={() => toggleAmenity(feature)}
                  className={`${chipBase} text-left px-4 py-3 ${on ? chipOn : chipOff}`}
                >
                  {feature}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Budget (buyer) ─────────────────────────────────────────────────── */}
      {!isAgent && (
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-50/50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <DollarSign className="h-5 w-5 text-gray-400" />
              Budget Range
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Currency */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Currency</Label>
              <Select
                value={priceCurrency}
                onValueChange={v => setPrefs(p => ({ ...p, currency: v }))}
              >
                <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-emerald-500 h-11 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Presets */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Quick Select</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUDGET_PRESETS_BUYER.map(preset => {
                  const on = prefs.minPrice === preset.min && prefs.maxPrice === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => selectBuyerPreset(preset)}
                      className={`py-2 px-3 text-sm border rounded-xl transition-colors font-medium ${on ? emeraldChipOn : emeraldChipOff}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-slate-700">Custom Range</Label>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {formatCurrency(prefs.minPrice ?? 0, priceCurrency)} – {formatCurrency(prefs.maxPrice ?? 1_000_000, priceCurrency)}
                </span>
              </div>
              <div className="px-2 pt-2 pb-4">
                <Slider
                  value={[prefs.minPrice ?? 0, prefs.maxPrice ?? 1_000_000]}
                  onValueChange={([min, max]) => setPrefs(p => ({ ...p, minPrice: min, maxPrice: max }))}
                  min={0}
                  max={2_000_000}
                  step={10_000}
                />
              </div>
            </div>

            {/* Area range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minArea" className="text-sm font-semibold text-slate-700">Min Area (m²)</Label>
                <Input
                  id="minArea"
                  type="number"
                  value={prefs.minArea}
                  onChange={e => setPrefs(p => ({ ...p, minArea: parseInt(e.target.value) || 0 }))}
                  className="rounded-xl border-slate-200 bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxArea" className="text-sm font-semibold text-slate-700">Max Area (m²)</Label>
                <Input
                  id="maxArea"
                  type="number"
                  value={prefs.maxArea}
                  onChange={e => setPrefs(p => ({ ...p, maxArea: parseInt(e.target.value) || 5000 }))}
                  className="rounded-xl border-slate-200 bg-white/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Agent: Professional Preferences ───────────────────────────────── */}
      {isAgent && (
        <Card className="rounded-2xl border-indigo-100 shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-indigo-50">
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              Professional Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">

            {/* License & Agency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <Award className="w-4 h-4 text-slate-400" /> License Number
                </Label>
                <Input
                  id="licenseNumber"
                  value={agentPrefs.licenseNumber}
                  onChange={e => setAgentPrefs(p => ({ ...p, licenseNumber: e.target.value }))}
                  placeholder="e.g. DRE# 01234567"
                  className="rounded-xl border-slate-200 bg-white/50 focus-visible:ring-indigo-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-slate-400" /> Agency / Brokerage
                </Label>
                <Input
                  id="agency"
                  value={agentPrefs.agency}
                  onChange={e => setAgentPrefs(p => ({ ...p, agency: e.target.value }))}
                  placeholder="Where do you work?"
                  className="rounded-xl border-slate-200 bg-white/50 focus-visible:ring-indigo-500 h-11"
                />
              </div>
            </div>

            {/* Experience */}
            <div className="max-w-xs space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Years of Experience</Label>
              <Select
                value={agentPrefs.experience?.toString() ?? '0'}
                onValueChange={v => setAgentPrefs(p => ({ ...p, experience: parseInt(v) }))}
              >
                <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-indigo-500 rounded-xl h-11">
                  <SelectValue placeholder="Select experience…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {EXPERIENCE_RANGES.map(r => (
                    <SelectItem key={r.value} value={r.value.toString()} className="cursor-pointer">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Specializations */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Specializations</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SPECIALIZATIONS.map(s => {
                  const on = agentPrefs.specializations?.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSpecialization(s)}
                      className={`${chipBase} text-left px-3 py-2.5 ${on ? agentChipOn : agentChipOff}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Commission Rate */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Commission Rate</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMISSION_RANGES.map(range => {
                  const cr = agentPrefs.commissionRate ?? 3.0;
                  const on = cr >= range.min && cr <= range.max;
                  return (
                    <button
                      key={range.label}
                      type="button"
                      onClick={() => setAgentPrefs(p => ({ ...p, commissionRate: range.min }))}
                      className={`py-2 px-3 text-sm border rounded-xl font-medium transition-colors ${on ? emeraldChipOn : emeraldChipOff}`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-xs">
                <Label htmlFor="commissionInput" className="text-sm text-slate-600 whitespace-nowrap">Custom %:</Label>
                <Input
                  id="commissionInput"
                  type="number"
                  value={agentPrefs.commissionRate}
                  onChange={e => setAgentPrefs(p => ({ ...p, commissionRate: parseFloat(e.target.value) || 0 }))}
                  min="0" max="20" step="0.1"
                  className="w-24 bg-white border-slate-200 text-center text-emerald-700 font-bold"
                />
              </div>
            </div>

            {/* Agent Property Price Range */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-slate-700">Property Price Range You Work With</Label>

              {/* Currency */}
              <Select
                value={agentCurrency}
                onValueChange={v => setAgentPrefs(p => ({
                  ...p,
                  propertyPriceRange: { ...(p.propertyPriceRange ?? { min: 0, max: 2_000_000, currency: 'XAF' }), currency: v },
                }))}
              >
                <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-indigo-500 h-11 rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUDGET_PRESETS_AGENT.map(preset => {
                  const ppr = agentPrefs.propertyPriceRange;
                  const on = ppr?.min === preset.min && ppr?.max === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => selectAgentPreset(preset)}
                      className={`py-2 px-3 text-sm border rounded-xl font-medium transition-colors ${on ? emeraldChipOn : emeraldChipOff}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold text-slate-700">Custom Range</Label>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    {formatCurrency(agentPrefs.propertyPriceRange?.min ?? 0, agentCurrency)} – {formatCurrency(agentPrefs.propertyPriceRange?.max ?? 2_000_000, agentCurrency)}
                  </span>
                </div>
                <div className="px-2 pt-2 pb-4">
                  <Slider
                    value={[agentPrefs.propertyPriceRange?.min ?? 0, agentPrefs.propertyPriceRange?.max ?? 2_000_000]}
                    onValueChange={([min, max]) => setAgentPrefs(p => ({
                      ...p,
                      propertyPriceRange: { ...(p.propertyPriceRange ?? { min, max, currency: 'XAF' }), min, max },
                    }))}
                    min={0}
                    max={5_000_000}
                    step={10_000}
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      )}

      {/* ── Message ────────────────────────────────────────────────────────── */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
          {message.type === 'success'
            ? <Check className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* ── Save ───────────────────────────────────────────────────────────── */}
      <div className="flex justify-end sticky bottom-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg sm:shadow-none sm:bg-transparent sm:p-0 sm:static border border-gray-100 sm:border-none">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          size="lg"
          className="w-full sm:w-auto min-w-36 rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          {isLoading
            ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            : <Save className="h-4 w-4 mr-2" />}
          {isLoading ? 'Saving…' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};