// app/robots.ts
// Auto-served at /robots.txt by Next.js — no config needed.

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/en/dashboard/",
          "/fr/dashboard/",
          "/ar/dashboard/",
          "/en/auth/",
          "/fr/auth/",
          "/ar/auth/",
          "/en/onboarding/",
          "/fr/onboarding/",
          "/ar/onboarding/",
          "/api/",
          "/en/properties/compare",
          "/fr/properties/compare",
          "/ar/properties/compare",
        ],
      },
    ],
    sitemap: "https://www.horohouse.com/sitemap.xml",
    host: "https://www.horohouse.com",
  };
}