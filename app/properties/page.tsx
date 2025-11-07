"use client";

import { ChevronDown, Grid, List, SlidersHorizontal, Eye, EyeOff, ChevronUp, MapPin, Map, Loader2, X, Share2, Copy, Check } from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import MapView from "@/components/property/MapView";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyCardSkeleton from "@/components/property/PropertyCardSkeleton";
import FilterSidebar, { AdvancedFilters } from "@/components/property/FilterSidebar";
import QuickSearch, { QuickSearchFilters } from "@/components/property/QuickSearch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

const IndexContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Mobile view state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [mobileMapFullScreen, setMobileMapFullScreen] = useState(false);
  const [mapHeight, setMapHeight] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper to update URL params
  const updateURLParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  // Parse filters from URL
  const getFiltersFromURL = (): QuickSearchFilters => {
    const filters: QuickSearchFilters = {};
    
    const city = searchParams.get('city');
    const listingType = searchParams.get('listingType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    
    if (city) filters.city = city;
    if (listingType) filters.listingType = listingType;
    if (minPrice) filters.minPrice = parseInt(minPrice, 10);
    if (maxPrice) filters.maxPrice = parseInt(maxPrice, 10);
    if (bedrooms) filters.bedrooms = parseInt(bedrooms, 10);
    if (bathrooms) filters.bathrooms = parseInt(bathrooms, 10);
    
    return filters;
  };

  const getAdvancedFiltersFromURL = (): AdvancedFilters => {
    const filters: AdvancedFilters = {};
    
    const propertyType = searchParams.get('propertyType');
    const minBedrooms = searchParams.get('minBedrooms');
    const minBathrooms = searchParams.get('minBathrooms');
    const hasPool = searchParams.get('hasPool');
    
    if (propertyType) filters.propertyTypes = [propertyType];
    if (minBedrooms) filters.minBedrooms = parseInt(minBedrooms, 10);
    if (minBathrooms) filters.minBathrooms = parseInt(minBathrooms, 10);
    if (hasPool) filters.hasPool = hasPool === 'true';
    
    return filters;
  };

  const [filters, setFilters] = useState<QuickSearchFilters>(getFiltersFromURL());
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(getAdvancedFiltersFromURL());
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.city) count++;
    if (filters.listingType) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (advancedFilters.propertyTypes?.length) count++;
    if (advancedFilters.minBedrooms) count++;
    if (advancedFilters.minBathrooms) count++;
    if (advancedFilters.hasPool !== undefined) count++;
    return count;
  }, [filters, advancedFilters]);

  // Generate filter chips
  const filterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: any }> = [];
    
    if (filters.city) {
      chips.push({ key: 'city', label: `📍 ${filters.city}`, value: filters.city });
    }
    if (filters.listingType) {
      chips.push({ 
        key: 'listingType', 
        label: filters.listingType === 'sale' ? '🏠 For Sale' : '🏢 For Rent', 
        value: filters.listingType 
      });
    }
    if (filters.minPrice) {
      chips.push({ 
        key: 'minPrice', 
        label: `Min: ${(filters.minPrice / 1000).toFixed(0)}k XAF`, 
        value: filters.minPrice 
      });
    }
    if (filters.maxPrice) {
      chips.push({ 
        key: 'maxPrice', 
        label: `Max: ${(filters.maxPrice / 1000).toFixed(0)}k XAF`, 
        value: filters.maxPrice 
      });
    }
    if (filters.bedrooms) {
      chips.push({ key: 'bedrooms', label: `🛏️ ${filters.bedrooms}+ Beds`, value: filters.bedrooms });
    }
    if (filters.bathrooms) {
      chips.push({ key: 'bathrooms', label: `🚿 ${filters.bathrooms}+ Baths`, value: filters.bathrooms });
    }
    if (advancedFilters.propertyTypes?.length) {
      chips.push({ 
        key: 'propertyType', 
        label: `Type: ${advancedFilters.propertyTypes[0]}`, 
        value: advancedFilters.propertyTypes[0] 
      });
    }
    if (advancedFilters.hasPool) {
      chips.push({ key: 'hasPool', label: '🏊 Has Pool', value: true });
    }
    
    return chips;
  }, [filters, advancedFilters]);

  // Remove individual filter
  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    const newAdvancedFilters = { ...advancedFilters };
    const urlUpdates: Record<string, string | null> = {};
    
    switch (key) {
      case 'city':
        delete newFilters.city;
        urlUpdates.city = null;
        break;
      case 'listingType':
        delete newFilters.listingType;
        urlUpdates.listingType = null;
        break;
      case 'minPrice':
        delete newFilters.minPrice;
        urlUpdates.minPrice = null;
        break;
      case 'maxPrice':
        delete newFilters.maxPrice;
        urlUpdates.maxPrice = null;
        break;
      case 'bedrooms':
        delete newFilters.bedrooms;
        urlUpdates.bedrooms = null;
        break;
      case 'bathrooms':
        delete newFilters.bathrooms;
        urlUpdates.bathrooms = null;
        break;
      case 'propertyType':
        delete newAdvancedFilters.propertyTypes;
        urlUpdates.propertyType = null;
        break;
      case 'hasPool':
        delete newAdvancedFilters.hasPool;
        urlUpdates.hasPool = null;
        break;
    }
    
    setFilters(newFilters);
    setAdvancedFilters(newAdvancedFilters);
    updateURLParams(urlUpdates);
    setPage(1);
    
    toast.success("Filter removed");
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setAdvancedFilters({});
    router.push(pathname, { scroll: false });
    setPage(1);
    toast.success("All filters cleared");
  };

  // Share current search
  const shareSearch = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Search link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Swipe gestures for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = mapHeight;
    setIsDragging(true);
  }, [isMobile, mapHeight]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = dragStartY.current - currentY;
    const containerHeight = containerRef.current?.offsetHeight || window.innerHeight;
    const percentChange = (diff / containerHeight) * 100;
    const newHeight = Math.max(10, Math.min(90, dragStartHeight.current + percentChange));
    setMapHeight(newHeight);
  }, [isMobile, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setIsDragging(false);
    if (mapHeight < 25) {
      setMapHeight(10);
      setMobileView('list');
    } else if (mapHeight > 75) {
      setMapHeight(90);
      setMobileView('map');
    } else {
      setMapHeight(40);
      setMobileView('list');
    }
  }, [isMobile, mapHeight]);

  const toggleMobileMap = () => {
    setMobileMapFullScreen(!mobileMapFullScreen);
  };

  // Show toast for initial URL params
  useEffect(() => {
    if (!isInitialized && Object.keys(filters).length > 0) {
      const activeFilters = filterChips.map(chip => chip.label);
      if (activeFilters.length > 0) {
        toast.info("Searching properties", {
          description: activeFilters.join(", "),
        });
      }
      setIsInitialized(true);
    }
  }, [filters, isInitialized, filterChips]);

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = {
          page,
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
          params.amenities = advancedFilters.hasPool ? ['hasPool'] : undefined;
        }
        
        const data = await apiClient.searchProperties(params);
        setProperties(Array.isArray(data?.properties) ? data.properties : []);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || 1);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load properties");
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters, advancedFilters, page, sortBy, sortOrder]);

  const handleQuickSearch = (qs: QuickSearchFilters) => {
    setFilters(qs);
    setPage(1);
    
    // Update URL
    const urlUpdates: Record<string, string | null> = {
      city: qs.city || null,
      listingType: qs.listingType || null,
      minPrice: qs.minPrice?.toString() || null,
      maxPrice: qs.maxPrice?.toString() || null,
      bedrooms: qs.bedrooms?.toString() || null,
      bathrooms: qs.bathrooms?.toString() || null,
      page: '1',
    };
    updateURLParams(urlUpdates);
    
    toast.success("Search updated");
  };

  const handleAdvancedFilters = (af: AdvancedFilters) => {
    setAdvancedFilters(af);
    setPage(1);
    
    // Update URL
    const urlUpdates: Record<string, string | null> = {
      propertyType: af.propertyTypes?.[0] || null,
      minBedrooms: af.minBedrooms?.toString() || null,
      minBathrooms: af.minBathrooms?.toString() || null,
      hasPool: af.hasPool !== undefined ? af.hasPool.toString() : null,
      page: '1',
    };
    updateURLParams(urlUpdates);
    
    toast.success("Advanced filters applied");
  };

  const handleSortChange = (value: string) => {
    let newSortBy = 'createdAt';
    let newSortOrder: 'asc' | 'desc' = 'desc';
    
    switch (value) {
      case 'newest':
        newSortBy = 'createdAt';
        newSortOrder = 'desc';
        break;
      case 'price-low':
        newSortBy = 'price';
        newSortOrder = 'asc';
        break;
      case 'price-high':
        newSortBy = 'price';
        newSortOrder = 'desc';
        break;
      case 'most-viewed':
        newSortBy = 'viewsCount';
        newSortOrder = 'desc';
        break;
    }
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
    
    updateURLParams({
      sortBy: newSortBy,
      sortOrder: newSortOrder,
      page: '1',
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURLParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uiProperties = useMemo(() => {
    const formatPrice = (value?: number) => {
      if (typeof value !== "number") return "";
      try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(value);
      } catch {
        return `${value.toLocaleString()} XAF`;
      }
    };

    const timeAgoFromDate = (iso?: string) => {
      if (!iso) return "";
      const diff = Date.now() - new Date(iso).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
      const days = Math.floor(hours / 24);
      return `${days} day${days === 1 ? "" : "s"} ago`;
    };

    return properties.map((p) => ({
      id: p._id || p.id,
      image: p.images?.[0]?.url || "/placeholder.svg",
      price: formatPrice(p.price),
      timeAgo: timeAgoFromDate(p.createdAt),
      address: [p.address, p.city, p.country].filter(Boolean).join(", "),
      beds: p.amenities?.bedrooms ?? 0,
      baths: p.amenities?.bathrooms ?? 0,
      sqft: p.area ? `${p.area} ft²` : "",
      tag: p.type ? String(p.type).toUpperCase() : undefined,
    }));
  }, [properties]);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background mt-[70px]">
        {mobileMapFullScreen ? (
          <div className="fixed inset-0 z-50 bg-background mt-[70px]">
            <MapView 
              properties={properties}
              onPropertyClick={(id) => console.log("Property clicked:", id)}
            />
            <Button
              onClick={toggleMobileMap}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 gap-2 shadow-lg z-50"
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

            {/* Filter Chips - Mobile */}
            {filterChips.length > 0 && (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2 items-center">
                  {filterChips.map((chip) => (
                    <Badge 
                      key={chip.key} 
                      variant="secondary"
                      className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-2"
                    >
                      <span>{chip.label}</span>
                      <button
                        onClick={() => removeFilter(chip.key)}
                        className="hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs h-8"
                  >
                    Clear all
                  </Button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-background pb-20">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold">Properties</h1>
                    <p className="text-xs text-muted-foreground">
                      {loading ? "Loading..." : error ? "" : `${total} listings`}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareSearch}
                      className="gap-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {activeFilterCount > 0 && (
                        <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-muted-foreground">Sort:</span>
                  <Select defaultValue="newest" onValueChange={handleSortChange}>
                    <SelectTrigger className="h-8 text-sm flex-1">
                      <SelectValue />
                    </SelectTrigger>
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
                  {loading && Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
                  {!loading && uiProperties.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No properties found.</p>
                      <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                    </div>
                  )}
                  {!loading && uiProperties.map((property) => (
                    <PropertyCard key={property.id} {...property} />
                  ))}
                </div>

                {!loading && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={toggleMobileMap}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 gap-2 shadow-lg z-50"
              size="lg"
            >
              <Map className="h-5 w-5" />
              Show Map ({total})
            </Button>
          </>
        )}

        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="right" className="w-full p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <FilterSidebar onApply={handleAdvancedFilters} onClose={() => setShowFilters(false)} />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen flex flex-col bg-background mt-[70px]">
      <div className="w-full px-6 py-4">
        <QuickSearch onSearch={handleQuickSearch} />
      </div>

      {/* Filter Chips - Desktop */}
      {filterChips.length > 0 && (
        <div className="w-full px-6 pb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
            {filterChips.map((chip) => (
              <Badge 
                key={chip.key} 
                variant="secondary"
                className="pl-3 pr-2 py-1.5 text-sm flex items-center gap-2"
              >
                <span>{chip.label}</span>
                <button
                  onClick={() => removeFilter(chip.key)}
                  className="hover:bg-muted rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-sm h-8"
            >
              Clear all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={shareSearch}
              className="text-sm h-8 gap-2 ml-auto"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share Search
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 flex h-[calc(100vh-64px-88px)]">
        {showMap && (
          <div className="w-2/5 h-full p-4 overflow-y-auto sticky top-[70px]">
            <div className="sticky top-4 h-[calc(100vh-90px-5px)] relative">
              <MapView 
                properties={properties}
                onPropertyClick={(id) => console.log("Property clicked:", id)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 relative">
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Properties</h1>
              <p className="text-muted-foreground text-sm">
                {loading ? "Loading..." : error ? "" : `${total} listings found`}
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Sort by</span>
                <Select defaultValue="newest" onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
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
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 ml-2"
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
                <Button variant="outline" size="sm">
                  <Grid className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className={`grid gap-6 grid-cols-1 ${showMap ? 'md:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
              {loading && Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
              {!loading && uiProperties.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No properties found matching your criteria.</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search criteria.</p>
                </div>
              )}
              {!loading && uiProperties.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowMap(!showMap)}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 gap-2 shadow-lg z-50"
            size="lg"
          >
            {showMap ? (
              <>
                <EyeOff className="h-5 w-5" />
                Hide Map
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                Show Map
              </>
            )}
          </Button>
        </div>
      </main>

      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="right" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <FilterSidebar onApply={handleAdvancedFilters} onClose={() => setShowFilters(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default function Index() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      }
    >
      <IndexContent />
    </Suspense>
  );
}