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
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type GridLayout = "grid" | "list";
const MAX_COMPARE = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoTimestamp(iso?: string): string { return iso ?? ""; }
function scrollToTop() {
  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Compare Bar ──────────────────────────────────────────────────────────────

interface CompareBarProps {
  items: Array<{ id: string; address: string; price: string; image?: string }>;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

function CompareBar({ items, onRemove, onClear, onCompare }: CompareBarProps) {
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#DDDDDD] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-6 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          <span className="text-[13px] font-semibold shrink-0 text-[#717171]">
            Compare ({items.length}/{MAX_COMPARE}):
          </span>
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl px-3 py-1.5 shrink-0">
              {item.image && (
                <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
              )}
              <span className="text-[12px] font-medium max-w-[120px] truncate text-[#222222]">{item.address}</span>
              <button
                onClick={() => onRemove(item.id)}
                className="text-[#717171] hover:text-[#222222] transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {Array.from({ length: MAX_COMPARE - items.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center w-24 h-10 border border-dashed border-[#DDDDDD] rounded-xl shrink-0"
            >
              <span className="text-[11px] text-[#AAAAAA]">+ Add</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClear}
            className="text-[13px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#717171] transition-colors px-2"
          >
            Clear
          </button>
          <button
            onClick={onCompare}
            disabled={items.length < 2}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-[#1A56DB] rounded-xl hover:bg-[#1648C5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <GitCompare className="h-4 w-4" />
            Compare {items.length < 2 ? `(need ${2 - items.length} more)` : "Now"}
          </button>
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
  const { t } = useLanguage();

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

  // ── Mobile / hover / cluster state ───────────────────────────────────────
  // Use false as default (SSR-safe). The effect corrects it on mount.
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMapFullScreen, setMobileMapFullScreen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clusterFilterIds, setClusterFilterIds] = useState<Set<string> | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const observerTarget = useRef<HTMLDivElement>(null);
  const toastShownRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    setIsMounted(true);
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
  const [searchVersion, setSearchVersion] = useState(0);

  const sortValue = useMemo(() => {
    if (sortBy === "price" && sortOrder === "asc") return "price-low";
    if (sortBy === "price" && sortOrder === "desc") return "price-high";
    if (sortBy === "viewsCount") return "most-viewed";
    return "newest";
  }, [sortBy, sortOrder]);

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
      const map: Record<string, string> = { sale: t.propertyCardExtras?.forSale || "For Sale", rent: t.propertyCardExtras?.forRent || "For Rent", short_term: t.propertyCardExtras?.shortStay || "Short Stay" };
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
    toast.success(t.propertiesPage?.filterRemoved || "Filter removed");
  }, [filters, advancedFilters, updateURLParams]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setAdvancedFilters({});
    router.push(pathname, { scroll: false });
    toast.success(t.propertiesPage?.allFiltersCleared || "All filters cleared");
  }, [router, pathname]);

  // ── Comparison handlers ───────────────────────────────────────────────────
  const handleCompareChange = useCallback((id: string, checked: boolean) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size >= MAX_COMPARE) {
          toast.error((t.propertiesPage?.compareUpTo || "You can compare up to {max} properties at once.").replace("{max}", String(MAX_COMPARE)));
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
      if (!append) setClusterFilterIds(null);

      const params: Record<string, any> = {
        page: pageNum, limit: 12,
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
        sortBy, sortOrder,
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
      city: qs.city ?? null, listingType: qs.listingType ?? null,
      minPrice: qs.minPrice?.toString() ?? null, maxPrice: qs.maxPrice?.toString() ?? null,
      bedrooms: qs.bedrooms?.toString() ?? null, bathrooms: qs.bathrooms?.toString() ?? null,
      checkIn: qs.checkIn ?? null, checkOut: qs.checkOut ?? null,
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
      title: p.title || "",
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

  const displayedProperties = useMemo(() => {
    if (!clusterFilterIds) return uiProperties;
    return uiProperties.filter((p) => clusterFilterIds.has(p.id));
  }, [uiProperties, clusterFilterIds]);

  const mapProperties = useMemo(() =>
    properties.map((p) => ({
      ...p,
      id: p._id || p.id,
      title: p.title || p.address || "",
      images: p.images?.map((img: { url: string }) => img.url).filter(Boolean) ?? [],
      image: p.images?.[0]?.url,
      address: [p.address, p.city, p.country].filter(Boolean).join(", "),
      beds: p.amenities?.bedrooms,
      baths: p.amenities?.bathrooms,
      sqft: p.area ? `${p.area} ft²` : undefined,
    })),
    [properties]
  );

  const currentListingType = (filters.listingType as "sale" | "rent" | "short_term" | undefined) ?? "any";

  if (!isMounted) return null;

  // ─────────────────────────────── MOBILE ──────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-white mt-[70px]">
        {mobileMapFullScreen ? (
          <div className="fixed inset-0 z-50 bg-white mt-[70px]">
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
            <button
              onClick={() => setMobileMapFullScreen(false)}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white bg-blue-600 rounded-xl shadow-lg z-50 hover:bg-[#444444] transition-colors"
            >
              <List className="h-5 w-5" /> Show Listings
            </button>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="sticky top-[65px] z-30 w-full px-4 py-3 bg-white border-b border-[#EBEBEB]">
              <QuickSearch onSearch={handleQuickSearch} initialFilters={filtersFromURL} />
            </div>

            <div className="flex-1 overflow-y-auto bg-white pb-24">
              <div className="p-4">
                {/* Title + controls */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-[20px] font-bold text-[#222222]">
                      {t.propertiesPage?.title || "Properties"}
                    </h1>
                    <p className="text-[13px] text-[#717171]">
                      {loading
                        ? (t.propertiesPage?.loading || "Loading…")
                        : `${total} ${t.propertiesPage?.listings || "listings"}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFilters(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold text-[#222222] border border-[#DDDDDD] rounded-xl hover:border-blue-600 transition-colors"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="bg-[#1A56DB] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Filter chips */}
                {filterChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {filterChips.map((chip) => (
                      <button
                        key={chip.key}
                        onClick={() => removeFilter(chip.key)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#222222] border border-blue-600 rounded-full hover:bg-[#F7F7F7] transition-colors"
                      >
                        {chip.label}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                    <button
                      onClick={clearAllFilters}
                      className="text-[12px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#717171] px-1"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Cluster banner */}
                {clusterFilterIds && (
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1A56DB]">
                        {t.propertiesPage?.mapClusterActive || "Map Cluster Active"}
                      </p>
                      <p className="text-[12px] text-[#717171]">
                        {displayedProperties.length} properties from this area
                      </p>
                    </div>
                    <button
                      onClick={() => setClusterFilterIds(null)}
                      className="text-[12px] font-semibold text-[#1A56DB] underline underline-offset-2"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Sort */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[12px] text-[#717171] font-medium">Sort:</span>
                  <Select value={sortValue} onValueChange={handleSortChange}>
                    <SelectTrigger className="h-9 text-[13px] flex-1 border-[#DDDDDD] rounded-xl text-[#222222]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#DDDDDD]">
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low → High</SelectItem>
                      <SelectItem value="price-high">Price: High → Low</SelectItem>
                      <SelectItem value="most-viewed">Most Viewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <p className="text-[13px] text-red-600 mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Cards */}
                <div className="grid gap-5 grid-cols-1">
                  {loading && properties.length === 0 &&
                    Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
                  {!loading && properties.length === 0 && (
                    <div className="text-center py-16 border border-dashed border-[#DDDDDD] rounded-2xl">
                      <p className="text-[15px] font-semibold text-[#222222] mb-1">
                        {t.propertiesPage?.noPropertiesFound || "No properties found"}
                      </p>
                      <p className="text-[13px] text-[#717171]">
                        {t.propertiesPage?.tryAdjustingFilters || "Try adjusting your filters."}
                      </p>
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

                {/* Infinite scroll sentinel */}
                <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-[#717171]">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-[13px]">Loading more…</span>
                    </div>
                  )}
                  {!hasMore && properties.length > 0 && (
                    <p className="text-[13px] text-[#717171]">No more properties</p>
                  )}
                </div>
              </div>
            </div>

            {/* Show Map FAB */}
            <button
              onClick={() => setMobileMapFullScreen(true)}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white bg-blue-600 rounded-xl shadow-lg z-40 hover:bg-[#444444] transition-colors"
            >
              <Map className="h-5 w-5" />
              {t.propertiesPage?.showMap || "Show Map"} ({total})
            </button>
          </>
        )}

        {compareIds.size > 0 && (
          <CompareBar
            items={compareItems}
            onRemove={(id) => handleCompareChange(id, false)}
            onClear={() => setCompareIds(new Set())}
            onCompare={handleCompareNow}
          />
        )}

        <FilterSidebar
          open={showFilters}
          onOpenChange={setShowFilters}
          onApply={handleAdvancedFilters}
          initialFilters={advancedFilters}
          listingType={currentListingType}
        />
      </div>
    );
  }

  // ─────────────────────────────── DESKTOP ─────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-white mt-[70px]">

      {/* Search bar */}
      <div className="w-full px-6 py-4 border-b border-[#EBEBEB] bg-white">
        <QuickSearch onSearch={handleQuickSearch} initialFilters={filtersFromURL} />
      </div>

      {/* Filter chips */}
      {filterChips.length > 0 && (
        <div className="px-6 py-3 border-b border-[#EBEBEB] bg-white flex flex-wrap gap-2 items-center">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => removeFilter(chip.key)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-[#222222] border border-blue-600 rounded-full hover:bg-[#F7F7F7] transition-colors"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-[13px] font-semibold text-[#222222] underline underline-offset-2 hover:text-[#717171] px-1 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      <main className="flex-1 flex h-[calc(100vh-64px-88px)]">

        {/* Map panel */}
        {showMap && (
          <div className="w-3/6 h-full p-4 sticky top-[70px] overflow-hidden">
            <div className="h-[calc(100vh-90px-5px)] relative rounded-2xl overflow-hidden">
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

        {/* Listings panel */}
        <div className={`flex-1 overflow-y-auto px-6 py-5 relative ${compareIds.size > 0 ? "pb-24" : ""}`}>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <p className="text-[14px] text-[#717171]">
                {loading && properties.length === 0
                  ? (t.propertiesPage?.loading || "Loading…")
                  : error ? ""
                    : `${total} ${t.propertiesPage?.listings || "listings found"}`}
              </p>

              {/* Sort */}
              <div className="h-4 w-px bg-[#DDDDDD]" />
              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-9 text-[13px] border-[#DDDDDD] rounded-xl text-[#222222]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDDDDD] shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low → High</SelectItem>
                  <SelectItem value="price-high">Price: High → Low</SelectItem>
                  <SelectItem value="most-viewed">Most Viewed</SelectItem>
                </SelectContent>
              </Select>

              {/* Filters button */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-xl border transition-colors ${showFilters
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-[#222222] border-[#DDDDDD] hover:border-blue-600"
                  }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters
                  ? (t.propertiesPage?.hideFilters || "Hide Filters")
                  : (t.propertiesPage?.showFilters || "Filters")}
                {activeFilterCount > 0 && (
                  <span className="bg-[#1A56DB] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Grid / List toggle */}
            <div className="flex items-center gap-1 border border-[#DDDDDD] rounded-xl p-1">
              <button
                onClick={() => setGridLayout("grid")}
                aria-pressed={gridLayout === "grid"}
                className={`p-1.5 rounded-lg transition-colors ${gridLayout === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-[#717171] hover:text-[#222222]"
                  }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridLayout("list")}
                aria-pressed={gridLayout === "list"}
                className={`p-1.5 rounded-lg transition-colors ${gridLayout === "list"
                  ? "bg-blue-600 text-white"
                  : "text-[#717171] hover:text-[#222222]"
                  }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-red-600 mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Cluster banner */}
          {clusterFilterIds && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#DBEAFE] p-2 rounded-xl">
                  <Map className="w-4 h-4 text-[#1A56DB]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#1A56DB]">
                    {t.propertiesPage?.mapClusterSelected || "Map area selected"}
                  </p>
                  <p className="text-[12px] text-[#717171]">
                    Showing {displayedProperties.length} properties from this area
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClusterFilterIds(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-[#222222] border border-[#DDDDDD] bg-white rounded-xl hover:border-blue-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}

          {/* Property grid */}
          <div className={`grid gap-5 ${gridLayout === "list"
            ? "grid-cols-1"
            : showMap
              ? "grid-cols-2"
              : "grid-cols-3 xl:grid-cols-4"
            }`}>
            {loading && displayedProperties.length === 0 &&
              Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            {!loading && displayedProperties.length === 0 && (
              <div className="col-span-full text-center py-20 border border-dashed border-[#DDDDDD] rounded-2xl">
                <p className="text-[16px] font-semibold text-[#222222] mb-1">
                  {t.propertiesPage?.noPropertiesFoundMatching || "No properties found"}
                </p>
                <p className="text-[14px] text-[#717171]">
                  {t.propertiesPage?.tryAdjustingSearch || "Try adjusting your filters or search criteria."}
                </p>
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

          {/* Infinite scroll sentinel */}
          <div ref={observerTarget} className="flex items-center justify-center py-10">
            {loadingMore && (
              <div className="flex items-center gap-2 text-[#717171]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[14px]">Loading more properties…</span>
              </div>
            )}
            {!hasMore && properties.length > 0 && (
              <p className="text-[14px] text-[#717171]">You've reached the end of the listings</p>
            )}
          </div>

          {/* Show/Hide Map FAB */}
          <button
            onClick={() => setShowMap((v) => !v)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white bg-blue-600 rounded-xl z-40 hover:bg-blue-700 transition-colors"
          >
            {showMap
              ? <><EyeOff className="h-5 w-5" />{t.propertiesPage?.hideMap || "Hide Map"}</>
              : <><Eye className="h-5 w-5" />{t.propertiesPage?.showMap || "Show Map"}</>}
          </button>
        </div>
      </main>

      {/* Comparison bar */}
      {compareIds.size > 0 && (
        <CompareBar
          items={compareItems}
          onRemove={(id) => handleCompareChange(id, false)}
          onClear={() => setCompareIds(new Set())}
          onCompare={handleCompareNow}
        />
      )}

      <FilterSidebar
        open={showFilters}
        onOpenChange={setShowFilters}
        onApply={handleAdvancedFilters}
        initialFilters={advancedFilters}
        listingType={currentListingType}
      />
    </div>
  );
};

export default function Index() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#1A56DB]" />
        <p className="text-[14px] text-[#717171]">Loading properties…</p>
      </div>
    }>
      <IndexContent />
    </Suspense>
  );
}