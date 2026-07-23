import { Suspense } from "react";
import { Metadata } from "next";
import PropertiesClient from "@/components/property/PropertiesClient";
import { Loader2 } from "lucide-react";
import { QuickSearchFilters } from "@/components/property/QuickSearch";
import { AdvancedFilters } from "@/components/property/FilterSidebar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.horohouse.com";

const LOCALE_TO_OG: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  ar: "ar_SA",
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

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
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error("Failed to fetch properties:", res.statusText);
    return { properties: [], total: 0, totalPages: 0 };
  }

  return res.json();
}

// ─── Metadata strings ─────────────────────────────────────────────────────────

type ListingType = "rent" | "sale" | undefined;

function buildTitle(locale: string, city?: string, listingType?: ListingType): string {
  if (locale === "fr") {
    if (city) {
      if (listingType === "sale") return `Propriétés à vendre à ${city} | HoroHouse`;
      if (listingType === "rent") return `Appartements à louer à ${city} | HoroHouse`;
      return `Immobilier à ${city} | HoroHouse`;
    }
    if (listingType === "sale") return `Propriétés à vendre en Afrique | HoroHouse`;
    if (listingType === "rent") return `Appartements à louer en Afrique | HoroHouse`;
    return `Annonces immobilières | HoroHouse`;
  }

  // English (default)
  if (city) {
    if (listingType === "sale") return `Properties for Sale in ${city} | HoroHouse`;
    if (listingType === "rent") return `Apartments for Rent in ${city} | HoroHouse`;
    return `Real Estate in ${city} | HoroHouse`;
  }
  if (listingType === "sale") return `Properties for Sale in Africa | HoroHouse`;
  if (listingType === "rent") return `Properties for Rent in Africa | HoroHouse`;
  return `Property Listings | HoroHouse`;
}

function buildDescription(locale: string, city?: string, listingType?: ListingType): string {
  if (locale === "fr") {
    if (city) {
      if (listingType === "sale")
        return `Trouvez les meilleures maisons et appartements à vendre à ${city}. Annonces vérifiées sur HoroHouse. Contact direct avec les agents.`;
      if (listingType === "rent")
        return `Explorez une large gamme de locations à ${city}. Contact direct avec les propriétaires et agents sur HoroHouse.`;
      return `Découvrez les biens immobiliers à ${city} — maisons, appartements, terrains et plus sur HoroHouse.`;
    }
    if (listingType === "sale")
      return `Parcourez des milliers de maisons et appartements à vendre en Afrique. Annonces vérifiées sur HoroHouse.`;
    if (listingType === "rent")
      return `Trouvez votre prochain chez-vous parmi des milliers de locations vérifiées en Afrique sur HoroHouse.`;
    return `Parcourez des milliers d'annonces immobilières vérifiées — maisons, appartements, terrains et logements étudiants sur HoroHouse.`;
  }

  // English
  if (city) {
    if (listingType === "sale")
      return `Find the best houses and apartments for sale in ${city}. Verified listings with direct agent contact on HoroHouse.`;
    if (listingType === "rent")
      return `Explore a wide range of rental properties in ${city}. Direct contact with landlords and agents on HoroHouse.`;
    return `Discover properties in ${city} — houses, apartments, land and more on HoroHouse.`;
  }
  if (listingType === "sale")
    return `Browse thousands of verified homes and apartments for sale across Africa on HoroHouse.`;
  if (listingType === "rent")
    return `Find your next home among thousands of verified rental listings across Africa on HoroHouse.`;
  return `Browse thousands of verified homes, apartments, land, and student housing on HoroHouse.`;
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const city =
    typeof resolvedSearchParams.city === "string"
      ? resolvedSearchParams.city
      : undefined;
  const listingType =
    resolvedSearchParams.listingType === "rent" ||
    resolvedSearchParams.listingType === "sale"
      ? (resolvedSearchParams.listingType as ListingType)
      : undefined;

  const title = buildTitle(locale, city, listingType);
  const description = buildDescription(locale, city, listingType);

  // ── Canonical — NO query params ──────────────────────────────────────────
  // Query-param canonicals cause duplicate-URL issues. The canonical always
  // points to the clean path; Google discovers filtered variants via internal links.
  const canonicalPath = `/${locale}/properties`;
  const canonical = `${BASE_URL}${canonicalPath}`;

  return {
    title,
    description,

    alternates: {
      canonical,
      languages: {
        en: `${BASE_URL}/en/properties`,
        fr: `${BASE_URL}/fr/properties`,
        ar: `${BASE_URL}/ar/properties`,
        "x-default": `${BASE_URL}/fr/properties`,
      },
    },

    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: LOCALE_TO_OG[locale] ?? "en_US",
      alternateLocale: Object.values(LOCALE_TO_OG).filter((l) => !l.startsWith(locale)),
      siteName: "HoroHouse",
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      site: "@HoroHouse",
      title,
      description,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const data = await fetchProperties(resolvedSearchParams);

  // ── ItemList JSON-LD ─────────────────────────────────────────────────────
  // Uses slug in URLs. Falls back to _id only if slug is absent (shouldn't happen).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: (data.data || []).map((prop: any, index: number) => {
      const identifier = prop.slug || prop._id;
      return {
        "@type": "ListItem",
        position: index + 1,
        url: `${BASE_URL}/${locale}/properties/${identifier}`,
        name: prop.title,
        image: prop.images?.[0]?.url,
      };
    }),
  };

  // ── Parse searchParams into typed filter objects ──────────────────────────
  const initialFilters: QuickSearchFilters = {};

  const { city, listingType, minPrice, maxPrice, bedrooms, bathrooms,
          checkIn, checkOut, guests, propertyType, amenities } = resolvedSearchParams;

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
  const { minBedrooms, minBathrooms, minGuests, hasPool } = resolvedSearchParams;

  if (initialFilters.propertyTypes) initialAdvancedFilters.propertyTypes = initialFilters.propertyTypes;
  if (typeof minBedrooms === "string") initialAdvancedFilters.minBedrooms = parseInt(minBedrooms, 10);
  if (typeof minBathrooms === "string") initialAdvancedFilters.minBathrooms = parseInt(minBathrooms, 10);
  if (typeof minGuests === "string") initialAdvancedFilters.minGuests = parseInt(minGuests, 10);
  if (typeof hasPool === "string") initialAdvancedFilters.hasPool = hasPool === "true";

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
          initialProperties={data.data || []}
          initialTotal={data.total || 0}
          initialFilters={initialFilters}
          initialAdvancedFilters={initialAdvancedFilters}
        />
      </Suspense>
    </>
  );
}