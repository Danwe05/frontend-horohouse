import { Metadata, ResolvingMetadata } from 'next';
import PropertyDetailClient from './PropertyDetailClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      next: { revalidate: 3600 },
    });
    const property = await response.json();

    if (!property || !property.title) {
      return { title: 'Property Not Found | HoroHouse' };
    }

    const firstImage = property.images?.[0]?.url;

    return {
      title: `${property.title} | HoroHouse`,
      description: property.description?.substring(0, 160),
      openGraph: {
        title: property.title,
        description: property.description?.substring(0, 160),
        images: firstImage ? [firstImage] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: property.title,
        description: property.description?.substring(0, 160),
        images: firstImage ? [firstImage] : [],
      },
    };
  } catch {
    return { title: 'Property | HoroHouse' };
  }
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return <PropertyDetailClient />;
}