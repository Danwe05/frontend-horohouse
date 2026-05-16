import { Metadata, ResolvingMetadata } from "next";
import PropertyDetailClient from "./PropertyDetailClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type Params = { params: Promise<{ slug: string[] }> };

async function fetchProperty(id: string) {
  const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata(
  { params }: Params,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const id = slug.at(-1)!;
  const property = await fetchProperty(id);

  if (!property?.title) return { title: "Property Not Found | HoroHouse" };

  const ogImage = property.images?.[0]?.url;
  const ogImageEntry =
    ogImage?.startsWith("http")
      ? [{ url: ogImage, width: 1200, height: 630 }]
      : [];

  const description = property.description?.substring(0, 160);

  const city = property.city ? ` à ${property.city}` : "";
  const price = property.price
    ? ` — ${property.price.toLocaleString("fr-CM")} XAF`
    : "";
  const beds = property.amenities?.bedrooms
    ? ` — ${property.amenities.bedrooms} ch.`
    : "";

  return {
    title: `${property.title} | HoroHouse`,
    description:
      description ||
      `${property.title}${city}${price}${beds}. Annonce vérifiée sur HoroHouse.`,
    openGraph: {
      title: property.title,
      description,
      images: ogImageEntry,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `https://www.horohouse.com/properties/${id}`,
    },
  };
}

export default async function PropertyPage({ params }: Params) {
  const { slug } = await params;
  const id = slug.at(-1)!;
  const property = await fetchProperty(id);

  const jsonLd = property
    ? {
        "@context": "https://schema.org",
        "@type": property.listingType === "short_term" ? "Accommodation" : "RealEstateListing",
        "name": property.title,
        "description": property.description,
        "image": property.images?.map((img: any) => img.url) || [],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": property.address,
          "addressLocality": property.city,
          "addressCountry": property.country || "CM",
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": property.location?.coordinates[1],
          "longitude": property.location?.coordinates[0],
        },
        "offers": {
          "@type": "Offer",
          "price": property.price,
          "priceCurrency": "XAF",
          "availability": "https://schema.org/InStock",
          "url": `https://www.horohouse.com/properties/${id}`,
        },
        "numberOfBedrooms": property.amenities?.bedrooms,
        "numberOfBathrooms": property.amenities?.bathrooms,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PropertyDetailClient id={id} />
    </>
  );
}