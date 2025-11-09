import { Search, MapPin, DollarSign, Bed, Bath, Loader2, Clock, X, Tag, Slash, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import SaveSearchModal from "@/components/saved-searches/SaveSearchModal";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface QuickSearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  listingType?: string;
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
  const { isAuthenticated } = useAuth();
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
  const cityInputRef = useRef<HTMLInputElement>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const budgetToPrice = (val: string): number | undefined => {
    switch (val) {
      case "100k": return 100000;
      case "200k": return 200000;
      case "500k": return 500000;
      case "1m": return 1000000;
      case "2m": return 2000000;
      case "5m": return 5000000;
      default: return undefined;
    }
  };

  const formatPrice = (val: string): string => {
    switch (val) {
      case "100k": return "100,000 XAF";
      case "200k": return "200,000 XAF";
      case "500k": return "500,000 XAF";
      case "1m": return "1,000,000 XAF";
      case "2m": return "2,000,000 XAF";
      case "5m": return "5,000,000 XAF";
      default: return val;
    }
  };

  const formatPriceMobile = (val: string): string => {
    switch (val) {
      case "100k": return "100K";
      case "200k": return "200K";
      case "500k": return "500K";
      case "1m": return "1M";
      case "2m": return "2M";
      case "5m": return "5M";
      default: return val;
    }
  };

  const numberOrUndefined = (val: string): number | undefined => {
    if (val === "any") return undefined;
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? undefined : n;
  };

  const getCurrentFilters = (): QuickSearchFilters => {
    return {
      city: city || undefined,
      listingType: listingType !== "any" ? listingType : undefined,
      minPrice: budgetToPrice(minBudget),
      maxPrice: budgetToPrice(maxBudget),
      bedrooms: numberOrUndefined(bedrooms),
      bathrooms: numberOrUndefined(bathrooms),
    };
  };

  const getActiveFilters = () => {
    const filters: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (city) {
      filters.push({
        key: 'city',
        label: city,
        onRemove: () => setCity('')
      });
    }

    if (listingType !== 'any') {
      filters.push({
        key: 'listingType',
        label: listingType === 'sale' ? 'Buy' : 'Rent',
        onRemove: () => setListingType('any')
      });
    }

    if (minBudget !== 'any') {
      filters.push({
        key: 'minBudget',
        label: `Min: ${formatPrice(minBudget)}`,
        onRemove: () => setMinBudget('any')
      });
    }

    if (maxBudget !== 'any') {
      filters.push({
        key: 'maxBudget',
        label: `Max: ${formatPrice(maxBudget)}`,
        onRemove: () => setMaxBudget('any')
      });
    }

    if (bedrooms !== 'any') {
      filters.push({
        key: 'bedrooms',
        label: `${bedrooms}+ Beds`,
        onRemove: () => setBedrooms('any')
      });
    }

    if (bathrooms !== 'any') {
      filters.push({
        key: 'bathrooms',
        label: `${bathrooms}+ Baths`,
        onRemove: () => setBathrooms('any')
      });
    }

    return filters;
  };

  const clearAllFilters = () => {
    setCity('');
    setListingType('any');
    setMinBudget('any');
    setMaxBudget('any');
    setBedrooms('any');
    setBathrooms('any');
  };

  const handleSaveSearch = async (data: any) => {
    try {
      await apiClient.createSavedSearch(data);
      toast.success('Search saved successfully!', {
        description: 'You will be notified when new properties match your criteria.'
      });
      setShowSaveModal(false);
    } catch (error: any) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search', {
        description: error?.response?.data?.message || 'Please try again later.'
      });
      throw error;
    }
  };

  const handleSaveButtonClick = () => {
    if (!isAuthenticated) {
      toast.error('Login required', {
        description: 'Please login to save your searches.'
      });
      return;
    }

    if (!hasSearched) {
      toast.error('No search to save', {
        description: 'Please perform a search first.'
      });
      return;
    }

    setShowSaveModal(true);
  };

  const addToRecentSearches = (location: string) => {
    if (!location) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== location);
      const updated = [location, ...filtered].slice(0, 5);
      return updated;
    });
  };

  const removeFromRecentSearches = (location: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(s => s !== location));
  };

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

        setSuggestions(places);
      }
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPlaceSuggestions(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    const totalItems = suggestions.length + recentSearches.length;
    if (totalItems === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < totalItems - 1 ? prev + 1 : prev);
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

  const handleRecentSearchClick = (location: string) => {
    setCity(location);
    setShowSuggestions(false);
    setSuggestions([]);
    const filters = getCurrentFilters();
    filters.city = location;
    setHasSearched(true);
    onSearch?.(filters);
  };

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setCity(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);
    addToRecentSearches(suggestion.text);
    const filters = getCurrentFilters();
    filters.city = suggestion.text;
    setHasSearched(true);
    onSearch?.(filters);
  };

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
    const filters = getCurrentFilters();
    if (city) {
      addToRecentSearches(city);
    }
    setHasSearched(true);
    onSearch?.(filters);
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (listingType !== "any" || minBudget !== "any" || maxBudget !== "any" || bedrooms !== "any" || bathrooms !== "any") {
      const filters = getCurrentFilters();
      setHasSearched(true);
      onSearch?.(filters);
    }
  }, [listingType, minBudget, maxBudget, bedrooms, bathrooms]);

  // Carousel drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="flex gap-3 items-end">
          {/* City Input */}
          <div className="flex-1 min-w-[250px] relative" ref={suggestionsRef}>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Location
            </label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              {isLoadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
              )}
              <Input
                ref={cityInputRef}
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border-1 border-border rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                  {recentSearches.length > 0 && (
                    <div className="p-2 border-b">
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <Clock className="h-3.5 w-3.5" />
                        Recent Searches
                      </div>
                      {recentSearches.map((search, idx) => (
                        <button
                          key={`recent-${idx}`}
                          onClick={() => handleRecentSearchClick(search)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent rounded-lg transition-colors group ${
                            selectedIndex === idx ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{search}</span>
                          </div>
                          <X
                            onClick={(e) => removeFromRecentSearches(search, e)}
                            className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <Search className="h-3.5 w-3.5" />
                        Suggestions
                      </div>
                      {suggestions.map((suggestion, idx) => {
                        const actualIndex = idx + recentSearches.length;
                        return (
                          <button
                            key={`suggestion-${idx}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`w-full flex items-start gap-2 px-3 py-2.5 hover:bg-accent rounded-lg transition-colors text-left ${
                              selectedIndex === actualIndex ? 'bg-accent' : ''
                            }`}
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium">{suggestion.text}</div>
                              <div className="text-xs text-muted-foreground">{suggestion.place_name}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Listing Type */}
          <div className="w-[140px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
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

          {/* Min Price */}
          <div className="w-[140px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min Price</label>
            <Select value={minBudget} onValueChange={setMinBudget}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">No Min</SelectItem>
                <SelectItem value="100k">100,000 XAF</SelectItem>
                <SelectItem value="200k">200,000 XAF</SelectItem>
                <SelectItem value="500k">500,000 XAF</SelectItem>
                <SelectItem value="1m">1,000,000 XAF</SelectItem>
                <SelectItem value="2m">2,000,000 XAF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Price */}
          <div className="w-[140px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Price</label>
            <Select value={maxBudget} onValueChange={setMaxBudget}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Max" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">No Max</SelectItem>
                <SelectItem value="200k">200,000 XAF</SelectItem>
                <SelectItem value="500k">500,000 XAF</SelectItem>
                <SelectItem value="1m">1,000,000 XAF</SelectItem>
                <SelectItem value="2m">2,000,000 XAF</SelectItem>
                <SelectItem value="5m">5,000,000 XAF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bedrooms */}
          <div className="w-[120px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Beds</label>
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
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Baths</label>
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

          {/* Save Search Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="gap-2 h-10 px-4 border-1 border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={handleSaveButtonClick}
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden lg:inline">Save</span>
            </Button>
          )}
        </div>

        {/* Active Filters Chips */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              <span className="font-medium">Active filters:</span>
            </div>
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="pl-2.5 pr-1.5 py-1 gap-1.5 text-xs font-medium hover:bg-secondary/80 cursor-pointer group"
                onClick={filter.onRemove}
              >
                {filter.label}
                <X className="h-3 w-3 group-hover:text-destructive" />
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Mobile & Tablet Layout with Carousel */}
      <div className="lg:hidden">
        {/* Location Search - Full Width */}
        <div className="mb-3 relative" ref={suggestionsRef}>
          <label className="text-xs font-semibold text-foreground mb-2 block">Where are you looking?</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            {isLoadingSuggestions && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
            )}
            <Input
              ref={cityInputRef}
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="City, neighborhood, or area"
              className="w-full pl-12 pr-4 h-12 text-base font-medium"
              autoComplete="off"
            />
          </div>
          {showSuggestions && (recentSearches.length > 0 || suggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border-1 border-border rounded-xl shadow-xl z-50 max-h-[250px] overflow-y-auto">
              {recentSearches.length > 0 && (
                <div className="p-2 border-b">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    <Clock className="h-4 w-4" />
                    Recent
                  </div>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={`recent-mobile-${idx}`}
                      onClick={() => handleRecentSearchClick(search)}
                      className={`w-full flex items-center justify-between px-3 py-3 hover:bg-accent rounded-lg transition-colors group ${
                        selectedIndex === idx ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">{search}</span>
                      </div>
                      <X
                        onClick={(e) => removeFromRecentSearches(search, e)}
                        className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      />
                    </button>
                  ))}
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    <Search className="h-4 w-4" />
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, idx) => {
                    const actualIndex = idx + recentSearches.length;
                    return (
                      <button
                        key={`suggestion-mobile-${idx}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full flex items-start gap-2 px-3 py-3 hover:bg-accent rounded-lg transition-colors text-left ${
                          selectedIndex === actualIndex ? 'bg-accent' : ''
                        }`}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold">{suggestion.text}</div>
                          <div className="text-xs text-muted-foreground">{suggestion.place_name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters Carousel */}
        <div className="relative mb-4">
          <div
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
            className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 cursor-grab active:cursor-grabbing"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Type Filter */}
            <div className="flex-shrink-0 snap-start">
              <div className="bg-card border-1 border-border rounded-xl p-3 min-w-[140px] hover:border-primary/50 transition-all">
                <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">Type</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="any">Any</option>
                  <option value="sale">Buy</option>
                  <option value="rent">Rent</option>
                </select>
              </div>
            </div>

            {/* Min Price Filter */}
            <div className="flex-shrink-0 snap-start">
              <div className="bg-card border-1 border-border rounded-xl p-3 min-w-[140px] hover:border-primary/50 transition-all">
                <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">Min Price</label>
                <select
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="any">No Min</option>
                  <option value="100k">100K</option>
                  <option value="200k">200K</option>
                  <option value="500k">500K</option>
                  <option value="1m">1M</option>
                  <option value="2m">2M</option>
                </select>
              </div>
            </div>

            {/* Max Price Filter */}
            <div className="flex-shrink-0 snap-start">
              <div className="bg-card border-1 border-border rounded-xl p-3 min-w-[140px] hover:border-primary/50 transition-all">
                <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wide">Max Price</label>
                <select
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="any">No Max</option>
                  <option value="200k">200K</option>
                  <option value="500k">500K</option>
                  <option value="1m">1M</option>
                  <option value="2m">2M</option>
                  <option value="5m">5M</option>
                </select>
              </div>
            </div>

            {/* Bedrooms Filter */}
            <div className="flex-shrink-0 snap-start">
              <div className="bg-card border-1 border-border rounded-xl p-3 min-w-[120px] hover:border-primary/50 transition-all">
                <label className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wide">
                  <Bed className="h-3.5 w-3.5" />
                  Beds
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="any">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>

            {/* Bathrooms Filter */}
            <div className="flex-shrink-0 snap-start">
              <div className="bg-card border-1 border-border rounded-xl p-3 min-w-[120px] hover:border-primary/50 transition-all">
                <label className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wide">
                  <Bath className="h-3.5 w-3.5" />
                  Baths
                </label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="any">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2 h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base active:scale-95 transition-all"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Search
              </>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              className="gap-2 h-12 px-5 border-1 border-blue-500 text-blue-500 hover:bg-blue-50 font-bold active:scale-95 transition-all"
              onClick={handleSaveButtonClick}
            >
              <Bookmark className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                <Tag className="h-3.5 w-3.5" />
                Active Filters
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive font-bold"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="px-3 py-1.5 gap-1.5 text-xs font-bold hover:bg-secondary/80 cursor-pointer group"
                  onClick={filter.onRemove}
                >
                  {filter.label}
                  <X className="h-3 w-3 group-hover:text-destructive transition-colors" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Search Modal */}
      <SaveSearchModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveSearch}
        currentFilters={getCurrentFilters()}
      />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default QuickSearch;