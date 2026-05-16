import { MetadataRoute } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL = "https://www.horohouse.com";
const locales = ["en", "fr", "ar"];

export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const getLocalizedUrl = (path: string, locale: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}/${locale}${cleanPath === '/' ? '' : cleanPath}`;
  };

  const getAlternates = (path: string) => {
    const languages: Record<string, string> = {};
    locales.forEach((l) => {
      languages[l] = getLocalizedUrl(path, l);
    });
    return { languages };
  };

  // Fetch all properties
  let properties: any[] = [];
  try {
    const res = await fetch(`${API_URL}/properties?limit=500&sortBy=createdAt&sortOrder=desc`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      properties = Array.isArray(data?.properties) ? data.properties : [];
    }
  } catch (e) {
    console.error("[Sitemap] Failed to fetch properties:", e);
  }

  // Fetch community posts
  let posts: any[] = [];
  try {
    const res = await fetch(`${API_URL}/community/posts?limit=500&sortBy=createdAt&sortOrder=desc`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      posts = Array.isArray(data?.data) ? data.data : [];
    }
  } catch (e) {
    console.error("[Sitemap] Failed to fetch community posts:", e);
  }

  // Fetch insights posts
  let insights: any[] = [];
  try {
    const res = await fetch(`${API_URL}/insights?limit=500&sortBy=publishedAt&sortOrder=desc`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      insights = Array.isArray(data?.data) ? data.data : [];
    }
  } catch (e) {
    console.error("[Sitemap] Failed to fetch insights posts:", e);
  }

  // Fetch insights categories
  let categories: any[] = [];
  try {
    const res = await fetch(`${API_URL}/insights/categories`, { next: { revalidate: 3600 } });
    if (res.ok) {
      categories = await res.json();
    }
  } catch (e) {
    console.error("[Sitemap] Failed to fetch insights categories:", e);
  }

  const staticPaths = [
    { path: "/", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/properties", priority: 0.9, changeFrequency: "hourly" as const },
    { path: "/community", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/insights", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/properties?listingType=rent", priority: 0.85, changeFrequency: "hourly" as const },
    { path: "/properties?listingType=sale", priority: 0.85, changeFrequency: "hourly" as const },
    { path: "/students", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.4, changeFrequency: "monthly" as const },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add static routes for each locale
  staticPaths.forEach(({ path, priority, changeFrequency }) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: getAlternates(path),
      });
    });
  });

  // Add dynamic property routes
  properties.forEach((p) => {
    const path = `/properties/${p._id || p.id}`;
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: "daily",
        priority: 0.8,
        alternates: getAlternates(path),
      });
    });
  });

  // Add dynamic community routes
  posts.forEach((p) => {
    const path = `/community/${p.slug}`;
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: getAlternates(path),
      });
    });
  });

  // Add dynamic insights routes
  insights.forEach((p) => {
    const path = `/insights/${p.slug}`;
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: getAlternates(path),
      });
    });
  });

  // Add dynamic insights categories
  categories.forEach((c) => {
    const path = `/insights/category/${c.slug}`;
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: getAlternates(path),
      });
    });
  });

  return sitemapEntries;
}