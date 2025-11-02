import { Search, MapPin, DollarSign, Bed, Bath, Loader2, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";

export interface QuickSearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  listingType?: string; // 'rent' or 'sale'
}

interface QuickSearchProps {
  onSearch?: (filters: QuickSearchFilters) => void;
  isSearching?: boolean;
}

interface PlaceSuggestion {
  place_name: string;
  text: string;
  place_type: string[];
}

const QuickSearch = ({ onSearch, isSearching = false }: QuickSearchProps) => {
  const [city, setCity] = useState("");
  const [listingType, setListingType] = useState("any");
  const [minBudget, setMinBudget] = useState("any");
  const [maxBudget, setMaxBudget] = useState("any");
  const [bedrooms, setBedrooms] = useState("any");
  const [bathrooms, setBathrooms] = useState("any");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const budgetToPrice = (val: string): number | undefined => {
    switch (val) {
      case "100k":
        return 100000;
      case "200k":
        return 200000;
      case "500k":
        return 500000;
      case "1m":
        return 1000000;
      case "2m":
        return 2000000;
      case "5m":
        return 5000000;
      default:
        return undefined;
    }
  };

  const numberOrUndefined = (val: string): number | undefined => {
    if (val === "any") return undefined;
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? undefined : n;
  };

  // Add to recent searches
  const addToRecentSearches = (location: string) => {
    if (!location) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== location);
      const updated = [location, ...filtered].slice(0, 5);
      return updated;
    });
  };

  // Remove from recent searches
  const removeFromRecentSearches = (location: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(s => s !== location));
  };

  // Fetch place suggestions from Maptiler Geocoding API
  const fetchPlaceSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_MAPTILER_API_KEY is not set");
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}&limit=8&autocomplete=true`
      );
      const data = await response.json();
      
      if (data.features) {
        // Filter to show cities, places, regions, and neighborhoods
        const places: PlaceSuggestion[] = data.features
          .filter((feature: any) => {
            const types = feature.place_type || [];
            return types.some((type: string) => 
              ['place', 'municipality', 'region', 'district', 'locality', 'neighborhood'].includes(type)
            );
          })
          .map((feature: any) => ({
            place_name: feature.place_name,
            text: feature.text,
            place_type: feature.place_type || [],
          }));

        // Sort suggestions: exact matches and main cities first
        const sortedPlaces = places.sort((a, b) => {
          const queryLower = query.toLowerCase();
          const aTextLower = a.text.toLowerCase();
          const bTextLower = b.text.toLowerCase();
          
          // Exact match comes first
          const aExact = aTextLower === queryLower;
          const bExact = bTextLower === queryLower;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Starts with query comes next
          const aStarts = aTextLower.startsWith(queryLower);
          const bStarts = bTextLower.startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          // Main cities (without numbers/subdivisions) come before districts
          const aHasNumber = /\d|I{2,}|IV|V/.test(a.text);
          const bHasNumber = /\d|I{2,}|IV|V/.test(b.text);
          if (!aHasNumber && bHasNumber) return -1;
          if (aHasNumber && !bHasNumber) return 1;
          
          // Shorter names (usually main cities) come first
          return a.text.length - b.text.length;
        });

        setSuggestions(sortedPlaces);
      }
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle city input change with debounce
  const handleCityChange = (value: string) => {
    setCity(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce API call
    searchTimeoutRef.current = setTimeout(() => {
      fetchPlaceSuggestions(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    const totalItems = suggestions.length + recentSearches.length;
    if (totalItems === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < totalItems) {
          if (selectedIndex < recentSearches.length) {
            handleRecentSearchClick(recentSearches[selectedIndex]);
          } else {
            handleSuggestionClick(suggestions[selectedIndex - recentSearches.length]);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (location: string) => {
    setCity(location);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Auto-search when recent search is selected
    const filters: QuickSearchFilters = {
      city: location,
      listingType: listingType !== "any" ? listingType : undefined,
      minPrice: budgetToPrice(minBudget),
      maxPrice: budgetToPrice(maxBudget),
      bedrooms: numberOrUndefined(bedrooms),
      bathrooms: numberOrUndefined(bathrooms),
    };
    onSearch?.(filters);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setCity(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);
    addToRecentSearches(suggestion.text);
    
    // Auto-search when suggestion is selected
    const filters: QuickSearchFilters = {
      city: suggestion.text,
      listingType: listingType !== "any" ? listingType : undefined,
      minPrice: budgetToPrice(minBudget),
      maxPrice: budgetToPrice(maxBudget),
      bedrooms: numberOrUndefined(bedrooms),
      bathrooms: numberOrUndefined(bathrooms),
    };
    onSearch?.(filters);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const filters: QuickSearchFilters = {
      city: city || undefined,
      listingType: listingType !== "any" ? listingType : undefined,
      minPrice: budgetToPrice(minBudget),
      maxPrice: budgetToPrice(maxBudget),
      bedrooms: numberOrUndefined(bedrooms),
      bathrooms: numberOrUndefined(bathrooms),
    };
    
    if (city) {
      addToRecentSearches(city);
    }
    
    onSearch?.(filters);
    setShowSuggestions(false);
  };

  // Auto-search when filters change (except city which is handled separately)
  useEffect(() => {
    // Only trigger if at least one filter is set (to avoid initial empty search)
    if (listingType !== "any" || minBudget !== "any" || maxBudget !== "any" || bedrooms !== "any" || bathrooms !== "any") {
      const filters: QuickSearchFilters = {
        city: city || undefined,
        listingType: listingType !== "any" ? listingType : undefined,
        minPrice: budgetToPrice(minBudget),
        maxPrice: budgetToPrice(maxBudget),
        bedrooms: numberOrUndefined(bedrooms),
        bathrooms: numberOrUndefined(bathrooms),
      };
      onSearch?.(filters);
    }
  }, [listingType, minBudget, maxBudget, bedrooms, bathrooms]);

  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <div className="hidden lg:flex gap-3 items-end">
        {/* City - Longer with Autocomplete */}
        <div className="flex-1 min-w-[250px] relative" ref={suggestionsRef}>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            {isLoadingSuggestions && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
            )}
            <Input
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search city or place"
              className="pl-9 h-10"
              autoComplete="off"
            />
            
            {/* Autocomplete Dropdown */}
            {showSuggestions && (recentSearches.length > 0 || suggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 border-border rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="border-b border-border">
                    <div className="px-3 py-2 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Recent Searches
                      </p>
                    </div>
                    <div className="p-1">
                      {recentSearches.map((location, index) => (
                        <div
                          key={`recent-${index}`}
                          onClick={() => handleRecentSearchClick(location)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-3 transition-all group ${
                            selectedIndex === index 
                              ? 'bg-primary text-primary-foreground shadow-md' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Clock className={`h-4 w-4 flex-shrink-0 ${
                            selectedIndex === index ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`} />
                          <span className={`flex-1 text-sm ${
                            selectedIndex === index ? 'text-primary-foreground font-semibold' : 'text-foreground'
                          }`}>
                            {location}
                          </span>
                          <button
                            onClick={(e) => removeFromRecentSearches(location, e)}
                            className={`flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                              selectedIndex === index 
                                ? 'hover:bg-primary-foreground/20' 
                                : 'hover:bg-muted-foreground/20'
                            }`}
                          >
                            <X className={`h-3 w-3 ${
                              selectedIndex === index ? 'text-primary-foreground' : 'text-muted-foreground'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    {recentSearches.length > 0 && (
                      <div className="px-3 py-2 bg-muted/30">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Suggestions
                        </p>
                      </div>
                    )}
                    <div className="p-1">
                      {suggestions.map((suggestion, index) => {
                        const adjustedIndex = index + recentSearches.length;
                        return (
                          <div
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                            className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-start gap-3 transition-all ${
                              selectedIndex === adjustedIndex 
                                ? 'bg-primary text-primary-foreground shadow-md' 
                                : 'hover:bg-muted'
                            }`}
                          >
                            <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              selectedIndex === adjustedIndex ? 'text-primary-foreground' : 'text-muted-foreground'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${
                                selectedIndex === adjustedIndex ? 'text-primary-foreground' : 'text-foreground'
                              }`}>
                                {suggestion.text}
                              </p>
                              <p className={`text-xs truncate mt-0.5 ${
                                selectedIndex === adjustedIndex ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}>
                                {suggestion.place_name}
                              </p>
                            </div>
                            {selectedIndex === adjustedIndex && (
                              <div className="flex-shrink-0">
                                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-primary-foreground/20 rounded">
                                  ↵
                                </kbd>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="px-3 py-2 bg-muted/50 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Use ↑↓ to navigate • Enter to select • Esc to close
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Listing Type */}
        <div className="w-[140px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Type
          </label>
          <Select value={listingType} onValueChange={setListingType}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="sale">Buy</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Budget */}
        <div className="w-[140px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Min Price
          </label>
          <Select value={minBudget} onValueChange={setMinBudget}>
            <SelectTrigger className="h-10 w-full">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Min" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">No Min</SelectItem>
              <SelectItem value="100k">100k XAF</SelectItem>
              <SelectItem value="200k">200k XAF</SelectItem>
              <SelectItem value="500k">500k XAF</SelectItem>
              <SelectItem value="1m">1M XAF</SelectItem>
              <SelectItem value="2m">2M XAF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Budget */}
        <div className="w-[140px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Max Price
          </label>
          <Select value={maxBudget} onValueChange={setMaxBudget}>
            <SelectTrigger className="h-10 w-full">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Max" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">No Max</SelectItem>
              <SelectItem value="200k">200k XAF</SelectItem>
              <SelectItem value="500k">500k XAF</SelectItem>
              <SelectItem value="1m">1M XAF</SelectItem>
              <SelectItem value="2m">2M XAF</SelectItem>
              <SelectItem value="5m">5M XAF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bedrooms */}
        <div className="w-[120px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Beds
          </label>
          <Select value={bedrooms} onValueChange={setBedrooms}>
            <SelectTrigger className="h-10 w-full">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Any" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bathrooms */}
        <div className="w-[120px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Baths
          </label>
          <Select value={bathrooms} onValueChange={setBathrooms}>
            <SelectTrigger className="h-10 w-full">
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Any" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <Button 
          className="gap-2 h-10 px-6 bg-blue-500 hover:bg-blue-600" 
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden space-y-3">
        {/* Location - Full width */}
        <div className="relative" ref={suggestionsRef}>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            {isLoadingSuggestions && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
            )}
            <Input
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search city or place"
              className="pl-9 h-11"
              autoComplete="off"
            />
            
            {/* Mobile Autocomplete Dropdown */}
            {showSuggestions && (recentSearches.length > 0 || suggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 border-border rounded-xl shadow-2xl z-50 max-h-[300px] overflow-y-auto">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="border-b border-border">
                    <div className="px-3 py-2 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Recent
                      </p>
                    </div>
                    <div className="p-1">
                      {recentSearches.map((location, index) => (
                        <div
                          key={`recent-mobile-${index}`}
                          onClick={() => handleRecentSearchClick(location)}
                          className="px-3 py-3 rounded-lg cursor-pointer flex items-center gap-3 active:bg-muted group"
                        >
                          <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="flex-1 text-sm text-foreground">
                            {location}
                          </span>
                          <button
                            onClick={(e) => removeFromRecentSearches(location, e)}
                            className="flex-shrink-0 p-1 rounded opacity-0 group-active:opacity-100 hover:bg-muted-foreground/20"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-1">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={`suggestion-mobile-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-3 rounded-lg cursor-pointer flex items-start gap-3 active:bg-muted"
                      >
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {suggestion.text}
                          </p>
                          <p className="text-xs truncate mt-0.5 text-muted-foreground">
                            {suggestion.place_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 1: Type and Min Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Type
            </label>
            <Select value={listingType} onValueChange={setListingType}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="sale">Buy</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Min Price
            </label>
            <Select value={minBudget} onValueChange={setMinBudget}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="No Min" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">No Min</SelectItem>
                <SelectItem value="100k">100k</SelectItem>
                <SelectItem value="200k">200k</SelectItem>
                <SelectItem value="500k">500k</SelectItem>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="2m">2M</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Max Price and Beds */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Max Price
            </label>
            <Select value={maxBudget} onValueChange={setMaxBudget}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="No Max" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">No Max</SelectItem>
                <SelectItem value="200k">200k</SelectItem>
                <SelectItem value="500k">500k</SelectItem>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="2m">2M</SelectItem>
                <SelectItem value="5m">5M</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Bedrooms
            </label>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Bathrooms and Search Button */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Bathrooms
            </label>
            <Select value={bathrooms} onValueChange={setBathrooms}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              className="gap-2 h-11 w-full bg-blue-500 hover:bg-blue-600" 
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSearch;