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
          "/dashboard/",
          "/auth/",
          "/onboarding/",
          "/api/",
          "/properties/compare",
        ],
      },
    ],
    sitemap: "https://www.horohouse.com/sitemap.xml",
    host: "https://www.horohouse.com",
  };
}