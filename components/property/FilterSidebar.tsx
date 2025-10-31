import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export interface AdvancedFilters {
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  hasPool?: boolean;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
}

interface FilterSidebarProps {
  onApply?: (filters: AdvancedFilters) => void;
  onClose?: () => void;
}

const FilterSidebar = ({ onApply, onClose }: FilterSidebarProps) => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [hasPool, setHasPool] = useState<boolean | undefined>(undefined);
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [maxBathrooms, setMaxBathrooms] = useState("");

  const togglePropertyType = (type: string) => {
    setPropertyTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
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
    };
    onApply?.(filters);
    onClose?.();
  };

  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setPropertyTypes([]);
    setHasPool(undefined);
    setMinBedrooms("");
    setMaxBedrooms("");
    setMinBathrooms("");
    setMaxBathrooms("");
  };

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      <h2 className="text-lg font-semibold">Advanced Filters</h2>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Price Range</Label>
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
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="house"
              checked={propertyTypes.includes("house")}
              onCheckedChange={() => togglePropertyType("house")}
            />
            <label htmlFor="house" className="text-sm cursor-pointer">
              House
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apartment"
              checked={propertyTypes.includes("apartment")}
              onCheckedChange={() => togglePropertyType("apartment")}
            />
            <label htmlFor="apartment" className="text-sm cursor-pointer">
              Apartment
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="villa"
              checked={propertyTypes.includes("villa")}
              onCheckedChange={() => togglePropertyType("villa")}
            />
            <label htmlFor="villa" className="text-sm cursor-pointer">
              Villa
            </label>
          </div>
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Bedrooms</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Min"
            value={minBedrooms}
            onChange={(e) => setMinBedrooms(e.target.value)}
            type="number"
            className="text-sm"
          />
          <Input
            placeholder="Max"
            value={maxBedrooms}
            onChange={(e) => setMaxBedrooms(e.target.value)}
            type="number"
            className="text-sm"
          />
        </div>
      </div>

      {/* Bathrooms */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Bathrooms</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Min"
            value={minBathrooms}
            onChange={(e) => setMinBathrooms(e.target.value)}
            type="number"
            className="text-sm"
          />
          <Input
            placeholder="Max"
            value={maxBathrooms}
            onChange={(e) => setMaxBathrooms(e.target.value)}
            type="number"
            className="text-sm"
          />
        </div>
      </div>

      {/* Pool */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Pool</Label>
        <div className="flex gap-2">
          <Button
            variant={hasPool === true ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setHasPool(true)}
          >
            With Pool
          </Button>
          <Button
            variant={hasPool === false ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setHasPool(false)}
          >
            No Pool
          </Button>
          <Button
            variant={hasPool === undefined ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setHasPool(undefined)}
          >
            Any
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          Reset
        </Button>
        <Button className="flex-1" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </div>
  );
};

export default FilterSidebar;
