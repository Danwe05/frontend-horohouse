"use client";

import { useState, useEffect } from "react";
import PropertyCard, { PropertyCardSkeleton } from "../PropertyCard";
import apiClient from "@/lib/api";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";
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
  listingType?: "rent" | "sale" | "short_term";
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
  createdAt: string; 
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

    const fetchProperties = async () => {
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

    fetchProperties();
    return () => { cancelled = true; };
  }, [propertyId, city, type]);

  const formatArea = (area?: number) =>
    area ? `${area.toLocaleString()} sqft` : undefined;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="space-y-6">
        <h2 className="text-[22px] font-semibold text-[#222222]">
          More places to stay
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
        <section className="py-12 border-t border-[#DDDDDD]">
          <div className="text-center space-y-4">
            <Home className="h-8 w-8 text-[#717171] mx-auto stroke-[1.5]" />
            <p className="text-[16px] text-[#717171]">
              We couldn't load similar listings right now.
            </p>
            <Link 
              href={`/properties?city=${encodeURIComponent(city)}`}
              className="text-[14px] font-semibold text-[#222222] underline"
            >
              Browse other listings in {city}
            </Link>
          </div>
        </section>
      );
    }
    return null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold text-[#222222]">
          More places to stay
        </h2>
      </div>

      <Carousel 
        opts={{ align: "start", loop: false }} 
        className="w-full group"
      >
        <CarouselContent className="-ml-4">
          {properties.map((property, index) => {
            const imageUrls = property.images.map((img) => img.url);
            const fullAddress = property.neighborhood
              ? `${property.neighborhood}, ${property.city}`
              : `${property.address}, ${property.city}`;

            return (
              <CarouselItem
                key={property._id ?? index}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4"
              >
                <PropertyCard
                  id={property._id}
                  image={imageUrls[0]}
                  images={imageUrls}
                  price={property.price}
                  timeAgo={property.createdAt}
                  address={fullAddress}
                  beds={property.amenities?.bedrooms}
                  baths={property.amenities?.bathrooms}
                  sqft={formatArea(property.area)}
                  initialIsFavorite={property.isFavorite ?? false}
                  listingType={property.listingType as any}
                  rating={typeof property.averageRating === "number" && property.averageRating > 0 ? property.averageRating : undefined}
                  reviewCount={typeof property.reviewCount === "number" ? property.reviewCount : undefined}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Circular floating arrows */}
        <CarouselPrevious 
            className="hidden md:flex -left-4 h-8 w-8 bg-white border border-[#DDDDDD] text-[#222222] hover:bg-white hover:scale-105 shadow-md opacity-0 group-hover:opacity-100 transition-all" 
        />
        <CarouselNext 
            className="hidden md:flex -right-4 h-8 w-8 bg-white border border-[#DDDDDD] text-[#222222] hover:bg-white hover:scale-105 shadow-md opacity-0 group-hover:opacity-100 transition-all" 
        />
      </Carousel>
    </section>
  );
};

export default SimilarProperties;