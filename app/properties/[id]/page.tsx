"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PropertyGallery from "@/components/property/details/PropertyGallery";
import PropertyInfo from "@/components/property/details/PropertyInfo";
import BookingPanel from "@/components/property/details/BookingPanel";
import PropertyDetails from "@/components/property/details/PropertyDetails";
import Neighborhood from "@/components/property/details/Neighborhood";
import RentalApplication from "@/components/property/details/RentalApplication";
import Reviews from "@/components/property/details/Reviews";
import PetPolicy from "@/components/property/details/PetPolicy";
import SimilarProperties from "@/components/property/details/SimilarProperties";
import apiClient from "@/lib/api";
import { useRecentlyViewedProperties } from '@/hooks/useRecentlyViewedProperties';

interface Property {
  _id: string;
  title: string;
  price: number;
  type: string;
  listingType: string;
  images: Array<{ url: string; publicId: string; caption?: string; isMain?: boolean }>;
  description: string;
  amenities: {
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
    hasGarden?: boolean;
    hasPool?: boolean;
    hasGym?: boolean;
    hasSecurity?: boolean;
    hasElevator?: boolean;
    hasBalcony?: boolean;
    hasAirConditioning?: boolean;
    hasInternet?: boolean;
    hasGenerator?: boolean;
    furnished?: boolean;
  };
  city: string;
  address: string;
  neighborhood?: string;
  country?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  area?: number;
  yearBuilt?: number;
  viewsCount: number;
  availability: string;
  contactPhone?: string;
  contactEmail?: string;
  keywords: string[];
  nearbyAmenities: string[];
  transportAccess: string[];
  depositAmount?: number;
  maintenanceFee?: number;
  virtualTourUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PropertyDetail() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const { addRecentProperty } = useRecentlyViewedProperties();

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiClient.getProperty(propertyId);
      setProperty(data);
      // Add to recently viewed (backend will update for authenticated users; local fallback for anonymous)
      try {
        addRecentProperty({
          id: data._id,
          title: data.title,
          price: data.price,
          location: data.address || data.city || '',
          imageUrl: data.images?.[0]?.url || '/placeholder.jpg',
          bedrooms: data.amenities?.bedrooms || undefined,
          bathrooms: data.amenities?.bathrooms || undefined,
          squareMeters: data.area || undefined,
        });
      } catch (e) {
        // Non-fatal
        console.warn('Failed to register recently viewed (non-fatal)', e);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load property details");
      console.error("Property fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            {error || "Property not found"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4" variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <PropertyGallery property={property} />
            <PropertyInfo property={property} />
            <PropertyDetails property={property} />
            <Neighborhood property={property} />
            <PetPolicy />
            <Reviews propertyId={property._id} />
            <RentalApplication propertyId={property._id} />
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <BookingPanel property={property} />
          </div>
        </div>

        {/* Full Width Section */}
        <div className="mt-12">
          <SimilarProperties propertyId={property._id} city={property.city} type={property.type} />
        </div>
      </main>
    </div>
  );
}

