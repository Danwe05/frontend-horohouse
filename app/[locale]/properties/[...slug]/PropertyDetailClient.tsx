"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Share2, Heart, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PropertyGallery from "@/components/property/details/PropertyGallery";
import PropertyInfo from "@/components/property/details/PropertyInfo";
import BookingPanel from "@/components/property/details/BookingPanel";
import PropertyDetails from "@/components/property/details/PropertyDetails";
import Neighborhood from "@/components/property/details/Neighborhood";
import Reviews from "@/components/property/details/Reviews";
import HostCard from "@/components/property/details/HostCard";
import PetPolicy, { type PetPolicyInfo } from "@/components/property/details/PetPolicy";
import SimilarProperties from "@/components/property/details/SimilarProperties";
import StudentFeaturesPanel from "@/components/property/details/StudentFeaturesPanel";
import HotelDetailClient from "./HotelDetailClient";
import apiClient from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      {/* Title skeleton */}
      <div className="mb-4 mt-20 flex items-center justify-between">
        <Skeleton className="h-8 w-2/3 bg-[#F7F7F7]" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-20 bg-[#F7F7F7] rounded-full" />
          <Skeleton className="h-8 w-16 bg-[#F7F7F7] rounded-full" />
        </div>
      </div>

      {/* Gallery skeleton */}
      <Skeleton className="h-[440px] w-full rounded-2xl bg-[#F7F7F7] mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-10">
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

export default function PropertyDetailClient({
  id,
  initialData,
}: {
  id: string;
  initialData?: Property;
}) {
  const router = useRouter();
  const { user, token } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const propertyId = id;

  const { t } = useLanguage();

  const [property, setProperty] = useState<Property | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const fallbackErrorMsg =
    t.propertyDetails?.failedToLoad ?? "Failed to load property details";

  const fetchProperty = useCallback(async () => {
    if (!propertyId || initialData) return;
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
  }, [propertyId, initialData, fallbackErrorMsg]);

  useEffect(() => {
    if (!initialData) {
      fetchProperty();
    }
  }, [fetchProperty, initialData]);

  const saved = property ? isFavorite(property._id) : false;

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title ?? "Property", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch { /* user cancelled */ }
  }, [property?.title]);

  const handleToggleFavorite = useCallback(async () => {
    if (!property) return;
    if (!user) {
      router.push(`/auth/login?redirect=/properties/${property._id}`);
      return;
    }
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (saved) {
        await apiClient.removeFromFavorites(property._id);
        removeFavorite(property._id);
        toast.success("Removed from saved");
      } else {
        await apiClient.addToFavorites(property._id);
        addFavorite(property._id);
        toast.success("Saved to wishlist");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [property, user, isTogglingFavorite, saved, router, addFavorite, removeFavorite]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return <PropertyDetailSkeleton />;

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !property) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 space-y-6 mt-16">
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

  // ── Hotel type — delegate to dedicated hotel detail page ─────────────────
  if (property.type === 'hotel') {
    return <HotelDetailClient id={id} />;
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const [longitude, latitude] = property.location?.coordinates ?? [];
  const petPolicy = buildPetPolicy(property);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ChatProvider
      token={token ?? ""}
      apiUrl={process.env.NEXT_PUBLIC_API_URL!}
      currentUser={user ?? undefined}
    >
      <div className="min-h-screen bg-white text-[#222222]">
        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-4">

          {/* ── Airbnb-style title row + share/save ── */}
          <div className="mt-20 mb-4 flex items-start justify-between gap-4">
            <h1 className="text-[26px] font-semibold tracking-tight leading-10 text-[#222222] flex-1 capitalize">
              {property.title} <br />
              <span className="text-[16px] font-normal flex items-center gap-2"><MapPin className="w-4 h-4 stroke-[2]" /> {property.address}</span>
            </h1>

            {/* Share & Save — desktop only (mobile is handled inside the gallery) */}
            <div className="hidden md:flex items-center gap-1 shrink-0">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-semibold text-[#222222] underline underline-offset-2 hover:bg-[#F7F7F7] transition-colors"
              >
                <Share2 className="w-4 h-4 stroke-[2]" />
                Share
              </button>
              <button
                onClick={handleToggleFavorite}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-semibold text-[#222222] underline underline-offset-2 hover:bg-[#F7F7F7] transition-colors"
              >
                <Heart
                  className={cn(
                    "w-4 h-4 stroke-[2] transition-colors",
                    saved ? "fill-[#FF385C] stroke-[#FF385C]" : ""
                  )}
                />
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* ── Gallery — full-width, no side margins ── */}
          <PropertyGallery property={property} onShare={handleShare} onSave={handleToggleFavorite} saved={saved} />

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-8">

            {/* ── Main content ── */}
            <div className="lg:col-span-8 space-y-0">

              {/* PropertyInfo: subtitle row + description + amenities + host */}
              <div className="border-b border-[#DDDDDD]">
                <PropertyInfo property={property} />
              </div>

              <div className="py-8 border-b border-[#DDDDDD]">
                <StudentFeaturesPanel property={property} />
              </div>

              <div className="py-8 border-b border-[#DDDDDD]">
                <PropertyDetails property={property} />
              </div>

              <div className="py-8 border-b border-[#DDDDDD]">
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
                <div className="py-8 border-b border-[#DDDDDD]">
                  <PetPolicy policy={petPolicy} currency="XAF" />
                </div>
              )}

              <div className="py-8 border-b border-[#DDDDDD]">
                <Reviews propertyId={property._id} />
              </div>
            </div>

            {/* ── Booking sidebar ── */}
            <div className="hidden lg:block lg:col-span-4 sticky top-24 mt-0">
              <BookingPanel property={property} />
            </div>
          </div>

          {/* ── Similar properties (full width) ── */}
          <div className="mt-16 border-t border-[#DDDDDD]">
            <HostCard property={property} />
          </div>

          <div className="mt-0 pt-8 border-t border-[#DDDDDD]">
            <SimilarProperties
              propertyId={property._id}
              city={property.city}
              type={property.type}
              listingType={property.listingType as "rent" | "sale"}
            />
          </div>

          {/* ── Mobile bottom padding (for sticky booking bar) ── */}
          <div className="h-24 lg:hidden" />
        </main>

        {/* ── Mobile sticky booking bar ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <BookingPanel property={property} mobileOnly />
        </div>
      </div>
    </ChatProvider>
  );
}