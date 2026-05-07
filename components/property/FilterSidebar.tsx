"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Minus, Plus, Home, Building2, Palmtree, Hotel, Key, Wifi, Car, Waves, Tv, Wind, Utensils, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdvancedFilters {
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  hasPool?: boolean; // legacy
  amenities?: string[];
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minGuests?: number;
}

interface FilterSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (filters: AdvancedFilters) => void;
  onFiltersChange?: (filters: AdvancedFilters) => void;
  initialFilters?: AdvancedFilters;
  listingType?: "sale" | "rent" | "short_term" | "any";
  resultCount?: number;
  isLoadingResults?: boolean;
}

// Helper for Airbnb-style Pill Selectors (Any, 1, 2, 3, 4, 5+)
const PillSelector = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => {
  const options = ["Any", "1", "2", "3", "4", "5+"];
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[16px] text-[#222222]">{label}</span>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt === "Any" ? "" : opt.replace('+', ''))}
            className={cn(
              "px-5 py-2.5 rounded-full border text-[14px] transition-colors shrink-0",
              (value === opt.replace('+', '') || (value === "" && opt === "Any"))
                ? "bg-blue-600 text-white boder-blue-600"
                : "bg-white text-[#222222] border-[#DDDDDD] hover:boder-blue-600"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// Helper for Stepper (Guests)
const Stepper = ({ value, onChange, label, sublabel }: { value: number; onChange: (v: number) => void; label: string; sublabel?: string }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex flex-col">
      <span className="text-[16px] text-[#222222]">{label}</span>
      {sublabel && <span className="text-[14px] text-[#717171]">{sublabel}</span>}
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        className="w-8 h-8 rounded-full border border-[#DDDDDD] flex items-center justify-center text-[#717171] hover:text-[#222222] hover:boder-blue-600 disabled:opacity-30 disabled:hover:border-[#DDDDDD] disabled:hover:text-[#717171] transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-[16px] text-[#222222] w-4 text-center">{value}{value >= 16 ? '+' : ''}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border border-[#DDDDDD] flex items-center justify-center text-[#717171] hover:text-[#222222] hover:boder-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const FilterSidebar = ({
  open,
  onOpenChange,
  onApply,
  onFiltersChange,
  initialFilters,
  listingType = "any",
  resultCount,
  isLoadingResults,
}: FilterSidebarProps) => {
  const { t } = useLanguage();
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [minBedrooms, setMinBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [minGuests, setMinGuests] = useState(0);

  useEffect(() => {
    if (initialFilters) {
      setMinPrice(initialFilters.minPrice);
      setMaxPrice(initialFilters.maxPrice);
      setPropertyTypes(initialFilters.propertyTypes || []);
      setAmenities(initialFilters.amenities || (initialFilters.hasPool ? ["pool"] : []));
      setMinBedrooms(initialFilters.minBedrooms?.toString() || "");
      setMinBathrooms(initialFilters.minBathrooms?.toString() || "");
      setMinGuests(initialFilters.minGuests || 0);
    }
  }, [initialFilters]);

  // Debounce effect to invoke onFiltersChange
  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange?.({
        minPrice,
        maxPrice,
        propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
        hasPool: amenities.includes("pool"),
        amenities: amenities.length > 0 ? amenities : undefined,
        minBedrooms: minBedrooms ? parseInt(minBedrooms) : undefined,
        minBathrooms: minBathrooms ? parseInt(minBathrooms) : undefined,
        minGuests: minGuests > 0 ? minGuests : undefined,
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [minPrice, maxPrice, propertyTypes, amenities, minBedrooms, minBathrooms, minGuests, onFiltersChange]);

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleApply = () => {
    const filters: AdvancedFilters = {
      minPrice,
      maxPrice,
      propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
      hasPool: amenities.includes("pool"),
      amenities: amenities.length > 0 ? amenities : undefined,
      minBedrooms: minBedrooms ? parseInt(minBedrooms) : undefined,
      minBathrooms: minBathrooms ? parseInt(minBathrooms) : undefined,
      minGuests: minGuests > 0 ? minGuests : undefined,
    };
    onApply?.(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setMinPrice(undefined); setMaxPrice(undefined); setPropertyTypes([]); setAmenities([]);
    setMinBedrooms(""); setMinBathrooms(""); setMinGuests(0);
  };

  const isResetDisabled = 
    minPrice === undefined && maxPrice === undefined && propertyTypes.length === 0 && 
    amenities.length === 0 && minBedrooms === "" && minBathrooms === "" && minGuests === 0;

  const isShortTerm = listingType === "short_term";
  const showGuestFilter = isShortTerm || listingType === "any";
  const showBedroomFilter = !isShortTerm;

  const propertyTypeOptions = [
    { id: "house", label: t.advancedFilters.house, icon: Home },
    { id: "apartment", label: t.advancedFilters.apartment, icon: Building2 },
    { id: "villa", label: t.advancedFilters.villa, icon: Palmtree },
    { id: "hotel", label: t.advancedFilters.hotel || "Hotel", icon: Hotel },
    { id: "guesthouse", label: t.advancedFilters.guesthouse || "Guest House", icon: Home },
    { id: "vacation_rental", label: t.advancedFilters.vacation_rental || "Vacation Rental", icon: Key },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="backdrop-blur-sm bg-black/40 z-50">
        {/* Airbnb style Modal: Full screen on mobile, large rounded rectangle on desktop */}
        <DialogContent className="fixed z-50 flex flex-col p-0 bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-[780px] sm:rounded-2xl overflow-hidden top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl border-none">
          
          {/* Sticky Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBEBEB] bg-white sticky top-0 z-10">
            <button 
              onClick={() => onOpenChange(false)}
              className="p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] transition-colors"
            >
              <X className="w-5 h-5 text-[#222222]" />
            </button>
            <DialogTitle className="text-[16px] font-bold text-[#222222] m-0">
              {t.advancedFilters.title || "Filters"}
            </DialogTitle>
            <div className="w-9" /> {/* Spacer to perfectly center the title */}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:px-8 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* Price Range */}
            <div className="pb-8 border-b border-[#EBEBEB]">
              <h3 className="text-[22px] font-semibold text-[#222222] mb-2">{t.advancedFilters.price_range}</h3>
              <p className="text-[14px] text-[#717171] mb-6">Property prices per {listingType === "short_term" ? "night" : listingType === "rent" ? "month" : "sale"}</p>
              
              <div className="mt-8 mb-6 px-2 relative h-16 w-full flex items-end justify-between gap-[2px]">
                {/* Mock Histogram */}
                {[...Array(40)].map((_, i) => {
                  const randomHeight = 10 + (Math.sin(i * 0.3) * 15 + Math.cos(i * 0.7) * 20 + 25);
                  const valueRange = i * (100 / 40); // 0-100%
                  const currentMin = minPrice ? (minPrice / (listingType === "sale" ? 100000000 : 1000000)) * 100 : 0;
                  const currentMax = maxPrice ? (maxPrice / (listingType === "sale" ? 100000000 : 1000000)) * 100 : 100;
                  const isActive = valueRange >= currentMin && valueRange <= currentMax;
                  return (
                    <div 
                      key={i} 
                      className={cn("w-full rounded-t-sm transition-all duration-300", isActive ? "bg-blue-600" : "bg-[#DDDDDD] opacity-50")}
                      style={{ height: `${isActive ? randomHeight : randomHeight * 0.8}px` }}
                    />
                  );
                })}
              </div>

              <div className="px-2 mb-6">
                <Slider
                  defaultValue={[0, 100]}
                  value={[
                    minPrice ? (minPrice / (listingType === "sale" ? 100000000 : 1000000)) * 100 : 0, 
                    maxPrice ? (maxPrice / (listingType === "sale" ? 100000000 : 1000000)) * 100 : 100
                  ]}
                  onValueChange={(val) => {
                    const multiplier = listingType === "sale" ? 1000000 : 10000;
                    if (val[0] === 0) setMinPrice(undefined);
                    else setMinPrice(val[0] * multiplier);
                    
                    if (val[1] === 100) setMaxPrice(undefined);
                    else setMaxPrice(val[1] * multiplier);
                  }}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative flex-1 border border-[#B0B0B0] rounded-xl px-3 py-2 focus-within:border-black focus-within:border-2 focus-within:p-[7px] transition-all">
                  <label className="block text-[12px] text-[#717171] mb-0.5">Minimum</label>
                  <div className="flex items-center">
                    <span className="text-[#222222] mr-1">XAF</span>
                    <input
                      type="number"
                      value={minPrice || ""}
                      onChange={(e) => setMinPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full text-[16px] text-[#222222] outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div className="text-[#B0B0B0]">-</div>
                <div className="relative flex-1 border border-[#B0B0B0] rounded-xl px-3 py-2 focus-within:border-black focus-within:border-2 focus-within:p-[7px] transition-all">
                  <label className="block text-[12px] text-[#717171] mb-0.5">Maximum</label>
                  <div className="flex items-center">
                    <span className="text-[#222222] mr-1">XAF</span>
                    <input
                      type="number"
                      value={maxPrice || ""}
                      onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full text-[16px] text-[#222222] outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Types (Grid layout) */}
            <div className="pb-8 border-b border-[#EBEBEB]">
              <h3 className="text-[22px] font-semibold text-[#222222] mb-6">{t.advancedFilters.property_types}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {propertyTypeOptions.map(({ id, label, icon: Icon }) => {
                  const isSelected = propertyTypes.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => togglePropertyType(id)}
                      className={cn(
                        "flex flex-col items-start gap-8 p-4 border rounded-xl transition-all duration-200 text-left",
                        isSelected
                          ? "boder-blue-600 border-2 bg-[#F7F7F7] p-[15px]" 
                          : "border-[#DDDDDD] hover:boder-blue-600"
                      )}
                    >
                      <Icon className={cn("w-8 h-8", isSelected ? "text-[#222222]" : "text-[#717171]")} strokeWidth={1.5} />
                      <span className="text-[16px] font-medium text-[#222222]">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rooms and spaces (Pills) */}
            {showBedroomFilter && (
              <div className="pb-8 border-b border-[#EBEBEB] space-y-6">
                <h3 className="text-[22px] font-semibold text-[#222222]">{t.advancedFilters.bedrooms || "Rooms and spaces"}</h3>
                <PillSelector 
                  label={t.advancedFilters.bedrooms} 
                  value={minBedrooms} 
                  onChange={setMinBedrooms} 
                />
                <PillSelector 
                  label={t.advancedFilters.bathrooms} 
                  value={minBathrooms} 
                  onChange={setMinBathrooms} 
                />
              </div>
            )}

            {/* Guests (Stepper) */}
            {showGuestFilter && (
              <div className="pb-8 border-b border-[#EBEBEB]">
                <h3 className="text-[22px] font-semibold text-[#222222] mb-4">Capacity</h3>
                <Stepper 
                  label={isShortTerm ? t.quickSearchExtras.guests : t.quickSearchExtras.guests}
                  value={minGuests}
                  onChange={setMinGuests}
                />
              </div>
            )}

            {/* Amenities Grid */}
            <div className="pb-4">
              <h3 className="text-[22px] font-semibold text-[#222222] mb-6">Amenities</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                {[
                  { id: "wifi", label: "Wifi", icon: Wifi },
                  { id: "kitchen", label: "Kitchen", icon: Utensils },
                  { id: "ac", label: "Air conditioning", icon: Wind },
                  { id: "pool", label: "Pool", icon: Waves },
                  { id: "parking", label: "Free parking", icon: Car },
                  { id: "tv", label: "TV", icon: Tv },
                  { id: "washer", label: "Washer", icon: Shirt },
                ].map(({ id, label, icon: Icon }) => {
                  const isChecked = amenities.includes(id);
                  return (
                    <div key={id} className="flex items-center space-x-4">
                      <Checkbox 
                        id={`amenity-${id}`} 
                        className="w-6 h-6 rounded border-[#B0B0B0] data-[state=checked]:bg-blue-600 data-[state=checked]:boder-blue-600 transition-colors"
                        checked={isChecked} 
                        onCheckedChange={(checked) => {
                          if (checked) setAmenities(prev => [...prev, id]);
                          else setAmenities(prev => prev.filter(v => v !== id));
                        }}
                      />
                      <label htmlFor={`amenity-${id}`} className="text-[16px] text-[#222222] cursor-pointer flex items-center gap-3 w-full">
                        <Icon className="w-6 h-6 text-[#717171]" strokeWidth={1.5} />
                        {label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#EBEBEB] bg-white sticky bottom-0 z-10">
            <button 
              onClick={handleReset}
              disabled={isResetDisabled}
              className={cn(
                "text-[16px] font-semibold underline underline-offset-2 transition-colors px-2 py-1",
                isResetDisabled ? "text-[#DDDDDD] cursor-not-allowed" : "text-[#222222] hover:text-[#717171]"
              )}
            >
              {t.advancedFilters.reset || "Clear all"}
            </button>
            <Button 
              onClick={handleApply}
              disabled={isLoadingResults}
              className="bg-blue-600 text-white px-8 py-6 rounded-xl text-[16px] font-semibold hover:bg-blue-700 active:scale-95 transition-all flex items-center min-w-[160px] justify-center"
            >
              {isLoadingResults ? (
                 <span className="animate-pulse">Loading...</span>
               ) : resultCount !== undefined ? (
                 `Show ${resultCount > 1000 ? "1,000+" : resultCount} places`
               ) : (
                 t.advancedFilters.apply || "Show places"
               )}
            </Button>
          </div>

        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
};

export default FilterSidebar;