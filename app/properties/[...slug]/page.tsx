import { Metadata, ResolvingMetadata } from 'next';
import PropertyDetailClient from './PropertyDetailClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

  if (!property?.title) return { title: 'Property Not Found | HoroHouse' };

  const ogImage = property.images?.[0]?.url;
  const ogImageEntry = ogImage?.startsWith('http')
    ? [{ url: ogImage, width: 1200, height: 630 }]
    : [];

  const description = property.description?.substring(0, 160);

  return {
    title: `${property.title} | HoroHouse`,
    description,
    openGraph: {
      title: property.title,
      description,
      images: ogImageEntry,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: property.title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function PropertyPage({ params }: Params) {
  const { slug } = await params;
  const id = slug.at(-1)!;

  return <PropertyDetailClient id={id} />;
}