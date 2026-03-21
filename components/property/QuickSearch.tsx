import {
  Search, MapPin, Bed, Bath, Loader2, Clock, X, Tag, Bookmark,
  Home, CalendarRange, Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import SaveSearchModal from "@/components/saved-searches/SaveSearchModal";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

function normalizeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------


export interface QuickSearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  listingType?: string;
  /** Short-term only */
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

interface QuickSearchProps {
  onSearch?: (filters: QuickSearchFilters) => void;
  isSearching?: boolean;
  initialFilters?: QuickSearchFilters;
}

interface PlaceSuggestion {
  place_name: string;
  text: string;
  place_type: string[];
}

// ---------------------------------------------------------------------------
// Price configs per listing type
// ---------------------------------------------------------------------------

type PriceOption = { value: string; label: string; shortLabel: string; amount: number | undefined };

const PRICE_OPTIONS: Record<string, PriceOption[]> = {
  // For sale — millions
  sale: [
    { value: "any", label: "No limit", shortLabel: "Any", amount: undefined },
    { value: "5m", label: "5,000,000 XAF", shortLabel: "5M", amount: 5_000_000 },
    { value: "10m", label: "10,000,000 XAF", shortLabel: "10M", amount: 10_000_000 },
    { value: "20m", label: "20,000,000 XAF", shortLabel: "20M", amount: 20_000_000 },
    { value: "50m", label: "50,000,000 XAF", shortLabel: "50M", amount: 50_000_000 },
    { value: "100m", label: "100,000,000 XAF", shortLabel: "100M", amount: 100_000_000 },
  ],
  // Monthly rent — hundreds of thousands
  rent: [
    { value: "any", label: "No limit", shortLabel: "Any", amount: undefined },
    { value: "50k", label: "50,000 XAF/mo", shortLabel: "50K", amount: 50_000 },
    { value: "100k", label: "100,000 XAF/mo", shortLabel: "100K", amount: 100_000 },
    { value: "200k", label: "200,000 XAF/mo", shortLabel: "200K", amount: 200_000 },
    { value: "500k", label: "500,000 XAF/mo", shortLabel: "500K", amount: 500_000 },
    { value: "1m", label: "1,000,000 XAF/mo", shortLabel: "1M", amount: 1_000_000 },
  ],
  // Nightly short-term
  short_term: [
    { value: "any", label: "No limit", shortLabel: "Any", amount: undefined },
    { value: "10k", label: "10,000 XAF/night", shortLabel: "10K", amount: 10_000 },
    { value: "25k", label: "25,000 XAF/night", shortLabel: "25K", amount: 25_000 },
    { value: "50k", label: "50,000 XAF/night", shortLabel: "50K", amount: 50_000 },
    { value: "100k", label: "100,000 XAF/night", shortLabel: "100K", amount: 100_000 },
    { value: "200k", label: "200,000 XAF/night", shortLabel: "200K", amount: 200_000 },
  ],
  any: [
    { value: "any", label: "No limit", shortLabel: "Any", amount: undefined },
    { value: "100k", label: "100,000 XAF", shortLabel: "100K", amount: 100_000 },
    { value: "200k", label: "200,000 XAF", shortLabel: "200K", amount: 200_000 },
    { value: "500k", label: "500,000 XAF", shortLabel: "500K", amount: 500_000 },
    { value: "1m", label: "1,000,000 XAF", shortLabel: "1M", amount: 1_000_000 },
    { value: "2m", label: "2,000,000 XAF", shortLabel: "2M", amount: 2_000_000 },
  ],
};

function getPriceOptions(listingType: string) {
  return PRICE_OPTIONS[listingType] ?? PRICE_OPTIONS.any;
}

function priceValueToAmount(value: string, listingType: string): number | undefined {
  const opts = getPriceOptions(listingType);
  return opts.find((o) => o.value === value)?.amount;
}

// ---------------------------------------------------------------------------
// ListingTypePill — the mode switcher
// ---------------------------------------------------------------------------

const TYPE_TABS = [
  { value: "rent", label: "Rent", icon: Calendar },
  { value: "sale", label: "Buy", icon: Home },
  { value: "short_term", label: "Stay", icon: CalendarRange },
] as const;

function ListingTypeTabs({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  t: any;
}) {
  return (
    <div className="inline-flex bg-muted rounded-full p-2.5 gap-0.5">
      {TYPE_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-150
              ${active
                ? tab.value === "short_term"
                  ? "bg-blue-600 text-white "
                  : tab.value === "rent"
                    ? "bg-blue-600 text-white "
                    : tab.value === "sale"
                      ? "bg-blue-600 text-white "
                      : "bg-card text-foreground "
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }
            `}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.value === "rent" ? t.quickSearchExtras.rent : tab.value === "sale" ? t.quickSearchExtras.buy : t.quickSearchExtras.stay}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const QuickSearch = ({ onSearch, isSearching = false, initialFilters }: QuickSearchProps) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Resolve initial listing type — default to "rent"
  const initListingType = initialFilters?.listingType ?? "rent";

  // Resolve initial price bucket labels from amount values
  const resolveInitBudget = (amount: number | undefined, lt: string) => {
    if (!amount) return "any";
    return getPriceOptions(lt).find((o) => o.amount === amount)?.value ?? "any";
  };

  const [city, setCity] = useState(initialFilters?.city ?? "");
  const [listingType, setListingType] = useState(initListingType);
  const [minBudget, setMinBudget] = useState(() => resolveInitBudget(initialFilters?.minPrice, initListingType));
  const [maxBudget, setMaxBudget] = useState(() => resolveInitBudget(initialFilters?.maxPrice, initListingType));
  const [bedrooms, setBedrooms] = useState(initialFilters?.bedrooms?.toString() ?? "any");
  const [bathrooms, setBathrooms] = useState(initialFilters?.bathrooms?.toString() ?? "any");

  // Short-term specific
  const [checkIn, setCheckIn] = useState<Date | undefined>(
    initialFilters?.checkIn ? new Date(initialFilters.checkIn) : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    initialFilters?.checkOut ? new Date(initialFilters.checkOut) : undefined
  );
  const [guests, setGuests] = useState(initialFilters?.guests?.toString() ?? "any");

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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const isShortTerm = listingType === "short_term";

  // Reset price selections when listing type changes (ranges are incompatible)
  useEffect(() => {
    setMinBudget("any");
    setMaxBudget("any");
  }, [listingType]);

  const rawPriceOptions = getPriceOptions(listingType);
  const priceOptions = rawPriceOptions.map(opt => ({
    ...opt,
    label: opt.value === "any" ? t.quickSearchExtras.noLimit : opt.label,
    shortLabel: opt.value === "any" ? t.quickSearchExtras.any : opt.shortLabel
  }));

  const getCurrentFilters = useCallback((): QuickSearchFilters => {
    const f: QuickSearchFilters = {
      city: city || undefined,
      listingType: listingType !== "any" ? listingType : undefined,
      minPrice: priceValueToAmount(minBudget, listingType),
      maxPrice: priceValueToAmount(maxBudget, listingType),
    };
    if (isShortTerm) {
      if (checkIn) f.checkIn = format(checkIn, "yyyy-MM-dd");
      if (checkOut) f.checkOut = format(checkOut, "yyyy-MM-dd");
      if (guests !== "any") f.guests = parseInt(guests, 10);
    } else {
      f.bedrooms = bedrooms !== "any" ? parseInt(bedrooms, 10) : undefined;
      f.bathrooms = bathrooms !== "any" ? parseInt(bathrooms, 10) : undefined;
    }
    return f;
  }, [city, listingType, minBudget, maxBudget, checkIn, checkOut, guests, bedrooms, bathrooms, isShortTerm]);

  const getActiveFilters = useCallback(() => {
    const filters: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (city) filters.push({ key: "city", label: city, onRemove: () => setCity("") });
    if (listingType !== "rent") {
      const labels: Record<string, string> = { sale: t.quickSearchExtras.buy, rent: t.quickSearchExtras.rent, short_term: t.quickSearchExtras.stay };
      filters.push({ key: "listingType", label: labels[listingType] ?? listingType, onRemove: () => setListingType("rent") });
    }
    if (minBudget !== "any") {
      const opt = priceOptions.find((o) => o.value === minBudget);
      filters.push({ key: "minBudget", label: `Min: ${opt?.shortLabel ?? minBudget}`, onRemove: () => setMinBudget("any") });
    }
    if (maxBudget !== "any") {
      const opt = priceOptions.find((o) => o.value === maxBudget);
      filters.push({ key: "maxBudget", label: `Max: ${opt?.shortLabel ?? maxBudget}`, onRemove: () => setMaxBudget("any") });
    }
    if (!isShortTerm) {
      if (bedrooms !== "any") filters.push({ key: "bedrooms", label: `${bedrooms}+ Beds`, onRemove: () => setBedrooms("any") });
      if (bathrooms !== "any") filters.push({ key: "bathrooms", label: `${bathrooms}+ Baths`, onRemove: () => setBathrooms("any") });
    } else {
      if (checkIn) filters.push({ key: "checkIn", label: `From: ${format(checkIn, "MMM d")}`, onRemove: () => setCheckIn(undefined) });
      if (checkOut) filters.push({ key: "checkOut", label: `To: ${format(checkOut, "MMM d")}`, onRemove: () => setCheckOut(undefined) });
      if (guests !== "any") filters.push({ key: "guests", label: `${guests} guests`, onRemove: () => setGuests("any") });
    }
    return filters;
  }, [city, listingType, minBudget, maxBudget, bedrooms, bathrooms, checkIn, checkOut, guests, isShortTerm, priceOptions]);

  const clearAllFilters = () => {
    setCity(""); setListingType("rent"); setMinBudget("any"); setMaxBudget("any");
    setBedrooms("any"); setBathrooms("any"); setCheckIn(undefined); setCheckOut(undefined); setGuests("any");
  };

  const handleSaveSearch = async (data: any) => {
    try {
      await apiClient.createSavedSearch(data);
      toast.success(t.quickSearchExtras.searchSaved, { description: t.quickSearchExtras.searchSavedDesc });
      setShowSaveModal(false);
    } catch (error: any) {
      toast.error(t.quickSearchExtras.failedToSaveSearch, { description: error?.response?.data?.message || "Please try again later." });
      throw error;
    }
  };

  const handleSaveButtonClick = () => {
    if (!isAuthenticated) { toast.error(t.messages.loginRequired, { description: t.messages.loginRequiredDesc || "Please login to save your searches." }); return; }
    if (!hasSearched) { toast.error(t.quickSearchExtras.noSearchToSave, { description: t.quickSearchExtras.noSearchToSaveDesc }); return; }
    setShowSaveModal(true);
  };

  const addToRecentSearches = (location: string) => {
    if (!location) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== location);
      return [location, ...filtered].slice(0, 5);
    });
  };

  const removeFromRecentSearches = (location: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((s) => s !== location));
  };

  const fetchPlaceSuggestions = async (query: string) => {
  if (!query || query.length < 2) { setSuggestions([]); return; }
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!apiKey) return;
  try {
    setIsLoadingSuggestions(true);

    // Normalize the query so "yaounde" hits "Yaoundé" etc.
    const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Try both the raw query and the normalized one for best coverage
    const queries = query === normalizedQuery ? [query] : [query, normalizedQuery];
    const allFeatures: any[] = [];

    await Promise.all(
      queries.map(async (q) => {
        const response = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${apiKey}&limit=10&autocomplete=true`
        );
        const data = await response.json();
        if (data.features) allFeatures.push(...data.features);
      })
    );

    // Filter to city-level place types
    const cityTypes = ["place", "municipality", "region", "district", "locality", "neighborhood"];
    const cityFeatures = allFeatures.filter((f: any) =>
      (f.place_type || []).some((t: string) => cityTypes.includes(t))
    );

    // Deduplicate: strip roman numerals + ordinal suffixes and collapse duplicates.
    // "Yaoundé I", "Yaoundé II", "Yaoundé III" → all collapse to "Yaoundé"
    const seen = new Map<string, PlaceSuggestion>();
    for (const f of cityFeatures) {
      const rawText: string = f.text || "";
      // Strip trailing roman numerals and Arabic ordinals (e.g. "Maroua I", "Arrondissement 3")
      const baseText = rawText
        .replace(/\s+(I{1,3}|IV|VI{0,3}|IX|X{0,3}|[0-9]+)(e?r?e?me?)?\s*$/i, "")
        .replace(/\s+arrondissement\s*$/i, "")
        .trim();

      const key = normalizeDiacritics(baseText);
      if (!seen.has(key)) {
        seen.set(key, {
          // Use the cleaned base name as the display text
          text: baseText,
          // Use the full place_name from the first match for the subtitle
          place_name: f.place_name,
          place_type: f.place_type || [],
        });
      }
    }

    // Sort: exact prefix matches first, then alphabetical
    const nq = normalizeDiacritics(query);
    const results = Array.from(seen.values()).sort((a, b) => {
      const aStarts = normalizeDiacritics(a.text).startsWith(nq);
      const bStarts = normalizeDiacritics(b.text).startsWith(nq);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.text.localeCompare(b.text);
    });

    setSuggestions(results.slice(0, 6));
  } catch { /* ignore */ } finally {
    setIsLoadingSuggestions(false);
  }
};

  const handleCityChange = (value: string) => {
    setCity(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchPlaceSuggestions(value), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    const totalItems = suggestions.length + recentSearches.length;
    if (totalItems === 0) return;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setSelectedIndex((p) => p < totalItems - 1 ? p + 1 : p); break;
      case "ArrowUp": e.preventDefault(); setSelectedIndex((p) => p > 0 ? p - 1 : -1); break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < recentSearches.length) handleRecentSearchClick(recentSearches[selectedIndex]);
        else if (selectedIndex >= recentSearches.length) handleSuggestionClick(suggestions[selectedIndex - recentSearches.length]);
        else handleSearch();
        break;
      case "Escape": setShowSuggestions(false); setSelectedIndex(-1); break;
    }
  };

  const handleRecentSearchClick = (location: string) => {
    setCity(location); setShowSuggestions(false); setSuggestions([]);
    const f = getCurrentFilters(); f.city = location; setHasSearched(true); onSearch?.(f);
  };

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setCity(suggestion.text); setShowSuggestions(false); setSuggestions([]);
    addToRecentSearches(suggestion.text);
    const f = getCurrentFilters(); f.city = suggestion.text; setHasSearched(true); onSearch?.(f);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
  // Attempt to match the typed city against a known suggestion text (accent-insensitive)
  const typedNorm = normalizeDiacritics(city);
  const matched = suggestions.find((s) => normalizeDiacritics(s.text) === typedNorm);
  const resolvedCity = matched ? matched.text : city;

  if (resolvedCity) addToRecentSearches(resolvedCity);
  setHasSearched(true);
  const f = getCurrentFilters();
  f.city = resolvedCity || undefined;
  onSearch?.(f);
  setShowSuggestions(false);
};

  // Auto-search when non-city filters change
  useEffect(() => {
    const anyFilterActive = listingType !== "any" || minBudget !== "any" || maxBudget !== "any" ||
      bedrooms !== "any" || bathrooms !== "any" || checkIn || checkOut || guests !== "any";
    if (anyFilterActive) { setHasSearched(true); onSearch?.(getCurrentFilters()); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingType, minBudget, maxBudget, bedrooms, bathrooms, checkIn, checkOut, guests]);

  // Drag handlers for mobile carousel
  const handleMouseDown = (e: React.MouseEvent) => { if (!carouselRef.current) return; setIsDragging(true); setStartX(e.pageX - carouselRef.current.offsetLeft); setScrollLeft(carouselRef.current.scrollLeft); };
  const handleTouchStart = (e: React.TouchEvent) => { if (!carouselRef.current) return; setIsDragging(true); setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft); setScrollLeft(carouselRef.current.scrollLeft); };
  const handleMouseMove = (e: React.MouseEvent) => { if (!isDragging || !carouselRef.current) return; e.preventDefault(); carouselRef.current.scrollLeft = scrollLeft - (e.pageX - carouselRef.current.offsetLeft - startX) * 2; };
  const handleTouchMove = (e: React.TouchEvent) => { if (!isDragging || !carouselRef.current) return; carouselRef.current.scrollLeft = scrollLeft - (e.touches[0].pageX - carouselRef.current.offsetLeft - startX) * 2; };
  const handleDragEnd = () => setIsDragging(false);

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  // Today's date for date input min
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="w-full">
      {/* ── DESKTOP ── */}
      <div className="hidden lg:block">
        {/* Row 1: Type tabs */}
        <div className="flex justify-center items-center mb-6">
          <ListingTypeTabs value={listingType} onChange={setListingType} t={t} />
        </div>

        {/* Row 2: Premium Full-Width Search Pill */}
        <div className="flex justify-center relative z-20 w-full">
          <div className="flex items-center bg-white border border-slate-200 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.1)] hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.15)] transition-all duration-300 rounded-full pl-6 pr-2 py-2 w-full max-w-5xl mx-auto divide-x divide-slate-200">

            {/* Location */}
            <div className="flex flex-col relative flex-[1.5] pr-4 py-1.5 hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors" ref={suggestionsRef} onClick={() => cityInputRef.current?.focus()}>
              <label className="text-[10px] font-extrabold text-slate-800 tracking-wider uppercase mb-0.5 pointer-events-none">{t.quickSearchExtras.where}</label>
              <Input
                ref={cityInputRef}
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t.quickSearchExtras.searchDestinations}
                className="border-none bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto text-[15px] font-medium placeholder:text-slate-400 placeholder:font-normal truncate"
                autoComplete="off"
              />
              {/* Desktop Suggestions Dropdown */}
              {showSuggestions && (recentSearches.length > 0 || suggestions.length > 0) && (
                <div className="absolute top-[calc(100%+16px)] left-0 w-[350px] bg-white border border-slate-100 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 max-h-[400px] overflow-y-auto py-3">
                  {recentSearches.length > 0 && (
                    <div className="px-2 pb-2 mb-2 border-b border-slate-50">
                      <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {t.quickSearchExtras.recentSearches}
                      </div>
                      {recentSearches.map((s, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); handleRecentSearchClick(s); }} className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors group ${selectedIndex === i ? "bg-slate-50" : ""}`}>
                          <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-slate-400 bg-slate-100 p-1 rounded-full" /><span className="text-[15px] font-medium text-slate-700">{s}</span></div>
                          <X onClick={(e) => removeFromRecentSearches(s, e)} className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <div className="px-2">
                      <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {t.quickSearchExtras.suggested}
                      </div>
                      {suggestions.map((s, i) => {
                        const ai = i + recentSearches.length;
                        return (
                          <button key={i} onClick={(e) => { e.stopPropagation(); handleSuggestionClick(s); }} className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left group ${selectedIndex === ai ? "bg-slate-50" : ""}`}>
                            <div className="flex items-center gap-3 truncate">
                              <MapPin className="h-5 w-5 text-slate-400 bg-slate-100 p-1 rounded-full shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors" />
                              <div className="truncate">
                                <div className="text-[15px] font-medium text-slate-700 truncate">{s.text}</div>
                                <div className="text-[13px] text-slate-500 truncate">{s.place_name}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Short Term Specific inputs */}
            {isShortTerm ? (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex flex-col flex-1 px-6 py-1.5 hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors">
                      <label className="text-[10px] font-extrabold text-slate-800 tracking-wider uppercase mb-0.5 pointer-events-none">{t.quickSearchExtras.checkIn}</label>
                      <div className={`text-[15px] font-medium truncate ${checkIn ? "text-slate-800" : "text-slate-400"}`}>
                        {checkIn ? format(checkIn, "MMM d, yyyy") : t.quickSearchExtras.addDates}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)]" align="start">
                    <CalendarComponent mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex flex-col flex-1 px-6 py-1.5 hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors">
                      <label className="text-[10px] font-extrabold text-slate-800 tracking-wider uppercase mb-0.5 pointer-events-none">{t.quickSearchExtras.checkOut}</label>
                      <div className={`text-[15px] font-medium truncate ${checkOut ? "text-slate-800" : "text-slate-400"}`}>
                        {checkOut ? format(checkOut, "MMM d, yyyy") : t.quickSearchExtras.addDates}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)]" align="start">
                    <CalendarComponent mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus disabled={(date) => date < (checkIn || new Date(new Date().setHours(0, 0, 0, 0)))} />
                  </PopoverContent>
                </Popover>

                <div className="flex flex-col flex-1 pl-6 pr-4 py-1.5 hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors">
                  <label className="text-[10px] font-extrabold text-slate-800 tracking-wider uppercase mb-0.5 pointer-events-none">{t.quickSearchExtras.who}</label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto text-[15px] font-medium text-slate-600 data-[placeholder]:text-slate-400 [&>svg]:opacity-30 hover:[&>svg]:opacity-100">
                      <SelectValue placeholder={t.quickSearchExtras.addGuests} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-xl border-slate-100 min-w-[150px]">
                      <SelectItem value="any" className="font-medium rounded-xl cursor-pointer">{t.quickSearchExtras.any}</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <SelectItem key={n} value={String(n)} className="font-medium rounded-xl cursor-pointer">{n}+ {t.quickSearchExtras.guests}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              // Non Short-term inputs
              <>
                <div className="flex flex-col flex-1 px-6 py-1.5 hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors">
                  <label className="text-[10px] font-extrabold text-slate-800 tracking-wider uppercase mb-0.5 pointer-events-none">{t.quickSearchExtras.beds}</label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger className="border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto text-[15px] font-medium text-slate-600 data-[placeholder]:text-slate-400 [&>svg]:opacity-30 hover:[&>svg]:opacity-100">
                      <SelectValue placeholder={t.quickSearchExtras.addBeds} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-xl border-slate-100 min-w-[150px]">
                      <SelectItem value="any" className="font-medium rounded-xl cursor-pointer">{t.quickSearchExtras.anyBeds}</SelectItem>
                      {["1", "2", "3", "4"].map((n) => <SelectItem key={n} value={n} className="font-medium rounded-xl cursor-pointer">{n} {t.quickSearchExtras.beds}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col flex-1 pl-6 pr-4 py-1.5 hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors">
                  <label className="text-[10px] font-extrabold text-slate-800 tracking-wider uppercase mb-0.5 pointer-events-none">{t.quickSearchExtras.baths}</label>
                  <Select value={bathrooms} onValueChange={setBathrooms}>
                    <SelectTrigger className="border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto text-[15px] font-medium text-slate-600 data-[placeholder]:text-slate-400 [&>svg]:opacity-30 hover:[&>svg]:opacity-100">
                      <SelectValue placeholder={t.quickSearchExtras.addBaths} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-xl border-slate-100 min-w-[150px]">
                      <SelectItem value="any" className="font-medium rounded-xl cursor-pointer">{t.quickSearchExtras.anyBaths}</SelectItem>
                      {["1", "2", "3"].map((n) => <SelectItem key={n} value={n} className="font-medium rounded-xl cursor-pointer">{n} {t.quickSearchExtras.baths}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex flex-col flex-1 pl-6 pr-4 py-1.5 hover:bg-slate-50/80 rounded-full cursor-pointer transition-colors">
              <label className="text-[10px] font-extrabold text-slate-800 tracking-wider uppercase mb-0.5 pointer-events-none">{t.quickSearchExtras.maxPrice}</label>
              <Select value={maxBudget} onValueChange={setMaxBudget}>
                <SelectTrigger className="border-none bg-transparent shadow-none focus:ring-0 p-0 h-auto text-[15px] font-medium text-slate-600 data-[placeholder]:text-slate-400 [&>svg]:opacity-30 hover:[&>svg]:opacity-100">
                  <SelectValue placeholder={t.quickSearchExtras.addMaxPrice} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-xl border-slate-100 min-w-[160px]">
                  {priceOptions.map((o) => <SelectItem key={o.value} value={o.value} className="font-medium rounded-xl cursor-pointer">{o.value === "any" ? "No max" : o.shortLabel}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Search Button Area */}
            <div className="pl-4 border-l-0 flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" className="rounded-full w-10 h-10 p-0 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors shrink-0 tooltip-trigger" onClick={clearAllFilters} aria-label="Clear filters" title="Clear all filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button className="rounded-full h-[52px] px-6 bg-blue-600 hover:bg-blue-700 hover:shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] active:scale-95 transition-all duration-300 text-white border-0" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin transition-transform" /> : <Search className="h-5 w-5 mr-1.5 transition-transform stroke-[2.5px]" />}
                <span className="font-bold text-[16px]">{t.quickSearchExtras.search}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Small Save button */}
        {hasActiveFilters && (
          <div className="flex justify-center mt-5 opacity-80 hover:opacity-100 transition-opacity">
            <Button variant="outline" className="rounded-full gap-2 h-9 px-4 text-xs font-semibold border-slate-200 text-slate-600 hover:text-slate-900  transition-all hover:border-slate-300 bg-white" onClick={handleSaveButtonClick}>
              <Bookmark className="h-3.5 w-3.5" /> {t.quickSearchExtras.saveThisSearch}
            </Button>
          </div>
        )}
      </div>

      {/* ── MOBILE ── */}
      <div className="lg:hidden">
        {!isMobileExpanded ? (
          // ── Mobile Default Floating Pill ── 
          <div
            onClick={() => setIsMobileExpanded(true)}
            className="flex items-center gap-4 bg-white rounded-full p-3 pl-5 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)] border border-slate-200/80 cursor-pointer active:scale-[0.98] transition-all hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] max-w-[90%] mx-auto mt-2"
          >
            <Search className="h-5 w-5 text-slate-800 shrink-0" strokeWidth={2.5} />
            <div className="flex flex-col truncate">
              <span className="text-[14px] font-bold text-slate-800 leading-tight">{t.quickSearchExtras.whereTo}</span>
              <span className="text-[12px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                {city ? city : t.quickSearchExtras.anywhere} • {isShortTerm ? (checkIn ? t.quickSearchExtras.datesSelected : t.quickSearchExtras.anyWeek) : t.quickSearchExtras.anyTime} • {guests !== "any" ? `${guests} ${t.quickSearchExtras.guests}` : t.quickSearchExtras.addGuests}
              </span>
            </div>
          </div>
        ) : (
          // ── Mobile Expanded Full-Screen Drawer ── 
          <div className="fixed inset-0 top-[50px] z-[100] bg-[#f7f7f9] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-slate-50 hover:bg-slate-100 text-slate-600 focus-visible:ring-0" onClick={() => setIsMobileExpanded(false)}>
                <X className="h-5 w-5" />
              </Button>
              <div className="flex -mx-2">
                <ListingTypeTabs value={listingType} onChange={setListingType} t={t} />
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-28">
              <div className="bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-4 space-y-3 mb-6">
                {/* Location */}
                <div className="relative" ref={suggestionsRef}>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
                    {isLoadingSuggestions && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin z-10" />}
                    <Input
                      autoFocus
                      ref={cityInputRef}
                      value={city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder={t.quickSearchExtras.whereTo}
                      className="w-full pl-12 pr-4 h-14 text-[16px] font-semibold bg-slate-50 border-transparent focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:bg-white rounded-2xl transition-all shadow-none"
                      autoComplete="off"
                    />
                  </div>
                  {/* Mobile suggestions dropdown */}
                  {showSuggestions && (recentSearches.length > 0 || suggestions.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-xl z-50 max-h-[250px] overflow-y-auto py-2">
                      {recentSearches.length > 0 && (
                        <div className="px-2 pb-2 mb-2 border-b border-slate-50">
                          <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest"><Clock className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />Recent</div>
                          {recentSearches.map((s, i) => (
                            <button key={i} onClick={(e) => { e.stopPropagation(); handleRecentSearchClick(s); }} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-2xl">
                              <div className="flex items-center gap-3"><span className="text-[15px] font-semibold text-slate-700">{s}</span></div>
                              <X onClick={(e) => removeFromRecentSearches(s, e)} className="h-4 w-4 text-slate-300" />
                            </button>
                          ))}
                        </div>
                      )}
                      {suggestions.length > 0 && (
                        <div className="px-2">
                          {suggestions.map((s, i) => (
                            <button key={i} onClick={(e) => { e.stopPropagation(); handleSuggestionClick(s); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl text-left">
                              <MapPin className="h-5 w-5 text-slate-400 bg-slate-100 p-1.5 rounded-full shrink-0" />
                              <div><div className="text-[15px] font-bold text-slate-700">{s.text}</div><div className="text-[13px] text-slate-500">{s.place_name}</div></div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile Short Term / Beds, Baths */}
                {isShortTerm ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="bg-slate-50 rounded-2xl p-3 relative hover:bg-slate-100/50 transition-colors cursor-pointer text-left">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Check-in</label>
                          <div className={`text-[15px] font-bold outline-none w-full truncate ${checkIn ? "text-slate-800" : "text-slate-400"}`}>
                            {checkIn ? format(checkIn, "MMM d, yyyy") : "Add dates"}
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[calc(100vw-2rem)] mx-4 p-0 rounded-2xl border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[150]" align="center">
                        <CalendarComponent mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} className="p-3 w-full flex justify-center" />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="bg-slate-50 rounded-2xl p-3 relative hover:bg-slate-100/50 transition-colors cursor-pointer text-left">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Check-out</label>
                          <div className={`text-[15px] font-bold outline-none w-full truncate ${checkOut ? "text-slate-800" : "text-slate-400"}`}>
                            {checkOut ? format(checkOut, "MMM d, yyyy") : "Add dates"}
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[calc(100vw-2rem)] mx-4 p-0 rounded-2xl border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[150]" align="center">
                        <CalendarComponent mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus disabled={(date) => date < (checkIn || new Date(new Date().setHours(0, 0, 0, 0)))} className="p-3 w-full flex justify-center" />
                      </PopoverContent>
                    </Popover>

                    <div className="bg-slate-50 rounded-2xl p-3 col-span-2 hover:bg-slate-100/50 transition-colors">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">{t.quickSearchExtras.guests}</label>
                      <select value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full bg-transparent text-[15px] font-bold text-slate-800 focus:outline-none appearance-none">
                        <option value="any">{t.quickSearchExtras.anyNumberOfGuests}</option>
                        {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={String(n)}>{n}+ {t.quickSearchExtras.guests}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3 hover:bg-slate-100/50 transition-colors">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">{t.quickSearchExtras.beds}</label>
                      <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full bg-transparent text-[15px] font-bold text-slate-800 focus:outline-none appearance-none">
                        <option value="any">{t.quickSearchExtras.anyBeds}</option>
                        {["1", "2", "3", "4"].map((n) => <option key={n} value={n}>{n}+ {t.quickSearchExtras.beds}</option>)}
                      </select>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 hover:bg-slate-100/50 transition-colors">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">{t.quickSearchExtras.baths}</label>
                      <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="w-full bg-transparent text-[15px] font-bold text-slate-800 focus:outline-none appearance-none">
                        <option value="any">{t.quickSearchExtras.anyBaths}</option>
                        {["1", "2", "3"].map((n) => <option key={n} value={n}>{n}+ {t.quickSearchExtras.baths}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Mobile Pricing */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-3 hover:bg-slate-100/50 transition-colors">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">{t.quickSearchExtras.maxPrice}</label>
                    <select value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} className="w-full bg-transparent text-[15px] font-bold text-slate-800 focus:outline-none appearance-none">
                      {priceOptions.map((o) => <option key={o.value} value={o.value}>{o.value === "any" ? t.quickSearchExtras.noMaxLimit : o.shortLabel}</option>)}
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-8 flex justify-center">
                    <Button variant="outline" className="rounded-full gap-2 h-10 px-5 text-sm font-semibold border-slate-200 text-slate-600 hover:text-slate-900 transition-all bg-white w-full max-w-[200px]" onClick={handleSaveButtonClick}>
                      <Bookmark className="h-4 w-4" /> {t.quickSearchExtras.saveThisSearch}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-8 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
              <button
                onClick={(e) => { e.preventDefault(); clearAllFilters(); }}
                className="text-[15px] font-bold text-slate-800 underline underline-offset-4 decoration-2 decoration-slate-300 hover:decoration-slate-800 transition-colors ml-2"
              >
                {t.propertiesPage.clear}
              </button>
              <Button
                className="h-[52px] rounded-full px-10 bg-blue-600 hover:bg-blue-700 text-white border-0 flex items-center gap-2 active:scale-95 transition-all text-[16px]"
                onClick={() => { setIsMobileExpanded(false); handleSearch(); }}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5 stroke-[2.5px]" />}
                <span className="font-bold">{t.quickSearchExtras.search}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <SaveSearchModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={handleSaveSearch} currentFilters={getCurrentFilters()} />


    </div>
  );
};

export default QuickSearch;