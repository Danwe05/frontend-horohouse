// app/[locale]/properties/[...slug]/page.tsx — full replacement
//
// Route shape assumption: [...slug] catches both:
//   /en/properties/appartement-3ch-douala          → slug = ["appartement-3ch-douala"]
//   /en/properties/appartement-3ch-douala/some-id  → slug = ["...", "id"]
//
// The last segment is used as the lookup key.
// Your API should expose GET /properties/slug/:slug  (preferred)
// OR fall back to GET /properties/:id if _id is passed.
// Adjust fetchProperty() if your endpoint differs.

import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailClient from "./PropertyDetailClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.horohouse.com";

const LOCALE_TO_OG: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  ar: "ar_SA",
};

type Params = { params: Promise<{ locale: string; slug: string[] }> };

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchProperty(identifier: string) {
  // Try slug endpoint first, fall back to ID endpoint.
  // If your API only has one shape, simplify this.
  let res = await fetch(`${API_BASE_URL}/properties/slug/${identifier}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    // Fallback: might be a raw _id
    res = await fetch(`${API_BASE_URL}/properties/${identifier}`, {
      next: { revalidate: 3600 },
    });
  }

  if (!res.ok) return null;

  const data = await res.json();
  // Handle both { property: {...} } and bare object responses
  return data?.property ?? data ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Apply Cloudinary transforms for 1200×630 OG image */
function buildOgImageUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  if (rawUrl.includes("res.cloudinary.com")) {
    return rawUrl.replace("/upload/", "/upload/f_auto,q_auto,w_1200,h_630,c_fill/");
  }
  return rawUrl; // Non-Cloudinary: return as-is
}

/** Resolve slug from the property: prefer property.slug, fall back to last route segment */
function resolveSlug(property: any, routeIdentifier: string): string {
  return property?.slug || routeIdentifier;
}

/** Resolve bedroom/bathroom count — API uses either top-level or nested under amenities */
function getBedrooms(property: any): number | undefined {
  return property?.bedrooms ?? property?.amenities?.bedrooms;
}
function getBathrooms(property: any): number | undefined {
  return property?.bathrooms ?? property?.amenities?.bathrooms;
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: Params,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale, slug } = await params;
  const identifier = slug.at(-1)!;
  const property = await fetchProperty(identifier);

  if (!property?.title) {
    return {
      title: "Property Not Found | HoroHouse",
      robots: { index: false, follow: false },
    };
  }

  const propertySlug = resolveSlug(property, identifier);
  const bedrooms = getBedrooms(property);
  const bathrooms = getBathrooms(property);
  const city: string = property.city || property.address?.city || "";
  const neighbourhood: string = property.neighborhood || property.address?.neighbourhood || "";
  const price: number = property.price;
  const currency: string = property.currency || "XAF";
  const listingType: string = property.listingType || "rent";

  // ── Format price ───────────────────────────────────────────────────────────
  let formattedPrice = "";
  try {
    formattedPrice = new Intl.NumberFormat(locale === "fr" ? "fr-CM" : "en-CM", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    formattedPrice = `${price?.toLocaleString()} ${currency}`;
  }

  // ── Title & description ────────────────────────────────────────────────────
  const cityStr = city ? (locale === "fr" ? ` à ${city}` : ` in ${city}`) : "";
  const bedsStr = bedrooms
    ? locale === "fr"
      ? `${bedrooms} ch. — `
      : `${bedrooms}-bed `
    : "";
  const bathsStr = bathrooms
    ? locale === "fr"
      ? `${bathrooms} sdb. — `
      : `${bathrooms}-bath `
    : "";

  const title =
    locale === "fr"
      ? `${property.title}${cityStr} | HoroHouse`
      : `${property.title}${cityStr} | HoroHouse`;

  const descriptionFr =
    property.description?.substring(0, 140) ||
    `${bedsStr}${bathsStr}${property.title}${cityStr}${formattedPrice ? ` — ${formattedPrice}` : ""}. Annonce vérifiée sur HoroHouse.`;

  const descriptionEn =
    property.description?.substring(0, 140) ||
    `${bedsStr}${bathsStr}${property.title}${cityStr}${formattedPrice ? ` — ${formattedPrice}` : ""}. Verified listing on HoroHouse.`;

  const description = locale === "fr" ? descriptionFr : descriptionEn;

  // ── OG image — with Cloudinary transforms ─────────────────────────────────
  const rawOgImage = property.images?.[0]?.url;
  const ogImageUrl = buildOgImageUrl(rawOgImage);
  const ogImages = ogImageUrl
    ? [{ url: ogImageUrl, width: 1200, height: 630, alt: property.title }]
    : [];

  // ── Canonical — always uses slug, always locale-prefixed ──────────────────
  const canonicalPath = `/${locale}/properties/${propertySlug}`;
  const canonical = `${BASE_URL}${canonicalPath}`;

  return {
    title,
    description,

    alternates: {
      canonical,
      languages: {
        en: `${BASE_URL}/en/properties/${propertySlug}`,
        fr: `${BASE_URL}/fr/properties/${propertySlug}`,
        ar: `${BASE_URL}/ar/properties/${propertySlug}`,
        "x-default": `${BASE_URL}/fr/properties/${propertySlug}`,
      },
    },

    openGraph: {
      title,
      description,
      images: ogImages,
      type: "website",
      url: canonical,
      siteName: "HoroHouse",
      locale: LOCALE_TO_OG[locale] ?? "en_US",
      alternateLocale: Object.values(LOCALE_TO_OG).filter((l) => !l.startsWith(locale)),
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
      creator: "@HoroHouse",
      site: "@HoroHouse",
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

function buildPropertyJsonLd(property: any, locale: string, propertySlug: string): object {
  const bedrooms = getBedrooms(property);
  const bathrooms = getBathrooms(property);
  const city: string = property.city || property.address?.city || "";
  const neighbourhood: string = property.neighborhood || property.address?.neighbourhood || "";
  const street: string = property.address?.street || property.address || "";
  const currency: string = property.currency || "XAF";

  // Geo: your API stores [lng, lat] in GeoJSON order
  const lat = property.location?.coordinates?.[1];
  const lng = property.location?.coordinates?.[0];

  const schemaType =
    property.listingType === "short_term"
      ? "Accommodation"
      : "RealEstateListing";

  const amenityFeatures = [
    property.amenities?.hasPool && { "@type": "LocationFeatureSpecification", name: "Swimming Pool", value: true },
    property.amenities?.hasGym && { "@type": "LocationFeatureSpecification", name: "Gym", value: true },
    property.amenities?.hasSecurity && { "@type": "LocationFeatureSpecification", name: "Security", value: true },
    property.amenities?.hasWifi && { "@type": "LocationFeatureSpecification", name: "WiFi", value: true },
    property.amenities?.hasParking && { "@type": "LocationFeatureSpecification", name: "Parking", value: true },
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": schemaType,

    name: property.title,
    description: property.description,
    // ✓ URL now locale-prefixed and uses slug
    url: `${BASE_URL}/${locale}/properties/${propertySlug}`,

    image: (property.images || []).slice(0, 5).map((img: any) => ({
      "@type": "ImageObject",
      url: img.url,
      ...(img.alt && { caption: img.alt }),
    })),

    address: {
      "@type": "PostalAddress",
      ...(typeof street === "string" && street && { streetAddress: street }),
      ...(neighbourhood && { addressLocality: neighbourhood }),
      addressRegion: city,
      addressCountry: property.country || "CM",
    },

    ...(lat && lng && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: lat,
        longitude: lng,
      },
    }),

    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      // ✓ URL now locale-prefixed and uses slug
      url: `${BASE_URL}/${locale}/properties/${propertySlug}`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: property.price,
        priceCurrency: currency,
        valueAddedTaxIncluded: true,
        ...(property.billingCycle && {
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode:
              property.billingCycle === "monthly" ? "MON"
                : property.billingCycle === "weekly" ? "WEE"
                  : "DAY",
          },
        }),
      },
    },

    ...(bedrooms !== undefined && { numberOfBedrooms: bedrooms }),
    ...(bathrooms !== undefined && { numberOfBathroomsTotal: bathrooms }),
    ...(property.area && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: property.area,
        unitCode: "MTK",
      },
    }),

    ...(amenityFeatures.length > 0 && { amenityFeature: amenityFeatures }),

    datePosted: property.publishedAt ?? property.createdAt,
    dateModified: property.updatedAt,

    provider: {
      "@type": "RealEstateAgent",
      name: property.agent?.name ?? "HoroHouse",
      url: BASE_URL,
    },
  };
}

function buildBreadcrumbJsonLd(property: any, locale: string, propertySlug: string): object {
  const city: string = property.city || property.address?.city || "";
  const neighbourhood: string = property.neighborhood || property.address?.neighbourhood || "";
  const base = `${BASE_URL}/${locale}`;

  const items: any[] = [
    { "@type": "ListItem", position: 1, name: "HoroHouse", item: `${base}/` },
    { "@type": "ListItem", position: 2, name: locale === "fr" ? "Annonces" : "Properties", item: `${base}/properties` },
  ];

  let pos = 3;
  if (city) {
    items.push({ "@type": "ListItem", position: pos++, name: city, item: `${base}/properties?city=${encodeURIComponent(city)}` });
  }
  if (neighbourhood) {
    items.push({ "@type": "ListItem", position: pos++, name: neighbourhood, item: `${base}/properties?city=${encodeURIComponent(city)}&neighbourhood=${encodeURIComponent(neighbourhood)}` });
  }
  items.push({ "@type": "ListItem", position: pos, name: property.title, item: `${base}/properties/${propertySlug}` });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyPage({ params }: Params) {
  const { locale, slug } = await params;
  const identifier = slug.at(-1)!;
  const property = await fetchProperty(identifier);

  if (!property) notFound();

  const propertySlug = resolveSlug(property, identifier);
  const propertyLd = buildPropertyJsonLd(property, locale, propertySlug);
  const breadcrumbLd = buildBreadcrumbJsonLd(property, locale, propertySlug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PropertyDetailClient id={identifier} initialData={property} />
    </>
  );
}