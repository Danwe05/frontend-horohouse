'use client';
import React, { useState } from "react";
import { TbRulerMeasure } from "react-icons/tb";
import { Search, X, Heart } from "lucide-react";
import { FaBed, FaMapMarkerAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

interface PropertyItem {
  image: string;
  type: string;
  status: string;
  price: string;
  bedrooms: number;
  location: string;
  area: string;
  agentName: string;
  agentRole: string;
  agentPhoto: string;
}

interface PropertiesProps {
  properties: PropertyItem[];
}

const PropertyCard: React.FC<PropertyItem & { index: number }> = ({
  image,
  type,
  status,
  price,
  bedrooms,
  location,
  area,
  agentName,
  agentRole,
  agentPhoto,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0">
      {/* Image Container */}
      <div className="relative overflow-hidden h-48 bg-gradient-to-br from-gray-200 to-gray-300">
        <img
          src={image}
          alt={type}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Status Badge */}
        <Badge className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
          {status}
        </Badge>

        {/* Favorite Button */}
        <Button
          onClick={() => setIsFavorite(!isFavorite)}
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-md hover:bg-white border-0 rounded-full shadow-lg hover:scale-110 transition-all"
        >
          <Heart
            size={20}
            className={`transition-colors ${
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-gray-600 hover:text-red-500"
            }`}
          />
        </Button>
      </div>

      {/* Content */}
      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">
              {type}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{location}</p>
          </div>
          <span className="font-bold text-blue-600 text-lg whitespace-nowrap">
            {price}
          </span>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-4 text-gray-600 text-sm mb-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaBed className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium">{bedrooms}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <TbRulerMeasure className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium">{area}</span>
          </div>
        </div>

        {/* Agent Info */}
        <div className="flex items-center gap-3">
          <img
            src={agentPhoto}
            alt={agentName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100"
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{agentName}</p>
            <p className="text-xs text-gray-500">{agentRole}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const filterButtons = [
  { label: "Property Type", options: ["House", "Apartment", "Studio"] },
  { label: "Price", options: ["< $100k", "$100k - $500k", "> $500k"] },
  { label: "Area", options: ["< 50m²", "50-100m²", "100-200m²", "200m²+"] },
  { label: "Location", options: ["Paris", "Lyon", "Marseille"] },
];

const Properties: React.FC<PropertiesProps> = ({ properties }) => {
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: string[] }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleOptionToggle = (btnIndex: number, option: string) => {
    setSelectedOptions((prev) => {
      const prevOptions = prev[btnIndex] || [];
      const newOptions = prevOptions.includes(option)
        ? prevOptions.filter((o) => o !== option)
        : [...prevOptions, option];
      return { ...prev, [btnIndex]: newOptions };
    });
  };

  const clearAllFilters = () => {
    setSelectedOptions({});
    setSearchQuery("");
  };

  const isButtonSelected = (btnIndex: number) =>
    selectedOptions[btnIndex]?.length > 0;

  const hasActiveFilters = Object.values(selectedOptions).some((opts) => opts.length > 0);

  const filteredProperties = properties.filter((property) => {
    // Search
    if (
      searchQuery &&
      !`${property.type} ${property.location}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
      return false;

    // Property Type
    const typeFilters = selectedOptions[0] || [];
    if (typeFilters.length > 0 && !typeFilters.includes(property.type)) return false;

    // Price Type
    const priceFilters = selectedOptions[1] || [];
    if (priceFilters.length > 0) {
      const priceNumber = Number(property.price.replace(/[^0-9]/g, ""));
      let priceMatch = false;
      for (const pf of priceFilters) {
        if (pf === "< $100k" && priceNumber < 100000) priceMatch = true;
        if (pf === "$100k - $500k" && priceNumber >= 100000 && priceNumber <= 500000)
          priceMatch = true;
        if (pf === "> $500k" && priceNumber > 500000) priceMatch = true;
      }
      if (!priceMatch) return false;
    }

    // Area
    const areaFilters = selectedOptions[2] || [];
    if (areaFilters.length > 0) {
      const areaNumber = Number(property.area.replace(/[^0-9]/g, ""));
      let areaMatch = false;
      for (const af of areaFilters) {
        if (af === "< 50m²" && areaNumber < 50) areaMatch = true;
        if (af === "50-100m²" && areaNumber >= 50 && areaNumber <= 100) areaMatch = true;
        if (af === "100-200m²" && areaNumber >= 100 && areaNumber <= 200) areaMatch = true;
        if (af === "200m²+" && areaNumber > 200) areaMatch = true;
      }
      if (!areaMatch) return false;
    }

    // Location
    const locationFilters = selectedOptions[3] || [];
    if (locationFilters.length > 0 && !locationFilters.includes(property.location))
      return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Properties
          </h1>
          <p className="text-gray-600 text-lg">
            Discover {filteredProperties.length} amazing properties
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 border-gray-200 rounded-lg shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-8 border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Filters</span>
              {hasActiveFilters && (
                <Button
                  onClick={clearAllFilters}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <X size={14} className="mr-1" /> Clear All
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {filterButtons.map((btn, index) => {
                const isSelected = isButtonSelected(index);
                const selectedCount = selectedOptions[index]?.length || 0;

                return (
                  <DropdownMenu key={index}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className={`font-medium ${
                          isSelected
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {btn.label}
                        {selectedCount > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-white/30 text-white">
                            {selectedCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {btn.options.map((option, i) => (
                        <DropdownMenuItem
                          key={i}
                          onClick={() => handleOptionToggle(index, option)}
                          className={`cursor-pointer font-medium ${
                            selectedOptions[index]?.includes(option)
                              ? "bg-blue-600 text-white focus:bg-blue-700"
                              : "focus:bg-gray-100"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border ${
                                selectedOptions[index]?.includes(option)
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-300"
                              }`}
                            />
                            {option}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 font-medium">
            Showing <span className="text-blue-600 font-bold">{filteredProperties.length}</span> of{" "}
            <span className="text-blue-600 font-bold">{properties.length}</span> properties
          </p>
        </div>

        {/* Property Cards Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property, index) => (
              <PropertyCard key={index} {...property} index={index} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-2xl font-bold text-gray-800 mb-2">No properties found</p>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
              <Button
                onClick={clearAllFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Properties;