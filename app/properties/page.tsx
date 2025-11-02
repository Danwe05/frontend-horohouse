"use client";

import { ChevronDown, Grid, List, SlidersHorizontal, Eye, EyeOff, ChevronUp, MapPin, Map, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import apiClient from "@/lib/api";
import { toast } from "sonner";
import Footer from "@/components/footer";

const IndexContent = () => {
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Mobile view state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [mobileMapFullScreen, setMobileMapFullScreen] = useState(false);
  const [mapHeight, setMapHeight] = useState(40); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize filters from URL params
  const getInitialFilters = (): QuickSearchFilters => {
    const urlCity = searchParams.get('city');
    const urlListingType = searchParams.get('listingType');
    const urlMaxPrice = searchParams.get('maxPrice');
    const urlBedrooms = searchParams.get('bedrooms');
    const urlBathrooms = searchParams.get('bathrooms');

    const initialFilters: QuickSearchFilters = {};
    
    if (urlCity) initialFilters.city = urlCity;
    if (urlListingType) initialFilters.listingType = urlListingType;
    if (urlMaxPrice) initialFilters.maxPrice = parseInt(urlMaxPrice, 10);
    if (urlBedrooms) initialFilters.bedrooms = parseInt(urlBedrooms, 10);
    if (urlBathrooms) initialFilters.bathrooms = parseInt(urlBathrooms, 10);

    return initialFilters;
  };

  const getInitialAdvancedFilters = (): AdvancedFilters => {
    const urlPropertyType = searchParams.get('propertyType');
    return urlPropertyType ? { propertyTypes: [urlPropertyType] } : {};
  };

  const [filters, setFilters] = useState<QuickSearchFilters>(getInitialFilters());
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(getInitialAdvancedFilters());
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Swipe gesture handlers for mobile
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
    
    // Snap to positions
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

  // Show toast for initial URL params only once
  useEffect(() => {
    if (!isInitialized && Object.keys(filters).length > 0) {
      const activeFilters = [];
      if (filters.city) activeFilters.push(`City: ${filters.city}`);
      if (filters.listingType) activeFilters.push(`Type: ${filters.listingType === 'sale' ? 'Buy' : 'Rent'}`);
      if (filters.maxPrice) activeFilters.push(`Budget: Up to ${filters.maxPrice.toLocaleString()} XAF`);
      if (filters.bedrooms) activeFilters.push(`${filters.bedrooms}+ beds`);
      if (filters.bathrooms) activeFilters.push(`${filters.bathrooms}+ baths`);
      
      if (activeFilters.length > 0) {
        toast.info("Searching properties", {
          description: activeFilters.join(", "),
        });
      }
      setIsInitialized(true);
    }
  }, [filters, isInitialized]);

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
          minPrice: advancedFilters.minPrice || undefined,
          bedrooms: advancedFilters.minBedrooms || filters.bedrooms || undefined,
          bathrooms: advancedFilters.minBathrooms || filters.bathrooms || undefined,
          propertyType: advancedFilters.propertyTypes?.[0] || undefined,
          sortBy,
          sortOrder,
        };
        // Add amenities filter for pool
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
    
    const activeFilters = [];
    if (qs.city) activeFilters.push(`City: ${qs.city}`);
    if (qs.listingType) activeFilters.push(`Type: ${qs.listingType === 'sale' ? 'Buy' : 'Rent'}`);
    if (qs.maxPrice) activeFilters.push(`Budget: Up to ${(qs.maxPrice / 1000).toFixed(0)}k XAF`);
    if (qs.bedrooms) activeFilters.push(`${qs.bedrooms}+ beds`);
    if (qs.bathrooms) activeFilters.push(`${qs.bathrooms}+ baths`);
    
    if (activeFilters.length > 0) {
      toast.info("Search filters applied", {
        description: activeFilters.join(", "),
      });
    }
  };

  const handleAdvancedFilters = (af: AdvancedFilters) => {
    setAdvancedFilters(af);
    setPage(1);
    toast.success("Advanced filters applied", {
      description: "Your search has been updated with advanced filters.",
    });
  };

  const handleSortChange = (value: string) => {
    switch (value) {
      case 'newest':
        setSortBy('createdAt');
        setSortOrder('desc');
        break;
      case 'price-low':
        setSortBy('price');
        setSortOrder('asc');
        break;
      case 'price-high':
        setSortBy('price');
        setSortOrder('desc');
        break;
      case 'most-viewed':
        setSortBy('viewsCount');
        setSortOrder('desc');
        break;
      default:
        setSortBy('createdAt');
        setSortOrder('desc');
    }
    setPage(1);
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
        {/* Full Screen Map View */}
        {mobileMapFullScreen ? (
          <div className="fixed inset-0 z-50 bg-background mt-[70px]">
            <MapView 
              properties={properties}
              onPropertyClick={(id) => {
                console.log("Property clicked:", id);
              }}
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
            {/* Quick Search */}
            <div className="w-full px-4 py-3">
              <QuickSearch onSearch={handleQuickSearch} />
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto bg-background pb-20">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold">Properties</h1>
                    <p className="text-xs text-muted-foreground">
                      {loading ? "Loading..." : error ? "" : `${total} listings`}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </div>

                {/* Sort */}
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

                {error && (
                  <p className="text-sm text-destructive mb-4">{error}</p>
                )}

                {/* Property Grid */}
                <div className="grid gap-4 grid-cols-1">
                  {loading && (
                    <>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <PropertyCardSkeleton key={i} />
                      ))}
                    </>
                  )}
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

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
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
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Map Button at Bottom Center */}
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

        {/* Filter Sidebar */}
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
      {/* Quick Search - Full Width */}
      <div className="w-full px-6 py-4">
        <QuickSearch onSearch={handleQuickSearch} />
      </div>

      <main className="flex-1 flex h-[calc(100vh-64px-88px)]">
        {/* Map Section - Fixed on scroll */}
        {showMap && (
          <div className="w-2/5 h-full p-4 overflow-y-auto sticky top-[70px]">
            <div className="sticky top-4 h-[calc(100vh-90px-5px)] relative">
              <MapView 
                properties={properties}
                onPropertyClick={(id) => {
                  console.log("Property clicked:", id);
                }}
              />
            </div>
          </div>
        )}

        {/* Listings Section */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          <div>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Properties</h1>
              <p className="text-muted-foreground text-sm">
                {loading ? "Loading..." : error ? "" : `${total} listings found`}
              </p>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            {/* Sort, View Controls & Filter Toggle */}
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

            {/* Property Grid - 2 columns when map shown, 4 when hidden */}
            <div className={`grid gap-6 grid-cols-1 ${showMap ? 'md:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
              {loading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </>
              )}
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

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            <div>
              
            </div>
          </div>

          {/* Fixed Show/Hide Map Button at Bottom Center */}
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

      {/* Filter Sidebar - Sheet */}
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