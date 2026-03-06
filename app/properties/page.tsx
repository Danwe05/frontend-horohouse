"use client";

import {
  Grid, List, SlidersHorizontal, Eye, EyeOff,
  Map, Loader2, X, Share2, Check,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/api";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type GridLayout = "grid" | "list";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value?: number): string {
  if (typeof value !== "number") return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "XAF",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} XAF`;
  }
}

// Returns the raw ISO string so PropertyCard's formatTimeAgo util handles display
function isoTimestamp(iso?: string): string {
  return iso ?? "";
}

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const IndexContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── UI state ────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [gridLayout, setGridLayout] = useState<GridLayout>("grid");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Mobile state ─────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMapFullScreen, setMobileMapFullScreen] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const observerTarget = useRef<HTMLDivElement>(null);
  // Track whether the initial-URL-filter toast has been shown — avoids useState + isInitialized pattern
  const toastShownRef = useRef(false);
  // Cleanup ref for the "copied" timeout
  const copiedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Detect mobile ─────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── URL helpers ────────────────────────────────────────────────────────────
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

  // Derive filter objects from URL — memoised so they're stable across renders
  const filtersFromURL = useMemo((): QuickSearchFilters => {
    const f: QuickSearchFilters = {};
    const city = searchParams.get("city");
    const listingType = searchParams.get("listingType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");
    if (city) f.city = city;
    if (listingType) f.listingType = listingType;
    if (minPrice) f.minPrice = parseInt(minPrice, 10);
    if (maxPrice) f.maxPrice = parseInt(maxPrice, 10);
    if (bedrooms) f.bedrooms = parseInt(bedrooms, 10);
    if (bathrooms) f.bathrooms = parseInt(bathrooms, 10);
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const advancedFiltersFromURL = useMemo((): AdvancedFilters => {
    const f: AdvancedFilters = {};
    const propertyType = searchParams.get("propertyType");
    const minBedrooms = searchParams.get("minBedrooms");
    const minBathrooms = searchParams.get("minBathrooms");
    const hasPool = searchParams.get("hasPool");
    if (propertyType) f.propertyTypes = [propertyType];
    if (minBedrooms) f.minBedrooms = parseInt(minBedrooms, 10);
    if (minBathrooms) f.minBathrooms = parseInt(minBathrooms, 10);
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

  // ── Filter chips ───────────────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.city) n++;
    if (filters.listingType) n++;
    if (filters.minPrice) n++;
    if (filters.maxPrice) n++;
    if (filters.bedrooms) n++;
    if (filters.bathrooms) n++;
    if (advancedFilters.propertyTypes?.length) n++;
    if (advancedFilters.minBedrooms) n++;
    if (advancedFilters.minBathrooms) n++;
    if (advancedFilters.hasPool !== undefined) n++;
    return n;
  }, [filters, advancedFilters]);

  const filterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (filters.city) chips.push({ key: "city", label: filters.city });
    if (filters.listingType) chips.push({ key: "listingType", label: filters.listingType === "sale" ? "For Sale" : "For Rent" });
    if (filters.minPrice) chips.push({ key: "minPrice", label: `Min: ${(filters.minPrice / 1000).toFixed(0)}k XAF` });
    if (filters.maxPrice) chips.push({ key: "maxPrice", label: `Max: ${(filters.maxPrice / 1000).toFixed(0)}k XAF` });
    if (filters.bedrooms) chips.push({ key: "bedrooms", label: `${filters.bedrooms}+ Beds` });
    if (filters.bathrooms) chips.push({ key: "bathrooms", label: `${filters.bathrooms}+ Baths` });
    if (advancedFilters.propertyTypes?.length) chips.push({ key: "propertyType", label: `Type: ${advancedFilters.propertyTypes[0]}` });
    if (advancedFilters.hasPool) chips.push({ key: "hasPool", label: "Has Pool" });
    return chips;
  }, [filters, advancedFilters]);

  const removeFilter = useCallback((key: string) => {
    const newFilters = { ...filters };
    const newAdvanced = { ...advancedFilters };
    const urlUpdates: Record<string, string | null> = {};

    switch (key) {
      case "city": delete newFilters.city; urlUpdates.city = null; break;
      case "listingType": delete newFilters.listingType; urlUpdates.listingType = null; break;
      case "minPrice": delete newFilters.minPrice; urlUpdates.minPrice = null; break;
      case "maxPrice": delete newFilters.maxPrice; urlUpdates.maxPrice = null; break;
      case "bedrooms": delete newFilters.bedrooms; urlUpdates.bedrooms = null; break;
      case "bathrooms": delete newFilters.bathrooms; urlUpdates.bathrooms = null; break;
      case "propertyType": delete newAdvanced.propertyTypes; urlUpdates.propertyType = null; break;
      case "hasPool": delete newAdvanced.hasPool; urlUpdates.hasPool = null; break;
    }

    setFilters(newFilters);
    setAdvancedFilters(newAdvanced);
    updateURLParams(urlUpdates);
    toast.success("Filter removed");
  }, [filters, advancedFilters, updateURLParams]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setAdvancedFilters({});
    router.push(pathname, { scroll: false });
    toast.success("All filters cleared");
  }, [router, pathname]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const shareSearch = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Search link copied to clipboard!");
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  // Cleanup copied timer on unmount
  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProperties = useCallback(async (pageNum: number, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: pageNum,
        limit: 12,
        city: filters.city || undefined,
        listingType: filters.listingType || undefined,
        maxPrice: advancedFilters.maxPrice || filters.maxPrice || undefined,
        minPrice: advancedFilters.minPrice || filters.minPrice || undefined,
        bedrooms: advancedFilters.minBedrooms || filters.bedrooms || undefined,
        bathrooms: advancedFilters.minBathrooms || filters.bathrooms || undefined,
        propertyType: advancedFilters.propertyTypes?.[0] || undefined,
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

  // Reset + fetch when filters/sort change — depend only on fetchProperties
  // (fetchProperties already captures all the filter deps)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProperties(1, false);
  }, [fetchProperties]);

  // Show one-time toast for pre-filled URL filters
  useEffect(() => {
    if (toastShownRef.current || filterChips.length === 0) return;
    toast.info("Searching properties", { description: filterChips.map((c) => c.label).join(", ") });
    toastShownRef.current = true;
  }, [filterChips]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleQuickSearch = useCallback((qs: QuickSearchFilters) => {
    setFilters(qs);
    updateURLParams({
      city: qs.city ?? null,
      listingType: qs.listingType ?? null,
      minPrice: qs.minPrice?.toString() ?? null,
      maxPrice: qs.maxPrice?.toString() ?? null,
      bedrooms: qs.bedrooms?.toString() ?? null,
      bathrooms: qs.bathrooms?.toString() ?? null,
    });
    toast.success("Search updated");
    scrollToTop();
  }, [updateURLParams]);

  const handleAdvancedFilters = useCallback((af: AdvancedFilters) => {
    setAdvancedFilters(af);
    updateURLParams({
      propertyType: af.propertyTypes?.[0] ?? null,
      minBedrooms: af.minBedrooms?.toString() ?? null,
      minBathrooms: af.minBathrooms?.toString() ?? null,
      hasPool: af.hasPool !== undefined ? String(af.hasPool) : null,
    });
    toast.success("Advanced filters applied");
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

  // ── Mapped UI properties ───────────────────────────────────────────────────
  const uiProperties = useMemo(() =>
    properties.map((p) => ({
      id: p._id || p.id,
      image: p.images?.[0]?.url || "/placeholder.svg",
      images: p.images?.map((img: { url: string }) => img.url).filter(Boolean),
      price: formatPrice(p.price),
      timeAgo: isoTimestamp(p.createdAt),
      address: [p.address, p.city, p.country].filter(Boolean).join(", "),
      beds: p.amenities?.bedrooms ?? 0,
      baths: p.amenities?.bathrooms ?? 0,
      sqft: p.area ? `${p.area} ft²` : "",
      tag: p.type ? String(p.type).toUpperCase() : undefined,
      listingType: p.listingType as "rent" | "sale" | undefined,
      // Forward verification flags to PropertyCard
      isVerified: p.isVerified ?? false,
      isBlockchainVerified: p.isBlockchainVerified ?? false,
    })),
    [properties]
  );

  // ── Shared filter chips JSX ────────────────────────────────────────────────
  const FilterChips = filterChips.length > 0 ? (
    <div className="flex flex-wrap gap-2 items-center">
      {filterChips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-2">
          <span>{chip.label}</span>
          <button
            onClick={() => removeFilter(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            className="hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-8">
        Clear all
      </Button>
    </div>
  ) : null;

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background mt-[70px]">
        {mobileMapFullScreen ? (
          <div className="fixed inset-0 z-50 bg-background mt-[70px]">
            <MapView properties={properties} onPropertyClick={handlePropertyClick} />
            <Button
              onClick={() => setMobileMapFullScreen(false)}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-lg z-50"
              size="lg"
            >
              <List className="h-5 w-5" />
              Show Listings
            </Button>
          </div>
        ) : (
          <>
            <div className="w-full px-4 py-3">
              <QuickSearch onSearch={handleQuickSearch} />
            </div>

            {FilterChips && <div className="px-4 pb-3">{FilterChips}</div>}

            <div className="flex-1 overflow-y-auto bg-background pb-20">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold">Properties</h1>
                    <p className="text-xs text-muted-foreground">
                      {loading ? "Loading…" : error ? "" : `${total} listings`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(true)}
                      className="gap-2"
                      aria-label="Open filters"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {activeFilterCount > 0 && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-muted-foreground">Sort:</span>
                  <Select defaultValue="newest" onValueChange={handleSortChange}>
                    <SelectTrigger className="h-8 text-sm flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="most-viewed">Most Viewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && <p className="text-sm text-destructive mb-4">{error}</p>}

                <div className="grid gap-4 grid-cols-1">
                  {loading && properties.length === 0 &&
                    Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
                  {!loading && properties.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No properties found.</p>
                      <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                    </div>
                  )}
                  {uiProperties.map((property) => (
                    <PropertyCard key={property.id} {...property} />
                  ))}
                </div>

                <div ref={observerTarget} className="h-10 flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading more…</span>
                    </div>
                  )}
                  {!hasMore && properties.length > 0 && (
                    <p className="text-sm text-muted-foreground">No more properties to load</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setMobileMapFullScreen(true)}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-lg z-50"
              size="lg"
            >
              <Map className="h-5 w-5" />
              Show Map ({total})
            </Button>
          </>
        )}

        <FilterSidebar
          open={showFilters}
          onOpenChange={setShowFilters}
          onApply={handleAdvancedFilters}
          initialFilters={advancedFilters}
        />
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background mt-[70px]">
      <div className="w-full px-6 py-4">
        <QuickSearch onSearch={handleQuickSearch} />
      </div>

      {FilterChips && <div className="px-6 pb-3">{FilterChips}</div>}

      <main className="flex-1 flex h-[calc(100vh-64px-88px)]">
        {showMap && (
          <div className="w-3/6 h-full p-4 sticky top-[70px] overflow-hidden">
            <div className="h-[calc(100vh-90px-5px)] relative">
              <MapView properties={properties} onPropertyClick={handlePropertyClick} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-sm">
                {loading && properties.length === 0
                  ? "Loading…"
                  : error
                  ? ""
                  : `${total} listings found`}
              </p>

              <span className="text-muted-foreground/30 text-sm">|</span>

              <span className="text-sm text-muted-foreground">Sort by</span>
              <Select defaultValue="newest" onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="most-viewed">Most Viewed</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters((v) => !v)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters ? "Hide" : "Show"} Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">

              {/* Grid / List toggle */}
              <Button
                variant={gridLayout === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setGridLayout("grid")}
                aria-label="Grid view"
                aria-pressed={gridLayout === "grid"}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={gridLayout === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setGridLayout("list")}
                aria-label="List view"
                aria-pressed={gridLayout === "list"}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <div
            className={`grid gap-6 grid-cols-1 ${
              gridLayout === "list"
                ? "md:grid-cols-1"
                : showMap
                ? "md:grid-cols-2"
                : "md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {loading && properties.length === 0 &&
              Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            {!loading && properties.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No properties found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search criteria.</p>
              </div>
            )}
            {uiProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>

          <div ref={observerTarget} className="flex items-center justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading more properties…</span>
              </div>
            )}
            {!hasMore && properties.length > 0 && (
              <p className="text-muted-foreground">You've reached the end of the listings</p>
            )}
          </div>

          {/* Show/Hide map FAB */}
          <Button
            onClick={() => setShowMap((v) => !v)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-lg z-50"
            size="lg"
          >
            {showMap ? (
              <><EyeOff className="h-5 w-5" /> Hide Map</>
            ) : (
              <><Eye className="h-5 w-5" /> Show Map</>
            )}
          </Button>
        </div>
      </main>

      <FilterSidebar
        open={showFilters}
        onOpenChange={setShowFilters}
        onApply={handleAdvancedFilters}
        initialFilters={advancedFilters}
      />
    </div>
  );
};

// ─── Page export ──────────────────────────────────────────────────────────────

export default function Index() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading properties…</p>
        </div>
      }
    >
      <IndexContent />
    </Suspense>
  );
}