// app/sitemap.ts  (full replacement)
// Key fixes vs original:
//  1. Property URLs now use `slug` not `_id`
//  2. Removed `?listingType=` query-param entries (Google treats these as
//     separate URLs and often ignores them; use dedicated /rent /sale paths instead)
//  3. Added /rent and /sale as clean static paths
//  4. Added city-level pages (if your API exposes them) — high-value for local SEO
//  5. Kept all the community/insights/categories logic unchanged

import { MetadataRoute } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL = "https://www.horohouse.com";
const locales = ["en", "fr", "ar"];

export const revalidate = 3600;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocalizedUrl(path: string, locale: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}/${locale}${cleanPath === "/" ? "" : cleanPath}`;
}

function getAlternates(path: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  locales.forEach((l) => {
    languages[l] = getLocalizedUrl(path, l);
  });
  // x-default → French (Cameroon majority Francophone)
  languages["x-default"] = getLocalizedUrl(path, "fr");
  return { languages };
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchProperties(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  try {
    const res = await fetch(
      `${API_URL}/properties?limit=1000&sortBy=createdAt&sortOrder=desc&fields=slug,updatedAt`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data?.properties) ? data.properties : [];
    // Only include properties that have a slug — skip any that only have _id
    return items.filter((p: any) => Boolean(p.slug));
  } catch (e) {
    console.error("[Sitemap] Failed to fetch properties:", e);
    return [];
  }
}

async function fetchCommunityPosts(): Promise<Array<{ slug: string; updatedAt?: string; createdAt: string }>> {
  try {
    const res = await fetch(
      `${API_URL}/community/posts?limit=500&sortBy=createdAt&sortOrder=desc&fields=slug,updatedAt,createdAt`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch (e) {
    console.error("[Sitemap] Failed to fetch community posts:", e);
    return [];
  }
}

async function fetchInsights(): Promise<Array<{ slug: string; updatedAt?: string; publishedAt: string }>> {
  try {
    const res = await fetch(
      `${API_URL}/insights?limit=500&sortBy=publishedAt&sortOrder=desc&fields=slug,updatedAt,publishedAt`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch (e) {
    console.error("[Sitemap] Failed to fetch insights:", e);
    return [];
  }
}

async function fetchInsightsCategories(): Promise<Array<{ slug: string }>> {
  try {
    const res = await fetch(`${API_URL}/insights/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("[Sitemap] Failed to fetch insights categories:", e);
    return [];
  }
}

// Optional: if your API exposes a cities endpoint
async function fetchCities(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  try {
    const res = await fetch(`${API_URL}/properties/cities`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((c: any) => Boolean(c.slug)) : [];
  } catch {
    // Non-fatal — cities endpoint may not exist yet
    return [];
  }
}

// ─── Static paths ─────────────────────────────────────────────────────────────
//
// REMOVED: `?listingType=rent` and `?listingType=sale` query-param entries.
// Google treats query params as separate URLs but often ignores them in sitemaps
// and may not crawl them at all. Use clean path segments instead:
//   /properties/rent  and  /properties/sale
// If these routes don't exist yet, create Next.js pages for them —
// they'll rank for "appartement à louer Douala" far better than the query-param version.

const staticPaths: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/",                   priority: 1.0, changeFrequency: "daily" },
  { path: "/properties",         priority: 0.9, changeFrequency: "hourly" },
  { path: "/properties/rent",    priority: 0.9, changeFrequency: "hourly" },   // ← replaces ?listingType=rent
  { path: "/properties/sale",    priority: 0.9, changeFrequency: "hourly" },   // ← replaces ?listingType=sale
  { path: "/community",          priority: 0.8, changeFrequency: "hourly" },
  { path: "/insights",           priority: 0.8, changeFrequency: "daily" },
  { path: "/students",           priority: 0.7, changeFrequency: "weekly" },
  { path: "/about",              priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact",            priority: 0.4, changeFrequency: "monthly" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, posts, insights, categories, cities] = await Promise.all([
    fetchProperties(),
    fetchCommunityPosts(),
    fetchInsights(),
    fetchInsightsCategories(),
    fetchCities(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Static routes × locales
  for (const { path, priority, changeFrequency } of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: getAlternates(path),
      });
    }
  }

  // City pages — high value for local SEO ("appartements Douala", "maisons Yaoundé")
  for (const city of cities) {
    const path = `/properties/city/${city.slug}`;
    for (const locale of locales) {
      entries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: city.updatedAt ? new Date(city.updatedAt) : new Date(),
        changeFrequency: "daily",
        priority: 0.85,
        alternates: getAlternates(path),
      });
    }
  }

  // Property pages — use SLUG not _id
  for (const p of properties) {
    const path = `/properties/${p.slug}`;
    for (const locale of locales) {
      entries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: "daily",
        priority: 0.8,
        alternates: getAlternates(path),
      });
    }
  }

  // Community posts
  for (const p of posts) {
    const path = `/community/${p.slug}`;
    for (const locale of locales) {
      entries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: getAlternates(path),
      });
    }
  }

  // Insights articles
  for (const p of insights) {
    const path = `/insights/${p.slug}`;
    for (const locale of locales) {
      entries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: getAlternates(path),
      });
    }
  }

  // Insights categories
  for (const c of categories) {
    const path = `/insights/category/${c.slug}`;
    for (const locale of locales) {
      entries.push({
        url: getLocalizedUrl(path, locale),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: getAlternates(path),
      });
    }
  }

  return entries;
}