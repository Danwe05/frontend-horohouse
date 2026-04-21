import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // ✅ remotePatterns only — domains[] is deprecated
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    ],
  },

  // ✅ Security + canonical headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  // ✅ Redirect non-www to www (important for canonical)
  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [{ type: 'host', value: 'horohouse.com' }],
        destination: 'https://www.horohouse.com/:path*',
        permanent: true,
      },
    ]
  },

  productionBrowserSourceMaps: false,
}

export default nextConfig