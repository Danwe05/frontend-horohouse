// app/robots.ts  (full replacement)
// Fixes vs original:
//  1. Added /ar/dashboard/, /ar/auth/, /ar/onboarding/ (were missing)
//  2. Added /en/bookings/, /fr/bookings/, /ar/bookings/ (auth-gated, shouldn't be indexed)
//  3. Added /en/settings/, /fr/settings/, /ar/settings/
//  4. Collapsed locale-specific paths using a wildcard-compatible pattern
//     NOTE: Next.js MetadataRoute.Robots doesn't support wildcards natively,
//     so we enumerate per locale — but see the comment below about a simpler approach.
//  5. Added Googlebot-specific rule to allow CSS/JS for rendering

import { MetadataRoute } from "next";

// Protected path segments — these get disallowed for every locale
const PROTECTED_SEGMENTS = [
  "dashboard",
  "auth",
  "onboarding",
  "bookings",
  "settings",
  "admin",
];

const LOCALES = ["en", "fr", "ar"];

// Generate disallow entries: /en/dashboard/, /fr/dashboard/, etc.
function buildDisallowList(): string[] {
  const paths: string[] = ["/api/"];

  for (const locale of LOCALES) {
    for (const segment of PROTECTED_SEGMENTS) {
      paths.push(`/${locale}/${segment}/`);
    }
    // Locale-prefixed compare page (no public value, generates infinite param URLs)
    paths.push(`/${locale}/properties/compare`);
    // Search pages with complex query strings — let Googlebot find these via internal links
    // (optional — comment out if you want Google to index filtered search results)
    // paths.push(`/${locale}/properties?`);
  }

  return paths;
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Main crawl rule for all bots
      {
        userAgent: "*",
        allow: "/",
        disallow: buildDisallowList(),
      },
      // Allow Googlebot to crawl JS/CSS for full rendering
      // (explicit allow overrides any accidental /api/ or /_next/ catch-all)
      {
        userAgent: "Googlebot",
        allow: ["/", "/_next/static/"],
        disallow: buildDisallowList(),
      },
    ],
    sitemap: "https://www.horohouse.com/sitemap.xml",
    host: "https://www.horohouse.com",
  };
}

// ─── www vs apex note ─────────────────────────────────────────────────────────
//
// Verify in Vercel that www.horohouse.com and horohouse.com both resolve,
// and that one 301-redirects to the other consistently.
//
// Your layout.tsx uses `metadataBase: new URL("https://www.horohouse.com")`
// which is correct — but if horohouse.com (no www) also serves the site
// without redirecting, Google sees two copies of every page and splits
// link equity between them.
//
// In Vercel: Domains → horohouse.com → set redirect to www.horohouse.com
// (or vice versa — just pick one and be consistent everywhere).
//
// Also: your layout.tsx canonical generates:
//   canonical: `https://www.horohouse.com/${locale}${pathSuffix}`
// This is correct. Confirm your metadataBase and canonical always agree on www vs no-www.