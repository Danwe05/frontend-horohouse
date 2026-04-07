"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PropertyGallery from "@/components/property/details/PropertyGallery";
import PropertyInfo from "@/components/property/details/PropertyInfo";
import BookingPanel from "@/components/property/details/BookingPanel";
import PropertyDetails from "@/components/property/details/PropertyDetails";
import Neighborhood from "@/components/property/details/Neighborhood";
import Reviews from "@/components/property/details/Reviews";
import PetPolicy, { type PetPolicyInfo } from "@/components/property/details/PetPolicy";
import SimilarProperties from "@/components/property/details/SimilarProperties";
import StudentFeaturesPanel from "@/components/property/details/StudentFeaturesPanel";
import apiClient from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  _id: string;
  title: string;
  price: number;
  type: string;
  listingType: string;
  images: Array<{ url: string; publicId: string; caption?: string; isMain?: boolean }>;
  description: string;
  agentId: any;
  ownerId: any;
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
    coordinates: [number, number]; // [longitude, latitude]
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
  pricingUnit?: "nightly" | "weekly";
  minNights?: number;
  maxNights?: number;
  cleaningFee?: number;
  serviceFee?: number;
  isInstantBookable?: boolean;
  cancellationPolicy?: string;
  advanceNoticeDays?: number;
  bookingWindowDays?: number;
  weeklyDiscountPercent?: number;
  monthlyDiscountPercent?: number;
  shortTermAmenities?: {
    maxGuests?: number;
    checkInTime?: string;
    checkOutTime?: string;
    hasWifi?: boolean;
    hasBreakfast?: boolean;
    hasTv?: boolean;
    hasKitchen?: boolean;
    hasWasher?: boolean;
    hasHeating?: boolean;
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    partiesAllowed?: boolean;
    wheelchairAccessible?: boolean;
    airportTransfer?: boolean;
    conciergeService?: boolean;
    dailyHousekeeping?: boolean;
  };
  tourType?: "kuula" | "youtube" | "images" | "none";
  tourThumbnail?: string;
  tourViews?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPetPolicy(property: Property): PetPolicyInfo {
  const petsAllowed = property.shortTermAmenities?.petsAllowed ?? false;

  if (!petsAllowed) {
    return { petsAllowed: false };
  }

  return {
    petsAllowed: true,
    rules: [
      {
        label: "Dogs allowed",
        allowed: true,
        icon: "dog",
        note: "Up to 2 dogs, 50 lbs max each",
      },
      {
        label: "Cats allowed",
        allowed: true,
        icon: "cat",
        note: "Up to 2 cats",
      },
      {
        label: "Small pets",
        allowed: true,
        icon: "bird",
        note: "Caged pets welcome",
      },
    ],
    depositAmount: property.depositAmount,
    requiresVaccination: true,
    requiresLicense: true,
    breedRestrictions: true,
  };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const PropertyDetailSkeleton = () => (
  <div className="min-h-screen bg-white">
    <main className="max-w-7xl mx-auto px-6 lg:px-10 py-4">
      <Skeleton className="h-10 w-10 mb-8 rounded-full bg-[#F7F7F7]" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-10">
          {/* Gallery */}
          <Skeleton className="h-[450px] w-full rounded-2xl bg-[#F7F7F7]" />

          {/* Title & Info */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 bg-[#F7F7F7]" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 bg-[#F7F7F7]" />
              <Skeleton className="h-5 w-32 bg-[#F7F7F7]" />
            </div>
            <div className="pt-6 border-t border-[#DDDDDD] mt-6">
              <Skeleton className="h-24 w-full bg-[#F7F7F7]" />
            </div>
            <div className="pt-6 border-t border-[#DDDDDD] mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl bg-[#F7F7F7]" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-4 sticky top-28">
          <Skeleton className="h-[480px] w-full rounded-2xl bg-[#F7F7F7] border border-[#DDDDDD]" />
        </div>
      </div>
    </main>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyDetailClient() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const { t } = useLanguage();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fallbackErrorMsg = t.propertyDetails?.failedToLoad ?? "Failed to load property details";

  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.getProperty(propertyId);
      setProperty(data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? fallbackErrorMsg);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return <PropertyDetailSkeleton />;

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !property) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 space-y-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="rounded-full h-12 w-12 p-0 text-[#222222] hover:bg-[#F7F7F7]"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2]" />
          </Button>
          <Alert className="border-[#FFDFDF] bg-[#FFF8F8] rounded-xl p-6">
            <AlertCircle className="h-5 w-5 text-[#E50000]" />
            <AlertDescription className="text-[#E50000] font-medium text-[15px] ml-2">
              {error || t.propertyDetails?.propertyNotFound || "Property not found"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const [longitude, latitude] = property.location?.coordinates ?? [];
  const petPolicy = buildPetPolicy(property);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-4">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-22">
          {/* ── Main content ── */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Gallery spans its container seamlessly */}
            <PropertyGallery property={property} />

            {/* Information sections, cleanly divided by Airbnb-style borders */}
            <div className="border-[#DDDDDD]">
              <PropertyInfo property={property} />
            </div>

            <div className="py-4 border-b border-[#DDDDDD]">
              <StudentFeaturesPanel property={property} />
            </div>

            <div className="py-4 border-b border-[#DDDDDD]">
              <PropertyDetails property={property} />
            </div>

            <div className="py-4 border-b border-[#DDDDDD]">
              <Neighborhood
                property={{
                  city: property.city,
                  neighborhood: property.neighborhood,
                  nearbyAmenities: property.nearbyAmenities,
                  transportAccess: property.transportAccess,
                  latitude: latitude,
                  longitude: longitude,
                }}
              />
            </div>

            {/* Only render PetPolicy when pets are relevant to this listing type */}
            {(property.listingType === "rent" || property.listingType === "short_term") && (
              <div className="py-4 border-b border-[#DDDDDD]">
                <PetPolicy policy={petPolicy} currency="XAF" />
              </div>
            )}

            <div className="py-4 border-b border-[#DDDDDD]">
              <Reviews propertyId={property._id} />
            </div>
          </div>

          {/* ── Booking sidebar ── */}
          <div className="lg:col-span-4 sticky top-28 mt-8 lg:mt-0">
            {/* BookingPanel generally handles its own internal styling, but sits cleanly here */}
            <BookingPanel property={property} />
          </div>
        </div>

        {/* ── Similar properties (full width) ── */}
        <div className="mt-16 pt-12 border-t border-[#DDDDDD]">
          <SimilarProperties
            propertyId={property._id}
            city={property.city}
            type={property.type}
            listingType={property.listingType as "rent" | "sale"}
          />
        </div>
      </main>
    </div>
  );
}