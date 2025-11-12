"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trash2, Eye, Filter, X, CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyCardSkeleton from "@/components/property/PropertyCardSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { h1 } from "framer-motion/client";

interface ViewedProperty {
  _id: string;
  title: string;
  price: number;
  images: Array<{ url: string }>;
  address: string;
  city: string;
  country: string;
  type: string;
  listingType: string;
  amenities?: {
    bedrooms?: number;
    bathrooms?: number;
  };
  area?: number;
  viewedAt: string;
  isActive: boolean;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function RecentlyViewedWidget() {
  const router = useRouter();
  const [properties, setProperties] = useState<ViewedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>("viewedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Format time ago - MOVED UP BEFORE useMemo
  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  };

  // Fetch viewed properties
  const fetchViewedProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 12,
        sortBy,
        sortOrder,
      };

      const data = await apiClient.getViewedProperties(params);
      
      setProperties(data.properties || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to load viewed properties";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViewedProperties();
  }, [page, sortBy, sortOrder]);

  // Apply date range filter
  const filteredProperties = useMemo(() => {
    if (!dateRange.from || !dateRange.to) {
      return properties;
    }

    return properties.filter((property) => {
      const viewedDate = new Date(property.viewedAt);
      return isWithinInterval(viewedDate, {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!),
      });
    });
  }, [properties, dateRange]);

  // Format properties for PropertyCard - NOW formatTimeAgo is available
  const formattedProperties = useMemo(() => {
    return filteredProperties.map((p) => ({
      id: p._id,
      image: p.images?.[0]?.url || "/placeholder.svg",
      price: new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
      }).format(p.price),
      timeAgo: formatTimeAgo(p.viewedAt), // Now this works!
      address: [p.address, p.city, p.country].filter(Boolean).join(", "),
      beds: p.amenities?.bedrooms ?? 0,
      baths: p.amenities?.bathrooms ?? 0,
      sqft: p.area ? `${p.area} ft²` : "",
      tag: p.type ? String(p.type).toUpperCase() : undefined,
      viewedAt: p.viewedAt,
    }));
  }, [filteredProperties]);

  // Handle sort change
  const handleSortChange = (value: string) => {
    switch (value) {
      case "recent":
        setSortBy("viewedAt");
        setSortOrder("desc");
        break;
      case "oldest":
        setSortBy("viewedAt");
        setSortOrder("asc");
        break;
      case "price-low":
        setSortBy("price");
        setSortOrder("asc");
        break;
      case "price-high":
        setSortBy("price");
        setSortOrder("desc");
        break;
    }
    setPage(1);
  };

  // Quick date filters
  const applyQuickDateFilter = (days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    setDateRange({ from, to });
    setShowDatePicker(false);
    toast.success(`Showing properties viewed in last ${days} days`);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
    toast.success("Date filter cleared");
  };

  // Remove single property from history
  const handleRemoveProperty = async (propertyId: string) => {
    try {
      await apiClient.removeFromViewingHistory(propertyId);
      setProperties((prev) => prev.filter((p) => p._id !== propertyId));
      setTotal((prev) => prev - 1);
      toast.success("Property removed from viewing history");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove property");
    }
  };

  // Clear all viewing history
  const handleClearHistory = async () => {
    try {
      await apiClient.clearViewingHistory();
      setProperties([]);
      setTotal(0);
      setTotalPages(1);
      setShowClearDialog(false);
      toast.success("Viewing history cleared successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to clear history");
    }
  };

  // Page navigation
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 ">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                Viewing History
              </h1>
              <p className="text-muted-foreground mt-2">
                {loading ? "Loading..." : `${total} properties viewed`}
              </p>
            </div>

            {!loading && total > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowClearDialog(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Filters */}
          {!loading && total > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select defaultValue="recent" onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                      : "Filter by Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Quick Filters</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickDateFilter(7)}
                        >
                          Last 7 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickDateFilter(30)}
                        >
                          Last 30 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickDateFilter(90)}
                        >
                          Last 3 months
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickDateFilter(365)}
                        >
                          Last year
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Custom Range</p>
                      <CalendarComponent
                        mode="range"
                        selected={dateRange}
                        onSelect={(range: any) => {
                          setDateRange(range || { from: undefined, to: undefined });
                        }}
                        numberOfMonths={2}
                        disabled={(date) => date > new Date()}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={clearDateFilter}
                      >
                        Clear
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setShowDatePicker(false)}
                        disabled={!dateRange.from || !dateRange.to}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Active Filter Badge */}
              {(dateRange.from || dateRange.to) && (
                <Badge variant="secondary" className="gap-2">
                  <Filter className="h-3 w-3" />
                  Date filtered
                  <button
                    onClick={clearDateFilter}
                    className="hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-center mb-2">Failed to Load History</p>
            <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={fetchViewedProperties}>Try Again</Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && formattedProperties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Eye className="h-20 w-20 text-muted-foreground/40 mb-6" />
            <h2 className="text-2xl font-semibold mb-2">No Viewing History</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {dateRange.from || dateRange.to
                ? "No properties viewed in the selected date range. Try adjusting your filters."
                : "You haven't viewed any properties yet. Start exploring to see your history here!"}
            </p>
            <Button onClick={() => router.push("/properties")}>
              Browse Properties
            </Button>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && !error && formattedProperties.length > 0 && (
          <>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {formattedProperties.map((property) => (
                <div key={property.id} className="relative group">
                  <PropertyCard {...property} />
                  
                  {/* Remove Button Overlay */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveProperty(property.id);
                    }}
                    className="absolute top-3 right-3 bg-destructive text-destructive-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-destructive/90 z-10"
                    title="Remove from history"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>

                  {/* Viewed At Badge */}
                  <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center gap-1.5 z-10">
                    <Calendar className="h-3 w-3" />
                    {property.timeAgo}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
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
          </>
        )}

        {/* Clear All Confirmation Dialog */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Viewing History?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your entire viewing history ({total} properties).
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearHistory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}