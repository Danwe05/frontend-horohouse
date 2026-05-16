import { Suspense } from "react";
import { Metadata } from "next";
import PropertiesClient from "@/components/property/PropertiesClient";
import { Loader2 } from "lucide-react";
import { QuickSearchFilters } from "@/components/property/QuickSearch";
import { AdvancedFilters } from "@/components/property/FilterSidebar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchProperties(searchParams: Record<string, any>) {
  const params = new URLSearchParams();
  params.append("page", "1");
  params.append("limit", "12");

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, String(value));
      }
    }
  });

  const res = await fetch(`${API_BASE_URL}/properties?${params.toString()}`, {
    next: { revalidate: 60 }, // ISR: Revalidate every 60 seconds
  });

  if (!res.ok) {
    console.error("Failed to fetch properties:", res.statusText);
    return { properties: [], total: 0, totalPages: 0 };
  }

  return res.json();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const { locale } = resolvedParams;

  const city = resolvedSearchParams.city;
  const listingType = resolvedSearchParams.listingType;

  let title = "Property Listings | HoroHouse";
  let description =
    "Browse thousands of verified homes, apartments, and land on HoroHouse.";

  if (typeof city === "string" && city) {
    if (listingType === "sale") {
      title = `Properties for Sale in ${city} | HoroHouse`;
      description = `Find the best houses and apartments for sale in ${city}. Verified listings on HoroHouse.`;
    } else if (listingType === "rent") {
      title = `Apartments for Rent in ${city} | HoroHouse`;
      description = `Explore a wide range of rental properties in ${city}. Direct contact with agents.`;
    } else {
      title = `Real Estate in ${city} | HoroHouse`;
      description = `Discover properties in ${city}. Houses, apartments, and more on HoroHouse.`;
    }
  } else if (listingType === "sale") {
    title = "Properties for Sale | HoroHouse";
  } else if (listingType === "rent") {
    title = "Properties for Rent | HoroHouse";
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.horohouse.com";
  const canonicalPath = `/${locale}/properties`;
  const url = new URL(`${baseUrl}${canonicalPath}`);
  
  // Keep important filters in canonical if they significantly change content
  if (typeof city === "string") url.searchParams.set("city", city);
  if (typeof listingType === "string") url.searchParams.set("listingType", listingType);

  return {
    title,
    description,
    alternates: {
      canonical: url.toString(),
    },
    openGraph: {
      title,
      description,
      url: url.toString(),
      type: "website",
    },
  };
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const data = await fetchProperties(resolvedSearchParams);

  const initialFilters: QuickSearchFilters = {};
  const city = resolvedSearchParams.city;
  const listingType = resolvedSearchParams.listingType;
  const minPrice = resolvedSearchParams.minPrice;
  const maxPrice = resolvedSearchParams.maxPrice;
  const bedrooms = resolvedSearchParams.bedrooms;
  const bathrooms = resolvedSearchParams.bathrooms;
  const checkIn = resolvedSearchParams.checkIn;
  const checkOut = resolvedSearchParams.checkOut;
  const guests = resolvedSearchParams.guests;
  const propertyType = resolvedSearchParams.propertyType;
  const amenities = resolvedSearchParams.amenities;

  if (typeof city === "string") initialFilters.city = city;
  if (typeof listingType === "string") initialFilters.listingType = listingType;
  if (typeof minPrice === "string") initialFilters.minPrice = parseInt(minPrice, 10);
  if (typeof maxPrice === "string") initialFilters.maxPrice = parseInt(maxPrice, 10);
  if (typeof bedrooms === "string") initialFilters.bedrooms = parseInt(bedrooms, 10);
  if (typeof bathrooms === "string") initialFilters.bathrooms = parseInt(bathrooms, 10);
  if (typeof checkIn === "string") initialFilters.checkIn = checkIn;
  if (typeof checkOut === "string") initialFilters.checkOut = checkOut;
  if (typeof guests === "string") initialFilters.guests = parseInt(guests, 10);
  if (typeof propertyType === "string") initialFilters.propertyTypes = [propertyType];
  if (typeof amenities === "string") initialFilters.amenities = amenities.split(",");

  const initialAdvancedFilters: AdvancedFilters = {};
  const minBedrooms = resolvedSearchParams.minBedrooms;
  const minBathrooms = resolvedSearchParams.minBathrooms;
  const minGuests = resolvedSearchParams.minGuests;
  const hasPool = resolvedSearchParams.hasPool;

  if (initialFilters.propertyTypes) initialAdvancedFilters.propertyTypes = initialFilters.propertyTypes;
  if (typeof minBedrooms === "string") initialAdvancedFilters.minBedrooms = parseInt(minBedrooms, 10);
  if (typeof minBathrooms === "string") initialAdvancedFilters.minBathrooms = parseInt(minBathrooms, 10);
  if (typeof minGuests === "string") initialAdvancedFilters.minGuests = parseInt(minGuests, 10);
  if (typeof hasPool === "string") initialAdvancedFilters.hasPool = hasPool === "true";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": (data.properties || []).map((prop: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.horohouse.com"}/${resolvedParams.locale}/properties/${prop._id}`,
      "name": prop.title,
      "image": prop.images?.[0]?.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center h-96 gap-3 pt-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#1A56DB]" />
            <p className="text-[14px] text-[#717171]">
              Loading HoroHouse Listings…
            </p>
          </div>
        }
      >
        <PropertiesClient
          initialProperties={data.properties || []}
          initialTotal={data.total || 0}
          initialFilters={initialFilters}
          initialAdvancedFilters={initialAdvancedFilters}
        />
      </Suspense>
    </>
  );
}