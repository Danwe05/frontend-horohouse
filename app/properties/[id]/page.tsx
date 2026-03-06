"use client";

import { useState, useEffect, useCallback } from "react";
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
import apiClient from "@/lib/api";

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
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives a PetPolicyInfo from the property's amenities / shortTermAmenities.
 * Adjust the rule list to match whatever pet data your API exposes.
 */
function buildPetPolicy(property: Property): PetPolicyInfo {
  const petsAllowed =
    property.shortTermAmenities?.petsAllowed ??
    false;

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
  <div className="min-h-screen bg-[#f8fafc]">
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
      {/* Back button placeholder */}
      <Skeleton className="h-9 w-24 mb-8 rounded-xl" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Gallery */}
          <Skeleton className="h-[420px] w-full rounded-3xl" />

          {/* Property info card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          </div>

          {/* Property details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
            <Skeleton className="h-7 w-40" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 sticky top-20 space-y-6">
          <Skeleton className="h-[480px] w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    </main>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyDetail() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.getProperty(propertyId);
      setProperty(data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to load property details");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 space-y-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="rounded-xl font-bold h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <Alert className="border-red-200 bg-red-50 rounded-2xl shadow-sm">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600 font-medium">
            {error || "Property not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  // GeoJSON coordinates are [longitude, latitude]
  const [longitude, latitude] = property.location?.coordinates ?? [];

  const petPolicy = buildPetPolicy(property);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
        {/* Back navigation */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 -ml-2 rounded-xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Main content ── */}
          <div className="lg:col-span-8 space-y-10">
            <PropertyGallery property={property} />

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
              <PropertyInfo property={property} />
            </div>

            <PropertyDetails property={property} />

            <Neighborhood
              property={{
                city: property.city,
                neighborhood: property.neighborhood,
                nearbyAmenities: property.nearbyAmenities,
                transportAccess: property.transportAccess,
                // Pass coordinates extracted from GeoJSON
                latitude: latitude,
                longitude: longitude,
              }}
            />

            {/* Only render PetPolicy when pets are relevant to this listing type */}
            {(property.listingType === "rent" || property.listingType === "short_term") && (
              <PetPolicy policy={petPolicy} currency="XAF" />
            )}

            <Reviews propertyId={property._id} />
          </div>

          {/* ── Booking sidebar ── */}
          <div className="lg:col-span-4 sticky top-20">
            <BookingPanel property={property} />
          </div>
        </div>

        {/* ── Similar properties (full width) ── */}
        <div className="mt-16 pt-12 border-t border-slate-200/60">
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