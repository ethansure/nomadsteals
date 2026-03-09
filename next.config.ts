import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Image optimization for external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.theflightdeal.com',
      },
      {
        protocol: 'https',
        hostname: 'theflightdeal.com',
      },
      {
        protocol: 'https',
        hostname: 'www.secretflying.com',
      },
      {
        protocol: 'https',
        hostname: 'secretflying.com',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
    // Minimize image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Performance optimizations
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react'],
  },

  // Compression
  compress: true,

  // Headers for caching
  async headers() {
    return [
      {
        // API routes - cache with stale-while-revalidate
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Static assets - long cache
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Fonts
        source: '/:all*(woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for cleaner URLs
  async redirects() {
    return [
      {
        source: '/deal/:id',
        destination: '/deals/:id',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
