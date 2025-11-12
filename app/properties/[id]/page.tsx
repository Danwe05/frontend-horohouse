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
import Reviews from "@/components/property/details/Reviews";
import PetPolicy from "@/components/property/details/PetPolicy";
import SimilarProperties from "@/components/property/details/SimilarProperties";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";

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
  const { isAuthenticated, user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError("");
      
      // DETAILED DEBUGGING
      const token = authService.getAccessToken();
      const hasToken = !!token;
      
      console.group("🔍 PROPERTY FETCH DEBUG");
      console.log("Property ID:", propertyId);
      console.log("Is Authenticated:", isAuthenticated);
      console.log("User:", user);
      console.log("Has Token:", hasToken);
      if (hasToken) {
        console.log("Token Preview:", token?.substring(0, 20) + "...");
      }
      console.groupEnd();

      // Store debug info
      setDebugInfo({
        propertyId,
        isAuthenticated,
        userId: user?.id || user?._id,
        hasToken,
        timestamp: new Date().toISOString()
      });
      
      const data = await apiClient.getProperty(propertyId);
      setProperty(data);
      
      console.group("✅ PROPERTY LOADED");
      console.log("Property:", {
        id: data._id,
        title: data.title,
        viewsCount: data.viewsCount,
      });
      console.groupEnd();

      // Wait a moment then check if it was tracked
      setTimeout(async () => {
        if (isAuthenticated) {
          try {
            console.log("🔍 Checking if view was tracked...");
            const viewedProps = await apiClient.getRecentlyViewed(5);
            console.log("Recently viewed:", viewedProps);
            
            const wasTracked = viewedProps?.some((item: any) => {
              const propId = item.property?._id || item.property?.id || item.id;
              return propId === propertyId;
            });
            
            console.log(wasTracked ? "✅ View was tracked!" : "❌ View was NOT tracked");
          } catch (err) {
            console.error("Error checking recently viewed:", err);
          }
        }
      }, 1000);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to load property details";
      setError(errorMessage);
      
      console.group("❌ PROPERTY FETCH ERROR");
      console.error("Error:", err);
      console.error("Status:", err.response?.status);
      console.error("Message:", errorMessage);
      console.error("Response:", err.response?.data);
      console.groupEnd();
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