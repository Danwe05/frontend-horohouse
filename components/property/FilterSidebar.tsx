"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

export interface AdvancedFilters {
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  hasPool?: boolean;
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
  initialFilters?: AdvancedFilters;
  /** Pass the current listing type so the sidebar can show/hide relevant fields */
  listingType?: "sale" | "rent" | "short_term" | "any";
}

const FilterSidebar = ({
  open,
  onOpenChange,
  onApply,
  initialFilters,
  listingType = "any",
}: FilterSidebarProps) => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [hasPool, setHasPool] = useState<boolean | undefined>(undefined);
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [maxBathrooms, setMaxBathrooms] = useState("");
  const [minGuests, setMinGuests] = useState("");

  useEffect(() => {
    if (initialFilters) {
      setMinPrice(initialFilters.minPrice?.toString() || "");
      setMaxPrice(initialFilters.maxPrice?.toString() || "");
      setPropertyTypes(initialFilters.propertyTypes || []);
      setHasPool(initialFilters.hasPool);
      setMinBedrooms(initialFilters.minBedrooms?.toString() || "");
      setMaxBedrooms(initialFilters.maxBedrooms?.toString() || "");
      setMinBathrooms(initialFilters.minBathrooms?.toString() || "");
      setMaxBathrooms(initialFilters.maxBathrooms?.toString() || "");
      setMinGuests(initialFilters.minGuests?.toString() || "");
    }
  }, [initialFilters]);

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleApply = () => {
    const filters: AdvancedFilters = {
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
      hasPool,
      minBedrooms: minBedrooms ? parseInt(minBedrooms) : undefined,
      maxBedrooms: maxBedrooms ? parseInt(maxBedrooms) : undefined,
      minBathrooms: minBathrooms ? parseInt(minBathrooms) : undefined,
      maxBathrooms: maxBathrooms ? parseInt(maxBathrooms) : undefined,
      minGuests: minGuests ? parseInt(minGuests) : undefined,
    };
    onApply?.(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setMinPrice(""); setMaxPrice(""); setPropertyTypes([]); setHasPool(undefined);
    setMinBedrooms(""); setMaxBedrooms(""); setMinBathrooms(""); setMaxBathrooms(""); setMinGuests("");
  };

  const isShortTerm = listingType === "short_term";
  const showGuestFilter = isShortTerm || listingType === "any";
  const showBedroomFilter = !isShortTerm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="backdrop-blur-sm">
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Refine your property search with detailed filters
            </DialogDescription>
          </DialogHeader>

          {/* All filter sections now correctly inside a single container */}
          <div className="space-y-6 py-4">

            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Price Range (XAF)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  type="number"
                  className="text-sm"
                />
                <Input
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  type="number"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Property Types */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Property Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "house", label: "House" },
                  { id: "apartment", label: "Apartment" },
                  { id: "villa", label: "Villa" },
                  { id: "hotel", label: "Hotel" },
                  { id: "guesthouse", label: "Guest House" },
                  { id: "vacation_rental", label: "Vacation Rental" },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      checked={propertyTypes.includes(id)}
                      onCheckedChange={() => togglePropertyType(id)}
                    />
                    <label htmlFor={id} className="text-sm cursor-pointer select-none">{label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Bedrooms — hidden for short-term */}
            {showBedroomFilter && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Bedrooms</Label>
                <div className="flex gap-2">
                  <Input placeholder="Min" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} type="number" className="text-sm" />
                  <Input placeholder="Max" value={maxBedrooms} onChange={(e) => setMaxBedrooms(e.target.value)} type="number" className="text-sm" />
                </div>
              </div>
            )}

            {/* Bathrooms — hidden for short-term */}
            {showBedroomFilter && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Bathrooms</Label>
                <div className="flex gap-2">
                  <Input placeholder="Min" value={minBathrooms} onChange={(e) => setMinBathrooms(e.target.value)} type="number" className="text-sm" />
                  <Input placeholder="Max" value={maxBathrooms} onChange={(e) => setMaxBathrooms(e.target.value)} type="number" className="text-sm" />
                </div>
              </div>
            )}

            {/* Guests — shown for short-term and "any" */}
            {showGuestFilter && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  {isShortTerm ? "Minimum Guests Capacity" : "Max Guests (short-term)"}
                </Label>
                <Input
                  placeholder="e.g. 2"
                  value={minGuests}
                  onChange={(e) => setMinGuests(e.target.value)}
                  type="number"
                  className="text-sm"
                />
              </div>
            )}

            {/* Pool */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Pool</Label>
              <div className="flex gap-2">
                <Button variant={hasPool === true ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setHasPool(true)}>With Pool</Button>
                <Button variant={hasPool === false ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setHasPool(false)}>No Pool</Button>
                <Button variant={hasPool === undefined ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setHasPool(undefined)}>Any</Button>
              </div>
            </div>

            {/* Action Buttons — always last, always inside the space-y-6 div */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleReset}>Reset</Button>
              <Button className="flex-1" onClick={handleApply}>Apply Filters</Button>
            </div>
          </div>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
};

export default FilterSidebar;