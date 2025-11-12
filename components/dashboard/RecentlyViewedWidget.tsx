"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/lib/api";
import { toast } from "sonner";

interface ViewedProperty {
  _id: string;
  title: string;
  price: number;
  images: Array<{ url: string }>;
  address: string;
  city: string;
  type: string;
  amenities?: {
    bedrooms?: number;
    bathrooms?: number;
  };
  viewedAt: string;
}

export default function RecentlyViewedWidget() {
  const router = useRouter();
  const [properties, setProperties] = useState<ViewedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentlyViewed();
  }, []);

  const fetchRecentlyViewed = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiClient.getRecentlyViewed(6);
      setProperties(data || []);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to load recently viewed";
      setError(errorMsg);
      console.error("Error fetching recently viewed:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
      }).format(price);
    } catch {
      return `${price.toLocaleString()} XAF`;
    }
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  const handleViewAll = () => {
    router.push("/viewed-properties");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle>Recently Viewed</CardTitle>
          </div>
          {!loading && properties.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="gap-1 text-primary hover:text-primary"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Properties you've recently looked at
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRecentlyViewed}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Eye className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No recently viewed properties yet
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push("/properties")}>
              Browse Properties
            </Button>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && !error && properties.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property._id}
                onClick={() => handlePropertyClick(property._id)}
                className="group cursor-pointer rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/50"
              >
                {/* Property Image */}
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={property.images?.[0]?.url || "/placeholder.svg"}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
                    {formatTimeAgo(property.viewedAt)}
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {property.title}
                    </h3>
                  </div>

                  <p className="text-lg font-bold text-primary">
                    {formatPrice(property.price)}
                  </p>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {property.address}, {property.city}
                  </p>

                  {/* Property Details */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {property.amenities?.bedrooms && (
                      <span className="flex items-center gap-1">
                        🛏️ {property.amenities.bedrooms}
                      </span>
                    )}
                    {property.amenities?.bathrooms && (
                      <span className="flex items-center gap-1">
                        🚿 {property.amenities.bathrooms}
                      </span>
                    )}
                    <span className="capitalize">{property.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {!loading && !error && properties.length > 0 && (
        <CardFooter>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleViewAll}
          >
            View Complete History
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}