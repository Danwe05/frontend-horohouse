import { MetadataRoute } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
const BASE_URL = 'https://www.horohouse.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all properties for sitemap
  let propertyUrls: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/properties?limit=500&sortBy=createdAt&sortOrder=desc`, {
      next: { revalidate: 3600 }
    })
    if (res.ok) {
      const data = await res.json()
      const properties = Array.isArray(data?.properties) ? data.properties : []
      propertyUrls = properties.map((p: any) => ({
        url: `${BASE_URL}/properties/${p._id || p.id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch properties', e)
  }

  return [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/properties`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/students`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.4 },
    ...propertyUrls,
  ]
}
