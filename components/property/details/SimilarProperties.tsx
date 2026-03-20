"use client";

import { useState, useEffect } from "react";
import PropertyCard, { PropertyCardSkeleton } from "../PropertyCard";
import apiClient from "@/lib/api";
import { Home } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimilarPropertiesProps {
  propertyId: string;
  city: string;
  type: string;
  listingType?: "rent" | "sale";
}

interface PropertyData {
  _id: string;
  title: string;
  price: number;
  type: string;
  listingType: string;
  images: Array<{ url: string; publicId: string; caption?: string; isMain?: boolean }>;
  address: string;
  city: string;
  neighborhood?: string;
  amenities: {
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
  };
  area?: number;
  createdAt: string; // ISO timestamp — passed directly to PropertyCard
  isFavorite?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SimilarProperties = ({
  propertyId,
  city,
  type,
  listingType = "rent",
}: SimilarPropertiesProps) => {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!propertyId || !city || !type) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.getSimilarProperties(propertyId, city, type);
        if (!cancelled) {
          setProperties(response.data ?? response ?? []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message ?? "Failed to load similar properties");
          setProperties([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [propertyId, city, type]);

  const formatArea = (area?: number) =>
    area ? `${area.toLocaleString()} sqft` : undefined;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Similar Properties Nearby
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // ── Error / empty ──────────────────────────────────────────────────────────
  if (error || properties.length === 0) {
    if (error) {
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Similar Properties Nearby
          </h2>
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center space-y-3">
            <Home className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-500">
              Could not load similar properties right now.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/properties?city=${encodeURIComponent(city)}&type=${encodeURIComponent(type)}`}>
                Browse {city} listings
              </Link>
            </Button>
          </div>
        </section>
      );
    }
    // Silently hide if no properties found (no error)
    return null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Similar Properties Nearby
        </h2>
        <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">
          {properties.length} {properties.length === 1 ? "property" : "properties"}
        </span>
      </div>

      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {properties.map((property, index) => {
            const imageUrls = property.images.map((img) => img.url);
            const fullAddress = property.neighborhood
              ? `${property.address}, ${property.neighborhood}, ${property.city}`
              : `${property.address}, ${property.city}`;

            return (
              <CarouselItem
                key={property._id ?? `${city}-${property.address}-${index}`}
                className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <PropertyCard
                  id={property._id}
                  image={imageUrls[0]}
                  images={imageUrls}
                  price={property.price}
                  // Pass raw ISO timestamp — PropertyCard's formatTimeAgo handles it accurately
                  timeAgo={property.createdAt}
                  address={fullAddress}
                  beds={property.amenities?.bedrooms}
                  baths={property.amenities?.bathrooms}
                  sqft={formatArea(property.area)}
                  initialIsFavorite={property.isFavorite ?? false}
                  listingType={property.listingType as "rent" | "sale"}
                  rating={typeof property.averageRating === "number" && property.averageRating > 0 ? property.averageRating : undefined}
                  reviewCount={typeof property.reviewCount === "number" ? property.reviewCount : undefined}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Show nav on all breakpoints with sensible positioning */}
        <CarouselPrevious className="-left-4 lg:-left-12 h-12 w-12 bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900" />
        <CarouselNext className="-right-4 lg:-right-12 h-12 w-12 bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900" />
      </Carousel>
    </section>
  );
};

export default SimilarProperties;