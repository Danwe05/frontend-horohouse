"use client";

import {
  Grid, List, SlidersHorizontal, Eye, EyeOff,
  Map, Loader2, X, GitCompare, Check, Share2,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import MapView from "@/components/property/MapView";
import PropertyCard from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property/PropertyCard";
import FilterSidebar, { AdvancedFilters } from "@/components/property/FilterSidebar";
import QuickSearch, { QuickSearchFilters } from "@/components/property/QuickSearch";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

// ─── Types ────────────────────────────────────────────────────────────────────

type GridLayout = "grid" | "list";

// Max properties that can be compared at once
const MAX_COMPARE = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoTimestamp(iso?: string): string {
  return iso ?? "";
}

function scrollToTop() {
  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Comparison Bar ───────────────────────────────────────────────────────────

interface CompareBarProps {
  items: Array<{ id: string; address: string; price: string; image?: string }>;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

function CompareBar({ items, onRemove, onClear, onCompare }: CompareBarProps) {
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-2xl px-6 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          <span className="text-sm font-semibold shrink-0 text-muted-foreground">
            Compare ({items.length}/{MAX_COMPARE}):
          </span>
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 shrink-0">
              {item.image && (
                <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" />
              )}
              <span className="text-xs font-medium max-w-[120px] truncate">{item.address}</span>
              <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: MAX_COMPARE - items.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center justify-center w-24 h-10 border-2 border-dashed border-muted-foreground/30 rounded-lg shrink-0">
              <span className="text-xs text-muted-foreground/50">+ Add</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">Clear</Button>
          <Button
            size="sm"
            onClick={onCompare}
            disabled={items.length < 2}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <GitCompare className="h-4 w-4" />
            Compare {items.length < 2 ? `(need ${2 - items.length} more)` : "Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const IndexContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { formatMoney } = useCurrency();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [gridLayout, setGridLayout] = useState<GridLayout>("grid");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Comparison state ──────────────────────────────────────────────────────
  const [showCompare, setShowCompare] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  // ── Mobile state ──────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMapFullScreen, setMobileMapFullScreen] = useState(false);
  // ── Hover state (for map pin highlight) ───────────────────────────────
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── Cluster drill-down state ─────────────────────────────────────────────
  const [clusterFilterIds, setClusterFilterIds] = useState<Set<string> | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const observerTarget = useRef<HTMLDivElement>(null);
  const toastShownRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── URL helpers ───────────────────────────────────────────────────────────
  const updateURLParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const filtersFromURL = useMemo((): QuickSearchFilters => {
    const f: QuickSearchFilters = {};
    const city = searchParams.get("city");
    const listingType = searchParams.get("listingType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = searchParams.get("guests");
    if (city) f.city = city;
    if (listingType) f.listingType = listingType;
    if (minPrice) f.minPrice = parseInt(minPrice, 10);
    if (maxPrice) f.maxPrice = parseInt(maxPrice, 10);
    if (bedrooms) f.bedrooms = parseInt(bedrooms, 10);
    if (bathrooms) f.bathrooms = parseInt(bathrooms, 10);
    if (checkIn) f.checkIn = checkIn;
    if (checkOut) f.checkOut = checkOut;
    if (guests) f.guests = parseInt(guests, 10);
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const advancedFiltersFromURL = useMemo((): AdvancedFilters => {
    const f: AdvancedFilters = {};
    const propertyType = searchParams.get("propertyType");
    const minBedrooms = searchParams.get("minBedrooms");
    const minBathrooms = searchParams.get("minBathrooms");
    const minGuests = searchParams.get("minGuests");
    const hasPool = searchParams.get("hasPool");
    if (propertyType) f.propertyTypes = [propertyType];
    if (minBedrooms) f.minBedrooms = parseInt(minBedrooms, 10);
    if (minBathrooms) f.minBathrooms = parseInt(minBathrooms, 10);
    if (minGuests) f.minGuests = parseInt(minGuests, 10);
    if (hasPool) f.hasPool = hasPool === "true";
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const [filters, setFilters] = useState<QuickSearchFilters>(filtersFromURL);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(advancedFiltersFromURL);
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );
  // Incremented on every explicit search — MapView watches this to auto-zoom
  const [searchVersion, setSearchVersion] = useState(0);

  // ── Derive current sort dropdown value from sortBy/sortOrder state ──────────
  const sortValue = useMemo(() => {
    if (sortBy === "price" && sortOrder === "asc") return "price-low";
    if (sortBy === "price" && sortOrder === "desc") return "price-high";
    if (sortBy === "viewsCount") return "most-viewed";
    return "newest";
  }, [sortBy, sortOrder]);

  // ── Active filter count ───────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.city) n++;
    if (filters.listingType) n++;
    if (filters.minPrice) n++;
    if (filters.maxPrice) n++;
    if (filters.bedrooms) n++;
    if (filters.bathrooms) n++;
    if (filters.checkIn) n++;
    if (filters.checkOut) n++;
    if (filters.guests) n++;
    if (advancedFilters.propertyTypes?.length) n++;
    if (advancedFilters.minBedrooms) n++;
    if (advancedFilters.minBathrooms) n++;
    if (advancedFilters.minGuests) n++;
    if (advancedFilters.hasPool !== undefined) n++;
    return n;
  }, [filters, advancedFilters]);

  const filterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (filters.city) chips.push({ key: "city", label: filters.city });
    if (filters.listingType) {
      const map: Record<string, string> = { sale: "For Sale", rent: "For Rent", short_term: "Short Stay" };
      chips.push({ key: "listingType", label: map[filters.listingType] ?? filters.listingType });
    }
    if (filters.minPrice) chips.push({ key: "minPrice", label: `Min: ${(filters.minPrice / 1000).toFixed(0)}k XAF` });
    if (filters.maxPrice) chips.push({ key: "maxPrice", label: `Max: ${(filters.maxPrice / 1000).toFixed(0)}k XAF` });
    if (filters.bedrooms) chips.push({ key: "bedrooms", label: `${filters.bedrooms}+ Beds` });
    if (filters.bathrooms) chips.push({ key: "bathrooms", label: `${filters.bathrooms}+ Baths` });
    if (filters.checkIn) chips.push({ key: "checkIn", label: `From: ${filters.checkIn}` });
    if (filters.checkOut) chips.push({ key: "checkOut", label: `To: ${filters.checkOut}` });
    if (filters.guests) chips.push({ key: "guests", label: `${filters.guests}+ Guests` });
    if (advancedFilters.propertyTypes?.length) chips.push({ key: "propertyType", label: `Type: ${advancedFilters.propertyTypes[0]}` });
    if (advancedFilters.minGuests) chips.push({ key: "minGuests", label: `${advancedFilters.minGuests}+ Guests` });
    if (advancedFilters.hasPool) chips.push({ key: "hasPool", label: "Has Pool" });
    return chips;
  }, [filters, advancedFilters]);

  const removeFilter = useCallback((key: string) => {
    const nf = { ...filters };
    const na = { ...advancedFilters };
    const urlUpdates: Record<string, string | null> = {};
    switch (key) {
      case "city": delete nf.city; urlUpdates.city = null; break;
      case "listingType": delete nf.listingType; urlUpdates.listingType = null; break;
      case "minPrice": delete nf.minPrice; urlUpdates.minPrice = null; break;
      case "maxPrice": delete nf.maxPrice; urlUpdates.maxPrice = null; break;
      case "bedrooms": delete nf.bedrooms; urlUpdates.bedrooms = null; break;
      case "bathrooms": delete nf.bathrooms; urlUpdates.bathrooms = null; break;
      case "checkIn": delete nf.checkIn; urlUpdates.checkIn = null; break;
      case "checkOut": delete nf.checkOut; urlUpdates.checkOut = null; break;
      case "guests": delete nf.guests; urlUpdates.guests = null; break;
      case "propertyType": delete na.propertyTypes; urlUpdates.propertyType = null; break;
      case "minGuests": delete na.minGuests; urlUpdates.minGuests = null; break;
      case "hasPool": delete na.hasPool; urlUpdates.hasPool = null; break;
    }
    setFilters(nf);
    setAdvancedFilters(na);
    updateURLParams(urlUpdates);
    toast.success("Filter removed");
  }, [filters, advancedFilters, updateURLParams]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setAdvancedFilters({});
    router.push(pathname, { scroll: false });
    toast.success("All filters cleared");
  }, [router, pathname]);

  // ── Comparison handlers ───────────────────────────────────────────────────
  const handleCompareChange = useCallback((id: string, checked: boolean) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size >= MAX_COMPARE) {
          toast.error(`You can compare up to ${MAX_COMPARE} properties at once.`);
          return prev;
        }
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const compareItems = useMemo(() =>
    properties
      .filter((p) => compareIds.has(p._id || p.id))
      .map((p) => ({
        id: p._id || p.id,
        address: [p.address, p.city].filter(Boolean).join(", "),
        price: formatMoney(p.price),
        image: p.images?.[0]?.url,
      })),
    [properties, compareIds]
  );

  const handleCompareNow = useCallback(() => {
    const ids = Array.from(compareIds).join(",");
    router.push(`/properties/compare?ids=${ids}`);
  }, [compareIds, router]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchProperties = useCallback(async (pageNum: number, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      // If we are doing a fresh fetch (not appending), clear the map drill-down
      if (!append) setClusterFilterIds(null);

      const params: Record<string, any> = {
        page: pageNum,
        limit: 12,
        city: filters.city || undefined,
        listingType: filters.listingType || undefined,
        maxPrice: advancedFilters.maxPrice || filters.maxPrice || undefined,
        minPrice: advancedFilters.minPrice || filters.minPrice || undefined,
        bedrooms: advancedFilters.minBedrooms || filters.bedrooms || undefined,
        bathrooms: advancedFilters.minBathrooms || filters.bathrooms || undefined,
        minGuests: advancedFilters.minGuests || filters.guests || undefined,
        propertyType: advancedFilters.propertyTypes?.[0] || undefined,
        checkIn: filters.checkIn || undefined,
        checkOut: filters.checkOut || undefined,
        sortBy,
        sortOrder,
      };
      if (advancedFilters.hasPool !== undefined) {
        params.amenities = advancedFilters.hasPool ? ["hasPool"] : undefined;
      }

      const data = await apiClient.searchProperties(params);
      const newProps = Array.isArray(data?.properties) ? data.properties : [];

      setProperties((prev) => append ? [...prev, ...newProps] : newProps);
      setTotal(data?.total ?? 0);
      setHasMore(newProps.length === 12 && (data?.totalPages ?? 0) > pageNum);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load properties");
      if (!append) setProperties([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, advancedFilters, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProperties(1, false);
  }, [fetchProperties]);

  useEffect(() => {
    if (toastShownRef.current || filterChips.length === 0) return;
    toastShownRef.current = true;
  }, [filterChips]);

  // ── Infinite scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          const next = page + 1;
          setPage(next);
          fetchProperties(next, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasMore, loading, loadingMore, page, fetchProperties]);

  // ── Search handlers ───────────────────────────────────────────────────────
  const handleQuickSearch = useCallback((qs: QuickSearchFilters) => {
    setFilters(qs);
    setSearchVersion((v) => v + 1);
    updateURLParams({
      city: qs.city ?? null,
      listingType: qs.listingType ?? null,
      minPrice: qs.minPrice?.toString() ?? null,
      maxPrice: qs.maxPrice?.toString() ?? null,
      bedrooms: qs.bedrooms?.toString() ?? null,
      bathrooms: qs.bathrooms?.toString() ?? null,
      checkIn: qs.checkIn ?? null,
      checkOut: qs.checkOut ?? null,
      guests: qs.guests?.toString() ?? null,
    });
    scrollToTop();
  }, [updateURLParams]);

  const handleAdvancedFilters = useCallback((af: AdvancedFilters) => {
    setAdvancedFilters(af);
    updateURLParams({
      propertyType: af.propertyTypes?.[0] ?? null,
      minBedrooms: af.minBedrooms?.toString() ?? null,
      minBathrooms: af.minBathrooms?.toString() ?? null,
      minGuests: af.minGuests?.toString() ?? null,
      hasPool: af.hasPool !== undefined ? String(af.hasPool) : null,
    });
    scrollToTop();
  }, [updateURLParams]);

  const handleSortChange = useCallback((value: string) => {
    const sortMap: Record<string, { sortBy: string; sortOrder: "asc" | "desc" }> = {
      newest: { sortBy: "createdAt", sortOrder: "desc" },
      "price-low": { sortBy: "price", sortOrder: "asc" },
      "price-high": { sortBy: "price", sortOrder: "desc" },
      "most-viewed": { sortBy: "viewsCount", sortOrder: "desc" },
    };
    const { sortBy: sb, sortOrder: so } = sortMap[value] ?? sortMap.newest;
    setSortBy(sb);
    setSortOrder(so);
    updateURLParams({ sortBy: sb, sortOrder: so });
    scrollToTop();
  }, [updateURLParams]);

  const handlePropertyClick = useCallback((id: string) => {
    router.push(`/properties/${id}`);
  }, [router]);

  // ── Mapped UI properties ──────────────────────────────────────────────────
  const uiProperties = useMemo(() =>
    properties.map((p) => ({
      id: p._id || p.id,
      image: p.images?.[0]?.url || "/placeholder.svg",
      images: p.images?.map((img: { url: string }) => img.url).filter(Boolean),
      price: p.price,
      timeAgo: isoTimestamp(p.createdAt),
      address: [p.address, p.city, p.country].filter(Boolean).join(", "),
      beds: p.amenities?.bedrooms ?? 0,
      baths: p.amenities?.bathrooms ?? 0,
      sqft: p.area ? `${p.area} ft²` : "",
      tag: p.type ? String(p.type).toUpperCase() : undefined,
      listingType: p.listingType as "rent" | "sale" | "short_term" | undefined,
      pricingUnit: p.pricingUnit,
      maxGuests: p.shortTermAmenities?.maxGuests,
      isVerified: p.isVerified ?? false,
      isBlockchainVerified: p.isBlockchainVerified ?? false,
      rating: typeof p.averageRating === "number" && p.averageRating > 0 ? p.averageRating : undefined,
      reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : undefined,
    })),
    [properties]
  );

  // ── Cluster drill-down filtered properties ────────────────────────────────
  const displayedProperties = useMemo(() => {
    if (!clusterFilterIds) return uiProperties;
    return uiProperties.filter((p) => clusterFilterIds.has(p.id));
  }, [uiProperties, clusterFilterIds]);

  // ── Normalized properties for MapView (resolves _id → id, flattens images,
  //    and maps nested API fields to the flat Property interface MapView expects) ──
  const mapProperties = useMemo(() =>
    properties.map((p) => ({
      ...p,
      id: p._id || p.id,
      title: p.title || p.address || "",
      images: p.images?.map((img: { url: string }) => img.url).filter(Boolean) ?? [],
      image: p.images?.[0]?.url,
      // Flat fields expected by MapView's Property interface
      address: [p.address, p.city, p.country].filter(Boolean).join(", "),
      beds: p.amenities?.bedrooms,
      baths: p.amenities?.bathrooms,
      sqft: p.area ? `${p.area} ft²` : undefined,
    })),
    [properties]
  );

  // ── Filter chips JSX ──────────────────────────────────────────────────────
  // const FilterChips = filterChips.length > 0 ? (
  //   <div className="flex flex-wrap gap-2 items-center">
  //     {filterChips.map((chip) => (
  //       <Badge key={chip.key} variant="secondary" className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-2">
  //         <span>{chip.label}</span>
  //         <button onClick={() => removeFilter(chip.key)} aria-label={`Remove ${chip.label} filter`} className="hover:bg-muted rounded-full p-0.5">
  //           <X className="h-3 w-3" />
  //         </button>
  //       </Badge>
  //     ))}
  //     <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-8">Clear all</Button>
  //   </div>
  // ) : null;

  // ── Current listing type for FilterSidebar ────────────────────────────────
  const currentListingType = (filters.listingType as "sale" | "rent" | "short_term" | undefined) ?? "any";

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background mt-[70px]">
        {mobileMapFullScreen ? (
          <div className="fixed inset-0 z-50 bg-background mt-[70px]">
            <MapView
              properties={mapProperties}
              onPropertyClick={handlePropertyClick}
              onClusterClick={(ids) => {
                setClusterFilterIds(new Set(ids));
                setMobileMapFullScreen(false);
              }}
              searchCity={filters.city}
              searchVersion={searchVersion}
            />
            <Button onClick={() => setMobileMapFullScreen(false)} className="fixed bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-lg z-50" size="lg">
              <List className="h-5 w-5" /> Show Listings
            </Button>
          </div>
        ) : (
          <>
            <div className="sticky top-[45px] z-30 w-full px-4 py-3">
              <QuickSearch onSearch={handleQuickSearch} initialFilters={filtersFromURL} />
            </div>
            {/* {FilterChips && <div className="px-4 pb-3">{FilterChips}</div>} */}
            <div className="flex-1 overflow-y-auto bg-background pb-24">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold">Properties</h1>
                    <p className="text-xs text-muted-foreground">{loading ? "Loading…" : `${total} listings`}</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Compare toggle */}
                    <Button
                      variant={showCompare ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setShowCompare((v) => !v); if (showCompare) setCompareIds(new Set()); }}
                      className="gap-1"
                    >
                      <GitCompare className="h-4 w-4" />
                      {compareIds.size > 0 && <Badge className="h-5 w-5 p-0 text-xs flex items-center justify-center">{compareIds.size}</Badge>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(true)} className="gap-2" aria-label="Open filters">
                      <SlidersHorizontal className="h-4 w-4" />
                      {activeFilterCount > 0 && <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFilterCount}</Badge>}
                    </Button>
                  </div>
                </div>
                {clusterFilterIds && (
                  <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">Map Cluster Active</p>
                      <p className="text-xs text-muted-foreground">Showing {displayedProperties.length} properties from the selected area.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setClusterFilterIds(null)} className="h-8">
                      Clear
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-muted-foreground">Sort:</span>
                  <Select value={sortValue} onValueChange={handleSortChange}>
                    <SelectTrigger className="h-8 text-sm flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low → High</SelectItem>
                      <SelectItem value="price-high">Price: High → Low</SelectItem>
                      <SelectItem value="most-viewed">Most Viewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-destructive mb-4">{error}</p>}
                <div className="grid gap-4 grid-cols-1">
                  {loading && properties.length === 0 && Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
                  {!loading && properties.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No properties found.</p>
                      <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                    </div>
                  )}
                  {displayedProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      {...property}
                      showCompare={showCompare}
                      isCompared={compareIds.has(property.id)}
                      onCompareChange={handleCompareChange}
                      onMouseEnter={() => setHoveredId(property.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    />
                  ))}
                </div>
                <div ref={observerTarget} className="h-10 flex items-center justify-center">
                  {loadingMore && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading more…</span></div>}
                  {!hasMore && properties.length > 0 && <p className="text-sm text-muted-foreground">No more properties</p>}
                </div>
              </div>
            </div>
            <Button onClick={() => setMobileMapFullScreen(true)} className="fixed bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-lg z-40" size="lg">
              <Map className="h-5 w-5" /> Show Map ({total})
            </Button>
          </>
        )}

        {/* Comparison bar — above the map FAB */}
        {compareIds.size > 0 && (
          <CompareBar items={compareItems} onRemove={(id) => handleCompareChange(id, false)} onClear={() => setCompareIds(new Set())} onCompare={handleCompareNow} />
        )}

        <FilterSidebar open={showFilters} onOpenChange={setShowFilters} onApply={handleAdvancedFilters} initialFilters={advancedFilters} listingType={currentListingType} />
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background mt-[70px]">
      <div className="w-full px-6 py-4">
        <QuickSearch onSearch={handleQuickSearch} initialFilters={filtersFromURL} />
      </div>

      {/* {FilterChips && <div className="px-6 pb-3">{FilterChips}</div>} */}

      <main className="flex-1 flex h-[calc(100vh-64px-88px)]">
        {showMap && (
          <div className="w-3/6 h-full p-4 sticky top-[70px] overflow-hidden">
            <div className="h-[calc(100vh-90px-5px)] relative">
              <MapView
                properties={mapProperties}
                onPropertyClick={handlePropertyClick}
                hoveredPropertyId={hoveredId}
                compareIds={compareIds}
                onRefresh={() => fetchProperties(1, false)}
                onClusterClick={(ids) => setClusterFilterIds(new Set(ids))}
                searchCity={filters.city}
                searchVersion={searchVersion}
              />
            </div>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-6 relative ${compareIds.size > 0 ? "pb-24" : ""}`}>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-sm">
                {loading && properties.length === 0 ? "Loading…" : error ? "" : `${total} listings found`}
              </p>
              <span className="text-muted-foreground/30 text-sm">|</span>
              <span className="text-sm text-muted-foreground">Sort by</span>
              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low → High</SelectItem>
                  <SelectItem value="price-high">Price: High → Low</SelectItem>
                  <SelectItem value="most-viewed">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters((v) => !v)} className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters ? "Hide" : "Show"} Filters
                {activeFilterCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFilterCount}</Badge>}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Compare toggle */}
              {/* <Button
                variant={showCompare ? "default" : "outline"}
                size="sm"
                onClick={() => { setShowCompare((v) => !v); if (showCompare) setCompareIds(new Set()); }}
                className="gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Compare
                {compareIds.size > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{compareIds.size}</Badge>}
              </Button> */}

              {/* Grid / List toggle */}
              <Button variant={gridLayout === "grid" ? "default" : "outline"} size="sm" onClick={() => setGridLayout("grid")} aria-label="Grid view" aria-pressed={gridLayout === "grid"}>
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant={gridLayout === "list" ? "default" : "outline"} size="sm" onClick={() => setGridLayout("list")} aria-label="List view" aria-pressed={gridLayout === "list"}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {clusterFilterIds && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Map className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Map Cluster Selected</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Showing <span className="font-semibold text-foreground">{displayedProperties.length}</span> properties from the selected map area.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setClusterFilterIds(null)} className="gap-2 bg-background hover:bg-muted">
                <X className="w-3.5 h-3.5" /> Clear Map Filter
              </Button>
            </div>
          )}

          <div className={`grid gap-6 grid-cols-1 ${gridLayout === "list" ? "md:grid-cols-1" : showMap ? "md:grid-cols-2" : "md:grid-cols-3 lg:grid-cols-4"}`}>
            {loading && displayedProperties.length === 0 && Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            {!loading && displayedProperties.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No properties found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search criteria.</p>
              </div>
            )}
            {displayedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                showCompare={showCompare}
                isCompared={compareIds.has(property.id)}
                onCompareChange={handleCompareChange}
                onMouseEnter={() => setHoveredId(property.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            ))}
          </div>

          <div ref={observerTarget} className="flex items-center justify-center py-8">
            {loadingMore && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /><span>Loading more properties…</span></div>}
            {!hasMore && properties.length > 0 && <p className="text-muted-foreground">You've reached the end of the listings</p>}
          </div>

          {/* Show/Hide map FAB */}
          <Button onClick={() => setShowMap((v) => !v)} className="fixed bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-lg z-40" size="lg">
            {showMap ? <><EyeOff className="h-5 w-5" />Hide Map</> : <><Eye className="h-5 w-5" />Show Map</>}
          </Button>
        </div>
      </main>

      {/* Comparison bar */}
      {compareIds.size > 0 && (
        <CompareBar items={compareItems} onRemove={(id) => handleCompareChange(id, false)} onClear={() => setCompareIds(new Set())} onCompare={handleCompareNow} />
      )}

      <FilterSidebar open={showFilters} onOpenChange={setShowFilters} onApply={handleAdvancedFilters} initialFilters={advancedFilters} listingType={currentListingType} />
    </div>
  );
};

export default function Index() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-96 space-y-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-muted-foreground">Loading properties…</p></div>}>
      <IndexContent />
    </Suspense>
  );
}