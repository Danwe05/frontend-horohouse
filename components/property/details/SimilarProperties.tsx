"use client";

import { useState, useEffect } from "react";
import PropertyCard from "../PropertyCard";
import apiClient from "@/lib/api";
import { Loader2 } from "lucide-react";

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
  createdAt: string;
  isFavorite?: boolean;
}

const SimilarProperties = ({ 
  propertyId, 
  city, 
  type,
  listingType = "rent" 
}: SimilarPropertiesProps) => {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSimilarProperties = async () => {
      try {
        setLoading(true);
        setError("");
        // Fetch similar properties based on propertyId, city, and type
        const response = await apiClient.getSimilarProperties(propertyId, city, type);
        setProperties(response.data || response);
      } catch (err: any) {
        console.error("Error fetching similar properties:", err);
        setError(err.response?.data?.message || "Failed to load similar properties");
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && city && type) {
      fetchSimilarProperties();
    }
  }, [propertyId, city, type]);

  // Helper function to calculate time ago
  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMinutes < 5) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  };

  // Format area for display
  const formatArea = (area?: number) => {
    if (!area) return undefined;
    return `${area.toLocaleString()} sqft`;
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Similar Properties Nearby</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (error || properties.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Similar Properties Nearby</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {properties.map((property, index) => {
          const imageUrls = property.images.map(img => img.url);
          const fullAddress = property.neighborhood 
            ? `${property.address}, ${property.neighborhood}, ${property.city}`
            : `${property.address}, ${property.city}`;

          return (
            <PropertyCard
              key={property._id || `${property.city || 'unknown'}-${property.address || 'addr'}-${index}`}
              id={property._id}
              image={imageUrls[0]}
              images={imageUrls}
              price={property.price.toString()}
              timeAgo={getTimeAgo(property.createdAt)}
              address={fullAddress}
              beds={property.amenities?.bedrooms}
              baths={property.amenities?.bathrooms}
              sqft={formatArea(property.area)}
              initialIsFavorite={property.isFavorite || false}
              listingType={property.listingType as "rent" | "sale"}
            />
          );
        })}
      </div>
    </section>
  );
};

export default SimilarProperties;